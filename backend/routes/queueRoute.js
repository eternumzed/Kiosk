const express = require('express');
const router = express.Router();
const queueController = require('../controllers/queueController');

router.get('/', queueController.getQueueSnapshot);

module.exports = router;
