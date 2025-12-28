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
      path: 'photoId',
      page: 0,
      x: 456,
      y: 498,
      width: 85,
      height: 85,
    },
  ],

};
