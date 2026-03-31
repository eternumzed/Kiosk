const Request = require('../models/requestSchema');
const Counter = require('../models/counter');
const { computeDocumentFee } = require('./feePolicy');

function normalizeFullName(value) {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getDocCode(documentName) {
  if (!documentName) return 'DOC';

  const map = {
    'barangay clearance': 'BRGY-CLR',
    'barangay indigency certificate': 'BRGY-IND',
    'first time job seeker certificate': 'FTJSC',
    'barangay work permit': 'BRGY-WP',
    'barangay residency certificate': 'BRGY-RES',
    'certificate of good moral character': 'GMC',
    'barangay business permit': 'BRGY-BP',
    'barangay building clearance': 'BRGY-BLD',
  };

  return map[documentName.toLowerCase()] || 'DOC';
}

async function createRequestIfMissing(data) {
  // If data already has referenceNumber, try to find existing request
  if (data.referenceNumber) {
    const existing = await Request.findOne({ referenceNumber: data.referenceNumber });
    if (existing) return existing;
  }

  const { fullName, email, contactNumber, address, document } = data;
  const feeResult = computeDocumentFee({
    document,
    purpose: data?.purpose,
    isStudent: data?.isStudent,
  });

  const year = new Date().getFullYear();
  const counter = await Counter.findOneAndUpdate(
    { name: 'requestCounter', year },
    { $inc: { seq: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  const docCode = getDocCode(document);

  const normalizedFullName = normalizeFullName(fullName);
  if (docCode === 'FTJSC' && normalizedFullName) {
    const parts = normalizedFullName.split(' ').filter(Boolean);
    const regexPattern = `^\\s*${parts.map(escapeRegex).join('\\s+')}\\s*$`;
    const nameRegex = new RegExp(regexPattern, 'i');

    const duplicateRequest = await Request.findOne({
      documentCode: 'FTJSC',
      status: { $ne: 'Cancelled' },
      deleted: { $ne: true },
      $or: [
        { fullNameNormalized: normalizedFullName },
        { fullName: nameRegex },
      ],
    }).lean();

    if (duplicateRequest) {
      const error = new Error('You already requested a First Time Job Seeker Certificate under this full name.');
      error.status = 409;
      throw error;
    }
  }

  const seqNum = String(counter.seq).padStart(4, '0');
  const referenceNumber = `${docCode}-${year}-${seqNum}`;

  const req = await Request.create({
    fullName,
    fullNameNormalized: normalizedFullName,
    document,
    documentCode: docCode,  // ← Save the document code!
    contactNumber,
    email,
    address,
    amount: feeResult.amount,
    status: 'Pending',
    referenceNumber,
  });

  return req;
}

module.exports = { createRequestIfMissing, getDocCode };
