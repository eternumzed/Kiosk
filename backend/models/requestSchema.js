const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const RequestSchema = new Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    fullName: { type: String, trim: true },
    contactNumber: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    address: { type: String, trim: true },
    document: { type: String },
    documentCode: { type: String },
    amount: { type: Number },
    category: { type: String },
    
    // Store all template-specific fields (age, purpose, citizenship, zone, etc.)
    // MongoDB allows storing any fields - they'll be preserved as-is
    // Common fields used in templates:
    citizenship: { type: String },
    civilStatus: { type: String },
    age: { type: String },
    purpose: { type: String },
    zone: { type: String },
    lengthOfResidency: { type: String },
    businessName: { type: String },
    businessKind: { type: String },
    sex: { type: String },
    projectType: { type: String },

    checkoutUrl: { type: String },
    paymongoSessionId: { type: String },
    paymongoPaymentId: { type: String },
    paymentMethod: { type: String, default: "" },
    currency: { type: String },
    paidAt: { type: Date },
    referenceNumber: { type: String, unique: true },

    status: {
        type: String,
        enum: ["Pending", "Processing", "For Pick-up", "Completed", "Cancelled"],
        default: "Pending"
    },
    paymentStatus: {
        type: String,
        enum: ["Unpaid", "Processing", "Paid", "Failed"],
        default: "Unpaid"
    },
    remarks: { type: String },

    // PDF/Document Fields (Added for consolidated tracking)
    type: { type: String },                           // Document type code (e.g., "BRGY-CLR")
    fileId: { type: String },                         // Google Drive file ID (unique identifier)
    pdfFileName: { type: String },                    // Original PDF filename
    pdfUploadedAt: { type: Date },                    // When PDF was uploaded to Drive
    pdfSize: { type: Number },                        // File size in bytes
    pdfUrl: { type: String },                         // Google Drive view link
    pdfDownloadUrl: { type: String },                 // Google Drive download link

    // Photo Fields (for ID photos)
    photoId: { type: String },                        // Base64 photo data (transient - not stored long-term)
    photoFileId: { type: String },                    // Google Drive photo file ID
    photoFileName: { type: String },                  // Photo filename on Drive
    photoUrl: { type: String },                       // Google Drive photo view link
    photoDownloadUrl: { type: String },               // Google Drive photo download link
    photoUploadedAt: { type: Date },                  // When photo was uploaded to Drive

    // Soft Delete Fields (For audit trail and recovery)
    deleted: { type: Boolean, default: false },       // Mark as deleted without removing
    deletedAt: { type: Date },                        // When was it deleted
    deletedReason: { type: String },                  // Why was it deleted
    deletedBy: { type: String },                      // Who deleted it (admin email/id)

}, { timestamps: true });


module.exports = mongoose.model('Request', RequestSchema);
