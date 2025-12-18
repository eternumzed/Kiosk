module.exports = {
  docx: 'BRGY-BLD.docx',

  dataMapper(raw) {
    const now = new Date();

    return {
      age: raw.age,
      sex: raw.sex,
      address: raw.address,
      project_type: raw.projectType,
      full_name: raw.fullName,
      date: now.toLocaleDateString(),
      day: now.getDate(),
      month: now.toLocaleString('en-US', { month: 'long' }),
      year: now.getFullYear(),
    };
  },
};
