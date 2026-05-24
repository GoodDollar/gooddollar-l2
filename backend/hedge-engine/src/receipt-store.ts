import * as fs from 'fs';
import * as fsp from 'fs/promises';
import * as path from 'path';

/**
 * Schema for one hedge receipt written to disk. Bump `v` when fields change
 * in a backwards-incompatible way — `readNewestFirst` will silently drop
 * unknown versions so old replicas don't crash on newer data.
 */
export interface HedgeReceipt {
  v: 1;
  id: string;
  timestamp: number;
  symbol: string;
  side: 'buy' | 'sell' | 'noop';
  notionalUsd: number;
  etoroOrderId?: string;
  executionPrice?: number;
  success: boolean;
  error?: string;
  beforeExposure: number;
  afterExposure: number;
  dryRun: boolean;
  mode: 'sandbox' | 'real' | 'demo' | 'unknown';
}

const DEFAULT_PATH = '.hedge-receipts.jsonl';
const SUPPORTED_VERSIONS = new Set<number>([1]);

/**
 * Append-only JSONL store for HedgeReceipts.
 *
 * Design:
 *  - One `fs.appendFile` per receipt — single syscall, atomic at the OS
 *    page boundary for line sizes we expect (<2KB).
 *  - Reads are line-by-line with graceful skip-on-corruption; a single bad
 *    line never blocks the rest of the file.
 *  - `recoverIfCorrupt()` rotates a file that is wholly unparseable to
 *    `<path>.corrupt-<ts>` so an operator can salvage it offline while the
 *    engine boots clean.
 */
export class ReceiptStore {
  private readonly filePath: string;

  constructor(filePath?: string) {
    this.filePath =
      filePath ?? process.env.HEDGE_RECEIPT_FILE ?? DEFAULT_PATH;
  }

  getPath(): string {
    return this.filePath;
  }

  async append(receipt: HedgeReceipt): Promise<void> {
    await fsp.mkdir(path.dirname(this.filePath), { recursive: true }).catch(() => {});
    await fsp.appendFile(this.filePath, JSON.stringify(receipt) + '\n', 'utf8');
  }

  async readNewestFirst(limit: number): Promise<HedgeReceipt[]> {
    if (!fs.existsSync(this.filePath)) return [];
    const raw = await fsp.readFile(this.filePath, 'utf8');
    const lines = raw.split('\n').filter(Boolean);
    const parsed: HedgeReceipt[] = [];
    for (const line of lines) {
      try {
        const entry = JSON.parse(line) as HedgeReceipt;
        if (!SUPPORTED_VERSIONS.has(entry.v)) {
          console.warn(`[ReceiptStore] skipping unknown schema v=${entry.v}`);
          continue;
        }
        parsed.push(entry);
      } catch {
        console.warn('[ReceiptStore] skipping unparseable line');
      }
    }
    return parsed.reverse().slice(0, limit);
  }

  async recoverIfCorrupt(): Promise<void> {
    if (!fs.existsSync(this.filePath)) return;
    const raw = await fsp.readFile(this.filePath, 'utf8');
    const lines = raw.split('\n').filter(Boolean);
    if (lines.length === 0) return;
    let validLines = 0;
    for (const line of lines) {
      try {
        const entry = JSON.parse(line);
        if (SUPPORTED_VERSIONS.has(entry?.v)) validLines += 1;
      } catch {
        // tolerate; counted as invalid
      }
    }
    if (validLines === 0) {
      const ts = new Date().toISOString().replace(/[:.]/g, '-');
      const rotated = `${this.filePath}.corrupt-${ts}`;
      console.warn(
        `[ReceiptStore] rotating corrupt receipt file to ${path.basename(rotated)}`,
      );
      await fsp.rename(this.filePath, rotated);
      await fsp.writeFile(this.filePath, '', 'utf8');
    }
  }
}
