module.exports = {
  docx: 'BRGY-BLD.docx',

  dataMapper(raw) {
    const now = new Date();
    const dayNum = now.getDate();
    const getOrdinal = (n) => {
      const s = ['TH', 'ST', 'ND', 'RD'];
      const v = n % 100;
      return n + (s[(v - 20) % 10] || s[v] || s[0]);
    };

    return {
      age: raw.age,
      sex: raw.sex.toUpperCase() || '',
      address: raw.address.toUpperCase() || '',
      project_type: raw.projectType.toUpperCase() || '',
      full_name: raw.fullName.toUpperCase() || '',
      date: now.toLocaleDateString(),
      day: getOrdinal(dayNum),
      month: now.toLocaleString('en-US', { month: 'long' }).toUpperCase(),
      year: now.getFullYear(),
    };
  },
};
