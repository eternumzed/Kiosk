const asyncHandler = require('express-async-handler');
const pdfService = require('../services/pdf/generatePdf');
const auth = require('../services/google/Auth');
const drive = require('../services/google/Drive');
const PushNotificationService = require('../services/notifications/pushNotification');

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
  let pdfPath = null;
  let namePrefix = type;
  let requestId = null;
  let referenceNumber = data.referenceNumber;
  let uploaded = null;
  let errorToReturn = null;

  try {
    // 1) Generate the PDF locally
    pdfPath = await pdfService({ templateKey: type, rawData: data });

    // 2) Create/find request record
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
      errorToReturn = { status: 500, body: { error: 'Failed to create request record', details: err.message } };
      return;
    }

    // 3) Upload to Drive if authenticated
    if (auth.isAuthenticated()) {
      try {
        uploaded = await drive.uploadPdf(pdfPath, namePrefix, {
          type,
          referenceNumber,
          requestId
        });
      } catch (err) {
        console.error('Drive upload failed:', err.response?.data || err.message || err);
        errorToReturn = { status: 500, body: { error: 'Drive upload failed', details: err.message || err } };
        return;
      }
    } else {
      errorToReturn = {
        status: 200,
        body: {
          authenticated: false,
          authUrl: auth.generateAuthUrl(),
          pdfPath,
        }
      };
      return;
    }
  } catch (err) {
    console.error('Document processing failed:', err);
    errorToReturn = { status: 500, body: { error: 'Failed to process document' } };
  } finally {
    // 4. GUARANTEED CLEANUP: always try to delete temp file
    if (pdfPath && fs.existsSync(pdfPath)) {
      try {
        fs.unlinkSync(pdfPath);
        console.log(`[Cleanup] Deleted temporary file: ${pdfPath}`);
      } catch (cleanupErr) {
        console.error(`[Cleanup] Failed to delete ${pdfPath}:`, cleanupErr);
      }
    }
  }

  // Respond to client
  if (uploaded) {
    return res.json({ uploaded: true, file: uploaded });
  } else if (errorToReturn) {
    return res.status(errorToReturn.status).json(errorToReturn.body);
  }
});

exports.oauthCallback = asyncHandler(async (req, res) => {
  const code = req.query.code;
  
  if (!code) {
    return res.status(400).json({ error: 'No authorization code provided' });
  }

  try {
    await auth.handleOAuthCallback(code);
    const adminUrl = process.env.VITE_ADMIN_URL || 'http://localhost:3000';
    res.redirect(`${adminUrl}?auth=success`);
  } catch (err) {
    console.error('OAuth callback error:', err.message);
    
    // Check if this is an access denied error
    if (err.message.startsWith('ACCESS_DENIED:')) {
      const errorDetails = err.message.replace('ACCESS_DENIED:', '');
      return res.status(403).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Access Denied</title>
            <style>
              body { font-family: 'Inter', system-ui, sans-serif; padding: 40px; text-align: center; background: #1f2937; min-height: 100vh; }
              .card { max-width: 520px; margin: 60px auto; padding: 48px; background: #111827; border-radius: 8px; border: 1px solid #374151; }
              h1 { color: #dc2626; margin-bottom: 24px; font-size: 28px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; }
              .divider { width: 60px; height: 3px; background: #dc2626; margin: 0 auto 24px; }
              p { color: #9ca3af; line-height: 1.8; margin: 16px 0; font-size: 15px; }
              .warning { color: #fbbf24; font-weight: 600; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin-top: 32px; }
              a { display: inline-block; margin-top: 32px; padding: 14px 32px; background: #374151; color: #e5e7eb; text-decoration: none; border-radius: 4px; font-weight: 600; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; border: 1px solid #4b5563; transition: all 0.2s; }
              a:hover { background: #4b5563; color: #ffffff; }
            </style>
          </head>
          <body>
            <div class="card">
              <h1>Access Denied</h1>
              <div class="divider"></div>
              <p>${errorDetails}</p>
              <p>This system is restricted to authorized personnel only. Unauthorized access attempts are logged and may be subject to further action.</p>
              <p class="warning">This incident has been recorded.</p>
              <a href="${process.env.VITE_ADMIN_URL || 'http://localhost:3000'}">Return</a>
            </div>
          </body>
        </html>
      `);
    }
    
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
    
    // Send push notification to the user if they have a userId
    if (updated && updated.userId) {
      try {
        await PushNotificationService.sendRequestStatusNotification(
          updated.userId,
          updated.referenceNumber,
          status,
          updated.document || updated.documentCode
        );
      } catch (notifError) {
        // Don't fail the request if notification fails
        console.error('Failed to send push notification:', notifError.message);
      }
    }
    
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