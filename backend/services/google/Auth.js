const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const { google } = require('googleapis');
const { oAuth2Client } = require('../../googleAuth');

const TOKEN_PATH = path.join(__dirname, '../../token.json');

// ALLOWED ADMIN EMAIL - only this email can sign in
const ALLOWED_ADMIN_EMAIL = "brgybiluso@gmail.com";

oAuth2Client.on('tokens', (tokens) => {
  if (!fs.existsSync(TOKEN_PATH)) return;

  const saved = JSON.parse(fs.readFileSync(TOKEN_PATH));

  if (tokens.refresh_token) {
    saved.refresh_token = tokens.refresh_token;
  }

  if (tokens.access_token) {
    saved.access_token = tokens.access_token;
    saved.expiry_date = tokens.expiry_date;
  }

  fs.writeFileSync(TOKEN_PATH, JSON.stringify(saved, null, 2));
});

exports.generateAuthUrl = () => {
  const SCOPES = [
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/userinfo.email'  // Required to verify email
  ];
  return oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });
};

exports.isAuthenticated = () => {
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
};

exports.handleOAuthCallback = async (code) => {
  const { tokens } = await oAuth2Client.getToken(code);
  oAuth2Client.setCredentials(tokens);
  
  // Verify the user's email before saving tokens
  const oauth2 = google.oauth2({ version: 'v2', auth: oAuth2Client });
  const { data: userInfo } = await oauth2.userinfo.get();
  
  console.log('🔍 Attempting sign-in with email:', userInfo.email);
  
  // Check if the email matches the allowed admin email
  if (userInfo.email.toLowerCase() !== ALLOWED_ADMIN_EMAIL.toLowerCase()) {
    console.error('❌ Unauthorized email attempted sign-in:', userInfo.email);
    oAuth2Client.setCredentials({}); // Clear credentials from client
    
    // Delete any existing token file to prevent stale tokens
    if (fs.existsSync(TOKEN_PATH)) {
      fs.unlinkSync(TOKEN_PATH);
    }
    
    throw new Error(`ACCESS_DENIED:Only ${ALLOWED_ADMIN_EMAIL} can sign in. You attempted with: ${userInfo.email}`);
  }
  
  // Email verified - save tokens WITH email
  const tokenData = {
    ...tokens,
    email: userInfo.email  // Store the verified email
  };
  
  await fsp.writeFile(TOKEN_PATH, JSON.stringify(tokenData, null, 2));
  console.log('✅ Tokens saved for', userInfo.email);
};

// Logout just ends the admin UI session - does NOT revoke Drive access
// This is standard practice: logging out of admin panel shouldn't break backend integrations
exports.logout = () => {
  // No-op for session logout. Token stays intact for backend operations.
  console.log('Admin session ended (Drive token preserved)');
};

// Disconnect Drive - actually revokes access and deletes token
// Use this when you explicitly want to stop all Google Drive operations
exports.disconnectDrive = () => {
  if (fs.existsSync(TOKEN_PATH)) {
    fs.unlinkSync(TOKEN_PATH);
    console.log('🔌 Google Drive disconnected - token deleted');
  }
  oAuth2Client.setCredentials({});
};
