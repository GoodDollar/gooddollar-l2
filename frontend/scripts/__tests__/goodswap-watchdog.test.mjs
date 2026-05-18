/**
 * Unit tests for the pure decision function in scripts/goodswap-watchdog.mjs.
 *
 * The watchdog itself has side effects (HTTP probes, `pm2 reload`, sleeps),
 * but `evaluateState` is a pure function that maps a probe result + state +
 * config + clock to the next state and the action to take. We test it in
 * isolation so the streak/threshold/cooldown semantics are pinned down.
 *
 * Tracking: .autobuilder/initiatives/0004-testnet-readiness-gate/tasks/
 *   0029-iter19-blocker-playwright-clobber-recurrence-3-distdir-isolation.md
 */

import { describe, it, expect } from 'vitest'
import { evaluateState } from '../goodswap-watchdog.mjs'

const cfg = Object.freeze({
  failureThreshold: 3,
  reloadCooldownMs: 300_000, // 5 min
})

describe('evaluateState', () => {
  it('healthy probe resets streak to 0', () => {
    const r = evaluateState({
      probeOk: true,
      probeReason: null,
      state: { streak: 2, lastReloadAtMs: 0 },
      cfg,
      nowMs: 1_000_000,
    })
    expect(r.action).toBe('none')
    expect(r.nextState.streak).toBe(0)
    expect(r.nextState.lastReloadAtMs).toBe(0) // preserved
  })

  it('healthy probe preserves a non-zero lastReloadAtMs', () => {
    const r = evaluateState({
      probeOk: true,
      probeReason: null,
      state: { streak: 0, lastReloadAtMs: 555 },
      cfg,
      nowMs: 1_000_000,
    })
    expect(r.nextState.lastReloadAtMs).toBe(555)
  })

  it('one failure below threshold → streak increments, no action', () => {
    const r = evaluateState({
      probeOk: false,
      probeReason: 'chunk-failure',
      state: { streak: 0, lastReloadAtMs: 0 },
      cfg,
      nowMs: 1_000_000,
    })
    expect(r.action).toBe('reload-throttled')
    expect(r.suppressedBy).toBe('below-threshold')
    expect(r.nextState.streak).toBe(1)
  })

  it('two failures below threshold → streak=2, still no reload', () => {
    const r = evaluateState({
      probeOk: false,
      probeReason: 'unreachable',
      state: { streak: 1, lastReloadAtMs: 0 },
      cfg,
      nowMs: 1_000_000,
    })
    expect(r.action).toBe('reload-throttled')
    expect(r.suppressedBy).toBe('below-threshold')
    expect(r.nextState.streak).toBe(2)
  })

  it('failure that crosses threshold AND no prior reload → fires reload, streak resets', () => {
    const nowMs = 1_000_000
    const r = evaluateState({
      probeOk: false,
      probeReason: 'chunk-failure',
      state: { streak: 2, lastReloadAtMs: 0 },
      cfg,
      nowMs,
    })
    expect(r.action).toBe('reload')
    // After firing, streak resets so we start counting fresh against
    // post-reload probes.
    expect(r.nextState.streak).toBe(0)
    expect(r.nextState.lastReloadAtMs).toBe(nowMs)
  })

  it('failure at threshold within cooldown → suppressed by cooldown, streak capped', () => {
    const cooldown = cfg.reloadCooldownMs
    const lastReloadAtMs = 1_000_000
    const nowMs = lastReloadAtMs + cooldown - 1 // 1ms before cooldown elapses
    const r = evaluateState({
      probeOk: false,
      probeReason: 'chunk-failure',
      state: { streak: 2, lastReloadAtMs },
      cfg,
      nowMs,
    })
    expect(r.action).toBe('reload-throttled')
    expect(r.suppressedBy).toBe('cooldown')
    // Streak is capped at threshold so it doesn't grow unbounded while
    // we wait for the cooldown to elapse.
    expect(r.nextState.streak).toBe(cfg.failureThreshold)
    expect(r.nextState.lastReloadAtMs).toBe(lastReloadAtMs)
  })

  it('failure exactly when cooldown elapses → fires reload', () => {
    const lastReloadAtMs = 1_000_000
    const nowMs = lastReloadAtMs + cfg.reloadCooldownMs // boundary
    const r = evaluateState({
      probeOk: false,
      probeReason: 'unreachable',
      state: { streak: 2, lastReloadAtMs },
      cfg,
      nowMs,
    })
    expect(r.action).toBe('reload')
    expect(r.nextState.lastReloadAtMs).toBe(nowMs)
  })

  it('sustained outage during cooldown → streak caps at threshold, no extra reload', () => {
    const lastReloadAtMs = 1_000_000
    // Start with a recent reload; we will tick probes every 30s for 4 minutes,
    // which is well inside the 5-minute cooldown.
    let state = { streak: 0, lastReloadAtMs }
    let r
    for (let i = 1; i <= 8; i++) {
      r = evaluateState({
        probeOk: false,
        probeReason: 'chunk-failure',
        state,
        cfg,
        nowMs: lastReloadAtMs + i * 30_000, // 30s, 60s, …, 240s (all < 300s)
      })
      state = r.nextState
    }
    // No second reload fired during the cooldown window.
    expect(state.lastReloadAtMs).toBe(lastReloadAtMs)
    // Streak plateaus at threshold (the cap) rather than growing unbounded.
    expect(state.streak).toBe(cfg.failureThreshold)
    expect(r.action).toBe('reload-throttled')
    expect(r.suppressedBy).toBe('cooldown')
  })

  it('long sustained outage → reloads at cooldown cadence, never faster', () => {
    // Walk minute-by-minute for 15 minutes with all-failing probes and verify
    // that the cooldown cap actually paces reloads. With cooldown=5min and
    // threshold=3, the watchdog should fire at most once per ~5 minutes.
    const t0 = 1_000_000
    let state = { streak: 0, lastReloadAtMs: 0 }
    let reloadCount = 0
    let lastReloadFiredAt = -Infinity
    for (let minute = 1; minute <= 15; minute++) {
      const nowMs = t0 + minute * 60_000
      const r = evaluateState({
        probeOk: false,
        probeReason: 'chunk-failure',
        state,
        cfg,
        nowMs,
      })
      state = r.nextState
      if (r.action === 'reload') {
        // Each reload must respect the cooldown gap relative to the prior one.
        expect(nowMs - lastReloadFiredAt).toBeGreaterThanOrEqual(cfg.reloadCooldownMs)
        lastReloadFiredAt = nowMs
        reloadCount++
      }
    }
    // 15 minutes / 5-min cooldown ≈ 3 reloads, bounded.
    expect(reloadCount).toBeGreaterThanOrEqual(1)
    expect(reloadCount).toBeLessThanOrEqual(4)
  })

  it('healthy probe after a triggered reload preserves lastReloadAtMs', () => {
    // Sequence: reload fires at t=1M, then immediately a healthy probe at t=1M+30s.
    const nowReload = 1_000_000
    const r1 = evaluateState({
      probeOk: false,
      probeReason: 'chunk-failure',
      state: { streak: 2, lastReloadAtMs: 0 },
      cfg,
      nowMs: nowReload,
    })
    expect(r1.action).toBe('reload')
    expect(r1.nextState.lastReloadAtMs).toBe(nowReload)

    const r2 = evaluateState({
      probeOk: true,
      probeReason: null,
      state: r1.nextState,
      cfg,
      nowMs: nowReload + 30_000,
    })
    expect(r2.action).toBe('none')
    expect(r2.nextState.streak).toBe(0)
    expect(r2.nextState.lastReloadAtMs).toBe(nowReload)
  })

  it('flap pattern (fail, ok, fail, ok, fail, ok) never accumulates streak', () => {
    let state = { streak: 0, lastReloadAtMs: 0 }
    const seq = [false, true, false, true, false, true]
    for (const ok of seq) {
      const r = evaluateState({
        probeOk: ok,
        probeReason: ok ? null : 'chunk-failure',
        state,
        cfg,
        nowMs: 1_000_000,
      })
      state = r.nextState
      // After any healthy probe the streak should immediately drop to 0.
      if (ok) expect(state.streak).toBe(0)
    }
    expect(state.lastReloadAtMs).toBe(0) // no reload ever fired
  })
})
