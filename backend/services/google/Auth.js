const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const { oAuth2Client } = require('../../googleAuth');

const TOKEN_PATH = path.join(__dirname, '../../token.json');

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
  const SCOPES = ['https://www.googleapis.com/auth/drive.file'];
  return oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });
};

exports.isAuthenticated = () => fs.existsSync(TOKEN_PATH);

exports.handleOAuthCallback = async (code) => {
  const { tokens } = await oAuth2Client.getToken(code);
  oAuth2Client.setCredentials(tokens);
  await fsp.writeFile(TOKEN_PATH, JSON.stringify(tokens, null, 2));
};

exports.logout = () => {
  if (fs.existsSync(TOKEN_PATH)) fs.unlinkSync(TOKEN_PATH);
};
