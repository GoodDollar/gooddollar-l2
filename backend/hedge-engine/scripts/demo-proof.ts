/**
 * Hedge-engine demo-proof script — produces the lane's "Overall
 * Definition of Done" artifact:
 *
 *   {
 *     orderId, symbol, side, amount, timestamp,
 *     before: { onchain, etoro },
 *     after:  { onchain, etoro },
 *   }
 *
 * Reads on-chain exposure for `PROOF_SYMBOL` (default AAPL), reads
 * eToro-side positions, issues one *capped* demo open for
 * `PROOF_AMOUNT_USD` (default 25, hard-clamped to MAX_DEMO_ORDER_NOTIONAL_USD
 * so the script never moves more than the configured per-order cap), reads
 * after-state, and writes `proof.json` under
 * `.autobuilder/initiatives/0007a-etoro-connectivity/proofs/`.
 *
 * Usage:
 *   ETORO_MODE=demo-trading \
 *   HEDGE_TRADING_ENABLED=true \
 *   ETORO_DEMO_KEY=… ETORO_DEMO_SECRET=… ETORO_DEMO_USER_KEY=… \
 *   RISK_ENGINE_ADDRESS=0x… RPC_URL=https://… \
 *   PROOF_SYMBOL=AAPL PROOF_AMOUNT_USD=25 \
 *   node -r ts-node/register backend/hedge-engine/scripts/demo-proof.ts
 *
 * Exits non-zero on any failure; the failure mode is also recorded in
 * the proof JSON so a post-mortem has the full pre/post snapshot.
 */
import { mkdirSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import {
  createEtoroClient,
  loadDemoCapConfig,
  resolveMode,
} from '@goodchain/etoro-client';
import { ExposureReader } from '../src/exposure-reader';
import { createEtoroBackedAdapter } from '../src/etoro-adapter';
import { EtoroAdapter } from '../src/hedge-executor';

interface ProofSide {
  onchainNetDelta: number;
  onchainBlockNumber: number;
  etoroPositions: Array<{
    positionId: string;
    symbol: string;
    side: 'buy' | 'sell';
    amount: number;
  }>;
}

interface ProofArtifact {
  orderId: string;
  symbol: string;
  side: 'buy' | 'sell';
  amount: number;
  timestamp: number;
  mode: string;
  before: ProofSide;
  after: ProofSide;
  error?: string;
}

const PROOF_DIR = resolve(
  __dirname,
  '..',
  '..',
  '..',
  '.autobuilder',
  'initiatives',
  '0007a-etoro-connectivity',
  'proofs',
);

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    console.error(`[demo-proof] missing required env var: ${name}`);
    process.exit(2);
  }
  return v;
}

async function snapshotSide(
  reader: ExposureReader,
  adapter: EtoroAdapter,
  symbol: string,
): Promise<ProofSide> {
  const [onchain, etoroPositions] = await Promise.all([
    reader.getExposure(symbol),
    adapter.getPositions(),
  ]);
  return {
    onchainNetDelta: onchain.netDelta,
    onchainBlockNumber: onchain.blockNumber,
    etoroPositions,
  };
}

function writeProof(artifact: ProofArtifact): string {
  mkdirSync(PROOF_DIR, { recursive: true });
  const stamp = new Date(artifact.timestamp).toISOString().replace(/[:.]/g, '-');
  const path = resolve(PROOF_DIR, `hedge-proof-${stamp}.json`);
  writeFileSync(path, JSON.stringify(artifact, null, 2));
  return path;
}

async function main(): Promise<void> {
  const mode = resolveMode();
  if (mode !== 'demo-trading' || process.env.HEDGE_TRADING_ENABLED !== 'true') {
    console.error(
      '[demo-proof] refusing to run: requires ETORO_MODE=demo-trading and ' +
      'HEDGE_TRADING_ENABLED=true. Current mode=' + mode +
      ', HEDGE_TRADING_ENABLED=' + (process.env.HEDGE_TRADING_ENABLED ?? '<unset>'),
    );
    process.exit(2);
  }

  const symbol = process.env.PROOF_SYMBOL ?? 'AAPL';
  const requestedAmount = Number(process.env.PROOF_AMOUNT_USD ?? '25');
  const caps = loadDemoCapConfig();
  const amount = Math.min(requestedAmount, caps.maxOrderNotionalUsd);
  if (!Number.isFinite(amount) || amount <= 0) {
    console.error(`[demo-proof] invalid amount: ${amount}`);
    process.exit(2);
  }

  const riskEngineAddress = requireEnv('RISK_ENGINE_ADDRESS');
  const rpcUrl = process.env.RPC_URL ?? 'http://localhost:8545';
  requireEnv('ETORO_DEMO_KEY');
  requireEnv('ETORO_DEMO_USER_KEY');

  const client = createEtoroClient();
  const adapter = createEtoroBackedAdapter(client);
  const reader = new ExposureReader(rpcUrl, riskEngineAddress);

  // The proof script runs without bootstrapping the SDK's instrument
  // resolver; operators pin the eToro `instrumentId` via env so the
  // script is independent of `/market-data/search` reachability.
  const instrumentId = requireEnv('PROOF_INSTRUMENT_ID');

  const before = await snapshotSide(reader, adapter, symbol);

  const timestamp = Date.now();
  let orderId = '';
  let error: string | undefined;
  try {
    const result = await adapter.openPosition({
      symbol,
      instrumentId,
      side: 'buy',
      amount,
    });
    orderId = result.orderId;
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
  }

  const after = await snapshotSide(reader, adapter, symbol);

  const artifact: ProofArtifact = {
    orderId,
    symbol,
    side: 'buy',
    amount,
    timestamp,
    mode,
    before,
    after,
    ...(error ? { error } : {}),
  };

  const path = writeProof(artifact);
  console.log(`[demo-proof] wrote ${path}`);
  if (error) {
    console.error(`[demo-proof] demo open failed: ${error}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error('[demo-proof] fatal:', err);
    process.exit(1);
  });
}
