const templates = require('../../templates');
const renderCarbone = require('./renderCarbone');
const addImages = require('./addImages');
const uploadDrive = require('./uploadDrive');

module.exports = async function generatePdf({ templateKey, rawData }) {
  const template = templates[templateKey];

  if (!template) {
    throw new Error(`Invalid template: ${templateKey}`);
  }

  // 1. Text rendering
  const basePdf = await renderCarbone(
    template.docx,
    template.dataMapper(rawData)
  );

  // 2. Images (optional)
  let finalPdf = basePdf;
  if (template.images && template.images.length > 0) {
    finalPdf = await addImages(basePdf, template.images);
  }

  // Return the final PDF file path; uploading is handled by controller so we can
  // decide whether to upload (depending on Drive auth) or return file for download.
  return finalPdf;
};
