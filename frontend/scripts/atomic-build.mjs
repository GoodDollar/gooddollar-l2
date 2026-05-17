#!/usr/bin/env node
// frontend/scripts/atomic-build.mjs
//
// Atomic Next.js build wrapper — structurally prevents the iter14 outage
// (https://goodswap.goodclaw.org served HTTP 500 on every /_next/static/*
// asset because a partial `next build` wiped `.next/BUILD_ID` while the
// PM2 process kept serving from its in-memory manifest).
//
// Strategy
// --------
// Next.js 14 has no `--build-output-dir` flag, and `distDir` in
// `next.config.js` is a static value loaded at process start. So we use a
// hardlink snapshot pattern instead:
//
//   1. If `.next.prev` exists from a previous failed run, remove it.
//   2. If `.next` exists, snapshot it via `cp -al .next .next.prev`.
//      Hardlinks are O(file_count) but only copy inodes, so this stays
//      sub-second even on a fresh `.next/` tree.
//   3. Run `next build` against the real `.next/` directory. Inside the
//      build, Next.js removes/replaces files; the hardlinks in
//      `.next.prev/` retain the previous inodes (unlink only drops one
//      name from the inode, not the inode itself).
//   4. On build success, assert `.next/BUILD_ID` exists and is non-empty
//      (defends against the iter14 root cause of a 0-exit-but-empty
//      build). If both pass, drop `.next.prev`. If the BUILD_ID check
//      fails we ROLL BACK — the apparently successful build is poison.
//   5. On build failure, atomically restore: `rm -rf .next && mv
//      .next.prev .next`. The previous good build is reinstated and
//      `postbuild-reload-pm2.mjs` (which runs after a 0-exit build) is
//      never invoked, so PM2 stays on the asset hashes it already has.
//
// Why this is safe
// ----------------
//   - The previous build is preserved on disk for the entire duration of
//     the new build, not just before it starts. If the process is killed
//     mid-build, the next run cleans up `.next.prev` and tries again
//     from the (still-intact) live `.next/`.
//   - We never modify the live PM2 process in this script; the existing
//     `postbuild-reload-pm2.mjs` postbuild hook keeps owning that, and
//     it only runs if `next build` (i.e. this wrapper) exits 0.
//   - `cp -al` and `mv` within the same filesystem are atomic at the
//     directory-rename level. The window where `.next` is missing
//     between `rm -rf .next` and `mv .next.prev .next` is ~ms; PM2's
//     manifest is in memory so it doesn't hit disk during that window.
//
// Testability
// -----------
// Exports `atomicBuild(options)` so vitest tests can inject
// `spawnSyncImpl`, `existsSyncImpl`, `rmImpl`, `renameImpl`,
// `nextBinPath`. The CLI shim at the bottom only runs when invoked as a
// script (`node atomic-build.mjs`), not when imported as a module.
//
// Wiring
// ------
// `frontend/package.json` calls this from `npm run build`:
//   "build": "node scripts/atomic-build.mjs"
// Next's `postbuild` hook is unchanged and still runs after success.
//
// Tracking:
//   .autobuilder/initiatives/0004-testnet-readiness-gate/tasks/
//     0015-iter14-blocker-frontend-build-atomic-swap.md

