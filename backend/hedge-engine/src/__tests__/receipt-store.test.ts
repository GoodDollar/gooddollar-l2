import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { ReceiptStore, HedgeReceipt } from '../receipt-store';

let tmpDir: string;
let filePath: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hedge-receipts-'));
  filePath = path.join(tmpDir, 'receipts.jsonl');
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function makeReceipt(overrides: Partial<HedgeReceipt> = {}): HedgeReceipt {
  return {
    v: 1,
    id: 'rcpt-1',
    timestamp: 1700000000000,
    symbol: 'AAPL',
    side: 'buy',
    notionalUsd: 50,
    success: true,
    beforeExposure: 100,
    afterExposure: 50,
    dryRun: false,
    mode: 'demo',
    ...overrides,
  };
}

describe('ReceiptStore', () => {
  it('append writes a single JSON line ending in \\n', async () => {
    const store = new ReceiptStore(filePath);
    await store.append(makeReceipt());
    const raw = fs.readFileSync(filePath, 'utf8');
    expect(raw.endsWith('\n')).toBe(true);
    expect(raw.split('\n').filter(Boolean)).toHaveLength(1);
    expect(JSON.parse(raw.trim())).toMatchObject({ id: 'rcpt-1', v: 1 });
  });

  it('readNewestFirst returns up to `limit` entries, newest first', async () => {
    const store = new ReceiptStore(filePath);
    await store.append(makeReceipt({ id: 'a', timestamp: 1 }));
    await store.append(makeReceipt({ id: 'b', timestamp: 2 }));
    await store.append(makeReceipt({ id: 'c', timestamp: 3 }));

    const results = await store.readNewestFirst(2);
    expect(results.map((r) => r.id)).toEqual(['c', 'b']);
  });

  it('readNewestFirst returns empty array when file does not exist', async () => {
    const store = new ReceiptStore(filePath);
    expect(await store.readNewestFirst(10)).toEqual([]);
  });

  it('skips corrupt lines with a warn log (no throw)', async () => {
    fs.writeFileSync(
      filePath,
      [
        JSON.stringify(makeReceipt({ id: 'good-1' })),
        'not-json-at-all',
        JSON.stringify(makeReceipt({ id: 'good-2', timestamp: 2 })),
      ].join('\n') + '\n',
    );
    const store = new ReceiptStore(filePath);
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const results = await store.readNewestFirst(10);
    expect(results.map((r) => r.id)).toEqual(['good-2', 'good-1']);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('recoverIfCorrupt rotates a fully-unparseable file and starts fresh', async () => {
    fs.writeFileSync(filePath, 'this is\nnot valid\njsonl at all\n');
    const store = new ReceiptStore(filePath);
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    await store.recoverIfCorrupt();

    expect(fs.existsSync(filePath)).toBe(true);
    expect(fs.readFileSync(filePath, 'utf8')).toBe('');
    // Rotated file should exist alongside.
    const rotated = fs.readdirSync(tmpDir).find((f) => f.startsWith('receipts.jsonl.corrupt-'));
    expect(rotated).toBeDefined();
    warnSpy.mockRestore();
  });

  it('recoverIfCorrupt leaves a healthy file untouched', async () => {
    const store = new ReceiptStore(filePath);
    await store.append(makeReceipt({ id: 'ok' }));
    const before = fs.readFileSync(filePath, 'utf8');
    await store.recoverIfCorrupt();
    expect(fs.readFileSync(filePath, 'utf8')).toBe(before);
    const rotated = fs.readdirSync(tmpDir).find((f) => f.startsWith('receipts.jsonl.corrupt-'));
    expect(rotated).toBeUndefined();
  });

  it('rejects unknown schema versions on read', async () => {
    fs.writeFileSync(
      filePath,
      JSON.stringify({ ...makeReceipt(), v: 99 }) + '\n' +
        JSON.stringify(makeReceipt({ id: 'good' })) + '\n',
    );
    const store = new ReceiptStore(filePath);
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const results = await store.readNewestFirst(10);
    expect(results.map((r) => r.id)).toEqual(['good']);
    warnSpy.mockRestore();
  });

  it('default path comes from HEDGE_RECEIPT_FILE env override', () => {
    process.env.HEDGE_RECEIPT_FILE = path.join(tmpDir, 'env-default.jsonl');
    const store = new ReceiptStore();
    expect(store.getPath()).toBe(process.env.HEDGE_RECEIPT_FILE);
    delete process.env.HEDGE_RECEIPT_FILE;
  });

  it('append is durable across multiple writes (each line stays intact)', async () => {
    const store = new ReceiptStore(filePath);
    for (let i = 0; i < 5; i++) {
      await store.append(makeReceipt({ id: `r-${i}`, timestamp: i }));
    }
    const lines = fs.readFileSync(filePath, 'utf8').split('\n').filter(Boolean);
    expect(lines).toHaveLength(5);
    for (const line of lines) {
      expect(() => JSON.parse(line)).not.toThrow();
    }
  });
});
