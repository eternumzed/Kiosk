const express = require('express');
const router = express.Router();
const pdfController = require('../controllers/pdfController');

router.post('/generate', pdfController.generatePdf);
router.get('/oauth-callback', pdfController.oauthCallback);
router.get('/check-auth', pdfController.checkAuth);
router.get('/logout', pdfController.logout);
router.get('/list', pdfController.listPdfs);
router.get('/download/:fileId', pdfController.downloadPdf);
router.delete('/:fileId', pdfController.deletePdf);

module.exports = router;
