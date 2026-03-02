const express = require('express');
const router = express.Router();

const printController = require('../controllers/printController');

// Print a receipt
router.post("/", printController.print);

// Get print status (check if print agent is connected)
router.get("/status", printController.getPrintStatus);

// Test print
router.post("/test", printController.testPrint);

module.exports = router;
