module.exports = {
  docx: 'BRGY-CLR.docx',

  dataMapper(raw) {
    const now = new Date();

    return {
      full_name: raw.fullName,
      citizenship: raw.citizenship,
      civil_status: raw.civilStatus,
      age: raw.age,
      purpose: raw.purpose,
      date: now.toLocaleDateString(),
      day: now.getDate(),
      month: now.toLocaleString('en-US', { month: 'long' }),
      year: now.getFullYear(),
    };
  },

  images: [
    {
      path: 'waldo.jpg',
      page: 0,
      x: 158,
      y: 158.5,
      width: 56,
      height: 56,
    },
  ],
};
