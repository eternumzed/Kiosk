const axios = require('axios')
const mongoose = require('mongoose');
const Request = require('../models/requestSchema.js');
const Counter = require('../models/counter.js');
const websocketHandler = require('../services/websocketHandler');

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

exports.createRequest = async (req, res) => {
    try {
        console.log('createRequest received body:', req.body);
        
        const { fullName, email, contactNumber, address, document, amount, returnUrl, cancelUrl, userId, ...templateFields } = req.body;
        
        console.log('Extracted template fields:', templateFields);
        console.log('User ID for request:', userId);

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
            referenceNumber,
            userId: userId || null,  // Link to mobile user if provided
            ...templateFields  // Store all template-specific fields (age, zone, purpose, etc.)
        });

        await newRequest.save();
        
        // Pass returnUrl and cancelUrl to payment controller for mobile deep linking
        const paymentData = { ...newRequest.toObject(), returnUrl, cancelUrl };
        const paymongoRes = await axios.post('https://api.brgybiluso.me/api/payment/create-checkout', paymentData);

        res.json(paymongoRes.data);



    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

exports.request = async (req, res) => {
    try {
        const request = await Request.find({ referenceNumber: req.params.id });
        if (!request) return res.status(404).json({ error: "Request not found" });
        res.json(request);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.trackRequest = async (req, res) => {

    try {
        const request = await Request.find({ referenceNumber: req.params.referenceNumber });
        if (!request) return res.status(404).json({ error: "Request not found" });
        res.json(request);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }

}

exports.hideRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const referenceNumber = typeof req.body?.referenceNumber === 'string'
            ? req.body.referenceNumber.trim()
            : '';
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        let request = null;
        const canUseObjectId = mongoose.Types.ObjectId.isValid(requestId);

        // Primary lookup by Mongo _id.
        if (canUseObjectId) {
            request = await Request.findOneAndUpdate(
                { _id: requestId, userId, deleted: { $ne: true } },
                {
                    hiddenByUser: true,
                    hiddenAt: new Date(),
                },
                { new: true }
            );
        }

        // Fallback for legacy/mobile edge cases where _id isn't available but reference exists.
        if (!request && referenceNumber) {
            request = await Request.findOneAndUpdate(
                { referenceNumber, userId, deleted: { $ne: true } },
                {
                    hiddenByUser: true,
                    hiddenAt: new Date(),
                },
                { new: true }
            );
        }

        if (!request) {
            return res.status(404).json({ error: 'Request not found' });
        }

        await websocketHandler.broadcastQueueUpdate();

        res.json({
            success: true,
            message: 'Request hidden successfully',
            request,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.unhideRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const referenceNumber = typeof req.body?.referenceNumber === 'string'
            ? req.body.referenceNumber.trim()
            : '';
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        let request = null;
        const canUseObjectId = mongoose.Types.ObjectId.isValid(requestId);

        if (canUseObjectId) {
            request = await Request.findOneAndUpdate(
                { _id: requestId, userId, deleted: { $ne: true } },
                {
                    hiddenByUser: false,
                    hiddenAt: null,
                },
                { new: true }
            );
        }

        if (!request && referenceNumber) {
            request = await Request.findOneAndUpdate(
                { referenceNumber, userId, deleted: { $ne: true } },
                {
                    hiddenByUser: false,
                    hiddenAt: null,
                },
                { new: true }
            );
        }

        if (!request) {
            return res.status(404).json({ error: 'Request not found' });
        }

        await websocketHandler.broadcastQueueUpdate();

        res.json({
            success: true,
            message: 'Request unhidden successfully',
            request,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

async function updateHiddenState(query, hiddenByUser) {
    const update = hiddenByUser
        ? { hiddenByUser: true, hiddenAt: new Date() }
        : { hiddenByUser: false, hiddenAt: null };

    return Request.findOneAndUpdate(
        { ...query, deleted: { $ne: true } },
        update,
        { new: true }
    );
}

async function updateHiddenStateByAnyIdentifier({ userId, requestId, referenceNumber, hiddenByUser }) {
    const safeReference = typeof referenceNumber === 'string' ? referenceNumber.trim() : '';
    const canUseObjectId = typeof requestId === 'string' && mongoose.Types.ObjectId.isValid(requestId);

    if (canUseObjectId) {
        const byId = await updateHiddenState({ _id: requestId, userId }, hiddenByUser);
        if (byId) return byId;
    }

    if (safeReference) {
        const byReference = await updateHiddenState({ referenceNumber: safeReference, userId }, hiddenByUser);
        if (byReference) return byReference;
    }

    return null;
}

exports.hideRequestAny = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const requestId = typeof req.body?.requestId === 'string' ? req.body.requestId.trim() : '';
        const referenceNumber = typeof req.body?.referenceNumber === 'string' ? req.body.referenceNumber.trim() : '';

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!requestId && !referenceNumber) {
            return res.status(400).json({ error: 'requestId or referenceNumber is required' });
        }

        const request = await updateHiddenStateByAnyIdentifier({
            userId,
            requestId,
            referenceNumber,
            hiddenByUser: true,
        });

        if (!request) {
            return res.status(404).json({ error: 'Request not found' });
        }

        await websocketHandler.broadcastQueueUpdate();
        res.json({ success: true, message: 'Request hidden successfully', request });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.unhideRequestAny = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const requestId = typeof req.body?.requestId === 'string' ? req.body.requestId.trim() : '';
        const referenceNumber = typeof req.body?.referenceNumber === 'string' ? req.body.referenceNumber.trim() : '';

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!requestId && !referenceNumber) {
            return res.status(400).json({ error: 'requestId or referenceNumber is required' });
        }

        const request = await updateHiddenStateByAnyIdentifier({
            userId,
            requestId,
            referenceNumber,
            hiddenByUser: false,
        });

        if (!request) {
            return res.status(404).json({ error: 'Request not found' });
        }

        await websocketHandler.broadcastQueueUpdate();
        res.json({ success: true, message: 'Request unhidden successfully', request });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.hideRequestByReference = async (req, res) => {
    try {
        const { referenceNumber } = req.params;
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const request = await updateHiddenState(
            { referenceNumber, userId },
            true
        );

        if (!request) {
            return res.status(404).json({ error: 'Request not found' });
        }

        await websocketHandler.broadcastQueueUpdate();
        res.json({ success: true, message: 'Request hidden successfully', request });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.unhideRequestByReference = async (req, res) => {
    try {
        const { referenceNumber } = req.params;
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const request = await updateHiddenState(
            { referenceNumber, userId },
            false
        );

        if (!request) {
            return res.status(404).json({ error: 'Request not found' });
        }

        await websocketHandler.broadcastQueueUpdate();
        res.json({ success: true, message: 'Request unhidden successfully', request });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};



