/**
 * sparklineSeed — deterministic synthetic 7-day price series.
 *
 * Task `0001-gooddollar-l2/0072-explore-sparkline-charts` already approved a
 * seeded-synthetic approach for the Explore page's 7d Trend column. This
 * helper exists so the data layer can pass a meaningful series into the
 * existing `<Sparkline>` component instead of `null` (which renders the
 * faint dashed "unavailable" placeholder).
 *
 * TODO(post-testnet): replace with real indexer-backed 7d history.
 *
 * Notes
 * - Pure, deterministic per `symbol` so re-renders produce identical points
 *   (no flicker when switching tabs).
 * - The last point equals `currentPrice` so the rightmost edge of the chart
 *   matches the price shown in the same row.
 * - Direction bias follows `change24h`'s sign so the chart roughly agrees
 *   with the 24h percentage shown next to it.
 * - Returns `null` for unusable inputs so callers can keep the dashed
 *   placeholder instead of plotting a flat line of zeros.
 */

const POINTS = 7

/** 32-bit hash of the symbol string — pure, no deps. */
function hashSymbol(symbol: string): number {
  let h = 2166136261 >>> 0 // FNV offset basis
  for (let i = 0; i < symbol.length; i++) {
    h ^= symbol.charCodeAt(i)
    h = Math.imul(h, 16777619) >>> 0 // FNV prime
  }
  // Avoid the (unlikely) zero seed which makes mulberry32 produce a slow
  // ramp instead of a random-looking sequence.
  return h === 0 ? 0xdeadbeef : h
}

/** mulberry32 — fast, deterministic 32-bit PRNG in [0, 1). */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return function () {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Generate a deterministic 7-point synthetic 7-day price series ending at
 * `currentPrice`.
 *
 * @param symbol      Token ticker — used as the PRNG seed.
 * @param currentPrice Live USD price; must be > 0 and finite or we return null.
 * @param change24h   Last 24h percent change. Used as a directional bias for
 *                    the drift. `null` is treated as `0` (no bias).
 * @returns Array of 7 positive numbers, last element === `currentPrice`, or
 *          `null` when `currentPrice` is unusable.
 */
export function generateSeededSparkline(
  symbol: string,
  currentPrice: number,
  change24h: number | null,
): number[] | null {
  if (!Number.isFinite(currentPrice) || currentPrice <= 0) return null

  const rng = mulberry32(hashSymbol(symbol))

  // Per-step drift: spread the 24h change across the 7 days, scaled up
  // modestly so the line is visually responsive. Capped to avoid silly
  // swings on extreme inputs.
  const change = change24h ?? 0
  const driftPerStep = Math.max(-0.05, Math.min(0.05, (change / 100) * 0.5))

  // Per-step random noise — small relative to the drift.
  const noiseAmplitude = 0.015 // ±1.5% per step

  // Walk backward from today so the last value is exactly currentPrice.
  const series: number[] = new Array<number>(POINTS)
  series[POINTS - 1] = currentPrice
  for (let i = POINTS - 2; i >= 0; i--) {
    const noise = (rng() - 0.5) * 2 * noiseAmplitude
    // previous = next / (1 + driftPerStep + noise) — undo one step of drift
    const factor = 1 + driftPerStep + noise
    // Guard against pathological factors (very unlikely with the caps above).
    const safeFactor = factor > 0.5 && factor < 1.5 ? factor : 1 + driftPerStep
    const prev = series[i + 1] / safeFactor
    series[i] = prev
  }

  return series
}
