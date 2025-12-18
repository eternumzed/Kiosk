module.exports = {
  docx: 'BRGY-IND.docx',

  dataMapper(raw) {
    const now = new Date();

    return {
      full_name: raw.fullName,
      age: raw.age,
      purpose: raw.purpose,
      day: now.getDate(),
      month: now.toLocaleString('en-US', { month: 'long' }),
      year: now.getFullYear(),
    };
  },
};
