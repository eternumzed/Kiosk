const express = require('express');

const router = express.Router();

const requestController = require('../controllers/requestController');

router.get("/:id", requestController.request);

module.exports = router;