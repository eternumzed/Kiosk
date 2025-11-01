const express = require('express')
const router = express.Router();
const paymentController = require('../controllers/paymentController');

router.post("/create-checkout", paymentController.createCheckout);
router.post('/handle-webhook', paymentController.handleWebhook);


module.exports = router;