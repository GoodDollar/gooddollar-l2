/**
 * Unit tests for scripts/postbuild-reload-pm2.mjs
 *
 * The script runs automatically as an npm `postbuild` hook after every
 * `next build`. It reloads the PM2 `goodswap` process so the running
 * server immediately serves the freshly-built artifacts, closing the
 * defect class where stale in-memory buildId causes site-wide unstyled
 * rendering (HTTP 400 on rotated CSS hashes).
 *
 * Tracking: .autobuilder/initiatives/0002-security-hardening/tasks/
 *   0087-frontend-postbuild-auto-reload-pm2.md
 *
 * Tests use dependency injection (no vi.mock) — mirrors the convention
 * established by scripts/__tests__/check-buildid-sync.test.mjs so all
 * postbuild script tests stay consistent.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { postbuildReloadPm2 } from '../postbuild-reload-pm2.mjs'

// --- helpers -----------------------------------------------------------------

function writeBuildId(tmp, id = 'TEST_BUILD_ID') {
  mkdirSync(join(tmp, '.next'), { recursive: true })
  writeFileSync(join(tmp, '.next', 'BUILD_ID'), id)
}

function makeExecFile({
  jlistApps = [{ name: 'goodswap', pid: 1234, pm2_env: { status: 'online' } }],
  reloadOk = true,
  reloadStderr = '',
} = {}) {
  // execFileImpl(cmd, args) → { status, stdout, stderr }
  return (cmd, args) => {
    if (cmd === 'pm2' && args?.[0] === 'jlist') {
      return { status: 0, stdout: JSON.stringify(jlistApps), stderr: '' }
    }
    if (cmd === 'pm2' && args?.[0] === 'reload') {
      return reloadOk
        ? { status: 0, stdout: '', stderr: '' }
        : { status: 1, stdout: '', stderr: reloadStderr || 'reload failed' }
    }
    throw new Error(`unexpected execFile call: ${cmd} ${args?.join(' ')}`)
  }
}

function makeSpawnSync({
  syncOk = true,
  syncMessage = 'OK',
  chunksOk = true,
  chunksMessage = 'OK',
} = {}) {
  // spawnSyncImpl(cmd, args, opts) → { status, stdout, stderr }
  // Handles BOTH post-reload health probes:
  //   - check-buildid-sync.mjs (BUILD_ID drift between disk and live process)
  //   - check-served-chunks.mjs (live HTML references chunks the process
  //     can no longer return — the iter11 stale-manifest mode)
  return (cmd, args) => {
    if (cmd === 'node' && args?.[0]?.endsWith('check-buildid-sync.mjs')) {
      return syncOk
        ? { status: 0, stdout: `[check-buildid-sync] ${syncMessage}`, stderr: '' }
        : { status: 1, stdout: '', stderr: `[check-buildid-sync] ${syncMessage}` }
    }
    if (cmd === 'node' && args?.[0]?.endsWith('check-served-chunks.mjs')) {
      return chunksOk
        ? { status: 0, stdout: `[check-served-chunks] ${chunksMessage}`, stderr: '' }
        : { status: 1, stdout: '', stderr: `[check-served-chunks] ${chunksMessage}` }
    }
    throw new Error(`unexpected spawnSync call: ${cmd} ${args?.join(' ')}`)
  }
}

function makeFetch({ status = 200 } = {}) {
  return async () => ({ ok: status >= 200 && status < 300, status, text: async () => 'OK' })
}

function makeFetchSequence(...sequence) {
  // First N calls return sequence[i]; remaining calls use the last entry.
  let i = 0
  return async () => {
    const entry = sequence[Math.min(i, sequence.length - 1)]
    i++
    if (entry instanceof Error) throw entry
    return { ok: entry >= 200 && entry < 300, status: entry, text: async () => 'OK' }
  }
}

// --- fixtures ----------------------------------------------------------------

let tmp
beforeEach(() => { tmp = mkdtempSync(join(tmpdir(), 'postbuild-pm2-test-')) })
afterEach(() => { rmSync(tmp, { recursive: true, force: true }) })

// --- tests -------------------------------------------------------------------

describe('postbuild-reload-pm2', () => {
  it('happy path: PM2 present, goodswap registered, reload succeeds, sync passes → exit 0', async () => {
    writeBuildId(tmp, 'HAPPY_BUILD')

    const result = await postbuildReloadPm2({
      cwd: tmp,
      env: {},
      whichImpl: (bin) => (bin === 'pm2' ? '/usr/bin/pm2' : null),
      execFileImpl: makeExecFile(),
      spawnSyncImpl: makeSpawnSync(),
      fetchImpl: makeFetch({ status: 200 }),
      healthPollMs: 1,
      healthTimeoutMs: 100,
    })

    expect(result.exitCode).toBe(0)
    expect(result.message).toMatch(/reload(ed)? goodswap|goodswap.*reload/i)
  })

  it('PM2 not on PATH → exit 0 with skip message (CI / first-clone path)', async () => {
    writeBuildId(tmp)

    const result = await postbuildReloadPm2({
      cwd: tmp,
      env: {},
      whichImpl: () => null, // pm2 not found
      execFileImpl: () => { throw new Error('execFile should not be called') },
      spawnSyncImpl: () => { throw new Error('spawnSync should not be called') },
      fetchImpl: () => { throw new Error('fetch should not be called') },
    })

    expect(result.exitCode).toBe(0)
    expect(result.message).toMatch(/PM2 not detected/i)
    expect(result.message).toMatch(/skipping reload/i)
  })

  it('PM2 present but goodswap not registered → exit 0 with skip message', async () => {
    writeBuildId(tmp)

    const result = await postbuildReloadPm2({
      cwd: tmp,
      env: {},
      whichImpl: (bin) => (bin === 'pm2' ? '/usr/bin/pm2' : null),
      execFileImpl: makeExecFile({ jlistApps: [{ name: 'other-app' }] }),
      spawnSyncImpl: () => { throw new Error('spawnSync should not be called') },
      fetchImpl: () => { throw new Error('fetch should not be called') },
    })

    expect(result.exitCode).toBe(0)
    expect(result.message).toMatch(/goodswap.*not registered|not registered.*goodswap/i)
    expect(result.message).toMatch(/skipping reload/i)
  })

  it('PM2 goodswap cwd differs from this build cwd → exit 0 without touching production', async () => {
    writeBuildId(tmp)

    let reloadWasCalled = false
    const result = await postbuildReloadPm2({
      cwd: tmp,
      env: {},
      whichImpl: (bin) => (bin === 'pm2' ? '/usr/bin/pm2' : null),
      execFileImpl: (cmd, args) => {
        if (cmd === 'pm2' && args?.[0] === 'jlist') {
          return {
            status: 0,
            stdout: JSON.stringify([
              {
                name: 'goodswap',
                pid: 1234,
                pm2_env: { status: 'online', pm_cwd: '/srv/goodswap/frontend' },
              },
            ]),
            stderr: '',
          }
        }
        if (cmd === 'pm2' && args?.[0] === 'reload') reloadWasCalled = true
        throw new Error(`unexpected execFile call: ${cmd} ${args?.join(' ')}`)
      },
      spawnSyncImpl: () => { throw new Error('spawnSync should not be called') },
      fetchImpl: () => { throw new Error('fetch should not be called') },
    })

    expect(result.exitCode).toBe(0)
    expect(reloadWasCalled).toBe(false)
    expect(result.message).toMatch(/cwd differs/i)
    expect(result.message).toMatch(/skipping reload/i)
  })

  it('.next/BUILD_ID missing → exit 1 with `task 0087` + `next build appears to have aborted` message', async () => {
    // No .next/BUILD_ID written.
    const result = await postbuildReloadPm2({
      cwd: tmp,
      env: {},
      whichImpl: (bin) => (bin === 'pm2' ? '/usr/bin/pm2' : null),
      execFileImpl: () => { throw new Error('execFile should not be called when BUILD_ID is missing') },
      spawnSyncImpl: () => { throw new Error('spawnSync should not be called') },
      fetchImpl: () => { throw new Error('fetch should not be called') },
    })

    expect(result.exitCode).toBe(1)
    expect(result.message).toMatch(/task 0087/)
    expect(result.message).toMatch(/next build appears to have aborted/i)
  })

  it('pm2 reload exits non-zero → exit 1 with stderr forwarded and task ID', async () => {
    writeBuildId(tmp)

    const result = await postbuildReloadPm2({
      cwd: tmp,
      env: {},
      whichImpl: (bin) => (bin === 'pm2' ? '/usr/bin/pm2' : null),
      execFileImpl: makeExecFile({ reloadOk: false, reloadStderr: 'no daemon running' }),
      spawnSyncImpl: () => { throw new Error('spawnSync should not be called') },
      fetchImpl: () => { throw new Error('fetch should not be called') },
    })

    expect(result.exitCode).toBe(1)
    expect(result.message).toMatch(/pm2 reload goodswap/i)
    expect(result.message).toMatch(/no daemon running/)
    expect(result.message).toMatch(/task 0087/)
  })

  it('SKIP_PM2_RELOAD=1 → exit 0 with skip message regardless of PM2 state', async () => {
    writeBuildId(tmp)

    const result = await postbuildReloadPm2({
      cwd: tmp,
      env: { SKIP_PM2_RELOAD: '1' },
      whichImpl: () => { throw new Error('which should not be called when SKIP set') },
      execFileImpl: () => { throw new Error('execFile should not be called when SKIP set') },
      spawnSyncImpl: () => { throw new Error('spawnSync should not be called') },
      fetchImpl: () => { throw new Error('fetch should not be called') },
    })

    expect(result.exitCode).toBe(0)
    expect(result.message).toMatch(/SKIP_PM2_RELOAD/)
    expect(result.message).toMatch(/skipping reload/i)
  })

  it('health poll never reaches 200 within timeout → exit 1 with pm2 logs hint', async () => {
    writeBuildId(tmp)

    const result = await postbuildReloadPm2({
      cwd: tmp,
      env: {},
      whichImpl: (bin) => (bin === 'pm2' ? '/usr/bin/pm2' : null),
      execFileImpl: makeExecFile(),
      spawnSyncImpl: () => { throw new Error('spawnSync should not be called when health poll fails') },
      // every fetch throws ECONNREFUSED
      fetchImpl: async () => { throw new Error('ECONNREFUSED') },
      healthPollMs: 1,
      healthTimeoutMs: 20, // short timeout so test is fast
    })

    expect(result.exitCode).toBe(1)
    expect(result.message).toMatch(/health check|did not respond|timeout/i)
    expect(result.message).toMatch(/pm2 logs goodswap/i)
    expect(result.message).toMatch(/task 0087/)
  })

  it('buildid-sync check fails after reload → exit 1 forwarding sync error', async () => {
    writeBuildId(tmp)

    const result = await postbuildReloadPm2({
      cwd: tmp,
      env: {},
      whichImpl: (bin) => (bin === 'pm2' ? '/usr/bin/pm2' : null),
      execFileImpl: makeExecFile(),
      spawnSyncImpl: makeSpawnSync({ syncOk: false, syncMessage: 'FAIL: BUILD_ID drift detected' }),
      fetchImpl: makeFetch({ status: 200 }),
      healthPollMs: 1,
      healthTimeoutMs: 100,
    })

    expect(result.exitCode).toBe(1)
    expect(result.message).toMatch(/buildid|drift/i)
    expect(result.message).toMatch(/task 0087/)
  })

  it('health poll recovers after initial failures → exit 0 (process eventually binds)', async () => {
    writeBuildId(tmp)

    const result = await postbuildReloadPm2({
      cwd: tmp,
      env: {},
      whichImpl: (bin) => (bin === 'pm2' ? '/usr/bin/pm2' : null),
      execFileImpl: makeExecFile(),
      spawnSyncImpl: makeSpawnSync(),
      // first 3 fetches fail, 4th succeeds
      fetchImpl: makeFetchSequence(
        new Error('ECONNREFUSED'),
        new Error('ECONNREFUSED'),
        new Error('ECONNREFUSED'),
        200,
      ),
      healthPollMs: 1,
      healthTimeoutMs: 200,
    })

    expect(result.exitCode).toBe(0)
    expect(result.message).toMatch(/reload(ed)? goodswap|goodswap.*reload/i)
  })

  // --- iter11 chunk-sync wiring ----------------------------------------------
  // After reload, BUILD_ID parity alone is not sufficient. The live process
  // may have rolled BUILD_ID but still hold a stale in-memory chunk manifest
  // (the iter11 mode). We must ALSO run check-served-chunks.mjs --strict and
  // fail loudly if any chunk referenced by the live HTML returns non-2xx.
  //
  // Tracking: .autobuilder/initiatives/0004-testnet-readiness-gate/tasks/
  //   0022-iter11-blocker-pm2-stale-bundle-after-dev-clobber.md
  it('runs check-served-chunks --strict after buildid-sync, succeeds → exit 0', async () => {
    writeBuildId(tmp)

    let chunksWasCalled = false
    let chunksWasStrict = false
    let chunksHadLiveUrl = false
    const spawnSyncImpl = (cmd, args, opts) => {
      if (cmd === 'node' && args?.[0]?.endsWith('check-buildid-sync.mjs')) {
        return { status: 0, stdout: '[check-buildid-sync] OK', stderr: '' }
      }
      if (cmd === 'node' && args?.[0]?.endsWith('check-served-chunks.mjs')) {
        chunksWasCalled = true
        chunksWasStrict = Array.isArray(args) && args.includes('--strict')
        chunksHadLiveUrl =
          opts?.env?.NEXT_LIVE_URL === 'http://localhost:3100/'
        return { status: 0, stdout: '[check-served-chunks] OK — 12 chunks 2xx', stderr: '' }
      }
      throw new Error(`unexpected spawnSync: ${cmd} ${args?.join(' ')}`)
    }

    const result = await postbuildReloadPm2({
      cwd: tmp,
      env: {},
      whichImpl: (bin) => (bin === 'pm2' ? '/usr/bin/pm2' : null),
      execFileImpl: makeExecFile(),
      spawnSyncImpl,
      fetchImpl: makeFetch({ status: 200 }),
      healthPollMs: 1,
      healthTimeoutMs: 100,
    })

    expect(result.exitCode).toBe(0)
    expect(chunksWasCalled).toBe(true)
    expect(chunksWasStrict).toBe(true)
    expect(chunksHadLiveUrl).toBe(true)
    // OK message should surface chunk count so operators see proof.
    expect(result.message).toMatch(/chunk/i)
  })

  it('check-served-chunks fails after reload → exit 1 with task 0022 + chunk-failure context forwarded', async () => {
    writeBuildId(tmp)

    const result = await postbuildReloadPm2({
      cwd: tmp,
      env: {},
      whichImpl: (bin) => (bin === 'pm2' ? '/usr/bin/pm2' : null),
      execFileImpl: makeExecFile(),
      // buildid-sync passes, chunks fail → exact iter11 stale-manifest mode.
      spawnSyncImpl: makeSpawnSync({
        chunksOk: false,
        chunksMessage:
          'FAIL: live process is serving HTML that references chunks it cannot return\n' +
          '  /_next/static/chunks/app/predict/page-OLD.js → status 404',
      }),
      fetchImpl: makeFetch({ status: 200 }),
      healthPollMs: 1,
      healthTimeoutMs: 100,
    })

    expect(result.exitCode).toBe(1)
    expect(result.message).toMatch(/check-served-chunks|chunk/i)
    expect(result.message).toMatch(/page-OLD\.js|404/)
    // Must point operator at the task that documents this failure mode.
    expect(result.message).toMatch(/0022/)
  })

  it('check-served-chunks is NOT called when buildid-sync fails (fail-fast contract)', async () => {
    // No point running the chunk probe if BUILD_ID itself never rolled —
    // the buildid-sync error already tells the operator exactly what to fix.
    writeBuildId(tmp)

    let chunksWasCalled = false
    const spawnSyncImpl = (cmd, args) => {
      if (cmd === 'node' && args?.[0]?.endsWith('check-buildid-sync.mjs')) {
        return { status: 1, stdout: '', stderr: '[check-buildid-sync] FAIL: drift' }
      }
      if (cmd === 'node' && args?.[0]?.endsWith('check-served-chunks.mjs')) {
        chunksWasCalled = true
        return { status: 0, stdout: '[check-served-chunks] OK', stderr: '' }
      }
      throw new Error(`unexpected spawnSync: ${cmd}`)
    }

    const result = await postbuildReloadPm2({
      cwd: tmp,
      env: {},
      whichImpl: (bin) => (bin === 'pm2' ? '/usr/bin/pm2' : null),
      execFileImpl: makeExecFile(),
      spawnSyncImpl,
      fetchImpl: makeFetch({ status: 200 }),
      healthPollMs: 1,
      healthTimeoutMs: 100,
    })

    expect(result.exitCode).toBe(1)
    expect(chunksWasCalled).toBe(false)
  })
})
