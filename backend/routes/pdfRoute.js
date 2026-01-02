const express = require('express');
const router = express.Router();
const pdfController = require('../controllers/pdfController');

// Authentication routes
router.get('/auth/check', pdfController.checkAuth);
router.get('/auth/init', pdfController.initAuth);
router.get('/auth/callback', pdfController.oauthCallback);
router.post('/auth/logout', pdfController.logout);

// PDF operations
router.post('/', pdfController.generatePdf);
router.get('/download/:fileId', pdfController.downloadPdf);
router.get('/list', pdfController.listPdfs);
router.get('/trash', pdfController.listTrash);
router.delete('/delete/:fileId', pdfController.deletePdf);
router.delete('/delete-multiple', pdfController.deleteMultiple);
router.delete('/trash/:fileId', pdfController.permanentlyDeleteFromTrash);
router.delete('/trash-multiple', pdfController.permanentlyDeleteMultipleFromTrash);
router.post('/restore/:fileId', pdfController.restoreFromTrash);
router.post('/restore-multiple', pdfController.restoreMultipleFromTrash);

// Status update routes - support both fileId and referenceNumber
router.patch('/status/:fileId', pdfController.updateStatus);
router.patch('/status/ref/:referenceNumber', pdfController.updateStatus);

// Legacy routes for backward compatibility
router.post('/generate', pdfController.generatePdf);
router.get('/oauth-callback', pdfController.oauthCallback);
router.get('/check-auth', pdfController.checkAuth);
router.get('/logout', pdfController.logout);
router.delete('/:fileId', pdfController.deletePdf);

module.exports = router;
