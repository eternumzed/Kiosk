const express = require('express');
const router = express.Router();
const requestController = require('../controllers/requestController');
// const authMiddleware = require('../middlewares/auth'); // for mobile/admin auth

// Public / kiosk
router.get("/track-request/:referenceNumber", requestController.trackRequest);

// Authenticated mobile user
// router.get("/", authMiddleware, requestController.getUserRequests); // all requests for logged-in user
// router.get("/:id", authMiddleware, requestController.getRequestById); // single request for logged-in user
// router.post("/", authMiddleware, requestController.createRequest); // create request via mobile app

module.exports = router;


// 




router.get("/:id", requestController.request); // for confirmation screen
router.get("/track-request/:id", requestController.trackRequest); // for searching request on track request screen

module.exports = router;
