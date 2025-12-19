const { get } = require("http");

module.exports = {
  docx: 'BRGY-RES.docx',

  dataMapper(raw) {
    const now = new Date();
    const dayNum = now.getDate();
    const getOrdinal = (n) => {
      const s = ['TH', 'ST', 'ND', 'RD'];
      const v = n % 100;
      return n + (s[(v - 20) % 10] || s[v] || s[0]);
    };

    return {
      full_name: raw.fullName.toUpperCase() || '',
      zone: raw.zone.toUpperCase() || '',
      purpose: raw.purpose.toUpperCase() || '',
      day: getOrdinal(dayNum),
      month: now.toLocaleString('en-US', { month: 'long' }).toUpperCase(),
      year: now.getFullYear(),
    };
  },

  images: [
    {
      path: 'waldo.jpg',
      page: 0,
      x: 250,
      y: 250,
      width: 100,
      height: 100,
    },
  ],

};
