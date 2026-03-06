const express = require('express');
const router = express.Router();

router.use('/payment', require('./paymentRoute'));
router.use('/request', require('./requestRoute'));
router.use('/print', require('./printRoute'));
router.use('/pdf', require('./pdfRoute'));
router.use('/queue', require('./queueRoute'));

module.exports = router;
