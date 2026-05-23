import fs from 'fs';
import os from 'os';
import path from 'path';
import { REAL_TRADING_ENABLED, EtoroClient } from '../../../etoro-client/src';
import { DeltaCalculator } from '../../../hedge-engine/src/delta-calculator';
import { HedgeEngine } from '../../../hedge-engine/src/engine';
import { ExposureReader } from '../../../hedge-engine/src/exposure-reader';
import { HedgeExecutor } from '../../../hedge-engine/src/hedge-executor';
import { HedgeProofRecorder } from '../../../hedge-engine/src/hedge-proof';
import { createMockEtoro } from '../mock-etoro-server';
import { writeEvidence } from '../evidence';
import { getRunId } from '../run-id';

describe('Lane 6 / hedge-dryrun — dry-run hedge produces a proof and never hits /trading', () => {
  it('REAL_TRADING_ENABLED is hardcoded false (precondition)', () => {
    expect(REAL_TRADING_ENABLED).toBe(false);
  });

  it('HedgeEngine.runOnce in dry-run writes a HedgeProof with orderId="dry-run" and NO order on mock', async () => {
    const runId = getRunId();
    const t0 = Date.now();

    const client = new EtoroClient({
      credentials: {
        mode: 'sandbox',
        apiKey: 'sandbox-test-key',
        apiSecret: 'sandbox-test-secret',
        baseUrl: 'https://mock.etoro.local/sapi',
      },
    });
    const mock = createMockEtoro({ axios: client.getHttpClient() });

    const adapter = {
      async openPosition(p: { symbol: string; instrumentId: string; side: 'buy' | 'sell'; amount: number }) {
        const r = await client.trading.openPosition(p);
        return { orderId: r.orderId, status: r.status };
      },
      async closePosition(positionId: string) {
        const r = await client.trading.closePosition(positionId);
        return { orderId: r.orderId };
      },
      async getPositions() {
        const ps = await client.trading.getOpenPositions();
        return ps.map((p) => ({
          positionId: p.positionId,
          symbol: p.symbol,
          side: p.side,
          amount: p.amount,
        }));
      },
    };

    // Stub reader: 10_000 USD net delta before, 0 after.
    const reader = {
      async getExposure(symbol: string) {
        return { symbol, netDelta: 10_000, absExposure: 10_000, blockNumber: 42, readTimestamp: Date.now() };
      },
      async getAllExposures() {
        return [{ symbol: 'AAPL', netDelta: 10_000, absExposure: 10_000, blockNumber: 42, readTimestamp: Date.now() }];
      },
    } as unknown as ExposureReader;

    const calculator = new DeltaCalculator({ deltaThresholdUsd: 5_000, deltaThresholdPct: 2 });
    const instrumentMap = new Map([['AAPL', 'INST-AAPL']]);
    const executor = new HedgeExecutor(adapter, instrumentMap, {
      dryRun: true,
      safetyMode: 'sandbox',
    });
    const engine = new HedgeEngine(reader, calculator, executor, {
      rpcUrl: 'mock',
      riskEngineAddress: '0x0',
      symbols: ['AAPL'],
      deltaThresholdUsd: 5_000,
      deltaThresholdPct: 2,
      pollIntervalMs: 30_000,
      dryRun: true,
    });

    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'qa-hedge-proof-'));
    const recorder = new HedgeProofRecorder(tmp);
    const proof = await engine.runOnce('AAPL', { recorder, etoroMode: 'sandbox' });

    const latestExists = fs.existsSync(path.join(tmp, 'latest.json'));

    const ok =
      proof.orderId === 'dry-run' &&
      proof.dryRun === true &&
      proof.realTradingEnabled === false &&
      proof.beforeExposure.netDelta === 10_000 &&
      mock.orders.length === 0 &&
      latestExists;

    writeEvidence({
      check: '06-hedge-dryrun',
      ok,
      runId,
      details: {
        durationMs: Date.now() - t0,
        proof,
        mockOrderCount: mock.orders.length,
        proofDir: tmp,
        realTradingEnabled: REAL_TRADING_ENABLED,
      },
    });

    fs.rmSync(tmp, { recursive: true, force: true });
    mock.stop();

    expect(proof.orderId).toBe('dry-run');
    expect(proof.dryRun).toBe(true);
    expect(proof.realTradingEnabled).toBe(false);
    expect(mock.orders).toHaveLength(0);
    expect(latestExists).toBe(true);
  });
});
