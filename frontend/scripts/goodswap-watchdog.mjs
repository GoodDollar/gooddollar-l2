#!/usr/bin/env node
/**
 * goodswap-watchdog — PM2-supervised runtime health watcher for the goodswap
 * frontend.
 *
 * Why this exists (iter19, task 0029 — recurrence #3)
 * ---------------------------------------------------
 * The shared-directory clobber failure mode has now produced three production
 * incidents in this initiative. The earlier defenses
 * (`atomic-build.mjs`, `postbuild-reload-pm2.mjs`, `pm2-launch-next.mjs`'s
 * BUILD_ID + manifest fences, and the new playwright `--dist-dir .next.e2e`
 * isolation guard) all stop the clobber at BUILD or BOOT time. None of them
 * help if the live PM2-managed process degrades AFTER boot — e.g. a stray
 * `next dev` rewrites `.next/` and the live `next start` process keeps
 * emitting HTML with chunk hashes that no longer exist on disk.
 *
 * This watchdog closes that window. It runs `checkServedChunks()` (the
 * iter11 stale-bundle probe) in strict mode against the local PM2 process
 * every PROBE_INTERVAL_MS. After FAILURE_THRESHOLD consecutive bad probes
 * it fires `pm2 reload <target> --update-env`, which re-invokes
 * `pm2-launch-next.mjs` and re-runs every boot-time fence. A
 * RELOAD_COOLDOWN_MS throttle and a RECOVERY_DELAY_MS post-reload pause
 * prevent reload-storms during the inevitable transient unreachability of
 * a reload.
 *
 * Configuration (env vars; CLI not needed for steady-state operation)
 * -------------------------------------------------------------------
 *   PROBE_URL            default http://localhost:3100/
 *   PROBE_INTERVAL_MS    default 60000   (1 minute)
 *   FAILURE_THRESHOLD    default 3       (consecutive bad probes)
 *   RELOAD_COOLDOWN_MS   default 300000  (5 minutes between reloads)
 *   RECOVERY_DELAY_MS    default 30000   (skip probing for this long after a reload)
 *   PM2_TARGET           default goodswap
 *
 * CLI flags
 * ---------
 *   --once      run a single probe and exit:
 *                 0 = healthy, 1 = unhealthy, 2 = unreachable
 *   --dry-run   detect, log, and PLAN a reload, but do NOT actually call pm2
 *
 * Log format
 * ----------
 * Every probe emits one JSON line on stdout prefixed with `[watchdog] `, e.g.
 *   [watchdog] {"ts":"...","event":"probe","ok":true,"streak":0,"sampledChunks":7}
 *   [watchdog] {"ts":"...","event":"probe","ok":false,"streak":2,"reason":"chunk-failure"}
 *   [watchdog] {"ts":"...","event":"reload","target":"goodswap","exitCode":0}
 *
 * Tracking: .autobuilder/initiatives/0004-testnet-readiness-gate/tasks/
 *   0029-iter19-blocker-playwright-clobber-recurrence-3-distdir-isolation.md
 */

import { spawnSync } from 'node:child_process'
import { appendFileSync } from 'node:fs'
import { checkServedChunks } from './check-served-chunks.mjs'

// Why no setBlocking() trick?
// ---------------------------
// A previous version of this script called
// `process.stdout._handle.setBlocking(true)` to force line-flushed stdout
// under PM2 (where stdout is a piped non-TTY and Node defaults to block-
// buffered writes that hide log lines for minutes). Empirically that flag
// triggered a tight crash loop: under PM2, the child received SIGINT
// roughly 3 seconds after every spawn and PM2 dutifully restarted it
// against `restart_delay`. The exact mechanism is undocumented and the
// fix was unsafe under load, so we abandoned the approach.
//
// Instead, we tail-append every JSON event to an explicit log file
// (`WATCHDOG_LOG_FILE`, default `frontend/.autobuilder-logs/goodswap-
// watchdog.log`) using `fs.appendFileSync`. That gives:
//   • guaranteed, real-time visibility (every emit() hits disk before the
//     next line of code runs);
//   • survivability across PM2 restarts and log rotation;
//   • a stable file path that `pm2 logs` users, ops dashboards, and the
//     reload runbook can `tail -f` directly.
// stdout still mirrors every line for `pm2 logs goodswap-watchdog`, but
// the file is the source of truth.

// --- Defaults --------------------------------------------------------------

const DEFAULTS = Object.freeze({
  PROBE_URL: 'http://localhost:3100/',
  PROBE_INTERVAL_MS: 60_000,
  FAILURE_THRESHOLD: 3,
  RELOAD_COOLDOWN_MS: 300_000,
  RECOVERY_DELAY_MS: 30_000,
  PM2_TARGET: 'goodswap',
})

