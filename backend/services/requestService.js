const Request = require('../models/requestSchema');
const Counter = require('../models/counter');

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

  const { fullName, email, contactNumber, address, document, amount } = data;

  const year = new Date().getFullYear();
  const counter = await Counter.findOneAndUpdate(
    { name: 'requestCounter', year },
    { $inc: { seq: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  const docCode = getDocCode(document);
  const seqNum = String(counter.seq).padStart(4, '0');
  const referenceNumber = `${docCode}-${year}-${seqNum}`;

  const req = await Request.create({
    fullName,
    document,
    contactNumber,
    email,
    address,
    amount,
    status: 'Pending',
    referenceNumber,
  });

  return req;
}

module.exports = { createRequestIfMissing, getDocCode };
