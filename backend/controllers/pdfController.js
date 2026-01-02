const asyncHandler = require('express-async-handler');
const pdfService = require('../services/pdf/generatePdf');
const auth = require('../services/google/Auth');
const drive = require('../services/google/Drive');

const fs = require('fs');
const path = require('path');
const requestService = require('../services/requestService');

exports.initAuth = asyncHandler(async (req, res) => {
  const authUrl = auth.generateAuthUrl();
  res.json({ authUrl });
});

exports.generatePdf = asyncHandler(async (req, res) => {
  let { type, data } = req.body;
  const Request = require('../models/requestSchema');

  // 1) Generate the PDF locally
  const pdfPath = await pdfService({ templateKey: type, rawData: data });

   let namePrefix = type;
  let requestId = null;
  let referenceNumber = data.referenceNumber;

  try {
     const request = await requestService.createRequestIfMissing(data);
    namePrefix = request.referenceNumber;
    requestId = request._id;
    referenceNumber = request.referenceNumber;
    
     if (!type && request.documentCode) {
      type = request.documentCode;
      console.log(`[generatePdf] Type not in request body, using documentCode: ${type}`);
    }
    
    console.log(`[generatePdf] PDF generation for request: ${referenceNumber} (ID: ${requestId}), type: ${type}`);
  } catch (err) {
    console.error('Failed to create/find request:', err.message || err);
    return res.status(500).json({ error: 'Failed to create request record', details: err.message });
  }

   if (auth.isAuthenticated()) {
    try {
      const uploaded = await drive.uploadPdf(pdfPath, namePrefix, { 
        type,
        referenceNumber,
        requestId  // MongoDB _id
      });

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

   return res.status(200).json({
    authenticated: false,
    authUrl: auth.generateAuthUrl(),
    pdfPath,
  });
});

exports.oauthCallback = asyncHandler(async (req, res) => {
  const code = req.query.code;
  
  if (!code) {
    return res.status(400).json({ error: 'No authorization code provided' });
  }

  try {
    await auth.handleOAuthCallback(code);
     const adminUrl = process.env.VITE_ADMIN_URL || 'http://localhost:4000';
    res.redirect(`${adminUrl}?auth=success`);
  } catch (err) {
    console.error('OAuth callback error:', err.message);
    res.status(500).json({ error: 'Authentication failed', details: err.message });
  }
});

exports.checkAuth = asyncHandler(async (req, res) => {
  res.json({ authenticated: auth.isAuthenticated() });
});

exports.logout = asyncHandler(async (req, res) => {
  auth.logout();
  res.json({ message: 'Logged out successfully' });
});

exports.listPdfs = asyncHandler(async (req, res) => {
  if (!auth.isAuthenticated()) return res.status(401).json({ error: 'Not authenticated' });
  const pdfs = await drive.listPdfs();
  res.json(pdfs);
});

exports.downloadPdf = asyncHandler(async (req, res) => {
  if (!auth.isAuthenticated()) return res.status(401).json({ error: 'Not authenticated' });
  
  try {
    const stream = await drive.downloadPdf(req.params.fileId);
    res.setHeader('Content-Type', 'application/pdf');
    stream.data.pipe(res);
  } catch (err) {
    res.status(500).json({ error: 'Download failed', details: err.message });
  }
});

exports.deletePdf = asyncHandler(async (req, res) => {
  if (!auth.isAuthenticated()) return res.status(401).json({ error: 'Not authenticated' });
  
  try {
    await drive.deletePdf(req.params.fileId, {
      deletedBy: 'admin',
      deletedReason: 'Deleted via admin dashboard'
    });
    res.json({ success: true, message: 'PDF deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Delete failed', details: err.message });
  }
});

exports.updateStatus = asyncHandler(async (req, res) => {
  if (!auth.isAuthenticated()) return res.status(401).json({ error: 'Not authenticated' });
  
   const { fileId, referenceNumber } = req.params;
  const identifier = fileId || referenceNumber;
  
  if (!identifier) {
    return res.status(400).json({ error: 'Missing fileId or referenceNumber parameter' });
  }
  
  const { status } = req.body;
  
  if (!['Pending', 'Processing', 'For Pick-up', 'Completed', 'Cancelled'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status. Must be one of: Pending, Processing, For Pick-up, Completed, Cancelled' });
  }
  
  try {
    const updated = await drive.updateStatus(identifier, status);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ error: 'Update failed', details: err.message });
  }
});

exports.deleteMultiple = asyncHandler(async (req, res) => {
  if (!auth.isAuthenticated()) return res.status(401).json({ error: 'Not authenticated' });
  
  const { fileIds } = req.body;
  
  if (!Array.isArray(fileIds) || fileIds.length === 0) {
    return res.status(400).json({ error: 'Invalid file IDs' });
  }
  
  try {
    const result = await drive.deleteMultiple(fileIds, {
      deletedBy: 'admin',
      deletedReason: 'Bulk deleted via admin dashboard'
    });
    res.json({ success: true, message: `${result.deleted} PDFs deleted successfully` });
  } catch (err) {
    res.status(500).json({ error: 'Deletion failed', details: err.message });
  }
});

exports.listTrash = asyncHandler(async (req, res) => {
  if (!auth.isAuthenticated()) return res.status(401).json({ error: 'Not authenticated' });
  const trash = await drive.listTrash();
  res.json(trash);
});

exports.permanentlyDeleteFromTrash = asyncHandler(async (req, res) => {
  if (!auth.isAuthenticated()) return res.status(401).json({ error: 'Not authenticated' });
  
  try {
    await drive.permanentlyDeleteFromTrash(req.params.fileId, {
      deletedBy: 'admin',
      deletedReason: 'Permanently deleted from trash'
    });
    res.json({ success: true, message: 'PDF permanently deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Permanent deletion failed', details: err.message });
  }
});

exports.permanentlyDeleteMultipleFromTrash = asyncHandler(async (req, res) => {
  if (!auth.isAuthenticated()) return res.status(401).json({ error: 'Not authenticated' });
  
  const { fileIds } = req.body;
  
  if (!Array.isArray(fileIds) || fileIds.length === 0) {
    return res.status(400).json({ error: 'Invalid file IDs' });
  }
  
  try {
    const result = await drive.permanentlyDeleteMultipleFromTrash(fileIds, {
      deletedBy: 'admin',
      deletedReason: 'Bulk permanently deleted from trash'
    });
    res.json({ success: true, message: `${result.deleted} PDFs permanently deleted` });
  } catch (err) {
    res.status(500).json({ error: 'Permanent deletion failed', details: err.message });
  }
});
exports.restoreFromTrash = asyncHandler(async (req, res) => {
  if (!auth.isAuthenticated()) return res.status(401).json({ error: 'Not authenticated' });
  
  try {
    const updated = await drive.restoreFromTrash(req.params.fileId);
    res.json({ success: true, message: 'Document restored successfully', data: updated });
  } catch (err) {
    res.status(500).json({ error: 'Restore failed', details: err.message });
  }
});

exports.restoreMultipleFromTrash = asyncHandler(async (req, res) => {
  if (!auth.isAuthenticated()) return res.status(401).json({ error: 'Not authenticated' });
  
  const { fileIds } = req.body;
  
  if (!Array.isArray(fileIds) || fileIds.length === 0) {
    return res.status(400).json({ error: 'Invalid file IDs' });
  }
  
  try {
    const result = await drive.restoreMultipleFromTrash(fileIds);
    res.json({ success: true, message: `${result.restored} document(s) restored successfully` });
  } catch (err) {
    res.status(500).json({ error: 'Restore failed', details: err.message });
  }
});