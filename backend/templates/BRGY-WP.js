module.exports = {
  docx: 'BRGY-WP.docx',

  dataMapper(raw) {
    const now = new Date();

    return {
      full_name: raw.fullName,
      day: now.getDate(),
      month: now.toLocaleString('en-US', { month: 'long' }),
      year: now.getFullYear(),
    };
  },
};
