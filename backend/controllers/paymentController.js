// paymentController.js
const axios = require('axios')
const Request = require('../models/requestSchema.js');
const { v4: uuidv4 } = require('uuid');

exports.createCheckout = async (req, res) => {
    try {
        const { fullName, contactNumber, address, barangay, document, amount } = req.body;


        const referenceNumber = uuidv4().split("-")[0].toUpperCase();

        const newRequest = await Request.create({
            fullName,
            document,
            contactNumber,
            address,
            barangay,
            amount,
            status: "pending",
            referenceNumber

        });


        const checkoutRes = await axios.post(
            "https://api.paymongo.com/v1/checkout_sessions",
            {
                data: {
                    attributes: {
                        line_items: [
                            {
                                name: document,
                                amount: amount * 100,
                                currency: "PHP",
                                quantity: 1,
                            },
                        ],
                        description: `Request for ${document}`,
                        payment_method_types: ["gcash", "card", "paymaya", "qrph", "grab_pay"],
                        success_url: `http://localhost:4000/confirmation?requestId=${newRequest._id}`,
                        cancel_url: "http://localhost:4000/",
                    },
                },
            },
            {
                headers: {
                    Authorization: `Basic ${Buffer.from(process.env.PAYMONGO_SECRET_KEY).toString("base64")}`,
                    "Content-Type": "application/json",
                },
            }
        );


        newRequest.paymongoId = checkoutRes.data.data.id;
        newRequest.referenceNumber = checkoutRes.data.data.attributes.reference_number;
        console.log(checkoutRes.data);
        await newRequest.save();

        res.json({
            checkoutUrl: checkoutRes.data.data.attributes.checkout_url,
            reference: newRequest.referenceNumber,
        });
    } catch (err) {
        console.error(err.response?.data || err.message);
        res.status(500).json({ error: err.message });
    }
};


exports.handleWebhook = async (req, res) => {
    try {

        console.log("Webhook received:", req.body);

        // TODO: find the Request by paymongoId or referenceNumber
        // TODO: update its paymentStatus, paidAt, etc.

        res.sendStatus(200); // must respond quickly
    } catch (err) {
        console.error("Webhook error:", err.message);
        res.status(500).json({ error: err.message });
    }
};
