module.exports = {
  docx: 'BRGY-CLR.docx',

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
      citizenship: raw.citizenship?.toUpperCase() || '',
      civil_status: raw.civilStatus?.toUpperCase() || '',
      age: raw.age,
      purpose: raw.purpose?.toUpperCase() || '',
      date: now.toLocaleDateString(),
      day: getOrdinal(dayNum),
      month: now.toLocaleString('en-US', { month: 'long' }).toUpperCase(),
      year: now.getFullYear(),
    };
  },

  images: [
    {
      path: 'photoId',
      page: 0,
      x: 435,
      y: 527,
      width: 56,
      height: 56,
    },
  ],
};
