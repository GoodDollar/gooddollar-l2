import { EtoroClient, EtoroMode } from '@goodchain/etoro-client';
import { EtoroAdapter } from './hedge-executor';
import { createMockAdapter } from './mock-adapter';
import { createEtoroBackedAdapter, createReadOnlyAdapter } from './etoro-adapter';

/** Pre-resolved selection of which adapter to use and whether to run the executor loop. */
export interface AdapterSelection {
  adapter: EtoroAdapter;
  /** True when the mode disallows mutating eToro state — main() skips `executor.executeAll`. */
  readOnly: boolean;
  /** Audit-only reason, surfaced in logs + SERVICE_DISABLED_REASON when readOnly. */
  reason?: string;
}

/** Factory for `EtoroClient`, injectable so tests can stub the SDK without booting axios. */
export type EtoroClientFactory = () => EtoroClient;

export interface SelectAdapterInput {
  mode: EtoroMode;
  /** Derived in `loadConfig`: `mode === 'demo-trading' && HEDGE_TRADING_ENABLED === 'true'`. */
  tradingEnabled: boolean;
  /** Lazy SDK factory — only invoked in the `demo-trading` + enabled branch. */
  clientFactory: EtoroClientFactory;
}

/**
 * Mode-gated adapter selection for hedge-engine startup.
 *
 *  - `mock`            → in-process MockAdapter (deterministic IDs).
 *  - `demo-trading` + tradingEnabled → EtoroClient-backed adapter,
 *                                     mutations land on the official
 *                                     `/trading/execution/demo/*` endpoints.
 *  - `demo-trading` + !tradingEnabled → read-only (HEDGE_TRADING_ENABLED missing).
 *  - `demo-readonly`   → read-only (mode forbids trading).
 *  - `real-disabled`   → read-only (lane-1 fence).
 *
 * Every read-only branch returns the same sentinel adapter that throws
 * `ReadOnlyAdapterError` on mutation, so a future code path that bypasses
 * the `readOnly` flag still fails closed at the adapter boundary.
 */
export function selectAdapter(input: SelectAdapterInput): AdapterSelection {
  switch (input.mode) {
    case 'mock':
      return { adapter: createMockAdapter(), readOnly: false };
    case 'demo-trading':
      if (input.tradingEnabled) {
        return { adapter: createEtoroBackedAdapter(input.clientFactory()), readOnly: false };
      }
      return {
        adapter: createReadOnlyAdapter(),
        readOnly: true,
        reason: 'HEDGE_TRADING_ENABLED required for demo-trading',
      };
    case 'demo-readonly':
      return {
        adapter: createReadOnlyAdapter(),
        readOnly: true,
        reason: 'ETORO_MODE=demo-readonly — hedge executor disabled',
      };
    case 'real-disabled':
      return {
        adapter: createReadOnlyAdapter(),
        readOnly: true,
        reason: 'ETORO_MODE=real-disabled — hedge executor disabled (lane-1 fence)',
      };
    default: {
      const exhaustive: never = input.mode;
      throw new Error(`selectAdapter: unhandled mode ${String(exhaustive)}`);
    }
  }
}
