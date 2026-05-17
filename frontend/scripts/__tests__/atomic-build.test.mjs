/**
 * Unit tests for scripts/atomic-build.mjs
 *
 * `atomic-build.mjs` is the Next.js build wrapper that structurally
 * prevents the iter14 outage: it snapshots the current `.next/`
 * directory via `cp -al` before invoking `next build`, then either
 * drops the snapshot on success or atomically restores it on failure
 * (build crash OR build exits 0 but BUILD_ID is missing — the exact
 * iter14 mode where `next start` keeps serving but every static asset
 * 500s).
 *
 * Tracking: .autobuilder/initiatives/0004-testnet-readiness-gate/tasks/
 *   0015-iter14-blocker-frontend-build-atomic-swap.md
 *
 * Test style mirrors the rest of frontend/scripts/__tests__/* —
 * dependency injection only, no vi.mock. Each test asserts both the
 * exit code AND the sequence of side-effects (snapshot taken, rollback
 * executed, snapshot dropped, …) by inspecting the recorded calls on
 * the injected fake implementations.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { join } from 'node:path'

import { atomicBuild } from '../atomic-build.mjs'

// --- in-memory test doubles -------------------------------------------------

function makeFakeFs(initial = {}) {
  // Path → size in bytes (size <= 0 means file/dir is absent).
  const files = new Map()
  for (const [p, size] of Object.entries(initial)) files.set(p, size)

  const calls = []

  return {
    files,
    calls,
    existsSyncImpl: (p) => files.has(p) && files.get(p) >= 0,
    rmImpl: (p) => {
      calls.push(['rm', p])
      // Remove the dir and every descendant marker.
      for (const k of Array.from(files.keys())) {
        if (k === p || k.startsWith(p + '/')) files.delete(k)
      }
    },
    renameImpl: (a, b) => {
      calls.push(['rename', a, b])
      // Move every entry under `a` to `b`.
      for (const k of Array.from(files.keys())) {
        if (k === a) {
          files.set(b, files.get(a))
          files.delete(a)
        } else if (k.startsWith(a + '/')) {
          const moved = b + k.slice(a.length)
          files.set(moved, files.get(k))
          files.delete(k)
        }
      }
    },
    statSizeImpl: (p) => (files.has(p) ? files.get(p) : 0),
  }
}

/**
 * Build a spawnSync fake that:
 *   - returns the configured exit code for `cp -al` and `cp -r`
 *   - simulates `next build` by mutating the fake fs (writes BUILD_ID
 *     if `buildIdContent` is non-null) and returning the configured
 *     `buildStatus`
 */
function makeSpawnSync({
  fs,
  cwd,
  cpStatus = 0,
  cprStatus = 0,
  buildStatus = 0,
  buildIdContent = 'TEST_BUILD_ID',
}) {
  const calls = []
  return {
    calls,
    spawnSyncImpl: (cmd, args) => {
      calls.push([cmd, ...args])

      if (cmd === 'cp' && args[0] === '-al') {
        const [, from, to] = args
        if (cpStatus === 0) {
          // Snapshot every file under `from` into `to`.
          for (const k of Array.from(fs.files.keys())) {
            if (k === from) fs.files.set(to, fs.files.get(from))
            else if (k.startsWith(from + '/')) {
              fs.files.set(to + k.slice(from.length), fs.files.get(k))
            }
          }
        }
        return { status: cpStatus }
      }

      if (cmd === 'cp' && args[0] === '-r') {
        const [, from, to] = args
        if (cprStatus === 0) {
          for (const k of Array.from(fs.files.keys())) {
            if (k === from) fs.files.set(to, fs.files.get(from))
            else if (k.startsWith(from + '/')) {
              fs.files.set(to + k.slice(from.length), fs.files.get(k))
            }
          }
        }
        return { status: cprStatus }
      }

      if (cmd === 'node' && args[0]?.endsWith('next')) {
        // Simulate `next build` faithfully:
        //   - it always deletes the live BUILD_ID at the start of a build
        //     (this is the iter14 root cause — a build can wipe BUILD_ID
        //     and then crash mid-way without ever regenerating it)
        //   - on success it writes a new BUILD_ID
        //   - if `buildIdContent` is null, it leaves BUILD_ID absent
        //     (the precise mode that took the live site down)
        const buildIdPath = join(cwd, '.next', 'BUILD_ID')
        fs.files.delete(buildIdPath)
        if (buildStatus === 0 && buildIdContent !== null) {
          fs.files.set(join(cwd, '.next'), 0)
          fs.files.set(buildIdPath, buildIdContent.length)
        }
        return { status: buildStatus }
      }

      throw new Error(`unexpected spawnSync call: ${cmd} ${args.join(' ')}`)
    },
  }
}

