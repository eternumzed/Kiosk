const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const RequestSchema = new Schema({
    fullName: { type: String, trim: true },
    contactNumber: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    address: { type: String, trim: true },
    barangay: { type: String },
    document: { type: String },
    amount: { type: Number },
    category: { type: String },

    checkoutUrl: { type: String },
    paymongoSessionId: { type: String },
    paymongoPaymentId: { type: String },
    currency: { type: String },
    paidAt: { type: Date },
    referenceNumber: { type: String, unique: true },


    status: {
        type: String,
        enum: ["Pending", "Processing", "Completed", "Cancelled"],
        default: "Pending"
    },
    paymentStatus: {
        type: String,
        enum: ["Unpaid", "Processing", "Paid", "Failed"],
        default: "Unpaid"
    },
    remarks: { type: String },

}, { timestamps: true });



module.exports = mongoose.model('Request', RequestSchema);
