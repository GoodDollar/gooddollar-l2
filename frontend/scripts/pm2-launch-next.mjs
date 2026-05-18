#!/usr/bin/env node
// frontend/scripts/pm2-launch-next.mjs
//
// PM2 entrypoint for the `goodswap` Next.js production server.
//
// Why this exists (iter18 fence)
// ------------------------------
// On 2026-05-17, https://goodswap.goodclaw.org served HTTP 200 on the HTML
// document but every `<script src="/_next/static/chunks/*.js">` referenced
// in that HTML returned HTTP 500. The HTML was templated from a fresh
// `build-manifest.json` but the corresponding hashed JS chunk files were
// never written to `.next/static/chunks/`. PM2 was happily running
// `next start` against this broken tree, hot-serving the bad manifest with
// zero indication that anything was wrong. `/api/status` was green because
// the API route bundle happened to be intact.
//
// `atomic-build.mjs` (iter14) prevents the *build* step from producing a
// poisoned `.next/` tree, but PM2 boots `next start` from whatever is on
// disk, even if a human / deploy / out-of-band process left it in a broken
// state. This launcher is the second line of defense: it validates the
// minimum invariants every Next.js production server needs BEFORE it spawns
// `next start`. If validation fails, the launcher exits non-zero and PM2
// marks the process `errored`, surfacing the corruption immediately
// (loud failure ≫ silent 500s).
//
// What we validate
// ----------------
//   1. `.next/` directory exists.
//   2. `.next/BUILD_ID` exists and is non-empty (defends against the
//      truncated-build case `atomic-build.mjs` already catches at build
//      time, in case `.next/` was tampered with after the build).
//   3. `.next/build-manifest.json` exists and parses as JSON.
//   4. The manifest does NOT carry the dev-mode signature
//      (`static/development/_buildManifest.js` etc.). A stray `next dev`
//      run over the production tree leaves exactly this shape and is the
//      precise iter11 mode. Loud failure ≫ silent dev-mode in PM2.
//   5. If `.next/app-build-manifest.json` exists (App Router projects),
//      it must parse as JSON. This is the precise iter11 hole the
//      original iter18 fence missed: the legacy `build-manifest.json`
//      is largely empty for App-Router-only routes, so chunk sampling
//      against it alone is effectively a no-op for this codebase.
//   6. A representative sample of JS chunks referenced by EITHER manifest
//      actually exist on disk (this is the precise iter18 mode, extended
//      to App Router via iter11).
//
// What we DELIBERATELY do not validate
// ------------------------------------
//   - CSS files: missing CSS degrades UX but the app still runs.
//   - .next/server/: server-side bundles are checked implicitly by
//     `next start` itself (it fails loud on missing chunks during the
//     first SSR call).
//   - Exact chunk counts or sizes: we trust Next.js to know how many
//     chunks it needs. We just spot-check that the references it WROTE
//     INTO THE MANIFEST resolve to real files.
//
// Testability
// -----------
// Exports `validateNextBuild(options)` so vitest can inject
// `existsSyncImpl` / `statSizeImpl` / `readFileSyncImpl`. The launcher
// shim at the bottom only runs when invoked as a script
// (`node pm2-launch-next.mjs`), not when imported as a module.
//
// Tracking:
//   .autobuilder/initiatives/0004-testnet-readiness-gate/tasks/
//     0018-iter18-blocker-frontend-build-regression-fence.md

