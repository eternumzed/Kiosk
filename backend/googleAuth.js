// backend/googleAuth.js
const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");


const CREDENTIALS_PATH = path.join(__dirname, "oauth_credentials.json");
const TOKEN_PATH = path.join(__dirname, "token.json");
const SESSION_PATH = path.join(__dirname, "admin_session.json");
const SCOPES = [
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/userinfo.email"  // Required to verify email
];

// ALLOWED ADMIN EMAIL - only this email can sign in
const ALLOWED_ADMIN_EMAIL = "brgybiluso@gmail.com";

// Session duration: 8 hours
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;

// Create admin session after successful login
function createSession(email) {
  console.log(`[createSession] Creating session at: ${SESSION_PATH}`);
  const session = {
    email,
    sessionId: crypto.randomBytes(32).toString('hex'),
    createdAt: Date.now(),
    expiresAt: Date.now() + SESSION_DURATION_MS
  };
  try {
    fs.writeFileSync(SESSION_PATH, JSON.stringify(session, null, 2));
    console.log(`[createSession] ✅ Session file written successfully for ${email}`);
  } catch (err) {
    console.error(`[createSession] ❌ Failed to write session file:`, err.message);
  }
  return session.sessionId;
}

// Get Google OAuth credentials from environment variables or fallback to JSON file (dev only)
function getCredentials() {
  // Priority 1: Environment variables (recommended for production)
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    return {
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI || 'https://api.brgybiluso.me/oauth2callback',
    };
  }
  
  // Priority 2: JSON file (for local development only)
  if (fs.existsSync(CREDENTIALS_PATH)) {
    console.warn('⚠️  Using oauth_credentials.json - use environment variables in production!');
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
    const { client_id, client_secret, redirect_uris } = credentials.installed || credentials.web;
    return {
      client_id,
      client_secret,
      redirect_uri: redirect_uris[0],
    };
  }
  
  throw new Error('Google OAuth credentials not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.');
}

const { client_id, client_secret, redirect_uri } = getCredentials();
console.log('🔧 Google OAuth Config:');
console.log('   Client ID:', client_id?.substring(0, 20) + '...');
console.log('   Redirect URI:', redirect_uri);
const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uri);

 function getAuthUrl(req, res) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline", // request refresh token
    scope: SCOPES,
    prompt: "consent",       // force consent to get refresh token
  });
  console.log('🔗 Redirecting to:', authUrl);
  res.redirect(authUrl);
}