import { spawnSync } from 'node:child_process'
import { existsSync, rmSync, renameSync, statSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import process from 'node:process'

const NEXT_DIR_NAME = '.next'
const SNAPSHOT_DIR_NAME = '.next.prev'

/**
 * Resolve the `next` CLI entrypoint for the given project root.
 * Works with both hoisted (npm workspaces) and per-project installs.
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
 * Run an atomic Next.js build.
 *
 * @param {object} [opts]
 * @param {string} [opts.cwd] - frontend project root; defaults to process.cwd()
 * @param {NodeJS.ProcessEnv} [opts.env] - environment for the child build
 * @param {string|null} [opts.nextBinPath] - resolved path to `next` CLI (auto if omitted)
 * @param {(file: string, args: string[], opts?: object) => { status: number|null, signal?: string|null }} [opts.spawnSyncImpl] - for tests
 * @param {(p: string) => boolean} [opts.existsSyncImpl] - for tests
 * @param {(p: string, opts?: object) => void} [opts.rmImpl] - for tests
 * @param {(a: string, b: string) => void} [opts.renameImpl] - for tests
 * @param {(p: string) => number} [opts.statSizeImpl] - returns size of file at p, for tests
 * @param {string[]} [opts.nextArgs] - args to pass to `next` (defaults to ['build'])
 * @param {(msg: string) => void} [opts.log]
 * @param {(msg: string) => void} [opts.error]
 * @returns {number} process exit code (0 = success, non-zero = failure)
 */
export function atomicBuild(opts = {}) {
  const {
    cwd = process.cwd(),
    env = process.env,
    nextBinPath = resolveNextBin(cwd),
    spawnSyncImpl = spawnSync,
    existsSyncImpl = existsSync,
    rmImpl = (p) => rmSync(p, { recursive: true, force: true }),
    renameImpl = renameSync,
    statSizeImpl = (p) => {
      try {
        return statSync(p).size
      } catch {
        return 0
      }
    },
    nextArgs = ['build'],
    log = (m) => process.stdout.write(`[atomic-build] ${m}\n`),
    error = (m) => process.stderr.write(`[atomic-build] ${m}\n`),
  } = opts

  if (!nextBinPath) {
    error(`could not resolve next CLI from ${cwd}; install dependencies first`)
    return 1
  }

  const nextDir = join(cwd, NEXT_DIR_NAME)
  const snapshotDir = join(cwd, SNAPSHOT_DIR_NAME)

  // 1. Wipe any stale snapshot from a previous failed run.
  if (existsSyncImpl(snapshotDir)) {
    log(`cleaning stale snapshot ${SNAPSHOT_DIR_NAME}/`)
    rmImpl(snapshotDir)
  }

  // 2. Snapshot the current live build, if one exists.
  const haveLive = existsSyncImpl(nextDir)
  let snapshotTaken = false
  if (haveLive) {
    log(`snapshotting ${NEXT_DIR_NAME}/ → ${SNAPSHOT_DIR_NAME}/ via cp -al`)
    const cp = spawnSyncImpl('cp', ['-al', nextDir, snapshotDir], {
      cwd,
      stdio: 'inherit',
      env,
    })
    if (cp.status === 0) {
      snapshotTaken = true
    } else {
      // Hardlink mode failed (cross-fs, permissions, …). Fall back to a
      // regular recursive copy so we still have a rollback target.
      error(`cp -al exited ${cp.status}; falling back to cp -r`)
      if (existsSyncImpl(snapshotDir)) rmImpl(snapshotDir)
      const cpr = spawnSyncImpl('cp', ['-r', nextDir, snapshotDir], {
        cwd,
        stdio: 'inherit',
        env,
      })
      if (cpr.status === 0) {
        snapshotTaken = true
      } else {
        error(`cp -r also failed (status=${cpr.status}); proceeding WITHOUT rollback safety`)
        if (existsSyncImpl(snapshotDir)) rmImpl(snapshotDir)
      }
    }
  } else {
    log(`no existing ${NEXT_DIR_NAME}/ to snapshot — first-time build`)
  }

  // 3. Run `next build` against the live .next dir.
  log(`running: node ${nextBinPath} ${nextArgs.join(' ')}`)
  const build = spawnSyncImpl('node', [nextBinPath, ...nextArgs], {
    cwd,
    stdio: 'inherit',
    env,
  })

  // 4. Decide success or failure and act atomically.
  const buildStatus = typeof build.status === 'number' ? build.status : 1
  const buildIdPath = join(nextDir, 'BUILD_ID')
  const buildIdOk = existsSyncImpl(buildIdPath) && statSizeImpl(buildIdPath) > 0

  if (buildStatus !== 0) {
    error(`next build exited ${buildStatus}; rolling back`)
    return rollback({ nextDir, snapshotDir, snapshotTaken, existsSyncImpl, rmImpl, renameImpl, error })
  }

  if (!buildIdOk) {
    error(`next build exited 0 but BUILD_ID missing or empty at ${buildIdPath}; rolling back`)
    return rollback({ nextDir, snapshotDir, snapshotTaken, existsSyncImpl, rmImpl, renameImpl, error })
  }

  // 5. Success — drop the snapshot.
  if (snapshotTaken && existsSyncImpl(snapshotDir)) {
    log(`build green; dropping snapshot ${SNAPSHOT_DIR_NAME}/`)
    rmImpl(snapshotDir)
  } else {
    log('build green; no snapshot to drop')
  }
  return 0
}

function rollback({ nextDir, snapshotDir, snapshotTaken, existsSyncImpl, rmImpl, renameImpl, error }) {
  if (!snapshotTaken || !existsSyncImpl(snapshotDir)) {
    error('no snapshot available — live .next/ may be in an inconsistent state')
    return 1
  }
  try {
    if (existsSyncImpl(nextDir)) rmImpl(nextDir)
    renameImpl(snapshotDir, nextDir)
    error('rolled back .next/ from snapshot — live PM2 process untouched')
  } catch (err) {
    error(`rollback failed: ${err && err.message ? err.message : err}`)
    return 1
  }
  return 1
}

// CLI shim — only run when invoked directly.
const invokedDirectly =
  typeof process.argv[1] === 'string' &&
  resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))

if (invokedDirectly) {
  const code = atomicBuild({
    nextArgs: process.argv.slice(2).length ? process.argv.slice(2) : ['build'],
  })
  process.exit(code)
}
