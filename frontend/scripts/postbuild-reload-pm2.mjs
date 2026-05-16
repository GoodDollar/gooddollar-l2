#!/usr/bin/env node
/**
 * postbuild-reload-pm2.mjs — runs automatically after every `next build`
 * via the `postbuild` npm script.
 *
 * Why this exists
 * ---------------
 * Running `next build` in isolation rotates `.next/BUILD_ID` and every
 * hashed CSS asset, but the already-running PM2 process keeps serving HTML
 * that references the OLD asset hashes. Next's static handler then returns
 * HTTP 400 for those stale paths and every page renders unstyled. Task
 * 0060 added a `deploy` wrapper that does this in the right order, but
 * any operator who ran `npm run build` directly bypassed it — the site
 * went unstyled in production in iteration #44 (this regression is the
 * reason for task 0087).
 *
 * This script makes `next build` inherently safe: after a successful build
 * it automatically reloads the `goodswap` PM2 app and verifies the rollover
 * via the existing buildid-sync check. The defect class becomes structurally
 * impossible — there is no way to build the frontend without also reloading
 * the live process.
 *
 * Tracking: .autobuilder/initiatives/0002-security-hardening/tasks/
 *   0087-frontend-postbuild-auto-reload-pm2.md
 *
 * Behaviour
 * ---------
 * - If SKIP_PM2_RELOAD=1: exit 0 (CI / sandboxed builds).
 * - If `.next/BUILD_ID` missing: exit 1 (build aborted — refuse to reload).
 * - If `pm2` not on PATH: exit 0 with skip log (fresh dev machine).
 * - If `pm2 jlist` does not contain `goodswap`: exit 0 with skip log.
 * - Otherwise: `pm2 reload goodswap --update-env`, poll
 *   http://localhost:3100/ until 200 (or timeout → exit 1), then run
 *   `scripts/check-buildid-sync.mjs --strict` (mismatch → exit 1).
 *
 * Failure modes always print the task ID so the operator knows where to
 * look for context.
 */

import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { execFileSync, spawnSync } from 'node:child_process'

const TASK_ID = 'task 0087'
const TRACKING = '.autobuilder/initiatives/0002-security-hardening/tasks/0087-frontend-postbuild-auto-reload-pm2.md'

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Default whichImpl: returns the resolved path of a binary on PATH, or null.
 * Uses `command -v` so it works without GNU `which` (BusyBox shells, etc).
 */
