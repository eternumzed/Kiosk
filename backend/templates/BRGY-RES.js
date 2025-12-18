module.exports = {
  docx: 'BRGY-RES.docx',

  dataMapper(raw) {
    const now = new Date();

    return {
      full_name: raw.fullName,
      zone: raw.zone,
      purpose: raw.purpose,
      day: now.getDate(),
      month: now.toLocaleString('en-US', { month: 'long' }),
      year: now.getFullYear(),
    };
  },
};
