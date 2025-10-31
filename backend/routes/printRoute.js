const express = require('express');
const router = express.Router();

const printController = require('../controllers/printController');

router.post("/", printController.print);

module.exports = router;
