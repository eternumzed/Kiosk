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
        
        const { fullName, email, contactNumber, address, document, amount, ...templateFields } = req.body;
        
        console.log('Extracted template fields:', templateFields);

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
            ...templateFields  // Store all template-specific fields (age, zone, purpose, etc.)
        });

        await newRequest.save();
        const paymongoRes = await axios.post('http://localhost:5000/api/payment/create-checkout', newRequest);

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



