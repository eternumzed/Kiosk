module.exports = {
  docx: 'BRGY-BP.docx',

  dataMapper(raw) {
    const now = new Date();

    return {
      business_name: raw.businessName,
      business_kind: raw.businessKind,
      address: raw.address,
      full_name: raw.fullName,
      date: now.toLocaleDateString(),
      day: now.getDate(),
      month: now.toLocaleString('en-US', { month: 'long' }),
      year: now.getFullYear(),
    };
  },
};