function readConfig(env = process.env) {
  const num = (k, fallback) => {
    const v = env[k]
    if (v === undefined || v === '') return fallback
    const n = Number(v)
    return Number.isFinite(n) && n >= 0 ? n : fallback
  }
  return {
    probeUrl: env.PROBE_URL || DEFAULTS.PROBE_URL,
    probeIntervalMs: num('PROBE_INTERVAL_MS', DEFAULTS.PROBE_INTERVAL_MS),
    failureThreshold: num('FAILURE_THRESHOLD', DEFAULTS.FAILURE_THRESHOLD),
    reloadCooldownMs: num('RELOAD_COOLDOWN_MS', DEFAULTS.RELOAD_COOLDOWN_MS),
    recoveryDelayMs: num('RECOVERY_DELAY_MS', DEFAULTS.RECOVERY_DELAY_MS),
    pm2Target: env.PM2_TARGET || DEFAULTS.PM2_TARGET,
  }
}

// --- Pure decision function (unit-tested) ----------------------------------

/**
 * Given a probe result and the current state, decide what the watchdog
 * should do on this tick.
 *
 * Inputs:
 *   probeOk          (bool)   did this probe come back healthy?
 *   probeReason      (string) short tag if !probeOk ("chunk-failure",
 *                             "unreachable", "page-error", "no-chunks-ref",
 *                             "unknown")
 *   state            { streak, lastReloadAtMs }
 *   cfg              { failureThreshold, reloadCooldownMs }
 *   nowMs            (number) current epoch ms
 *
 * Returns:
 *   {
 *     nextState: { streak, lastReloadAtMs },
 *     action:    'none' | 'reload' | 'reload-throttled',
 *     // The reason a reload was suppressed, when action === 'reload-throttled'.
 *     // Useful for logs / tests; either 'cooldown' or 'below-threshold'.
 *     suppressedBy?: 'cooldown' | 'below-threshold',
 *   }
 *
 * Design notes:
 *   - On a healthy probe we always reset the streak to 0 (the failure must
 *     be consecutive to fire). `lastReloadAtMs` is preserved.
 *   - We only fire a reload when streak >= threshold AND the cooldown has
 *     elapsed. Otherwise we report `reload-throttled` with the reason so
 *     the operator can see in logs whether the threshold or the cooldown
 *     was the blocker.
 *   - This function does NOT perform IO. The caller wires up the actual
 *     `pm2 reload` and clock.
 */
export function evaluateState({ probeOk, probeReason, state, cfg, nowMs }) {
  if (probeOk) {
    return {
      nextState: { streak: 0, lastReloadAtMs: state.lastReloadAtMs },
      action: 'none',
    }
  }
  const nextStreak = state.streak + 1
  const meetsThreshold = nextStreak >= cfg.failureThreshold
  const cooldownElapsed = nowMs - state.lastReloadAtMs >= cfg.reloadCooldownMs
  if (meetsThreshold && cooldownElapsed) {
    return {
      // After firing a reload we reset the streak. The next probe is delayed
      // by RECOVERY_DELAY_MS at the caller, then we start counting fresh.
      nextState: { streak: 0, lastReloadAtMs: nowMs },
      action: 'reload',
    }
  }
  if (meetsThreshold && !cooldownElapsed) {
    // Threshold satisfied but we already reloaded recently. Cap the streak
    // at the threshold so it doesn't grow unboundedly while waiting for
    // the cooldown to elapse, but DO log it so operators see the watchdog
    // is still seeing failures.
    return {
      nextState: { streak: cfg.failureThreshold, lastReloadAtMs: state.lastReloadAtMs },
      action: 'reload-throttled',
      suppressedBy: 'cooldown',
    }
  }
  return {
    nextState: { streak: nextStreak, lastReloadAtMs: state.lastReloadAtMs },
    action: 'reload-throttled',
    suppressedBy: 'below-threshold',
  }
}

// --- Probe wrapper ---------------------------------------------------------

/**
 * Run a single chunk-served probe. Returns a small summary suitable for
 * decision-making + logging. Reuses `checkServedChunks` in strict mode so
 * an unreachable PM2 process is treated as a hard failure (the whole point
 * of the watchdog).
 */
async function runProbe(probeUrl) {
  try {
    const result = await checkServedChunks({ liveUrl: probeUrl, strict: true })
    if (result.exitCode === 0) {
      return {
        ok: true,
        reason: null,
        sampledChunks: result.sampledCount,
        message: result.message,
      }
    }
    // Categorise the failure from the message envelope so logs are searchable.
    const msg = result.message || ''
    let reason = 'unknown'
    if (msg.includes('live process is unreachable')) reason = 'unreachable'
    else if (msg.includes('no /_next/* chunk references')) reason = 'no-chunks-ref'
    else if (msg.includes('did not return 2xx')) reason = 'page-error'
    else if (msg.includes('serving HTML that references chunks it cannot return')) {
      reason = 'chunk-failure'
    }
    return {
      ok: false,
      reason,
      sampledChunks: result.sampledCount,
      message: msg,
    }
  } catch (err) {
    // checkServedChunks shouldn't throw, but if it ever does we treat that
    // as a probe-level failure rather than crashing the watchdog itself.
    return {
      ok: false,
      reason: 'probe-error',
      sampledChunks: 0,
      message: `[watchdog] probe threw: ${err?.message || err}`,
    }
  }
}

