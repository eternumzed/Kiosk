const mongoose = require('mongoose');

const PdfMetadataSchema = new mongoose.Schema({
  fileId: { type: String, required: true, unique: true }, // Google Drive file ID
  fileName: { type: String, required: true },
  referenceNumber: { type: String },
  type: { type: String }, // Document code like BRGY-CLR
  status: {
    type: String,
    enum: ['Pending', 'Processing', 'For Pick-up', 'Completed', 'Cancelled'],
    default: 'Pending'
  },
  size: { type: Number },
  webViewLink: { type: String },
  webContentLink: { type: String },
  createdTime: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('PdfMetadata', PdfMetadataSchema);
