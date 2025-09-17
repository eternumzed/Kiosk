const express = require('express');
const router = express.Router();

const requestController = require('../controllers/requestController');

router.get("/:id", requestController.request);
router.get("/track-request/:id", requestController.trackRequest);

module.exports = router;