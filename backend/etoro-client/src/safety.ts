import { EtoroMode } from './types';

/**
 * Hardcoded build-time safety constant.
 *
 * This worktree (Lane 6) is the QA / proof / release gate. It must NEVER
 * place a real-money order, regardless of how environment variables are set.
 *
 * `REAL_TRADING_ENABLED` is intentionally typed `false` (literal) so that any
 * code path that gates on `=== true` is type-unreachable. Flipping it
 * requires a source edit AND recompile — env tampering alone cannot do it.
 *
 * Do NOT change this constant in this lane. Real-mode work happens in a
 * different worktree with its own review process.
 */
export const REAL_TRADING_ENABLED: false = false;

export class RealTradingDisabledError extends Error {
  readonly code = 'REAL_TRADING_DISABLED' as const;

  constructor(message: string) {
    super(message);
    this.name = 'RealTradingDisabledError';
  }
}

/**
 * Throw if the caller is about to perform a real-money trading operation
 * while the source-level fence (`REAL_TRADING_ENABLED`) is `false`.
 *
 * The check uses the literal constant — not an env read — so this fence
 * survives a hostile `.env`.
 */
export function assertDemoModeOrThrow(mode: EtoroMode | string): void {
  if (mode === 'real' && (REAL_TRADING_ENABLED as boolean) !== true) {
    throw new RealTradingDisabledError(
      'Refusing real-mode trading: REAL_TRADING_ENABLED is hardcoded `false` ' +
        'in backend/etoro-client/src/safety.ts. Flipping requires a source ' +
        'edit + recompile, not env vars.',
    );
  }
}

/**
 * Returns `true` only if the source fence allows real trading. Always `false`
 * in this worktree. Use this in callers that need to gate optional code paths.
 */
export function isRealTradingEnabled(): boolean {
  return (REAL_TRADING_ENABLED as boolean) === true;
}
