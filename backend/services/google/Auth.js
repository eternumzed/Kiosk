const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const { google } = require('googleapis');
const { oAuth2Client } = require('../../googleAuth');

const TOKEN_PATH = path.join(__dirname, '../../token.json');
const SESSION_PATH = path.join(__dirname, '../../admin_session.json');

// ALLOWED ADMIN EMAIL - only this email can sign in
const ALLOWED_ADMIN_EMAIL = "brgybiluso@gmail.com";

// Session duration: 8 hours
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;

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

// Create a new admin session (called after successful OAuth)
function createSession(email) {
  const session = {
    email,
    sessionId: crypto.randomBytes(32).toString('hex'),
    createdAt: Date.now(),
    expiresAt: Date.now() + SESSION_DURATION_MS
  };
  fs.writeFileSync(SESSION_PATH, JSON.stringify(session, null, 2));
  console.log(`✅ Admin session created for ${email} (expires in 8 hours)`);
  return session.sessionId;
}

// Check if admin UI session is valid (for admin dashboard access)
exports.isAdminLoggedIn = () => {
  console.log(`[isAdminLoggedIn] Checking session at: ${SESSION_PATH}`);
  console.log(`[isAdminLoggedIn] Session file exists: ${fs.existsSync(SESSION_PATH)}`);
  
  if (!fs.existsSync(SESSION_PATH)) {
    console.log('[isAdminLoggedIn] No session file found');
    return false;
  }
  
  try {
    const session = JSON.parse(fs.readFileSync(SESSION_PATH));
    console.log(`[isAdminLoggedIn] Session loaded:`, { email: session.email, expiresAt: new Date(session.expiresAt).toISOString() });
    
    // Check if session is expired
    if (Date.now() > session.expiresAt) {
      console.log('[isAdminLoggedIn] Session expired');
      // Clean up expired session
      try { fs.unlinkSync(SESSION_PATH); } catch (_) {}
      return false;
    }
    
    // Check if email matches
    if (session.email?.toLowerCase() !== ALLOWED_ADMIN_EMAIL.toLowerCase()) {
      console.log(`[isAdminLoggedIn] Email mismatch: ${session.email} vs ${ALLOWED_ADMIN_EMAIL}`);
      return false;
    }
    
    console.log('[isAdminLoggedIn] Session valid!');
    return true;
  } catch (err) {
    console.error('[isAdminLoggedIn] Error reading session:', err.message);
    return false;
  }
};

// Check if Google Drive token exists (for backend PDF operations)
// This is separate from admin UI session
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
  // Get tokens but DON'T set on shared client yet
  const { tokens } = await oAuth2Client.getToken(code);
  
  // Create a TEMPORARY client just for email verification
  // This prevents contaminating the shared oAuth2Client with wrong credentials
  const tempClient = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  tempClient.setCredentials(tokens);
  
  // Verify the user's email using the temp client
  const oauth2 = google.oauth2({ version: 'v2', auth: tempClient });
  const { data: userInfo } = await oauth2.userinfo.get();
  
  console.log('🔍 Attempting sign-in with email:', userInfo.email);
  
  // Check if the email matches the allowed admin email
  if (userInfo.email.toLowerCase() !== ALLOWED_ADMIN_EMAIL.toLowerCase()) {
    console.error('❌ Unauthorized email attempted sign-in:', userInfo.email);
    // Don't touch the shared oAuth2Client at all - just reject
    // DO NOT delete token.json - backend PDF operations must continue
    
    throw new Error(`ACCESS_DENIED:Only ${ALLOWED_ADMIN_EMAIL} can sign in. You attempted with: ${userInfo.email}`);
  }
  
  // Email verified - NOW it's safe to set credentials on the shared client
  oAuth2Client.setCredentials(tokens);
  
  // Save tokens WITH email
  const tokenData = {
    ...tokens,
    email: userInfo.email
  };
  
  await fsp.writeFile(TOKEN_PATH, JSON.stringify(tokenData, null, 2));
  console.log('✅ Tokens saved for', userInfo.email);
  
  // Create admin UI session
  createSession(userInfo.email);
};

// Logout - ends admin UI session (Drive token stays for backend operations)
exports.logout = () => {
  if (fs.existsSync(SESSION_PATH)) {
    fs.unlinkSync(SESSION_PATH);
    console.log('🚪 Admin session ended');
  }
};

// Disconnect Drive - actually revokes access and deletes token
// Use this when you explicitly want to stop all Google Drive operations
exports.disconnectDrive = () => {
  // Clear session too
  if (fs.existsSync(SESSION_PATH)) {
    fs.unlinkSync(SESSION_PATH);
  }
  if (fs.existsSync(TOKEN_PATH)) {
    fs.unlinkSync(TOKEN_PATH);
    console.log('🔌 Google Drive disconnected - token deleted');
  }
  oAuth2Client.setCredentials({});
};
