const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
const { oAuth2Client } = require('../../googleAuth');

const FOLDER_ID = '1W91EpKXT1__yVhHH_WPv2fZMkK6_SkOZ';

module.exports = async function uploadDrive(pdfPath, prefix = 'Document') {
  const drive = google.drive({
    version: 'v3',
    auth: oAuth2Client,
  });

  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, '-')
    .slice(0, -5);

  const fileName = `${prefix}_${timestamp}.pdf`;

  const response = await drive.files.create({
    resource: {
      name: fileName,
      parents: [FOLDER_ID],
    },
    media: {
      mimeType: 'application/pdf',
      body: fs.createReadStream(pdfPath),
    },
    fields: 'id, webViewLink, webContentLink',
  });

  await drive.permissions.create({
    fileId: response.data.id,
    requestBody: {
      role: 'reader',
      type: 'anyone',
    },
  });

  return response.data;
};
