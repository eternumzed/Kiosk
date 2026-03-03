const fs = require('fs').promises;
const path = require('path');

// Cleanup script for tmp/carbone_render - removes files older than TTL hours
// Usage: node backend/scripts/cleanup_tmp.js [hours]

async function cleanup(ttlHoursArg) {
  const cwd = __dirname;
  const BASE_TMP_DIR = path.join(cwd, '..', 'tmp', 'carbone_render');
  // TTL resolution: accept hours arg, CLI arg, env `TMP_TTL_HOURS`, or minutes env `TMP_TTL_MINUTES`.
  const envTtlMinutes = Number(process.env.TMP_TTL_MINUTES) || 0;
  const ttlHoursFromMinutes = envTtlMinutes > 0 ? envTtlMinutes / 60 : 0;
  const ttlHours = Number(ttlHoursArg) || Number(process.argv[2]) || Number(process.env.TMP_TTL_HOURS) || ttlHoursFromMinutes || 24; // default 24 hours
  const now = Date.now();
  const ttlMs = ttlHours * 60 * 60 * 1000;

  try {
    const files = await fs.readdir(BASE_TMP_DIR);
    let removed = 0;
    for (const f of files) {
      const p = path.join(BASE_TMP_DIR, f);
      try {
        const st = await fs.stat(p);
        if (now - st.mtimeMs > ttlMs) {
          await fs.unlink(p);
          console.log('Removed', p);
          removed++;
        }
      } catch (err) {
        // ignore individual file errors
        console.warn('Skipping', p, err.message || err);
      }
    }
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
