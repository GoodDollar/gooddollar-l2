/**
 * Compile-time safety fence for the hedge-engine.
 *
 * Spec invariant:
 *   REAL_TRADING_ENABLED must be hardcoded false.
 *   There must be NO environment variable that flips it to true.
 *
 * If a future change-of-direction ever needs to enable real trading, this
 * file is the only place it can happen — and the change MUST come with a
 * matching test flip below, producing a visible diff for code review.
 */

export const REAL_TRADING_ENABLED = false as const;

/**
 * Modes the fence understands. Anything else is collapsed to `<unknown>`
 * in error messages to prevent log injection / credential leakage via the
 * mode argument.
 */
const KNOWN_MODES = new Set(['sandbox', 'real', 'demo']);

export type TradeFenceMode = 'sandbox' | 'real' | 'demo' | string;

export interface TradeFenceInput {
  mode: TradeFenceMode;
  dryRun: boolean;
}

export class RealTradingFenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RealTradingFenceError';
  }
}

/**
 * Throw unless it is safe to open eToro orders from this process.
 *
 * Rules:
 *  - Dry-run paths are always safe (no orders leave the process).
 *  - With REAL_TRADING_ENABLED === false (the only allowed value), the
 *    only mode that may open orders is `demo`. Sandbox and real both
 *    throw — sandbox to keep the demo label authoritative, real to
 *    enforce the spec's hard prohibition on live-account paths.
 */
export function assertTradeFence(input: TradeFenceInput): void {
  if (input.dryRun) return;

  if (REAL_TRADING_ENABLED) {
    // Unreachable while the const above is `false`. Kept as a defensive
    // branch so a future flip needs both a value AND a logic change.
    return;
  }

  if (input.mode === 'demo') return;

  const safeMode = KNOWN_MODES.has(input.mode) ? input.mode : '<unknown>';
  throw new RealTradingFenceError(
    `Refusing to enable trading: ETORO_MODE='${safeMode}' is not 'demo' ` +
      'and REAL_TRADING_ENABLED is hardcoded false',
  );
}
