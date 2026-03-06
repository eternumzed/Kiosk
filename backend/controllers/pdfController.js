const asyncHandler = require('express-async-handler');
const pdfService = require('../services/pdf/generatePdf');
const auth = require('../services/google/Auth');
const drive = require('../services/google/Drive');
const PushNotificationService = require('../services/notifications/pushNotification');
const websocketHandler = require('../services/websocketHandler');

const fs = require('fs');
const path = require('path');
const requestService = require('../services/requestService');

// Generate Access Denied HTML page with kiosk theme
function getAccessDeniedPage(attemptedEmail, adminUrl) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Access Denied - Barangay Biluso</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Inter', system-ui, sans-serif;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #1e3a5f 0%, #0f172a 50%, #1e3a5f 100%);
            padding: 20px;
          }
          .container { max-width: 480px; width: 100%; text-align: center; }
          .logo {
            width: 80px; height: 80px; margin: 0 auto 24px;
            background: linear-gradient(135deg, #3b82f6, #1d4ed8);
            border-radius: 50%; display: flex; align-items: center; justify-content: center;
            box-shadow: 0 8px 32px rgba(59, 130, 246, 0.3);
          }
          .logo svg { width: 40px; height: 40px; color: white; }
          .card {
            background: rgba(255, 255, 255, 0.95);
            border-radius: 16px; padding: 40px 32px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4);
          }
          .icon-error {
            width: 64px; height: 64px; margin: 0 auto 20px;
            background: #fef2f2; border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
          }
          .icon-error svg { width: 32px; height: 32px; color: #dc2626; }
          h1 { color: #dc2626; font-size: 24px; font-weight: 700; margin-bottom: 16px; }
          .message { color: #4b5563; font-size: 15px; line-height: 1.6; margin-bottom: 16px; }
          .email-badge {
            display: inline-block; background: #fee2e2; color: #dc2626;
            padding: 8px 16px; border-radius: 8px; font-weight: 600; font-size: 14px; margin: 8px 0 24px;
          }
          .warning {
            background: #fefce8; border: 1px solid #fef08a; border-radius: 8px;
            padding: 12px 16px; color: #854d0e; font-size: 13px; margin-bottom: 24px;
          }
          .btn {
            display: inline-block; background: linear-gradient(135deg, #3b82f6, #1d4ed8);
            color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none;
            font-weight: 600; font-size: 15px; transition: transform 0.2s, box-shadow 0.2s;
          }
          .btn:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(59, 130, 246, 0.4); }
          .footer { margin-top: 24px; color: rgba(255, 255, 255, 0.6); font-size: 13px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div class="card">
            <div class="icon-error">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1>Access Denied</h1>
            <p class="message">This admin dashboard is restricted to authorized Barangay Biluso personnel only.</p>
            <div class="email-badge">${attemptedEmail}</div>
            <div class="warning">
              <strong>Note:</strong> Unauthorized access attempts are logged for security purposes.
            </div>
            <a href="${adminUrl}" class="btn">Return to Login</a>
          </div>
          <p class="footer">Barangay Biluso Kiosk System</p>
        </div>
      </body>
    </html>
  `;
}

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

  const adminUrl = process.env.VITE_ADMIN_URL || 'https://admin.brgybiluso.me';
  
  try {
    await auth.handleOAuthCallback(code);
    res.redirect(`${adminUrl}?auth=success`);
  } catch (err) {
    console.error('OAuth callback error:', err.message);
    
    // Check if this is an access denied error
    if (err.message.startsWith('ACCESS_DENIED:')) {
      const attemptedEmail = err.message.replace('ACCESS_DENIED:', '').split('You attempted with:')[1]?.trim() || 'Unknown';
      return res.status(403).send(getAccessDeniedPage(attemptedEmail, adminUrl));
    }
    
    res.status(500).json({ error: 'Authentication failed', details: err.message });
  }
});

exports.checkAuth = asyncHandler(async (req, res) => {
  // Check if admin has an active session (not just if Drive token exists)
  res.json({ authenticated: auth.isAdminLoggedIn() });
});

exports.logout = asyncHandler(async (req, res) => {
  auth.logout();
  res.json({ message: 'Logged out successfully' });
});

// Disconnect Google Drive - actually revokes token (use with caution)
exports.disconnectDrive = asyncHandler(async (req, res) => {
  auth.disconnectDrive();
  res.json({ message: 'Google Drive disconnected. PDF uploads will stop until re-authenticated.' });
});

exports.listPdfs = asyncHandler(async (req, res) => {
  if (!auth.isAdminLoggedIn()) return res.status(401).json({ error: 'Not authenticated' });
  const pdfs = await drive.listPdfs();
  res.json(pdfs);
});

exports.downloadPdf = asyncHandler(async (req, res) => {
  if (!auth.isAdminLoggedIn()) return res.status(401).json({ error: 'Not authenticated' });
  
  try {
    const stream = await drive.downloadPdf(req.params.fileId);
    res.setHeader('Content-Type', 'application/pdf');
    stream.data.pipe(res);
  } catch (err) {
    res.status(500).json({ error: 'Download failed', details: err.message });
  }
});

exports.deletePdf = asyncHandler(async (req, res) => {
  if (!auth.isAdminLoggedIn()) return res.status(401).json({ error: 'Not authenticated' });
  
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
  if (!auth.isAdminLoggedIn()) return res.status(401).json({ error: 'Not authenticated' });
  
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
    if (updated && updated.userId && status !== 'Pending') {
      try {
        await PushNotificationService.sendRequestStatusNotification(
          updated.userId,
          updated.referenceNumber,
          updated.document || updated.documentCode || 'Document Request',
          status
        );
      } catch (notifError) {
        // Don't fail the request if notification fails
        console.error('Failed to send push notification:', notifError.message);
      }
    }

    await websocketHandler.broadcastQueueUpdate();
    
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ error: 'Update failed', details: err.message });
  }
});

exports.deleteMultiple = asyncHandler(async (req, res) => {
  if (!auth.isAdminLoggedIn()) return res.status(401).json({ error: 'Not authenticated' });
  
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
  if (!auth.isAdminLoggedIn()) return res.status(401).json({ error: 'Not authenticated' });
  const trash = await drive.listTrash();
  res.json(trash);
});

exports.permanentlyDeleteFromTrash = asyncHandler(async (req, res) => {
  if (!auth.isAdminLoggedIn()) return res.status(401).json({ error: 'Not authenticated' });
  
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
  if (!auth.isAdminLoggedIn()) return res.status(401).json({ error: 'Not authenticated' });
  
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
  if (!auth.isAdminLoggedIn()) return res.status(401).json({ error: 'Not authenticated' });
  
  try {
    const updated = await drive.restoreFromTrash(req.params.fileId);
    res.json({ success: true, message: 'Document restored successfully', data: updated });
  } catch (err) {
    res.status(500).json({ error: 'Restore failed', details: err.message });
  }
});

exports.restoreMultipleFromTrash = asyncHandler(async (req, res) => {
  if (!auth.isAdminLoggedIn()) return res.status(401).json({ error: 'Not authenticated' });
  
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