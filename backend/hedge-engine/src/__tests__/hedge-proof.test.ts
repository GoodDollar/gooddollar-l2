import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  HedgeProofRecorder,
  HedgeProof,
  NO_OP_ORDER_ID,
  isNoOpProof,
  newProofRunId,
} from '../hedge-proof';

function makeProof(overrides: Partial<HedgeProof> = {}): HedgeProof {
  return {
    runId: 'test-run-1',
    orderId: 'ord-abc',
    symbol: 'AAPL',
    side: 'buy',
    notionalUsd: 42,
    timestamp: 1_750_000_000_000,
    beforeExposure: { netDelta: 100, absExposure: 100, blockNumber: 1 },
    afterExposure: { netDelta: 60, absExposure: 60, blockNumber: 2 },
    dryRun: true,
    etoroMode: 'sandbox',
    realTradingEnabled: false,
    ...overrides,
  };
}

describe('newProofRunId', () => {
  it('returns a unique runId per call', () => {
    const a = newProofRunId();
    const b = newProofRunId();
    expect(a).not.toBe(b);
    expect(a).toMatch(/^\d{4}-\d{2}-\d{2}/);
  });
});

describe('NO_OP_ORDER_ID', () => {
  it('is exactly "no-op" — rename guard for the frontend mirror', () => {
    expect(NO_OP_ORDER_ID).toBe('no-op');
  });
});

describe('isNoOpProof', () => {
  function noOpProof(overrides: Partial<HedgeProof> = {}): HedgeProof {
    return makeProof({
      orderId: NO_OP_ORDER_ID,
      notionalUsd: 0,
      beforeExposure: { netDelta: 100, absExposure: 100, blockNumber: 5 },
      afterExposure: { netDelta: 100, absExposure: 100, blockNumber: 5 },
      ...overrides,
    });
  }

  it('returns true on the canonical sentinel shape', () => {
    expect(isNoOpProof(noOpProof())).toBe(true);
  });

  it('returns false when orderId is not the sentinel', () => {
    expect(isNoOpProof(noOpProof({ orderId: 'real-order-1' }))).toBe(false);
  });

  it('returns false when notionalUsd is non-zero', () => {
    expect(isNoOpProof(noOpProof({ notionalUsd: 12.5 }))).toBe(false);
  });

  it('returns false when before/after blockNumber differ', () => {
    expect(
      isNoOpProof(
        noOpProof({
          afterExposure: { netDelta: 100, absExposure: 100, blockNumber: 6 },
        }),
      ),
    ).toBe(false);
  });

  it('returns false when before/after netDelta differ', () => {
    expect(
      isNoOpProof(
        noOpProof({
          afterExposure: { netDelta: 110, absExposure: 110, blockNumber: 5 },
        }),
      ),
    ).toBe(false);
  });
});

describe('HedgeProofRecorder', () => {
  let dir: string;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hedge-proof-'));
  });

  afterEach(() => {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
    } catch {
      // best effort
    }
  });

  it('write() emits a per-runId JSON file with the exact schema', async () => {
    const recorder = new HedgeProofRecorder(dir);
    const proof = makeProof();
    const file = await recorder.write(proof);
    expect(fs.existsSync(file)).toBe(true);
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
    expect(parsed.runId).toBe('test-run-1');
    expect(parsed.orderId).toBe('ord-abc');
    expect(parsed.beforeExposure).toEqual({ netDelta: 100, absExposure: 100, blockNumber: 1 });
    expect(parsed.afterExposure).toEqual({ netDelta: 60, absExposure: 60, blockNumber: 2 });
    expect(parsed.realTradingEnabled).toBe(false);
  });

  it('write() also updates latest.json with the most recent proof', async () => {
    const recorder = new HedgeProofRecorder(dir);
    await recorder.write(makeProof({ runId: 'older', orderId: 'old-id' }));
    await recorder.write(makeProof({ runId: 'newer', orderId: 'new-id' }));

    const latestPath = path.join(dir, 'latest.json');
    const latest = JSON.parse(fs.readFileSync(latestPath, 'utf8'));
    expect(latest.runId).toBe('newer');
    expect(latest.orderId).toBe('new-id');
  });

  it('getLatest() returns the parsed proof from latest.json', async () => {
    const recorder = new HedgeProofRecorder(dir);
    await recorder.write(makeProof({ runId: 'newest', orderId: 'final-id' }));
    const latest = await recorder.getLatest();
    expect(latest).not.toBeNull();
    expect(latest!.orderId).toBe('final-id');
    expect(latest!.realTradingEnabled).toBe(false);
  });

  it('getLatest() returns null when latest.json is absent', async () => {
    const recorder = new HedgeProofRecorder(dir);
    expect(await recorder.getLatest()).toBeNull();
  });

  it('runId is sanitized into the filename (no path traversal)', async () => {
    const recorder = new HedgeProofRecorder(dir);
    const file = await recorder.write(makeProof({ runId: '../../../oops' }));
    expect(file.startsWith(dir)).toBe(true);
    expect(path.basename(file)).not.toContain('/');
    expect(path.basename(file)).not.toContain('..');
  });
});
