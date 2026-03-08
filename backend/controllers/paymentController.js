// paymentController.js
const axios = require('axios')
const fs = require('fs');
const jwt = require('jsonwebtoken');
const Request = require('../models/requestSchema.js');
const Counter = require('../models/counter.js');
const pdfService = require('../services/pdf/generatePdf.js');
const drive = require('../services/google/Drive.js');
const auth = require('../services/google/Auth.js');
const requestService = require('../services/requestService.js');
const PushNotificationService = require('../services/notifications/pushNotification');
const websocketHandler = require('../services/websocketHandler');

const kioskUrl = process.env.KIOSK_URL || "http://localhost:4000";

const paymentMethodTypes = ["gcash", "paymaya", "qrph", "grab_pay", "shopee_pay", "billease"];

function resolveUserIdFromRequest(req, fallbackUserId) {
    const authHeader = req.headers?.authorization || '';
    if (typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
        return fallbackUserId || null;
    }

    const token = authHeader.slice(7).trim();
    if (!token) return fallbackUserId || null;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        return decoded?.userId || fallbackUserId || null;
    } catch (_err) {
        return fallbackUserId || null;
    }
}


exports.createCheckout = async (req, res) => {
    try {
        const newRequest = req.body
        
        // Use client-provided returnUrl (for mobile deep linking) or default to kiosk URL
        const successUrl = newRequest.returnUrl 
            ? `${newRequest.returnUrl}?referenceNumber=${newRequest.referenceNumber}`
            : `${kioskUrl}/confirmation?referenceNumber=${newRequest.referenceNumber}`;
        const cancelUrl = newRequest.cancelUrl || `${kioskUrl}/payment`;

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
                        success_url: successUrl,
                        cancel_url: cancelUrl,
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

        console.log(`Webhook received - Event Type: ${eventType}`);

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

                if (updatedRequest.userId) {
                    try {
                        await PushNotificationService.sendRequestStatusNotification(
                            updatedRequest.userId,
                            updatedRequest.referenceNumber,
                            updatedRequest.document || updatedRequest.documentCode || 'Document Request',
                            updatedRequest.status,
                            updatedRequest._id
                        );
                    } catch (notifErr) {
                        console.error('Failed to send processing notification:', notifErr.message);
                    }
                }

                await websocketHandler.broadcastQueueUpdate();

                try {
                    const templateKey = requestService.getDocCode(updatedRequest.document);
                    console.log(`Generating PDF with template: ${templateKey}`);
                    
                    const rawData = updatedRequest.toObject();
                    console.log(`Data being passed to template:`, rawData);
                    
                    const pdfPath = await pdfService({ templateKey, rawData });
                    console.log(`PDF generated at: ${pdfPath}`);
                    
                    // Only attempt upload if authenticated
                    if (!auth.isAuthenticated()) {
                        console.warn('Google Drive not authenticated - skipping upload. File will be cleaned by pm2 daemon.');
                    } else {
                        try {
                            const uploaded = await drive.uploadPdf(pdfPath, updatedRequest.referenceNumber, {
                                type: templateKey,
                                referenceNumber: updatedRequest.referenceNumber,
                                requestId: updatedRequest._id,
                            });
                            console.log('PDF uploaded to Drive:', uploaded);
                            
                            // Only delete after successful upload
                            try {
                                if (fs.existsSync(pdfPath)) {
                                    fs.unlinkSync(pdfPath);
                                    console.log(`[Cleanup] Deleted temp PDF: ${pdfPath}`);
                                }
                            } catch (e) {
                                console.warn(`[Cleanup] Could not delete temp file ${pdfPath}:`, e.message);
                            }
                        } catch (uploadErr) {
                            // Upload failed - leave file for pm2 cleanup daemon
                            console.error('Drive upload failed:', uploadErr.message || uploadErr);
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

exports.createCashPayment = async (req, res) => {
    try {
        const newRequest = req.body;
        const { fullName, email, contactNumber, address, document, amount, userId, ...templateFields } = newRequest;
        const linkedUserId = resolveUserIdFromRequest(req, userId);
        
        console.log('Cash payment - User ID:', linkedUserId);

        // Generate reference number same way as e-wallet
        const year = new Date().getFullYear();
        const counter = await Counter.findOneAndUpdate(
            { name: 'requestCounter', year },
            { $inc: { seq: 1 } },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        const docCode = requestService.getDocCode(document);
        const seqNum = String(counter.seq).padStart(4, '0');
        const referenceNumber = `${docCode}-${year}-${seqNum}`;

        // Set current Manila time
        const paidAt = new Date(
            new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" })
        );

        // Create request with cash payment status
        const request = await Request.create({
            fullName,
            document,
            contactNumber,
            email,
            address,
            amount,
            referenceNumber,
            status: "Pending",
            paymentStatus: "Pending",
            paymentMethod: "Cash",
            paidAt: paidAt,
            userId: linkedUserId || null,  // Link to mobile user if provided/authenticated
            ...templateFields
        });

        console.log(`\n=== CASH PAYMENT CREATED ===`);
        console.log(`Reference: ${request.referenceNumber}`);
        console.log(`Document: ${request.document}`);
        console.log(`Amount: PHP ${request.amount}\n`);

        // Generate PDF for cash payment (don't wait for webhook)
        try {
            const templateKey = requestService.getDocCode(request.document);
            console.log(`[PDF GENERATION] Starting...`);
            console.log(`[PDF GENERATION] Template Key: ${templateKey}`);
            console.log(`[PDF GENERATION] Document: ${request.document}`);
            
            const rawData = request.toObject();
            
            const pdfPath = await pdfService({ templateKey, rawData });
            console.log(`[PDF GENERATION] Success`);
            console.log(`[PDF GENERATION] File Path: ${pdfPath}\n`);
            
            // Only attempt upload if authenticated
            if (!auth.isAuthenticated()) {
                console.warn('[GOOGLE DRIVE] Not authenticated - skipping upload. File will be cleaned by pm2 daemon.');
            } else {
                try {
                    console.log(`[GOOGLE DRIVE] Uploading PDF...`);
                    const uploaded = await drive.uploadPdf(pdfPath, request.referenceNumber, {
                        type: templateKey,
                        referenceNumber: request.referenceNumber,
                        requestId: request._id,
                    });
                    console.log(`[GOOGLE DRIVE] Upload Success`);
                    console.log(`[GOOGLE DRIVE] File ID: ${uploaded.fileId || uploaded.id || 'N/A'}`);
                    console.log(`[GOOGLE DRIVE] View URL: ${uploaded.webViewLink || 'N/A'}\n`);
                    
                    // Only delete after successful upload
                    try {
                        if (fs.existsSync(pdfPath)) {
                            fs.unlinkSync(pdfPath);
                            console.log(`[CLEANUP] Temp PDF file deleted\n`);
                        }
                    } catch (e) {
                        console.warn(`[CLEANUP] Could not delete temp file: ${e.message}`);
                    }
                } catch (uploadErr) {
                    // Upload failed - leave file for pm2 cleanup daemon
                    console.error(`[GOOGLE DRIVE] Upload failed: ${uploadErr.message || uploadErr}`);
                }
            }
        } catch (err) {
            console.error(`\n[ERROR] PDF GENERATION/UPLOAD FAILED`);
            console.error(`[ERROR] Message: ${err.message || err}`);
            console.error(`[ERROR] Reference: ${request.referenceNumber}\n`);
            // Don't fail the payment creation if PDF generation fails
        }

        res.json({
            success: true,
            referenceNumber: request.referenceNumber,
            status: request.status,
            paymentStatus: request.paymentStatus,
            paymentMethod: request.paymentMethod,
            message: "Request created. Please proceed to barangay cashier with receipt."
        });

    } catch (err) {
        console.error(`\n[ERROR] CASH PAYMENT CREATION FAILED`);
        console.error(`[ERROR] Message: ${err.message}\n`);
        res.status(500).json({ error: err.message });
    }
};
