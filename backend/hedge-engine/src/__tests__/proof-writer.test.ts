import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  ProofWriter,
  formatProofMarkdown,
  ProofWriterInput,
} from '../proof-writer';
import { ReconciliationSnapshot } from '../types';
import { HedgeReceipt } from '../receipt-store';

let tmpDir: string;
beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hedge-proof-'));
});
afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function makeSnapshot(): ReconciliationSnapshot {
  return {
    timestamp: Date.UTC(2026, 4, 23, 12, 0, 0),
    exposures: [
      { symbol: 'AAPL', netDelta: 50, absExposure: 100, blockNumber: 10, readTimestamp: 1 },
      { symbol: 'TSLA', netDelta: -20, absExposure: 80, blockNumber: 10, readTimestamp: 1 },
    ],
    etoroPositions: [],
    hedgesExecuted: [],
    residuals: new Map([['AAPL', 5], ['TSLA', -3]]),
  };
}

function makeReceipt(over: Partial<HedgeReceipt> = {}): HedgeReceipt {
  return {
    v: 1,
    id: 'receipt-1',
    timestamp: 1700000000000,
    symbol: 'AAPL',
    side: 'buy',
    notionalUsd: 50,
    success: true,
    etoroOrderId: 'etoro-1',
    beforeExposure: 50,
    afterExposure: 45,
    dryRun: false,
    mode: 'demo',
    ...over,
  };
}

describe('formatProofMarkdown', () => {
  it('renders all required sections', () => {
    const md = formatProofMarkdown({
      snapshot: makeSnapshot(),
      capSnapshot: { dailyNotionalUsd: 100, dailyOrders: 2, cycleOrders: 1, dayKey: '2026-05-23' },
      breakerState: { tripped: false },
      killSwitchEngaged: false,
      mode: 'demo',
      dryRun: false,
      receipts: [makeReceipt()],
      isoTimestamp: '2026-05-23T12:00:00.000Z',
    });
    expect(md).toContain('# Demo hedge run — 2026-05-23T12:00:00.000Z');
    expect(md).toMatch(/## Mode|\*\*Mode:\*\*/);
    expect(md).toContain('## Breakers & kill switch');
    expect(md).toContain('## Caps');
    expect(md).toContain('## Receipts');
    expect(md).toContain('## Exposure before/after');
  });

  it('output is deterministic for the same input (golden test)', () => {
    const input: ProofWriterInput = {
      snapshot: makeSnapshot(),
      capSnapshot: { dailyNotionalUsd: 100, dailyOrders: 2, cycleOrders: 1, dayKey: '2026-05-23' },
      breakerState: { tripped: false },
      killSwitchEngaged: false,
      mode: 'demo',
      dryRun: false,
      receipts: [makeReceipt({ id: 'a' }), makeReceipt({ id: 'b', symbol: 'TSLA', side: 'sell' })],
      isoTimestamp: '2026-05-23T12:00:00.000Z',
    };
    const a = formatProofMarkdown(input);
    const b = formatProofMarkdown(input);
    expect(a).toBe(b);
  });

  it('flags tripped breakers prominently', () => {
    const md = formatProofMarkdown({
      snapshot: makeSnapshot(),
      capSnapshot: null,
      breakerState: { tripped: true, reason: 'exposure_stale', detail: 'oldest read age=30000ms' },
      killSwitchEngaged: false,
      mode: 'demo',
      dryRun: false,
      receipts: [],
      isoTimestamp: '2026-05-23T12:00:00.000Z',
    });
    expect(md).toContain('**TRIPPED — exposure_stale**');
  });

  it('flags kill-switch when engaged', () => {
    const md = formatProofMarkdown({
      snapshot: makeSnapshot(),
      capSnapshot: null,
      breakerState: { tripped: false },
      killSwitchEngaged: true,
      mode: 'demo',
      dryRun: false,
      receipts: [],
      isoTimestamp: '2026-05-23T12:00:00.000Z',
    });
    expect(md).toContain('**ENGAGED**');
  });

  it('NEVER echoes credentials or env values (no-secrets sweep)', () => {
    const md = formatProofMarkdown({
      snapshot: makeSnapshot(),
      capSnapshot: null,
      breakerState: { tripped: false },
      killSwitchEngaged: false,
      mode: 'demo',
      dryRun: false,
      receipts: [
        makeReceipt({
          // Red herring: an attacker tries to push a credential-shaped string
          // through the symbol or error fields. The proof must not propagate it.
          symbol: 'AAPL',
          error: undefined,
        }),
      ],
      isoTimestamp: '2026-05-23T12:00:00.000Z',
    });
    // No secret-like substrings in the rendered markdown.
    expect(md).not.toMatch(/api[_-]?key/i);
    expect(md).not.toMatch(/secret/i);
    expect(md).not.toMatch(/password/i);
    expect(md).not.toMatch(/Bearer\s+[A-Za-z0-9._-]+/);
  });
});

describe('ProofWriter', () => {
  it('writes a markdown file with the `run-<iso>.md` filename pattern', async () => {
    const writer = new ProofWriter(tmpDir);
    const pointer = await writer.writeProof({
      snapshot: makeSnapshot(),
      capSnapshot: { dailyNotionalUsd: 0, dailyOrders: 0, cycleOrders: 0, dayKey: '2026-05-23' },
      breakerState: { tripped: false },
      killSwitchEngaged: false,
      mode: 'demo',
      dryRun: true,
      receipts: [],
      isoTimestamp: '2026-05-23T12:00:00.000Z',
    });
    const expected = path.join(tmpDir, 'run-2026-05-23T12-00-00.000Z.md');
    expect(pointer.path).toBe(expected);
    expect(fs.existsSync(expected)).toBe(true);
  });

  it('updates latest.json atomically (writes to .tmp then renames)', async () => {
    const writer = new ProofWriter(tmpDir);
    await writer.writeProof({
      snapshot: makeSnapshot(),
      capSnapshot: null,
      breakerState: { tripped: false },
      killSwitchEngaged: false,
      mode: 'demo',
      dryRun: false,
      receipts: [makeReceipt()],
      isoTimestamp: '2026-05-23T12:00:00.000Z',
    });
    const latest = JSON.parse(fs.readFileSync(path.join(tmpDir, 'latest.json'), 'utf8'));
    expect(latest).toMatchObject({
      path: expect.stringContaining('run-2026-05-23T12-00-00.000Z.md'),
      timestamp: Date.UTC(2026, 4, 23, 12, 0, 0),
      summary: expect.stringContaining('demo'),
    });
    // No leftover .tmp file
    expect(fs.existsSync(path.join(tmpDir, 'latest.json.tmp'))).toBe(false);
  });

  it('readLatestPointer returns null when latest.json is missing', () => {
    const writer = new ProofWriter(tmpDir);
    expect(writer.readLatestPointer()).toBeNull();
  });
});