// Handle Google OAuth callback
// Generate Access Denied HTML page with kiosk theme
function getAccessDeniedPage(attemptedEmail) {
  const adminUrl = process.env.VITE_ADMIN_URL || 'https://admin.brgybiluso.me';
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Access Denied - Barangay Biluso</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Inter', system-ui, sans-serif;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #1e3a5f 0%, #0f172a 50%, #1e3a5f 100%);
            padding: 20px;
          }
          .container {
            max-width: 480px;
            width: 100%;
            text-align: center;
          }
          .logo {
            width: 80px;
            height: 80px;
            margin: 0 auto 24px;
            background: linear-gradient(135deg, #3b82f6, #1d4ed8);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 8px 32px rgba(59, 130, 246, 0.3);
          }
          .logo svg { width: 40px; height: 40px; color: white; }
          .card {
            background: rgba(255, 255, 255, 0.95);
            border-radius: 16px;
            padding: 40px 32px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4);
          }
          .icon-error {
            width: 64px;
            height: 64px;
            margin: 0 auto 20px;
            background: #fef2f2;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .icon-error svg { width: 32px; height: 32px; color: #dc2626; }
          h1 {
            color: #dc2626;
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 16px;
          }
          .message {
            color: #4b5563;
            font-size: 15px;
            line-height: 1.6;
            margin-bottom: 16px;
          }
          .email-badge {
            display: inline-block;
            background: #fee2e2;
            color: #dc2626;
            padding: 8px 16px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 14px;
            margin: 8px 0 24px;
          }
          .warning {
            background: #fefce8;
            border: 1px solid #fef08a;
            border-radius: 8px;
            padding: 12px 16px;
            color: #854d0e;
            font-size: 13px;
            margin-bottom: 24px;
          }
          .btn {
            display: inline-block;
            background: linear-gradient(135deg, #3b82f6, #1d4ed8);
            color: white;
            padding: 14px 32px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            font-size: 15px;
            transition: transform 0.2s, box-shadow 0.2s;
          }
          .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(59, 130, 246, 0.4);
          }
          .footer {
            margin-top: 24px;
            color: rgba(255, 255, 255, 0.6);
            font-size: 13px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div class="card">
            <div class="icon-error">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1>Access Denied</h1>
            <p class="message">This admin dashboard is restricted to authorized Barangay Biluso personnel only.</p>
            <div class="email-badge">${attemptedEmail}</div>
            <div class="warning">
              <strong>Note:</strong> Unauthorized access attempts are logged for security purposes.
            </div>
            <a href="${adminUrl}" class="btn">Return to Login</a>
          </div>
          <p class="footer">Barangay Biluso Kiosk System</p>
        </div>
      </body>
    </html>
  `;
}

async function handleCallback(req, res) {
  const code = req.query.code;
  const adminUrl = process.env.VITE_ADMIN_URL || 'https://admin.brgybiluso.me';
  
  if (!code) {
    console.error('❌ No authorization code in callback');
    return res.status(400).send("Missing code");
  }

  try {
    // Get tokens but DON'T set on shared client yet
    const { tokens } = await oAuth2Client.getToken(code);
    
    // Create a TEMPORARY client just for email verification
    // This prevents contaminating the shared oAuth2Client with wrong credentials
    const { client_id, client_secret, redirect_uri } = getCredentials();
    const tempClient = new google.auth.OAuth2(client_id, client_secret, redirect_uri);
    tempClient.setCredentials(tokens);
    
    // Verify the user's email using the temp client
    const oauth2 = google.oauth2({ version: 'v2', auth: tempClient });
    const { data: userInfo } = await oauth2.userinfo.get();
    
    console.log('🔍 Attempting sign-in with email:', userInfo.email);
    
    // Check if the email matches the allowed admin email
    if (userInfo.email.toLowerCase() !== ALLOWED_ADMIN_EMAIL.toLowerCase()) {
      console.error('❌ Unauthorized email attempted sign-in:', userInfo.email);
      // Don't touch the shared oAuth2Client at all - just reject
      return res.status(403).send(getAccessDeniedPage(userInfo.email));
    }
    
    // Email verified - NOW it's safe to set credentials on the shared client
    oAuth2Client.setCredentials(tokens);
    
    // Save tokens WITH email
    const tokenData = {
      ...tokens,
      email: userInfo.email
    };
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokenData, null, 2));
    console.log('✅ Tokens saved for', userInfo.email, '(includes refresh token:', !!tokens.refresh_token, ')');
    
    // Create admin UI session
    createSession(userInfo.email);
    
    // Redirect to admin dashboard on success
    res.redirect(`${adminUrl}?auth=success`);
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
    // If credentials aren't loaded in memory, load from file
    if (!oAuth2Client.credentials || !oAuth2Client.credentials.access_token) {
      console.log('⏳ Loading credentials from token.json...');
      const savedTokens = JSON.parse(fs.readFileSync(TOKEN_PATH));
      
      // CRITICAL: Only load if email matches authorized admin
      if (!savedTokens.email || savedTokens.email.toLowerCase() !== ALLOWED_ADMIN_EMAIL.toLowerCase()) {
        console.error(`❌ Token belongs to wrong email: ${savedTokens.email || 'unknown'}`);
        console.error(`   Expected: ${ALLOWED_ADMIN_EMAIL}`);
        console.error(`   Please delete token.json and re-authenticate with the correct account.`);
        throw new Error(`Token belongs to unauthorized email (${savedTokens.email}). Admin must re-authenticate with ${ALLOWED_ADMIN_EMAIL}.`);
      }
      
      oAuth2Client.setCredentials(savedTokens);
      console.log(`✅ Credentials loaded for ${savedTokens.email}`);
    }
    
    const expiryDate = oAuth2Client.credentials.expiry_date;
    
    // Check if token is expired or expiring soon (within 5 minutes)
    if (!expiryDate || Date.now() >= expiryDate - 5 * 60 * 1000) {
      console.log('⏳ Token expired/expiring. Refreshing...');
      const { credentials } = await oAuth2Client.refreshAccessToken();
      
      // Preserve email when saving refreshed token
      const savedTokens = JSON.parse(fs.readFileSync(TOKEN_PATH));
      const updatedTokens = {
        ...credentials,
        email: savedTokens.email
      };
      
      oAuth2Client.setCredentials(updatedTokens);
      fs.writeFileSync(TOKEN_PATH, JSON.stringify(updatedTokens, null, 2));
      console.log('✅ Token refreshed successfully');
    }
  } catch (err) {
    console.error('❌ Token refresh failed:', err.message);
    throw new Error('Failed to refresh Google token. Admin may need to re-authenticate.');
  }
}

// Logout function - ends admin session but preserves Drive token
// Standard practice: logging out of admin UI shouldn't break backend integrations
function logout() {
  if (fs.existsSync(SESSION_PATH)) {
    fs.unlinkSync(SESSION_PATH);
    console.log('🚪 Admin session ended (Drive token preserved)');
  }
}

// Disconnect Drive - actually revokes access and deletes token
function disconnectDrive() {
  // Clear session too
  if (fs.existsSync(SESSION_PATH)) {
    fs.unlinkSync(SESSION_PATH);
  }
  if (fs.existsSync(TOKEN_PATH)) {
    fs.unlinkSync(TOKEN_PATH);
    oAuth2Client.setCredentials({});
    console.log('🔌 Google Drive disconnected - token deleted');
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
  disconnectDrive,
  isAuthenticated,
};

