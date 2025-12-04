// paymentController.js
const axios = require('axios')
const Request = require('../models/requestSchema.js');
const Counter = require('../models/counter.js');

const kioskUrl = "http://localhost:4000" || process.env.VITE_KIOSK_URL;

const paymentMethodTypes = ["gcash", "card", "paymaya", "qrph", "grab_pay", "shopee_pay", "billease", "brankas_bdo", "brankas_landbank", "brankas_metrobank"];

function getDocCode(documentName) {
    if (!documentName) return "DOC";

    const map = {
        "barangay clearance": "BRGY-CLR",
        "barangay indigency certificate": "BRGY-IND",
        "first time job seeker certificate": "FTJSC",
        "barangay work permit": "BRGY-WP",
        "barangay residency certificate": "BRGY-RES",
        "certificate of good moral character": "GMC",
        "barangay business permit": "BRGY-BP",
        "barangay building clearance": "BRGY-BLD",
    };


    return map[documentName.toLowerCase()] || "DOC";
}


exports.createCheckout = async (req, res) => {
    try {
        const { fullName, email, contactNumber, address, document, amount } = req.body;

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
                        payment_method_types: paymentMethodTypes,
                        success_url: `${kioskUrl}/confirmation?referenceNumber=${newRequest.referenceNumber}`,
                        cancel_url: `${kioskUrl}/payment`,
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
        const event = req.body.data;
        const eventType = event?.attributes?.type;

        if (eventType === 'checkout_session.payment.paid') {

            const checkoutData = event.attributes.data.attributes;
            const refNum = checkoutData.reference_number;
            const paymentMethod = checkoutData.payment_method_used;

            let paymentLabel = '';

            switch (paymentMethod) {
                case 'gcash': paymentLabel = 'GCash'; break;
                case 'card': paymentLabel = 'Credit/Debit Card'; break;
                case 'paymaya': paymentLabel = 'PayMaya'; break;
                case 'grab_pay': paymentLabel = 'GrabPay'; break;
                case 'shopee_pay': paymentLabel = 'ShopeePay'; break;
                case 'billease': paymentLabel = 'BillEase'; break;
                case 'qrph': paymentLabel = 'QR Ph'; break;
                case 'brankas_bdo': paymentLabel = 'Brankas (BDO)'; break;
                case 'brankas_landbank': paymentLabel = 'Brankas (Landbank)'; break;
                case 'brankas_metrobank': paymentLabel = 'Brankas (Metrobank)'; break;
                default:
                    paymentLabel = paymentMethod || 'Unknown';
                    break;
            }

            const paidAt = new Date(
                new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" })
            );

            const updatedRequest = await Request.findOneAndUpdate(
                { referenceNumber: refNum },
                {
                    $set: {
                        status: "Processing",
                        paymentStatus: "Paid",
                        paymentMethod: paymentLabel,
                        paidAt: paidAt,
                    },
                },
                { new: true }
            );

            if (updatedRequest) {
                console.log(`Updated record for ${refNum}:`, updatedRequest);
            } else {
                console.warn(`No request found for reference: ${refNum}`);
            }
        }

        res.sendStatus(200);

    } catch (err) {
        console.error('Webhook processing error:', err);
        res.sendStatus(500);
    }
};