// --- Effects ---------------------------------------------------------------

function pm2Reload(target, { dryRun = false } = {}) {
  if (dryRun) return { exitCode: 0, dryRun: true }
  const res = spawnSync('pm2', ['reload', target, '--update-env'], {
    stdio: ['ignore', 'inherit', 'inherit'],
  })
  return { exitCode: res.status ?? -1, dryRun: false, signal: res.signal ?? null }
}

// Resolved once at startup. Tests can override via the env var.
const LOG_FILE = process.env.WATCHDOG_LOG_FILE || ''

function emit(event, fields) {
  // One JSON line per event so `pm2 logs goodswap-watchdog` is grep/jq-friendly.
  const payload = { ts: new Date().toISOString(), event, ...fields }
  const line = '[watchdog] ' + JSON.stringify(payload)
  // Mirror to stdout (visible in `pm2 logs goodswap-watchdog` once the pipe
  // buffer flushes) and synchronously append to the explicit log file (visible
  // immediately to anyone tailing it). Swallow filesystem errors — log
  // dropouts must never crash the watchdog.
  console.log(line)
  if (LOG_FILE) {
    try {
      appendFileSync(LOG_FILE, line + '\n', { encoding: 'utf8' })
    } catch {
      /* ignore */
    }
  }
}

// --- Long-running loop -----------------------------------------------------

async function runOneTick(state, cfg, { dryRun }) {
  const probe = await runProbe(cfg.probeUrl)
  const decision = evaluateState({
    probeOk: probe.ok,
    probeReason: probe.reason,
    state,
    cfg,
    nowMs: Date.now(),
  })

  emit('probe', {
    ok: probe.ok,
    reason: probe.reason,
    streak: decision.nextState.streak,
    sampledChunks: probe.sampledChunks,
  })

  if (decision.action === 'reload') {
    emit('reload-start', {
      target: cfg.pm2Target,
      dryRun,
      streakAtFire: cfg.failureThreshold,
      lastProbeReason: probe.reason,
    })
    const r = pm2Reload(cfg.pm2Target, { dryRun })
    emit('reload-end', {
      target: cfg.pm2Target,
      exitCode: r.exitCode,
      dryRun: r.dryRun,
      signal: r.signal ?? null,
    })
    return { nextState: decision.nextState, didReload: true }
  }
  if (decision.action === 'reload-throttled' && !probe.ok) {
    emit('reload-suppressed', {
      reason: decision.suppressedBy,
      streak: decision.nextState.streak,
    })
  }
  return { nextState: decision.nextState, didReload: false }
}

async function main() {
  const argv = new Set(process.argv.slice(2))
  const once = argv.has('--once')
  const dryRun = argv.has('--dry-run')
  const cfg = readConfig()

  emit('start', {
    probeUrl: cfg.probeUrl,
    probeIntervalMs: cfg.probeIntervalMs,
    failureThreshold: cfg.failureThreshold,
    reloadCooldownMs: cfg.reloadCooldownMs,
    recoveryDelayMs: cfg.recoveryDelayMs,
    pm2Target: cfg.pm2Target,
    mode: once ? 'once' : 'loop',
    dryRun,
  })

  if (once) {
    const probe = await runProbe(cfg.probeUrl)
    emit('probe', { ok: probe.ok, reason: probe.reason, streak: probe.ok ? 0 : 1, sampledChunks: probe.sampledChunks })
    if (probe.ok) process.exit(0)
    if (probe.reason === 'unreachable') process.exit(2)
    process.exit(1)
  }

  let state = { streak: 0, lastReloadAtMs: 0 }
  let stopping = false
  const onSignal = (sig) => {
    if (stopping) return
    stopping = true
    emit('stop', { signal: sig })
    process.exit(0)
  }
  process.on('SIGTERM', () => onSignal('SIGTERM'))
  process.on('SIGINT', () => onSignal('SIGINT'))

  // Main loop. Sleeps between ticks; after a reload, sleeps the recovery
  // window before resuming so we don't probe the gap during which PM2 is
  // booting the new process (which would itself look like an `unreachable`
  // failure).
  while (!stopping) {
    const tick = await runOneTick(state, cfg, { dryRun })
    state = tick.nextState
    const delay = tick.didReload ? cfg.recoveryDelayMs : cfg.probeIntervalMs
    await new Promise((res) => setTimeout(res, delay))
  }
}

// Only run when invoked directly. Tests import `evaluateState`.
//
// Detection is non-trivial because PM2 launches the script via its
// `ProcessContainerFork.js` wrapper, which means `process.argv[1]` points to
// the wrapper, NOT this file. PM2 does set `process.env.pm_exec_path` to the
// real script path, so we check that too. Under vitest, neither condition is
// true, so `main()` does not run when tests `import { evaluateState }`.
const invokedAsScript =
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith('goodswap-watchdog.mjs') ||
  process.env.pm_exec_path?.endsWith('goodswap-watchdog.mjs')

if (invokedAsScript) {
  main().catch((err) => {
    emit('fatal', { message: err?.message || String(err) })
    process.exit(1)
  })
}
