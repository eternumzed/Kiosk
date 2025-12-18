const carbone = require('carbone');
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');

module.exports = async function renderCarbone(docxName, documentData) {
  const templatePath = path.join(
    __dirname,
    '..',
    '..',
    '..',
    'templates',
    docxName
  );

  const outputPath = path.join(
    __dirname,
    `${Date.now()}-base.pdf`
  );

  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${templatePath}`);
  }

  return new Promise((resolve, reject) => {
    carbone.render(
      templatePath,
      documentData,
      { convertTo: 'pdf' },
      async (err, result) => {
        if (err) return reject(err);

        await fsp.writeFile(outputPath, result);
        resolve(outputPath);
      }
    );
  });
};