function defaultWhich(bin) {
  try {
    const out = execFileSync('sh', ['-c', `command -v ${bin}`], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
    return out || null
  } catch {
    return null
  }
}

/**
 * Default execFileImpl: wraps execFileSync so all spawn calls return the
 * { status, stdout, stderr } shape the script (and tests) expect, even
 * on non-zero exits.
 */
function defaultExecFile(cmd, args) {
  try {
    const stdout = execFileSync(cmd, args, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    return { status: 0, stdout, stderr: '' }
  } catch (err) {
    return {
      status: typeof err?.status === 'number' ? err.status : 1,
      stdout: err?.stdout?.toString?.() ?? '',
      stderr: err?.stderr?.toString?.() ?? String(err?.message ?? err),
    }
  }
}

/**
 * Default spawnSyncImpl: pass-through with normalised string output.
 */
function defaultSpawnSync(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', ...opts })
  return {
    status: r.status ?? 1,
    stdout: r.stdout?.toString?.() ?? '',
    stderr: r.stderr?.toString?.() ?? '',
  }
}

export async function postbuildReloadPm2({
  cwd = process.cwd(),
  env = process.env,
  whichImpl = defaultWhich,
  execFileImpl = defaultExecFile,
  spawnSyncImpl = defaultSpawnSync,
  fetchImpl = globalThis.fetch,
  pm2AppName = 'goodswap',
  livePort = 3100,
  healthPollMs = 200,
  healthTimeoutMs = 10000,
} = {}) {
  // --- 1. honour the explicit opt-out ----------------------------------------
  if (env.SKIP_PM2_RELOAD === '1') {
    return {
      exitCode: 0,
      message: `[postbuild-reload-pm2] SKIP_PM2_RELOAD=1 set — skipping reload.\n  ${TRACKING}`,
    }
  }

  // --- 2. refuse to reload if the build was aborted --------------------------
  const buildIdPath = join(cwd, '.next', 'BUILD_ID')
  if (!existsSync(buildIdPath)) {
    return {
      exitCode: 1,
      message: [
        `[postbuild-reload-pm2] FAIL (${TASK_ID}): next build appears to have aborted.`,
        `  expected: ${buildIdPath}`,
        '  refusing to reload PM2 with stale artifacts.',
        `  ${TRACKING}`,
      ].join('\n'),
    }
  }

  // --- 3. is PM2 even installed? ---------------------------------------------
  const pm2Path = whichImpl('pm2')
  if (!pm2Path) {
    return {
      exitCode: 0,
      message: [
        '[postbuild-reload-pm2] PM2 not detected on PATH — skipping reload.',
        '  (this is normal for dev machines and CI; set SKIP_PM2_RELOAD=1 to silence)',
      ].join('\n'),
    }
  }

  // --- 4. is goodswap registered with this PM2 daemon? ------------------------
  const jlist = execFileImpl('pm2', ['jlist'])
  if (jlist.status !== 0) {
    return {
      exitCode: 0,
      message: [
        `[postbuild-reload-pm2] pm2 jlist failed (status ${jlist.status}) — skipping reload.`,
        `  stderr: ${jlist.stderr.trim()}`,
        '  (no PM2 daemon means nothing to reload; set SKIP_PM2_RELOAD=1 to silence)',
      ].join('\n'),
    }
  }
  let apps = []
  try {
    apps = JSON.parse(jlist.stdout || '[]')
  } catch (err) {
    return {
      exitCode: 0,
      message: [
        '[postbuild-reload-pm2] pm2 jlist returned invalid JSON — skipping reload.',
        `  error: ${err?.message ?? err}`,
      ].join('\n'),
    }
  }
  const hasApp = Array.isArray(apps) && apps.some((a) => a?.name === pm2AppName)
  if (!hasApp) {
    return {
      exitCode: 0,
      message: [
        `[postbuild-reload-pm2] ${pm2AppName} not registered with PM2 — skipping reload.`,
        `  (run \`pm2 start pm2-ecosystem.config.js\` once to register; until then this`,
        '   build does not need a reload — set SKIP_PM2_RELOAD=1 to silence)',
      ].join('\n'),
    }
  }

  // --- 5. perform the actual reload ------------------------------------------
  const reload = execFileImpl('pm2', ['reload', pm2AppName, '--update-env'])
  if (reload.status !== 0) {
    return {
      exitCode: 1,
      message: [
        `[postbuild-reload-pm2] FAIL (${TASK_ID}): pm2 reload ${pm2AppName} exited ${reload.status}.`,
        `  stderr: ${reload.stderr.trim()}`,
        '  the previous PM2 process is likely still serving stale HTML.',
        `  fix: investigate \`pm2 logs ${pm2AppName}\` then re-run \`npm run build\`.`,
        `  ${TRACKING}`,
      ].join('\n'),
    }
  }

  // --- 6. poll until the new process is bound and responding -----------------
  const liveUrl = `http://localhost:${livePort}/`
  const deadline = Date.now() + healthTimeoutMs
  let healthy = false
  let lastErr = 'unknown'
  while (Date.now() < deadline) {
    try {
      const res = await fetchImpl(liveUrl)
      if (res?.ok || (res?.status >= 200 && res?.status < 500)) {
        healthy = true
        break
      }
      lastErr = `status ${res?.status}`
    } catch (err) {
      lastErr = String(err?.message ?? err)
    }
    await sleep(healthPollMs)
  }
  if (!healthy) {
    return {
      exitCode: 1,
      message: [
        `[postbuild-reload-pm2] FAIL (${TASK_ID}): health check timeout after ${healthTimeoutMs}ms.`,
        `  ${pm2AppName} did not respond at ${liveUrl} (last error: ${lastErr}).`,
        `  inspect: \`pm2 logs ${pm2AppName}\``,
        `  ${TRACKING}`,
      ].join('\n'),
    }
  }

  // --- 7. PROVE the rollover took effect via existing buildid-sync check -----
  const syncScript = join(cwd, 'scripts', 'check-buildid-sync.mjs')
  const sync = spawnSyncImpl('node', [syncScript, '--strict'], {
    cwd,
    env: { ...env, NEXT_LIVE_URL: liveUrl },
  })
  if (sync.status !== 0) {
    const blob = [sync.stdout, sync.stderr].filter(Boolean).join('\n').trim()
    return {
      exitCode: 1,
      message: [
        `[postbuild-reload-pm2] FAIL (${TASK_ID}): buildid-sync check failed after reload.`,
        blob || '  (no sync output)',
        '  the PM2 process did not pick up the new BUILD_ID.',
        `  ${TRACKING}`,
      ].join('\n'),
    }
  }

  return {
    exitCode: 0,
    message: [
      `[postbuild-reload-pm2] OK — reloaded ${pm2AppName}; live process serving new BUILD_ID.`,
      `  ${sync.stdout.trim()}`,
    ].join('\n'),
  }
}

// --- CLI entry point ---------------------------------------------------------
// Only run when invoked directly (not when imported by tests).
const invokedAsScript =
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith('postbuild-reload-pm2.mjs')

if (invokedAsScript) {
  const result = await postbuildReloadPm2()
  if (result.exitCode === 0) {
    console.log(result.message)
  } else {
    console.error(result.message)
  }
  process.exit(result.exitCode)
}
