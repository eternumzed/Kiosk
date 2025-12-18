const fs = require('fs');
const { google } = require('googleapis');
const { oAuth2Client } = require('../../googleAuth');

const FOLDER_ID = '1W91EpKXT1__yVhHH_WPv2fZMkK6_SkOZ';

const drive = google.drive({ version: 'v3', auth: oAuth2Client });

exports.uploadPdf = async (pdfPath, namePrefix) => {
  // If namePrefix looks like a reference number (contains dashes), use it verbatim
  // otherwise include a timestamp to avoid collisions
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const fileName = (typeof namePrefix === 'string' && namePrefix.includes('-'))
    ? `${namePrefix}.pdf`
    : `${namePrefix || 'Document'}_${timestamp}.pdf`;

  const res = await drive.files.create({
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
    fileId: res.data.id,
    requestBody: { role: 'reader', type: 'anyone' },
  });

  return res.data;
};

exports.listPdfs = async () => {
  const res = await drive.files.list({
    q: `'${FOLDER_ID}' in parents and mimeType='application/pdf'`,
    fields: 'files(id,name,createdTime,size,webViewLink)',
    orderBy: 'createdTime desc',
  });

  return res.data.files;
};

exports.downloadPdf = async (fileId) => {
  return drive.files.get(
    { fileId, alt: 'media' },
    { responseType: 'stream' }
  );
};

exports.deletePdf = async (fileId) => {
  await drive.files.delete({ fileId });
};
