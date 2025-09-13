// routes/paymentRoute.js
const express = require("express");
const axios = require("axios");
const router = express.Router();

const PAYMONGO_SECRET_KEY = process.env.PAYMONGO_SECRET_KEY; 

router.post("/create-checkout", async (req, res) => {
    try {
        const { document, amount } = req.body;

        const encodedKey = Buffer.from(PAYMONGO_SECRET_KEY + ":").toString("base64");

        const response = await axios.post(
            "https://api.paymongo.com/v1/checkout_sessions",
            {
                data: {
                    attributes: {
                        send_email_receipt: true,
                        show_description: true,
                        show_line_items: true,
                        cancel_url: "http://localhost:4000/payment",
                        description: "Payment for " + document,
                        line_items: [
                            {
                                currency: "PHP",
                                amount: amount * 100,
                                description: document,
                                name: document,
                                quantity: 1,
                            },
                        ],
                        payment_method_types: [
                            "qrph",
                            "gcash",
                            "grab_pay",
                            "paymaya",
                            "card",
                        ],
                        success_url: "http://localhost:4000/confirmation",
                    },
                },
            },
            {
                headers: {
                    accept: "application/json",
                    "Content-Type": "application/json",
                    Authorization: `Basic ${encodedKey}`,
                },
            }
        );
        const checkoutData = response.data.data;

        res.json({
            checkoutUrl: checkoutData.attributes.checkout_url,
            reference: checkoutData.id, 
            description: checkoutData.attributes.description,
            amount: checkoutData.attributes.line_items[0].amount / 100,
            currency: checkoutData.attributes.line_items[0].currency,
        });
    } catch (error) {
        console.error("PayMongo error:", error.response?.data || error.message);
        res.status(500).json({ error: "Payment session creation failed" });
    }
})

module.exports = router;
