module.exports = {
  docx: 'FTJSC.docx',

  dataMapper(raw) {
    const now = new Date();

    return {
      full_name: raw.fullName,
      zone: raw.zone,
      length_of_residency: raw.lengthOfResidency,
      date: now.toLocaleDateString(),
      day: now.getDate(),
      month: now.toLocaleString('en-US', { month: 'long' }),
      year: now.getFullYear(),
    };
  },
};
