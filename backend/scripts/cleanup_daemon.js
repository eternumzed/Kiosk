const { cleanup } = require('./cleanup_tmp');

// Daemon to run cleanup periodically. Configure with env vars or args.
// ENV:
//  - CLEANUP_INTERVAL_HOURS (default: 6)
//  - TMP_TTL_HOURS (passed to cleanup; default: 24)

const intervalHours = Number(process.env.CLEANUP_INTERVAL_HOURS) || Number(process.argv[2]) || 6;
// Accept TTL in hours or minutes. Priority: TMP_TTL_HOURS, TMP_TTL_MINUTES, CLI arg, default 24h
const envTtlMinutes = Number(process.env.TMP_TTL_MINUTES) || 0;
const ttlHours = Number(process.env.TMP_TTL_HOURS) || (envTtlMinutes > 0 ? envTtlMinutes / 60 : Number(process.argv[3]) || 24);

async function runOnce() {
  console.log(`[cleanup_daemon] Running cleanup (TTL=${ttlHours}h)`);
  try {
    await cleanup(ttlHours);
    console.log('[cleanup_daemon] Cleanup finished');
  } catch (err) {
    console.error('[cleanup_daemon] Cleanup error:', err.message || err);
  }
}

(async () => {
  // First run immediately
  await runOnce();

  const intervalMs = intervalHours * 60 * 60 * 1000;
  console.log(`[cleanup_daemon] Scheduling next runs every ${intervalHours} hour(s)`);

  setInterval(() => {
    runOnce();
  }, intervalMs);

  // keep process alive
  process.on('SIGINT', () => process.exit(0));
  process.on('SIGTERM', () => process.exit(0));
})();
