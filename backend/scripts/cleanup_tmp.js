const fs = require('fs').promises;
const path = require('path');

// Cleanup script for tmp/carbone_render - removes files older than TTL hours
// Usage: node backend/scripts/cleanup_tmp.js [hours]

async function cleanup(ttlHoursArg) {
  const cwd = __dirname;
  // target the repo root tmp folder: /var/www/Kiosk/tmp/carbone_render
  const BASE_TMP_DIR = path.join(cwd, '..', '..', 'tmp', 'carbone_render');
  // TTL resolution: accept hours arg, CLI arg, env `TMP_TTL_HOURS`, or minutes env `TMP_TTL_MINUTES`.
  const envTtlMinutes = Number(process.env.TMP_TTL_MINUTES) || 0;
  const ttlHoursFromMinutes = envTtlMinutes > 0 ? envTtlMinutes / 60 : 0;
  const ttlHours = Number(ttlHoursArg) || Number(process.argv[2]) || Number(process.env.TMP_TTL_HOURS) || ttlHoursFromMinutes || 24; // default 24 hours
  const now = Date.now();
  const ttlMs = ttlHours * 60 * 60 * 1000;

  try {
    // Ensure target directory exists (create if missing) to avoid ENOENT
    try {
      await fs.mkdir(BASE_TMP_DIR, { recursive: true });
    } catch (mkdirErr) {
      console.error('Failed to ensure tmp directory exists:', mkdirErr.message || mkdirErr);
      throw mkdirErr;
    }

    let removed = 0;

    const forceDelete = !!(process.env.TMP_FORCE_DELETE && process.env.TMP_FORCE_DELETE !== '0');

    // Recursively process directory: delete files older than TTL (or all files when forced)
    async function processDir(dir) {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const ent of entries) {
        const full = path.join(dir, ent.name);
        try {
          if (ent.isDirectory()) {
            // recurse into subdirectory
            await processDir(full);
            continue;
          }

          if (ent.isFile() || ent.isSymbolicLink()) {
            const st = await fs.stat(full);
            const ageMs = now - st.mtimeMs;
            if (forceDelete || ageMs > ttlMs) {
              await fs.unlink(full);
              console.log('Removed', full);
              removed++;
            }
          }
        } catch (e) {
          // ignore per-file errors but log for visibility
          console.warn('Skipping', full, e.message || e);
        }
      }
    }

    await processDir(BASE_TMP_DIR);

    console.log(`Cleanup complete. Removed ${removed} file(s) older than ${ttlHours} hour(s).`);
  } catch (err) {
    console.error('Failed to run cleanup:', err.message || err);
    throw err;
  }
}

module.exports = { cleanup };

if (require.main === module) {
  cleanup().catch(() => process.exit(1));
}
