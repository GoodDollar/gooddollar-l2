/**
 * In-memory proof store. Keeps the last N successful submissions per rail
 * so the `/proof` HTTP endpoint and the frontend status API can render
 * "most recent on-chain proof per rail" without reading the chain again.
 *
 * Pure / synchronous / no I/O — testable in isolation.
 */

export type RailName = 'stocks' | 'crypto';

export interface ProofEntryInput {
  txHash: string;
  blockNumber: number;
  /** gasUsed serialised as a decimal string so JSON consumers don't have to deal with BigInt. */
  gasUsed: string;
  symbols: string[];
  roundTripMs: number;
  submittedAtMs: number;
  /** Off-chain mid prices used to build the batch, keyed by symbol. */
  mids: Record<string, number>;
}

export interface ProofEntry extends ProofEntryInput {
  rail: RailName;
}

export interface ProofSnapshot {
  generatedAt: number;
  stocks: ProofEntry[];
  crypto: ProofEntry[];
}

export const DEFAULT_PROOF_CAPACITY = 50;

export class ProofStore {
  private readonly capacity: number;
  private readonly rails: Record<RailName, ProofEntry[]> = { stocks: [], crypto: [] };

  constructor(capacity: number = DEFAULT_PROOF_CAPACITY) {
    this.capacity = Math.max(1, Math.floor(capacity));
  }

  record(rail: RailName, entry: ProofEntryInput): void {
    const arr = this.rails[rail];
    arr.push({ ...entry, rail });
    // Bound the buffer. Push-then-trim keeps semantics simple; capacity is small.
    while (arr.length > this.capacity) arr.shift();
  }

  snapshot(): ProofSnapshot {
    return {
      generatedAt: Date.now(),
      stocks: this.rails.stocks.slice().reverse(),
      crypto: this.rails.crypto.slice().reverse(),
    };
  }
}
