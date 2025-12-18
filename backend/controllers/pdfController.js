const asyncHandler = require('express-async-handler');
const pdfService = require('../services/pdf/generatePdf');
const auth = require('../services/google/Auth');
const drive = require('../services/google/Drive');

const fs = require('fs');
const path = require('path');
const requestService = require('../services/requestService');

exports.generatePdf = asyncHandler(async (req, res) => {
  const { type, data } = req.body;

  // 1) Generate the PDF locally
  const pdfPath = await pdfService({ templateKey: type, rawData: data });

  // If no referenceNumber provided, create a Request server-side so we have a reference
  let namePrefix = type;
  if (!data.referenceNumber) {
    try {
      const created = await requestService.createRequestIfMissing(data);
      namePrefix = created.referenceNumber;
      // attach reference to data for downstream usage
      data.referenceNumber = created.referenceNumber;
    } catch (err) {
      console.error('Failed to create request for PDF reference:', err.message || err);
    }
  } else {
    namePrefix = data.referenceNumber;
  }

  // 2) If authenticated with Drive, upload and return Drive metadata
  if (auth.isAuthenticated()) {
    try {
      const uploaded = await drive.uploadPdf(pdfPath, namePrefix);

      // remove local temp files when upload succeeds (best-effort)
      try {
        if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
      } catch (err) {
        console.warn('Failed to delete temp PDF:', err.message || err);
      }

      return res.json({ uploaded: true, file: uploaded });
    } catch (err) {
      console.error('Drive upload failed:', err.response?.data || err.message || err);
      return res.status(500).json({ error: 'Drive upload failed', details: err.message || err });
    }
  }

  // 3) Not authenticated: return authUrl plus local path info so client can request auth
  return res.status(200).json({
    authenticated: false,
    authUrl: auth.generateAuthUrl(),
    pdfPath,
  });
});

exports.oauthCallback = asyncHandler(async (req, res) => {
  await auth.handleOAuthCallback(req.query.code);
  res.send('Authentication successful');
});

exports.checkAuth = asyncHandler(async (req, res) => {
  res.json({ authenticated: auth.isAuthenticated() });
});

exports.logout = asyncHandler(async (req, res) => {
  auth.logout();
  res.json({ message: 'Logged out' });
});

exports.listPdfs = asyncHandler(async (req, res) => {
  if (!auth.isAuthenticated()) return res.sendStatus(401);
  res.json(await drive.listPdfs());
});

exports.downloadPdf = asyncHandler(async (req, res) => {
  const stream = await drive.downloadPdf(req.params.fileId);
  stream.data.pipe(res);
});

exports.deletePdf = asyncHandler(async (req, res) => {
  await drive.deletePdf(req.params.fileId);
  res.json({ success: true });
});
