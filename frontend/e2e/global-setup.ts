import { execSync } from 'child_process'

/**
 * Kills any lingering Playwright-launched chromium processes before the suite
 * starts.  After a long run (~23+ min, 112+ tests) chromium zygote processes
 * may still be shutting down when the next invocation begins, exhausting the
 * OS process pool and causing:
 *   browserType.launch: Timeout 180000ms exceeded
 *
 * This teardown runs once, before any worker spawns a browser.
 * See GOO-3048 for root-cause analysis.
 */
export default async function globalSetup() {
  try {
    // Kill stale chromium/playwright processes left from a previous run.
    // Using SIGTERM first so they flush if possible; errors are expected in a
    // clean environment (no matching processes) — suppress them.
    // Target Playwright-managed browser binaries only. Do NOT use
    // `playwright.*chrome` — it matches the test runner CLI when
    // `--project=mobile-chrome` is set and SIGTERM-kills the suite (GOO-3225).
    execSync(
      'pkill -f "ms-playwright/chromium-.*/chrome-linux/chrome" || true',
      { stdio: 'ignore' },
    )
    execSync('pkill -f "chrome.*--type=zygote" || true', { stdio: 'ignore' })
  } catch {
    // pkill exits non-zero when no processes match — that's fine.
  }
}
