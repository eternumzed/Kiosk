// backend/googleAuth.js
const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");

const TOKEN_PATH = path.join(__dirname, "token.json");
const CREDENTIALS_PATH = path.join(__dirname, "oauth_credentials.json");
const SCOPES = ["https://www.googleapis.com/auth/drive.file"];

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
const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uri);

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
    
    // Save tokens with refresh token
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
    console.log('✅ Tokens saved (includes refresh token:', !!tokens.refresh_token, ')');
    
    res.send("✅ Google Drive authorization successful! You can now close this window and generate PDFs.");
  } catch (err) {
    console.error("❌ Error exchanging code:", err.message);
    res.status(500).send("Failed to get access token: " + err.message);
  }
}

// Load saved token if exists
function loadSavedToken() {
  if (fs.existsSync(TOKEN_PATH)) {
    const tokens = JSON.parse(fs.readFileSync(TOKEN_PATH));
    oAuth2Client.setCredentials(tokens);
    
    // Set up automatic token refresh
    oAuth2Client.on('tokens', (newTokens) => {
      if (newTokens.refresh_token) {
        tokens.refresh_token = newTokens.refresh_token;
      }
      tokens.access_token = newTokens.access_token;
      tokens.expiry_date = newTokens.expiry_date;
      fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
    });
    
    console.log('✅ Token loaded from storage');
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

// Check if authenticated
function isAuthenticated() {
  return fs.existsSync(TOKEN_PATH);
}

module.exports = {
  oAuth2Client,
  getAuthUrl,
  handleCallback,
  loadSavedToken,
  logout,
  isAuthenticated,
};

