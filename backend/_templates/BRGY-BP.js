module.exports = {
  docx: 'BRGY-BP.docx',

  dataMapper(raw) {
    const now = new Date();
    const dayNum = now.getDate();
    const getOrdinal = (n) => {
      const s = ['TH', 'ST', 'ND', 'RD'];
      const v = n % 100;
      return n + (s[(v - 20) % 10] || s[v] || s[0]);
    };

    return {
      business_name: raw.businessName?.toUpperCase() || '',
      business_kind: raw.businessKind?.toUpperCase() || '',
      address: raw.address?.toUpperCase() || '',
      full_name: raw.fullName?.toUpperCase() || '',
      date: now.toLocaleDateString(),
      day: getOrdinal(dayNum),
      month: now.toLocaleString('en-US', { month: 'long' }).toUpperCase(),
      year: now.getFullYear(),
    };
  },
};
