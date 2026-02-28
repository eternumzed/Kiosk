// backend/googleAuth.js
const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");

const CREDENTIALS_PATH = path.join(__dirname, "oauth_credentials.json");
const TOKEN_PATH = path.join(__dirname, "token.json");
const SCOPES = ["https://www.googleapis.com/auth/drive.file"];

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