import { spawn } from 'node:child_process'
import { existsSync, statSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import process from 'node:process'

const NEXT_DIR_NAME = '.next'
const SAMPLE_LIMIT = 5

/**
 * Validate that the on-disk `.next/` build is structurally complete enough
 * to serve `next start` without producing 500s on hashed chunks.
 *
 * Returns `{ ok: true }` on success and `{ ok: false, reason, missing? }`
 * on failure. `reason` is a stable identifier suitable for log alerting
 * and runbook lookups.
 *
 * @param {object} opts
 * @param {string} opts.cwd
 * @param {(p: string) => boolean} [opts.existsSyncImpl]
 * @param {(p: string) => number} [opts.statSizeImpl]
 * @param {(p: string, encoding?: string) => string} [opts.readFileSyncImpl]
 * @param {(msg: string) => void} [opts.log]
 * @param {(msg: string) => void} [opts.error]
 * @returns {{ ok: true } | { ok: false, reason: string, missing?: string[] }}
 */
export function validateNextBuild(opts) {
  const {
    cwd,
    existsSyncImpl = existsSync,
    statSizeImpl = (p) => {
      try {
        return statSync(p).size
      } catch {
        return 0
      }
    },
    readFileSyncImpl = (p) => readFileSync(p, 'utf8'),
    log = () => {},
    error = (m) => process.stderr.write(`[pm2-launch-next] ${m}\n`),
  } = opts

  const nextDir = join(cwd, NEXT_DIR_NAME)
  const buildIdPath = join(nextDir, 'BUILD_ID')
  const manifestPath = join(nextDir, 'build-manifest.json')
  const appManifestPath = join(nextDir, 'app-build-manifest.json')

  // 1. `.next/` must exist.
  if (!existsSyncImpl(nextDir)) {
    error(`.next/ directory missing at ${nextDir}`)
    return { ok: false, reason: 'no-next-dir' }
  }

  // 2. BUILD_ID must exist and be non-empty.
  if (!existsSyncImpl(buildIdPath)) {
    error(`.next/BUILD_ID missing at ${buildIdPath}`)
    return { ok: false, reason: 'no-build-id' }
  }
  if (statSizeImpl(buildIdPath) <= 0) {
    error(`.next/BUILD_ID is empty at ${buildIdPath}`)
    return { ok: false, reason: 'empty-build-id' }
  }

  // 3. build-manifest.json must exist and parse.
  if (!existsSyncImpl(manifestPath)) {
    error(`.next/build-manifest.json missing at ${manifestPath}`)
    return { ok: false, reason: 'no-manifest' }
  }
  let manifest
  try {
    manifest = JSON.parse(readFileSyncImpl(manifestPath, 'utf8'))
  } catch (e) {
    error(`.next/build-manifest.json failed to parse: ${e.message}`)
    return { ok: false, reason: 'bad-manifest' }
  }

  // 4. iter11 fence: detect dev-mode signature. `next dev` writes a
  // distinctive `lowPriorityFiles` entry pointing at static/development/.
  // If we see it, a developer (or background watcher) wiped the prod tree
  // and we must refuse to start `next start` against it — otherwise PM2
  // proudly serves a dev build with no hot-reload client.
  const lowPriorityFiles =
    manifest && typeof manifest === 'object' && Array.isArray(manifest.lowPriorityFiles)
      ? manifest.lowPriorityFiles
      : []
  if (lowPriorityFiles.some((f) => typeof f === 'string' && f.startsWith('static/development/'))) {
    error('.next/build-manifest.json carries dev-mode signature (static/development/*).')
    error('  → someone ran `next dev` over the production .next/ tree.')
    error('  → rebuild with `npm run build` (from frontend/) before retrying.')
    return { ok: false, reason: 'dev-mode-build' }
  }

  // 5. App Router companion manifest. Optional (Pages-Router-only
  // projects do not have it), but if present it must parse. This codebase
  // is App-Router-dominant so most real chunk references live here, not
  // in `build-manifest.json.pages`.
  let appManifest = null
  if (existsSyncImpl(appManifestPath)) {
    try {
      appManifest = JSON.parse(readFileSyncImpl(appManifestPath, 'utf8'))
    } catch (e) {
      error(`.next/app-build-manifest.json failed to parse: ${e.message}`)
      return { ok: false, reason: 'bad-app-manifest' }
    }
  }

  // 6. Sample up to SAMPLE_LIMIT JS chunks referenced by EITHER manifest
  // and confirm they exist on disk. This is the precise iter18 check,
  // extended to App Router via iter11.
  const sampled = []
  function sampleFromPagesMap(pagesMap) {
    if (!pagesMap || typeof pagesMap !== 'object') return false
    for (const files of Object.values(pagesMap)) {
      if (!Array.isArray(files)) continue
      for (const f of files) {
        if (typeof f !== 'string') continue
        if (!f.endsWith('.js')) continue
        if (sampled.includes(f)) continue
        sampled.push(f)
        if (sampled.length >= SAMPLE_LIMIT) return true
      }
    }
    return false
  }
  const legacyPages = manifest && typeof manifest === 'object' ? manifest.pages : null
  const filled = sampleFromPagesMap(legacyPages)
  if (!filled && appManifest && typeof appManifest === 'object') {
    sampleFromPagesMap(appManifest.pages)
  }

  if (sampled.length === 0) {
    error('build-manifest.json + app-build-manifest.json contained no JS chunk references')
    return { ok: false, reason: 'no-chunks' }
  }

  const missing = sampled.filter((f) => !existsSyncImpl(join(nextDir, f)))
  if (missing.length > 0) {
    error(`${missing.length}/${sampled.length} manifest-referenced JS chunks missing on disk:`)
    for (const m of missing) error(`  - ${m}`)
    return { ok: false, reason: 'missing-chunks', missing }
  }

  log(`build validation OK — BUILD_ID present, ${sampled.length} sample chunks verified`)
  return { ok: true }
}

/**
 * Resolve the `next` CLI entrypoint for the given project root.
 *
 * @param {string} cwd
 * @returns {string|null}
 */
function resolveNextBin(cwd) {
  try {
    const req = createRequire(join(cwd, 'package.json'))
    return req.resolve('next/dist/bin/next')
  } catch {
    return null
  }
}

/**
 * CLI shim — only runs when this file is invoked directly.
 *
 * Behavior:
 *   - validate the .next/ build → exit 1 with descriptive reason if bad
 *   - spawn `next start -p $PORT` (default 3100)
 *   - forward SIGTERM/SIGINT/SIGHUP to the child so PM2 can stop us cleanly
 *   - exit with the child's exit code
 */
/**
 * Resolve which port to bind `next start` to.
 * Precedence: `--port <n>` argv flag → `PORT` env var → 3100.
 *
 * @param {string[]} argv
 * @param {NodeJS.ProcessEnv} env
 * @returns {string}
 */
export function resolvePort(argv, env) {
  const portIdx = argv.indexOf('--port')
  if (portIdx !== -1 && argv[portIdx + 1]) return argv[portIdx + 1]
  if (env.PORT) return env.PORT
  return '3100'
}

function main() {
  const cwd = process.cwd()
  const port = resolvePort(process.argv.slice(2), process.env)

  process.stdout.write(`[pm2-launch-next] validating .next/ at ${cwd}\n`)
  const result = validateNextBuild({
    cwd,
    log: (m) => process.stdout.write(`[pm2-launch-next] ${m}\n`),
    error: (m) => process.stderr.write(`[pm2-launch-next] ${m}\n`),
  })

  if (!result.ok) {
    process.stderr.write(
      `[pm2-launch-next] REFUSING to start next: ${result.reason}. ` +
        `Rebuild with \`npm run build\` (from frontend/) before retrying.\n`,
    )
    process.exit(1)
  }

  const nextBin = resolveNextBin(cwd)
  if (!nextBin) {
    process.stderr.write(
      `[pm2-launch-next] could not resolve next CLI from ${cwd}; install dependencies first\n`,
    )
    process.exit(1)
  }

  process.stdout.write(`[pm2-launch-next] starting next on port ${port}\n`)
  const child = spawn('node', [nextBin, 'start', '-p', port], {
    cwd,
    stdio: 'inherit',
    env: process.env,
  })

  // Forward common termination signals to the child so PM2 reloads/stops are clean.
  for (const sig of ['SIGTERM', 'SIGINT', 'SIGHUP']) {
    process.on(sig, () => {
      try {
        child.kill(sig)
      } catch {
        /* child already dead */
      }
    })
  }

  child.on('exit', (code, signal) => {
    if (signal) {
      process.stderr.write(`[pm2-launch-next] next exited via signal ${signal}\n`)
      process.exit(1)
      return
    }
    process.exit(typeof code === 'number' ? code : 1)
  })
}

/**
 * Decide whether to invoke main() based on argv and env.
 *
 * Direct node invocation: argv[1] equals our own module path.
 *
 * PM2 fork mode: argv[1] points at PM2's ProcessContainerFork.js (not us),
 * but PM2 exposes a stable `pm_id` env var on the child, plus typically
 * `PM2_HOME` and the process `name`. Detect any of those to know we're
 * inside PM2 and should still run main(). Without this, the iter18 silent
 * failure recurs: the launcher imports fine but never validates the build
 * or spawns `next start`.
 *
 * Test runners (vitest etc.) set argv[1] to their own CLI and have no
 * PM2 env, so this returns false and tests can import the module safely.
 */
export function shouldRunMain({ argv1, modulePath, env }) {
  if (argv1 && argv1 === modulePath) return true
  const e = env || {}
  if (e.pm_id !== undefined && e.pm_id !== '') return true
  if (e.PM2_HOME && e.name) return true
  return false
}

if (
  shouldRunMain({
    argv1: process.argv[1],
    modulePath: fileURLToPath(import.meta.url),
    env: process.env,
  })
) {
  main()
}
