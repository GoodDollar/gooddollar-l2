import { EtoroAdapter } from './hedge-executor';

/**
 * Hedge-engine mock adapter. Returns deterministic
 * `mock-<SYMBOL>-<sequence>` order IDs (per-instance counter) and maintains
 * a small in-memory position book so unit tests and `mock`-mode dev runs
 * exercise the full `openPosition` → `getPositions` → `closePosition`
 * lifecycle without touching eToro or the network.
 *
 * Replaces the deleted `createPlaceholderAdapter`'s `sim-<Date.now()>` /
 * `console.log` / `getPositions(): []` semantics — those were a TODO
 * masquerading as production code; this is the explicit mock surface.
 */
export interface MockAdapter extends EtoroAdapter {
  /** Test-only: number of `openPosition` calls served. */
  openCount(): number;
  /** Test-only: number of `closePosition` calls served. */
  closeCount(): number;
  /** Test-only: reset sequence + position book. */
  reset(): void;
}

interface MockPositionRecord {
  positionId: string;
  symbol: string;
  side: 'buy' | 'sell';
  amount: number;
}

export function createMockAdapter(): MockAdapter {
  const sequenceBySymbol = new Map<string, number>();
  const positions = new Map<string, MockPositionRecord>();
  let opens = 0;
  let closes = 0;

  const nextSequence = (symbol: string): number => {
    const next = (sequenceBySymbol.get(symbol) ?? 0) + 1;
    sequenceBySymbol.set(symbol, next);
    return next;
  };

  return {
    async openPosition(params) {
      opens += 1;
      const seq = nextSequence(params.symbol);
      const orderId = `mock-${params.symbol}-${seq}`;
      const positionId = `mock-pos-${params.symbol}-${seq}`;
      positions.set(positionId, {
        positionId,
        symbol: params.symbol,
        side: params.side,
        amount: params.amount,
      });
      return { orderId, status: 'filled' };
    },
    async closePosition(positionId) {
      closes += 1;
      positions.delete(positionId);
      return { orderId: `mock-close-${positionId}` };
    },
    async getPositions() {
      return [...positions.values()];
    },
    openCount: () => opens,
    closeCount: () => closes,
    reset: () => {
      sequenceBySymbol.clear();
      positions.clear();
      opens = 0;
      closes = 0;
    },
  };
}
