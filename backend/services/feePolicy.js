const BASE_FEES = {
  'barangay clearance': 50,
  'barangay indigency certificate': 0,
  'barangay residency certificate': 0,
  'first time job seeker certificate': 200,
  'barangay work permit': 200,
  'certificate of good moral character': 500,
  'barangay business permit': 100,
  'barangay building clearance': 100,
};

function normalizeText(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function normalizeBoolean(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return normalized === 'true' || normalized === 'yes' || normalized === 'y' || normalized === '1';
  }
  if (typeof value === 'number') return value === 1;
  return false;
}

function isWorkRelatedPurpose(purpose) {
  const normalized = normalizeText(purpose);
  if (!normalized) return false;
  return /(work|job|employment|trabaho|hanapbuhay|apply|application)/i.test(normalized);
}

function computeDocumentFee({ document, purpose, isStudent }) {
  const docKey = normalizeText(document);
  const baseFee = BASE_FEES[docKey] ?? 0;

  if (docKey === 'barangay clearance') {
    const student = normalizeBoolean(isStudent);
    const workPurpose = isWorkRelatedPurpose(purpose);
    if (student && !workPurpose) {
      return { amount: 0, reason: 'student_non_work_clearance' };
    }
    return { amount: baseFee, reason: 'standard_clearance_fee' };
  }

  return { amount: baseFee, reason: 'standard_fee' };
}

module.exports = {
  computeDocumentFee,
  normalizeBoolean,
};
