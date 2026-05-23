import * as os from 'os';
import * as path from 'path';
import { promises as fs } from 'fs';
import { AuditLog } from '../audit-log';

async function readAll(file: string): Promise<string[]> {
  try {
    const txt = await fs.readFile(file, 'utf8');
    return txt.split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

describe('AuditLog', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'oracle-signer-audit-'));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('creates the directory if missing', async () => {
    const nested = path.join(tmpDir, 'nested', 'deeper');
    const log = new AuditLog({ dir: nested });
    await log.append({ rail: 'stocks', event: 'submit_ok', txHash: '0x1', symbols: ['AAPL'] });

    const files = await fs.readdir(nested);
    expect(files.length).toBeGreaterThan(0);
  });

  it('appends one JSON line per entry', async () => {
    const log = new AuditLog({ dir: tmpDir });
    await log.append({ rail: 'stocks', event: 'submit_ok', txHash: '0xS1', symbols: ['AAPL'] });
    await log.append({ rail: 'crypto', event: 'submit_ok', txHash: '0xC1', symbols: ['WETH'] });

    const file = path.join(tmpDir, log.currentFileName());
    const lines = await readAll(file);
    expect(lines).toHaveLength(2);
    const a = JSON.parse(lines[0]);
    const b = JSON.parse(lines[1]);
    expect(a.event).toBe('submit_ok');
    expect(a.rail).toBe('stocks');
    expect(b.txHash).toBe('0xC1');
    expect(typeof a.ts).toBe('number');
  });

  it('records the file path as YYYY-MM-DD.jsonl by default', () => {
    const log = new AuditLog({ dir: tmpDir });
    expect(log.currentFileName()).toMatch(/^\d{4}-\d{2}-\d{2}\.jsonl$/);
  });

  it('does not leak signer keys / RPC URLs from entry payloads', async () => {
    const log = new AuditLog({ dir: tmpDir });
    await log.append({
      rail: 'stocks',
      event: 'submit_ok',
      txHash: '0xS1',
      symbols: ['AAPL'],
      // Deliberate fields that should NEVER appear even if a caller accidentally passed them.
      signerKey: '0xdeadbeef',
      rpcUrl: 'https://mainnet.infura.io/v3/secret',
    } as never);

    const file = path.join(tmpDir, log.currentFileName());
    const txt = await fs.readFile(file, 'utf8');
    expect(txt).not.toMatch(/signerKey/);
    expect(txt).not.toMatch(/rpcUrl/);
    expect(txt).not.toMatch(/deadbeef/);
    expect(txt).not.toMatch(/infura/);
  });

  it('is non-fatal when the underlying append fails', async () => {
    const log = new AuditLog({ dir: tmpDir });
    const origAppend = (fs as any).appendFile;
    (fs as any).appendFile = jest.fn().mockRejectedValue(new Error('disk full'));

    await expect(
      log.append({ rail: 'stocks', event: 'submit_ok', txHash: '0xS1', symbols: ['AAPL'] }),
    ).resolves.not.toThrow();

    (fs as any).appendFile = origAppend;
  });

  it('refused/startup/shutdown/submit_fail events accepted', async () => {
    const log = new AuditLog({ dir: tmpDir });
    await log.append({ rail: 'stocks', event: 'refused', error: 'non-devnet chain id 1', chainId: 1 });
    await log.append({ rail: 'crypto', event: 'submit_fail', error: 'reverted', symbols: ['WETH'] });
    await log.append({ rail: 'stocks', event: 'startup' });
    await log.append({ rail: 'stocks', event: 'shutdown' });

    const file = path.join(tmpDir, log.currentFileName());
    const lines = await readAll(file);
    expect(lines).toHaveLength(4);
    const events = lines.map(l => JSON.parse(l).event);
    expect(events).toEqual(['refused', 'submit_fail', 'startup', 'shutdown']);
  });

  it('serialises sequentially even when callers fire in parallel', async () => {
    const log = new AuditLog({ dir: tmpDir });
    const fires = Array.from({ length: 20 }, (_, i) => log.append({
      rail: 'stocks',
      event: 'submit_ok',
      txHash: `0xS${i}`,
      symbols: ['AAPL'],
    }));
    await Promise.all(fires);

    const file = path.join(tmpDir, log.currentFileName());
    const lines = await readAll(file);
    expect(lines).toHaveLength(20);
    // Each line should parse as JSON (i.e. not interleaved).
    for (const l of lines) expect(() => JSON.parse(l)).not.toThrow();
  });
});
