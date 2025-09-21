// paymentController.js
const axios = require('axios')
const Request = require('../models/requestSchema.js');
const Counter = require('../models/counter.js');

function getDocCode(documentName) {
    if (!documentName) return "DOC";

    const map = {
        "cedula": "CED",
        "birth certificate": "BC",
        "marriage certificate": "MC",
        "death certificate": "DC",
        "barangay clearance": "BRGY",
        "building permit": "BP",
        "health certificate": "HC",
    };

    return map[documentName.toLowerCase()] || "DOC";
}


exports.createCheckout = async (req, res) => {
    try {
        const { fullName, email, contactNumber, address, barangay, document, amount } = req.body;

        const year = new Date().getFullYear();
        const counter = await Counter.findOneAndUpdate(
            { name: 'requestCounter', year },
            { $inc: { seq: 1 } },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        const docCode = getDocCode(document);
        const seqNum = String(counter.seq).padStart(4, '0');
        const referenceNumber = `${docCode}-${year}-${seqNum}`;

        const newRequest = await Request.create({
            fullName,
            document,
            contactNumber,
            email,
            address,
            barangay,
            amount,
            status: "Pending",
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
                        description: `Request for ${document} by ${fullName}`,
                        payment_method_types: ["gcash", "card", "paymaya", "qrph", "grab_pay"],
                        success_url: `http://localhost:4000/confirmation?requestId=${newRequest._id}`,
                        cancel_url: `http://localhost:4000/payment`,
                        billing: {
                            name: fullName,
                            email: email,
                            phone: contactNumber || ""
                        },
                        reference_number: referenceNumber,
                        send_email_receipt: true
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
        newRequest.checkoutUrl = checkoutRes.data.data.attributes.checkout_url;
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
