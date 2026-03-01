const axios = require('axios')
const Request = require('../models/requestSchema.js');
const Counter = require('../models/counter.js');

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



