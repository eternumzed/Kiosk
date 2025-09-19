const axios = require('axios')
const Request = require('../models/requestSchema.js');

exports.request = async (req, res) => {
    try {
        const request = await Request.findById(req.params.id);
        if (!request) return res.status(404).json({ error: "Request not found" });
        res.json(request);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.trackRequest = async (req, res) => {

    try {
        const request = await Request.find({ referenceNumber: req.params.id });
        if (!request) return res.status(404).json({ error: "Request reference number not found" });
        res.json(request);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }

}



