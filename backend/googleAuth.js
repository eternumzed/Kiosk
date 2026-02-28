// backend/googleAuth.js
const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");

const CREDENTIALS_PATH = path.join(__dirname, "oauth_credentials.json");
const TOKEN_PATH = path.join(__dirname, "token.json");
const SCOPES = [
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/userinfo.email"  // Required to verify email
];

// ALLOWED ADMIN EMAIL - only this email can sign in
const ALLOWED_ADMIN_EMAIL = "brgybiluso@gmail.com";

const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
const { client_id, client_secret, redirect_uris } = credentials.installed || credentials.web;

 const REDIRECT_URI = redirect_uris[0]; // http://localhost:3000/oauth2callback

const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, REDIRECT_URI);

 function getAuthUrl(req, res) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline", // request refresh token
    scope: SCOPES,
    prompt: "consent",       // force consent to get refresh token
  });
  res.redirect(authUrl);
}

// Handle Google OAuth callback
async function handleCallback(req, res) {
  const code = req.query.code;
  
  if (!code) {
    console.error('❌ No authorization code in callback');
    return res.status(400).send("Missing code");
  }

  try {
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);
    
    // Verify the user's email before saving tokens
    const oauth2 = google.oauth2({ version: 'v2', auth: oAuth2Client });
    const { data: userInfo } = await oauth2.userinfo.get();
    
    console.log('🔍 Attempting sign-in with email:', userInfo.email);
    
    // Check if the email matches the allowed admin email
    if (userInfo.email.toLowerCase() !== ALLOWED_ADMIN_EMAIL.toLowerCase()) {
      console.error('❌ Unauthorized email attempted sign-in:', userInfo.email);
      oAuth2Client.setCredentials({}); // Clear credentials
      return res.status(403).send(`
        <!DOCTYPE html>
        <html>
          <head><title>Access Denied</title></head>
          <body style="font-family: 'Inter', system-ui, sans-serif; padding: 40px; text-align: center; background: #1f2937; min-height: 100vh;">
            <div style="max-width: 520px; margin: 60px auto; padding: 48px; background: #111827; border-radius: 8px; border: 1px solid #374151; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);">
              <h1 style="color: #dc2626; margin-bottom: 24px; font-size: 28px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px;">Access Denied</h1>
              <div style="width: 60px; height: 3px; background: #dc2626; margin: 0 auto 24px;"></div>
              <p style="color: #9ca3af; line-height: 1.8; margin: 16px 0; font-size: 15px;">This dashboard is restricted to authorized personnel only.</p>
              <p style="color: #9ca3af; line-height: 1.8; margin: 16px 0; font-size: 15px;">You attempted to sign in with: <strong style="color: #dc2626; background: #333; padding: 0.2em 0.5em; border-radius: 4px;">${userInfo.email}</strong></p>
              <p style="color: #9ca3af; line-height: 1.8; margin: 16px 0; font-size: 15px;">Unauthorized access attempts are logged and may be subject to further action.</p>
              <p style="color: #fbbf24; font-weight: 600; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin-top: 32px;">This incident has been recorded.</p>
              <a href="/" style="display: inline-block; margin-top: 32px; padding: 14px 32px; background: #374151; color: #e5e7eb; text-decoration: none; border-radius: 4px; font-weight: 600; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; border: 1px solid #4b5563;">Return</a>
            </div>
          </body>
        </html>
      `);
    }
    
    // Email verified - save tokens WITH email
    const tokenData = {
      ...tokens,
      email: userInfo.email  // Store the verified email
    };
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokenData, null, 2));
    console.log('✅ Tokens saved for', userInfo.email, '(includes refresh token:', !!tokens.refresh_token, ')');
    
    res.send("✅ Google Drive authorization successful! You can now close this window and generate PDFs.");
  } catch (err) {
    console.error("❌ Error exchanging code:", err.message);
    res.status(500).send("Failed to get access token: " + err.message);
  }
}

// Load saved token if exists (only if email matches)
function loadSavedToken() {
  if (fs.existsSync(TOKEN_PATH)) {
    const tokens = JSON.parse(fs.readFileSync(TOKEN_PATH));
    
    // Only load tokens if they belong to the authorized admin
    if (!tokens.email || tokens.email.toLowerCase() !== ALLOWED_ADMIN_EMAIL.toLowerCase()) {
      console.log('⚠️ Token exists but email mismatch or missing. Not loading credentials.');
      console.log('   Stored email:', tokens.email || 'none');
      console.log('   Please delete token.json and re-authenticate with', ALLOWED_ADMIN_EMAIL);
      return;
    }
    
    oAuth2Client.setCredentials(tokens);
    
    // Set up automatic token refresh
    oAuth2Client.on('tokens', (newTokens) => {
      // Preserve the email when refreshing tokens
      const updatedTokens = { ...tokens };
      if (newTokens.refresh_token) {
        updatedTokens.refresh_token = newTokens.refresh_token;
      }
      updatedTokens.access_token = newTokens.access_token;
      updatedTokens.expiry_date = newTokens.expiry_date;
      fs.writeFileSync(TOKEN_PATH, JSON.stringify(updatedTokens, null, 2));
      console.log('✅ Token auto-refreshed and saved');
    });
    
    console.log('✅ Token loaded from storage for', tokens.email);
  }
}

// Ensure token is refreshed before API calls
async function ensureValidToken() {
  if (!fs.existsSync(TOKEN_PATH)) {
    throw new Error('❌ No token found. Admin must authenticate first.');
  }

  try {
    const accessToken = oAuth2Client.credentials.access_token;
    const expiryDate = oAuth2Client.credentials.expiry_date;
    
    // Check if token is expired or expiring soon (within 5 minutes)
    if (expiryDate && Date.now() >= expiryDate - 5 * 60 * 1000) {
      console.log('⏳ Token expired/expiring. Refreshing...');
      const { credentials } = await oAuth2Client.refreshAccessToken();
      oAuth2Client.setCredentials(credentials);
      
      // Save refreshed token
      fs.writeFileSync(TOKEN_PATH, JSON.stringify(credentials, null, 2));
      console.log('✅ Token refreshed successfully');
    }
  } catch (err) {
    console.error('❌ Token refresh failed:', err.message);
    throw new Error('Failed to refresh Google token. Admin may need to re-authenticate.');
  }
}

// Logout function to clear token
function logout() {
  if (fs.existsSync(TOKEN_PATH)) {
    fs.unlinkSync(TOKEN_PATH);
    oAuth2Client.setCredentials({});
    console.log('✅ Token cleared - user must re-authenticate');
  }
}

// Check if authenticated (with email verification)
function isAuthenticated() {
  if (!fs.existsSync(TOKEN_PATH)) return false;
  
  try {
    const saved = JSON.parse(fs.readFileSync(TOKEN_PATH));
    // Check if the saved email matches the allowed admin email
    if (saved.email && saved.email.toLowerCase() === ALLOWED_ADMIN_EMAIL.toLowerCase()) {
      return true;
    }
    // If no email stored or doesn't match, not authenticated
    console.log('❌ Token exists but email mismatch or missing. Stored:', saved.email);
    return false;
  } catch (err) {
    console.error('Error reading token:', err.message);
    return false;
  }
}

module.exports = {
  oAuth2Client,
  getAuthUrl,
  handleCallback,
  loadSavedToken,
  ensureValidToken,
  logout,
  isAuthenticated,
};