// --- fixtures ---------------------------------------------------------------

let cwd
let nextDir
let snapshotDir
let buildIdPath

beforeEach(() => {
  cwd = '/fake/frontend'
  nextDir = join(cwd, '.next')
  snapshotDir = join(cwd, '.next.prev')
  buildIdPath = join(nextDir, 'BUILD_ID')
})

// --- tests ------------------------------------------------------------------

describe('atomic-build (Phase B wrapper for iter14)', () => {
  it('happy path: live .next/ snapshotted, build succeeds, snapshot dropped → exit 0', () => {
    const fs = makeFakeFs({
      [nextDir]: 0,
      [buildIdPath]: 21, // old BUILD_ID, will be overwritten
      [join(nextDir, 'static/css/old.css')]: 4096,
    })
    const sp = makeSpawnSync({ fs, cwd, buildIdContent: 'NEW_BUILD_ID' })

    const code = atomicBuild({
      cwd,
      env: {},
      nextBinPath: '/fake/node_modules/next/dist/bin/next',
      spawnSyncImpl: sp.spawnSyncImpl,
      existsSyncImpl: fs.existsSyncImpl,
      rmImpl: fs.rmImpl,
      renameImpl: fs.renameImpl,
      statSizeImpl: fs.statSizeImpl,
      log: () => {},
      error: () => {},
    })

    expect(code).toBe(0)
    // Snapshot was created and then dropped — neither should be present at the end.
    expect(fs.existsSyncImpl(snapshotDir)).toBe(false)
    // Live .next/ still present with the new BUILD_ID.
    expect(fs.existsSyncImpl(nextDir)).toBe(true)
    expect(fs.existsSyncImpl(buildIdPath)).toBe(true)
    // cp -al → next build → rm snapshot, in order.
    const cmds = sp.calls.map((c) => `${c[0]} ${c[1]}`)
    expect(cmds[0]).toMatch(/^cp -al$/)
    expect(cmds[1]).toMatch(/^node \/fake\/node_modules\/next\/dist\/bin\/next$/)
  })

  it('first-time build: no live .next/, build succeeds → exit 0, no rollback path taken', () => {
    const fs = makeFakeFs({}) // empty fs
    const sp = makeSpawnSync({ fs, cwd })

    const code = atomicBuild({
      cwd,
      env: {},
      nextBinPath: '/fake/node_modules/next/dist/bin/next',
      spawnSyncImpl: sp.spawnSyncImpl,
      existsSyncImpl: fs.existsSyncImpl,
      rmImpl: fs.rmImpl,
      renameImpl: fs.renameImpl,
      statSizeImpl: fs.statSizeImpl,
      log: () => {},
      error: () => {},
    })

    expect(code).toBe(0)
    // No `cp -al` was issued because there was nothing to snapshot.
    expect(sp.calls.find((c) => c[0] === 'cp' && c[1] === '-al')).toBeUndefined()
    // No snapshot left behind.
    expect(fs.existsSyncImpl(snapshotDir)).toBe(false)
    // Live .next/ now contains BUILD_ID from the simulated build.
    expect(fs.existsSyncImpl(buildIdPath)).toBe(true)
  })

  it('build crash (non-zero exit) → snapshot rolled back, exit 1, live .next/ preserved', () => {
    const fs = makeFakeFs({
      [nextDir]: 0,
      [buildIdPath]: 21,
      [join(nextDir, 'static/css/old.css')]: 4096,
    })
    const sp = makeSpawnSync({ fs, cwd, buildStatus: 1, buildIdContent: null })

    const code = atomicBuild({
      cwd,
      env: {},
      nextBinPath: '/fake/node_modules/next/dist/bin/next',
      spawnSyncImpl: sp.spawnSyncImpl,
      existsSyncImpl: fs.existsSyncImpl,
      rmImpl: fs.rmImpl,
      renameImpl: fs.renameImpl,
      statSizeImpl: fs.statSizeImpl,
      log: () => {},
      error: () => {},
    })

    expect(code).toBe(1)
    // Snapshot consumed by the rollback → no longer present.
    expect(fs.existsSyncImpl(snapshotDir)).toBe(false)
    // Live .next/ restored from snapshot — original BUILD_ID still intact.
    expect(fs.existsSyncImpl(buildIdPath)).toBe(true)
    expect(fs.existsSyncImpl(join(nextDir, 'static/css/old.css'))).toBe(true)
  })

  it('iter14 mode: build exits 0 but BUILD_ID missing → rollback fires, exit 1', () => {
    const fs = makeFakeFs({
      [nextDir]: 0,
      [buildIdPath]: 21,
      [join(nextDir, 'static/css/good.css')]: 4096,
    })
    // Build "succeeds" (exit 0) but writes no BUILD_ID — exactly the
    // iter14 root cause that took the live site down.
    const sp = makeSpawnSync({ fs, cwd, buildStatus: 0, buildIdContent: null })

    const code = atomicBuild({
      cwd,
      env: {},
      nextBinPath: '/fake/node_modules/next/dist/bin/next',
      spawnSyncImpl: sp.spawnSyncImpl,
      existsSyncImpl: fs.existsSyncImpl,
      rmImpl: fs.rmImpl,
      renameImpl: fs.renameImpl,
      statSizeImpl: fs.statSizeImpl,
      log: () => {},
      error: () => {},
    })

    expect(code).toBe(1)
    expect(fs.existsSyncImpl(snapshotDir)).toBe(false)
    // Original good CSS asset must still be on disk after rollback.
    expect(fs.existsSyncImpl(join(nextDir, 'static/css/good.css'))).toBe(true)
    expect(fs.existsSyncImpl(buildIdPath)).toBe(true)
  })

  it('build exits 0 but BUILD_ID is empty file → rollback fires, exit 1', () => {
    const fs = makeFakeFs({
      [nextDir]: 0,
      [buildIdPath]: 21,
    })
    // Simulate build that writes a 0-byte BUILD_ID by intercepting the
    // "next" call and writing size=0 manually.
    const sp = {
      calls: [],
      spawnSyncImpl: (cmd, args) => {
        sp.calls.push([cmd, ...args])
        if (cmd === 'cp' && args[0] === '-al') {
          fs.files.set(snapshotDir, 0)
          fs.files.set(join(snapshotDir, 'BUILD_ID'), 21)
          return { status: 0 }
        }
        if (cmd === 'node' && args[0].endsWith('next')) {
          fs.files.set(buildIdPath, 0) // empty BUILD_ID — poison
          return { status: 0 }
        }
        throw new Error(`unexpected: ${cmd} ${args.join(' ')}`)
      },
    }

    const code = atomicBuild({
      cwd,
      env: {},
      nextBinPath: '/fake/node_modules/next/dist/bin/next',
      spawnSyncImpl: sp.spawnSyncImpl,
      existsSyncImpl: fs.existsSyncImpl,
      rmImpl: fs.rmImpl,
      renameImpl: fs.renameImpl,
      statSizeImpl: fs.statSizeImpl,
      log: () => {},
      error: () => {},
    })

    expect(code).toBe(1)
    // After rollback, BUILD_ID should be restored to a non-empty file.
    expect(fs.statSizeImpl(buildIdPath)).toBe(21)
  })

  it('build fails and no snapshot exists (first-time build) → exit 1, no rollback attempted', () => {
    const fs = makeFakeFs({})
    const sp = makeSpawnSync({ fs, cwd, buildStatus: 1, buildIdContent: null })

    const code = atomicBuild({
      cwd,
      env: {},
      nextBinPath: '/fake/node_modules/next/dist/bin/next',
      spawnSyncImpl: sp.spawnSyncImpl,
      existsSyncImpl: fs.existsSyncImpl,
      rmImpl: fs.rmImpl,
      renameImpl: fs.renameImpl,
      statSizeImpl: fs.statSizeImpl,
      log: () => {},
      error: () => {},
    })

    expect(code).toBe(1)
    // No snapshot was ever taken → no rename call to roll back from.
    expect(sp.calls.find((c) => c[0] === 'cp')).toBeUndefined()
  })

  it('cp -al fails → falls back to cp -r, build still proceeds', () => {
    const fs = makeFakeFs({
      [nextDir]: 0,
      [buildIdPath]: 21,
    })
    const sp = makeSpawnSync({ fs, cwd, cpStatus: 1, cprStatus: 0 })

    const code = atomicBuild({
      cwd,
      env: {},
      nextBinPath: '/fake/node_modules/next/dist/bin/next',
      spawnSyncImpl: sp.spawnSyncImpl,
      existsSyncImpl: fs.existsSyncImpl,
      rmImpl: fs.rmImpl,
      renameImpl: fs.renameImpl,
      statSizeImpl: fs.statSizeImpl,
      log: () => {},
      error: () => {},
    })

    expect(code).toBe(0)
    const cmds = sp.calls.map((c) => `${c[0]} ${c[1]}`)
    expect(cmds).toEqual(
      expect.arrayContaining(['cp -al', 'cp -r']),
    )
  })

  it('stale .next.prev/ from prior failed run is cleaned up before snapshot', () => {
    const fs = makeFakeFs({
      [nextDir]: 0,
      [buildIdPath]: 21,
      [snapshotDir]: 0, // garbage from prior aborted run
      [join(snapshotDir, 'BUILD_ID')]: 21,
    })
    const sp = makeSpawnSync({ fs, cwd })

    const code = atomicBuild({
      cwd,
      env: {},
      nextBinPath: '/fake/node_modules/next/dist/bin/next',
      spawnSyncImpl: sp.spawnSyncImpl,
      existsSyncImpl: fs.existsSyncImpl,
      rmImpl: fs.rmImpl,
      renameImpl: fs.renameImpl,
      statSizeImpl: fs.statSizeImpl,
      log: () => {},
      error: () => {},
    })

    expect(code).toBe(0)
    // The stale snapshot must have been removed; final state has no snapshot.
    expect(fs.existsSyncImpl(snapshotDir)).toBe(false)
    // Both side-effects happened: rm of the stale snapshot AND cp -al for the new one.
    const rmCalled = fs.calls.some((c) => c[0] === 'rm' && c[1] === snapshotDir)
    const cpCalled = sp.calls.some((c) => c[0] === 'cp' && c[1] === '-al')
    expect(rmCalled).toBe(true)
    expect(cpCalled).toBe(true)
  })

  it('next CLI cannot be resolved → exit 1, no spawn calls made', () => {
    const fs = makeFakeFs({ [nextDir]: 0, [buildIdPath]: 21 })
    const sp = makeSpawnSync({ fs, cwd })

    const code = atomicBuild({
      cwd,
      env: {},
      nextBinPath: null, // simulate failed resolve
      spawnSyncImpl: sp.spawnSyncImpl,
      existsSyncImpl: fs.existsSyncImpl,
      rmImpl: fs.rmImpl,
      renameImpl: fs.renameImpl,
      statSizeImpl: fs.statSizeImpl,
      log: () => {},
      error: () => {},
    })

    expect(code).toBe(1)
    expect(sp.calls).toEqual([])
  })
})
