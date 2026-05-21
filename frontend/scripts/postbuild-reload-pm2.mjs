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
import { join, resolve } from 'node:path'
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
  buildIdSyncTimeoutMs = 10000,
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
  const pm2App = Array.isArray(apps) ? apps.find((a) => a?.name === pm2AppName) : null
  if (!pm2App) {
    return {
      exitCode: 0,
      message: [
        `[postbuild-reload-pm2] ${pm2AppName} not registered with PM2 — skipping reload.`,
        `  (run \`pm2 start pm2-ecosystem.config.js\` once to register; until then this`,
        '   build does not need a reload — set SKIP_PM2_RELOAD=1 to silence)',
      ].join('\n'),
    }
  }

  // --- 5. avoid reloading production from a detached worktree -----------------
  // PM2 can only reload the app it already supervises. If an operator runs
  // `npm run build` in an integration/lane worktree while production goodswap
  // is registered, reloading that PM2 app would restart the production cwd and
  // then compare this worktree's BUILD_ID against production HTML. That is both
  // noisy (false buildid-sync failure) and risky (a test build should not touch
  // prod). Only auto-reload when the current build cwd is the PM2 app cwd.
  const pm2Cwd = pm2App?.pm2_env?.pm_cwd || pm2App?.pm2_env?.cwd || pm2App?.cwd
  if (pm2Cwd && resolve(pm2Cwd) !== resolve(cwd)) {
    return {
      exitCode: 0,
      message: [
        `[postbuild-reload-pm2] ${pm2AppName} PM2 cwd differs from this build cwd — skipping reload.`,
        `  pm2 cwd:   ${resolve(pm2Cwd)}`,
        `  build cwd: ${resolve(cwd)}`,
        '  This is expected for integration/lane worktree builds; deploy from the live app cwd to reload PM2.',
      ].join('\n'),
    }
  }

  // --- 6. perform the actual reload ------------------------------------------
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
  // PM2 reload can return before the replacement Next.js worker is the one
  // answering :3100. A one-shot buildid probe raced the old worker in the
  // overnight gate: health was 200, but the live HTML still carried the prior
  // BUILD_ID for a moment. Treat BUILD_ID parity as the readiness condition and
  // poll it until the new worker is observably serving the fresh build.
  const syncScript = join(cwd, 'scripts', 'check-buildid-sync.mjs')
  const syncDeadline = Date.now() + buildIdSyncTimeoutMs
  let sync = null
  do {
    sync = spawnSyncImpl('node', [syncScript, '--strict'], {
      cwd,
      env: { ...env, NEXT_LIVE_URL: liveUrl },
    })
    if (sync.status === 0) break
    if (Date.now() < syncDeadline) await sleep(healthPollMs)
  } while (Date.now() < syncDeadline)
  if (sync.status !== 0) {
    const blob = [sync.stdout, sync.stderr].filter(Boolean).join('\n').trim()
    return {
      exitCode: 1,
      message: [
        `[postbuild-reload-pm2] FAIL (${TASK_ID}): buildid-sync check did not pass within ${buildIdSyncTimeoutMs}ms after reload.`,
        blob || '  (no sync output)',
        '  the PM2 process did not pick up the new BUILD_ID.',
        `  ${TRACKING}`,
      ].join('\n'),
    }
  }

  // --- 8. PROVE every chunk the live HTML references is actually returnable --
  //
  // Why this exists (iter11)
  // ------------------------
  // BUILD_ID parity (step 7) is NECESSARY but not SUFFICIENT. The live
  // process can pick up the new BUILD_ID and still hold a stale in-memory
  // chunk manifest if Next's internal manifest cache desynced (the exact
  // mode caught in iter11 production: HTML rendered with chunk hashes that
  // no longer existed on disk, every route blank, /api/status still 200).
  // check-served-chunks.mjs does the runtime probe that closes this gap:
  // it fetches a sample of live pages, extracts every `/_next/...` URL,
  // and confirms each one returns 2xx from the same live process.
  //
  // Fail-fast: if buildid-sync above failed we already returned, so we only
  // reach this point when the build rolled over cleanly — meaning any chunk
  // 404 here is unambiguously the stale-manifest mode and operator-actionable.
  //
  // Tracking: .autobuilder/initiatives/0004-testnet-readiness-gate/tasks/
  //   0022-iter11-blocker-pm2-stale-bundle-after-dev-clobber.md
  const chunksScript = join(cwd, 'scripts', 'check-served-chunks.mjs')
  const chunks = spawnSyncImpl('node', [chunksScript, '--strict'], {
    cwd,
    env: { ...env, NEXT_LIVE_URL: liveUrl },
  })
  if (chunks.status !== 0) {
    const blob = [chunks.stdout, chunks.stderr].filter(Boolean).join('\n').trim()
    return {
      exitCode: 1,
      message: [
        `[postbuild-reload-pm2] FAIL (task 0022): check-served-chunks failed after reload.`,
        blob || '  (no chunk-probe output)',
        '  the live process is serving HTML that references chunks it cannot return.',
        '  diagnosis: stale in-memory manifest (iter11 mode). Try a second',
        `  \`pm2 reload ${pm2AppName} --update-env\`; if it persists, the on-disk`,
        '  `.next/` tree was clobbered (e.g. a stray `next dev`) — atomic rebuild',
        '  via `npm run build` (which re-runs this hook) is the canonical fix.',
        '  Tracking: .autobuilder/initiatives/0004-testnet-readiness-gate/tasks/0022-iter11-blocker-pm2-stale-bundle-after-dev-clobber.md',
      ].join('\n'),
    }
  }

  return {
    exitCode: 0,
    message: [
      `[postbuild-reload-pm2] OK — reloaded ${pm2AppName}; live process serving new BUILD_ID and all chunks 2xx.`,
      `  ${sync.stdout.trim()}`,
      `  ${chunks.stdout.trim()}`,
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
