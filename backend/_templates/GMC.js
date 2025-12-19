module.exports = {
  docx: 'GMC.docx',

  dataMapper(raw) {
    const now = new Date();

    return {
      full_name: raw.fullName,
      civil_status: raw.civilStatus,
      day: now.getDate(),
      month: now.toLocaleString('en-US', { month: 'long' }),
      year: now.getFullYear(),
    };
  },
};
