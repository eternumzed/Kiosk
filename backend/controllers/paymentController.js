// paymentController.js
const axios = require('axios')
const fs = require('fs');
const Request = require('../models/requestSchema.js');
const pdfService = require('../services/pdf/generatePdf.js');
const drive = require('../services/google/Drive.js');
const requestService = require('../services/requestService.js');

const kioskUrl = "http://localhost:4000" || process.env.VITE_KIOSK_URL;

const paymentMethodTypes = ["gcash", "card", "paymaya", "qrph", "grab_pay", "shopee_pay", "billease", "brankas_bdo", "brankas_landbank", "brankas_metrobank"];


exports.createCheckout = async (req, res) => {
    try {
        const newRequest = req.body

        const checkoutRes = await axios.post(
            "https://api.paymongo.com/v1/checkout_sessions",
            {
                data: {
                    attributes: {
                        line_items: [
                            {
                                name: newRequest.document,
                                amount: newRequest.amount * 100,
                                currency: "PHP",
                                quantity: 1,
                            },
                        ],
                        description: `Request for ${newRequest.document} by ${newRequest.fullName}`,
                        payment_method_types: paymentMethodTypes,
                        success_url: `${kioskUrl}/confirmation?referenceNumber=${newRequest.referenceNumber}`,
                        cancel_url: `${kioskUrl}/payment`,
                        billing: {
                            name: newRequest.fullName,
                            email: newRequest.email,
                            phone: newRequest.contactNumber || ""
                        },
                        reference_number: newRequest.referenceNumber,
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

        console.log(checkoutRes.data.data.attributes);

        res.json(checkoutRes.data.data.attributes);

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

                try {
                    const templateKey = requestService.getDocCode(updatedRequest.document);
                    console.log(`Generating PDF with template: ${templateKey}`);
                    
                    const rawData = updatedRequest.toObject();
                    console.log(`Data being passed to template:`, rawData);
                    
                    const result = await pdfService({ templateKey, rawData });
                    const pdfPath = result.pdfPath || result; // Handle both old and new format
                    console.log(`PDF generated at: ${pdfPath}`);
                    
                    // Update request with photo metadata if available
                    if (result.photoMetadata) {
                        await Request.findByIdAndUpdate(
                            updatedRequest._id,
                            {
                                photoFileId: result.photoMetadata.photoFileId,
                                photoFileName: result.photoMetadata.photoFileName,
                                photoUrl: result.photoMetadata.photoUrl,
                                photoDownloadUrl: result.photoMetadata.photoDownloadUrl,
                                photoUploadedAt: new Date(),
                            }
                        );
                        console.log('Photo metadata saved to request');
                    }
                    
                    try {
                         const uploaded = await drive.uploadPdf(pdfPath, updatedRequest.referenceNumber, {
                            type: templateKey,
                            referenceNumber: updatedRequest.referenceNumber,
                            requestId: updatedRequest._id,
                            photoFileId: result.photoMetadata?.photoFileId, // Store photo ID reference
                        });
                        console.log('PDF uploaded to Drive:', uploaded);
                    } finally {
                         try {
                            if (fs.existsSync(pdfPath)) {
                                fs.unlinkSync(pdfPath);
                                console.log(`Temp PDF deleted: ${pdfPath}`);
                            }
                        } catch (e) {
                            console.warn(`Could not delete temp file ${pdfPath}:`, e.message);
                        }
                    }
                } catch (err) {
                    console.error('PDF generation/upload after payment failed:', err.message || err);
                 }
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
