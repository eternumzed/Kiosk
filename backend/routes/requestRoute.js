const express = require('express');
const router = express.Router();
const requestController = require('../controllers/requestController');
const { verifyAccessToken } = require('../middleware/authMiddleware');
// const authMiddleware = require('../middlewares/auth'); // for mobile/admin auth

// Public / kiosk
// router.get("/track-request/:referenceNumber", requestController.trackRequest);

// Authenticated mobile user
// router.get("/", authMiddleware, requestController.getUserRequests); // all requests for logged-in user
// router.get("/:id", authMiddleware, requestController.getRequestById); // single request for logged-in user
// router.post("/", authMiddleware, requestController.createRequest); // create request via mobile app

// module.exports = router;


// 


router.post("/create-request/", requestController.createRequest)

// Authenticated mobile user request visibility controls
router.patch('/hide', verifyAccessToken, requestController.hideRequestAny);
router.patch('/unhide', verifyAccessToken, requestController.unhideRequestAny);
router.patch('/hide/:requestId', verifyAccessToken, requestController.hideRequest);
router.patch('/unhide/:requestId', verifyAccessToken, requestController.unhideRequest);
router.patch('/hide/ref/:referenceNumber', verifyAccessToken, requestController.hideRequestByReference);
router.patch('/unhide/ref/:referenceNumber', verifyAccessToken, requestController.unhideRequestByReference);

router.get('/track-request/:referenceNumber', requestController.trackRequest); // Confirmation.jsx TrackRequest.jsx
router.get('/:id', requestController.request); // for confirmation screen + mobile details

module.exports = router;
