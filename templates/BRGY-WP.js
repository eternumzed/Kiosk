module.exports = {
  docx: 'BRGY-WP.docx',

  dataMapper(raw) {
    const now = new Date();
    const dayNum = now.getDate();
    const getOrdinal = (n) => {
      const s = ['TH', 'ST', 'ND', 'RD'];
      const v = n % 100;
      return n + (s[(v - 20) % 10] || s[v] || s[0]);
    };

    return {
      full_name: raw.fullName?.toUpperCase() || '',
      day: getOrdinal(dayNum),
      month: now.toLocaleString('en-US', { month: 'long' }).toUpperCase(),
      year: now.getFullYear(),
    };
  },
};
