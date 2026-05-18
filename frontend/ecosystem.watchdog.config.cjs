/**
 * PM2 ecosystem entry for the goodswap runtime watchdog.
 *
 * The watchdog complements the boot-time defenses in
 * `scripts/pm2-launch-next.mjs` (BUILD_ID + manifest + dev-tree clobber
 * fences) by detecting drift AFTER the production process is already
 * running — most importantly the "served HTML references chunks that no
 * longer exist on disk" failure mode that produced incidents #1–#3 of the
 * `next dev` shared-directory clobber (recurrence #3 → task 0029).
 *
 * Tracking: .autobuilder/initiatives/0004-testnet-readiness-gate/tasks/
 *   0029-iter19-blocker-playwright-clobber-recurrence-3-distdir-isolation.md
 *
 * Installation (one-time, from the repo root):
 *
 *   pm2 start frontend/ecosystem.watchdog.config.cjs
 *   pm2 save
 *
 * Operations:
 *
 *   pm2 logs goodswap-watchdog          # live JSON event stream
 *   pm2 reload goodswap-watchdog        # pick up config changes
 *   pm2 stop goodswap-watchdog          # disable temporarily
 *
 * To run a one-shot probe without touching PM2 state:
 *
 *   node frontend/scripts/goodswap-watchdog.mjs --once
 *
 * To verify the reload path without actually reloading goodswap:
 *
 *   node frontend/scripts/goodswap-watchdog.mjs --dry-run
 *
 * Configuration knobs (env vars; defaults are conservative and match
 * the script's documented defaults — keep them in sync):
 *   PROBE_URL            http://localhost:3100/
 *   PROBE_INTERVAL_MS    60_000   (probe every minute)
 *   FAILURE_THRESHOLD    3        (reload after 3 consecutive bad probes)
 *   RELOAD_COOLDOWN_MS   300_000  (≥5 min between reloads)
 *   RECOVERY_DELAY_MS    30_000   (skip probing for 30s after a reload)
 *   PM2_TARGET           goodswap (process to reload)
 */
const path = require('node:path')

module.exports = {
  apps: [
    {
      name: 'goodswap-watchdog',
      script: path.join(__dirname, 'scripts', 'goodswap-watchdog.mjs'),
      cwd: __dirname,
      interpreter: 'node',
      // Watchdog is intentionally single-instance: more than one would
      // cause duplicate reload attempts and bypass the cooldown logic.
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      // The watchdog is light (one HTTP probe per minute). Restart aggressively
      // if it ever crashes — being down is the same as being silent.
      max_restarts: 20,
      restart_delay: 5_000,
      // Watchdog logs are pure JSON-lines on stdout; let pm2-logrotate
      // handle rotation alongside the other process logs.
      env: {
        NODE_ENV: 'production',
        PROBE_URL: 'http://localhost:3100/',
        PROBE_INTERVAL_MS: '60000',
        FAILURE_THRESHOLD: '3',
        RELOAD_COOLDOWN_MS: '300000',
        RECOVERY_DELAY_MS: '30000',
        PM2_TARGET: 'goodswap',
        // Explicit, file-based event log. `pm2 logs goodswap-watchdog` still
        // works (stdout is mirrored), but this file is the source of truth
        // for ops dashboards and the `tail -f` runbook step in
        // docs/TESTNET_README.md → "Frontend health".
        WATCHDOG_LOG_FILE: path.join(__dirname, '.autobuilder-logs', 'goodswap-watchdog.log'),
      },
    },
  ],
}
