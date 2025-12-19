// Optionally enable Carbone debug logs when PDF_DEBUG is truthy
const wantsCarboneDebug = !!process.env.PDF_DEBUG && process.env.PDF_DEBUG !== '0' && process.env.PDF_DEBUG !== 'false';
if (wantsCarboneDebug) {
  const existing = process.env.DEBUG || '';
  const parts = new Set(existing.split(',').filter(Boolean));
  parts.add('carbone');
  parts.add('carbone:converter');
  process.env.DEBUG = Array.from(parts).join(',');
  try { require('debug').enable(process.env.DEBUG); } catch (_) {}
}

const carbone = require('carbone');
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const { spawn } = require('child_process');

// Use a short, local render path to avoid space/permission issues
const BASE_TMP_DIR = path.join(__dirname, '..', '..', '..', 'tmp');
const RENDER_DIR = path.join(BASE_TMP_DIR, 'carbone_render');

try {
  fs.mkdirSync(BASE_TMP_DIR, { recursive: true });
  fs.mkdirSync(RENDER_DIR, { recursive: true });
} catch (_) {
  // best-effort; carbone will attempt to create its render path too
}

// Warm up the converter and pin renderPath
try {
  carbone.set({
    startFactory: true,
    factories: 1,
    renderPath: RENDER_DIR,
    attempts: 2,
    converterFactoryTimeout: 120000,
  });
} catch (_) {
  // ignore; carbone will use defaults if set is not available in this context
}

async function sofficeCliConvert(inputDocxPath, outputDir) {
  return new Promise((resolve, reject) => {
    const args = [
      '--headless',
      '--invisible',
      '--nologo',
      '--norestore',
      '--convert-to', 'pdf',
      '--outdir', outputDir,
      inputDocxPath,
    ];
    const proc = spawn('soffice', args, { stdio: 'inherit' });
    proc.on('error', (err) => reject(err));
    proc.on('close', (code) => {
      if (code !== 0) return reject(new Error(`soffice exited with code ${code}`));
      const pdfPath = path.join(
        outputDir,
        path.basename(inputDocxPath, path.extname(inputDocxPath)) + '.pdf'
      );
      if (!fs.existsSync(pdfPath)) return reject(new Error('soffice did not produce a PDF'));
      resolve(pdfPath);
    });
  });
}

module.exports = async function renderCarbone(docxName, documentData) {
  const templatePath = path.join(
    __dirname,
    '..',
    '..',
    '..',
    'templates',
    docxName
  );

  const ts = Date.now();
  const outputPath = path.join(RENDER_DIR, `${ts}-base.pdf`);

  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${templatePath}`);
  }

  try {
    // Primary path: use Carbone’s integrated converter
    const bufferOrPath = await new Promise((resolve, reject) => {
      carbone.render(
        templatePath,
        documentData,
        { convertTo: 'pdf', renderPrefix: `${ts}-` },
        (err, resultPathOrBuffer) => {
          if (err) return reject(err);
          resolve(resultPathOrBuffer);
        }
      );
    });

    // When renderPrefix is set, carbone returns a file path
    if (typeof bufferOrPath === 'string') {
      return bufferOrPath;
    }

    // If a buffer is returned (older behavior), write it
    await fsp.writeFile(outputPath, bufferOrPath);
    return outputPath;
  } catch (carboneErr) {
    // Fallback: render DOCX then convert via soffice CLI
    const docxTmp = path.join(RENDER_DIR, `${ts}-fallback.docx`);
    try {
      const docxBuffer = await new Promise((resolve, reject) => {
        carbone.render(
          templatePath,
          documentData,
          {},
          (err, resultBuffer) => {
            if (err) return reject(err);
            resolve(resultBuffer);
          }
        );
      });
      await fsp.writeFile(docxTmp, docxBuffer);
      const pdfPath = await sofficeCliConvert(docxTmp, RENDER_DIR);
      return pdfPath;
    } catch (fallbackErr) {
      throw new Error(`Carbone conversion failed: ${carboneErr?.message || carboneErr}. Fallback failed: ${fallbackErr?.message || fallbackErr}`);
    } finally {
      try { if (fs.existsSync(docxTmp)) fs.unlinkSync(docxTmp); } catch (_) {}
    }
  }
};
