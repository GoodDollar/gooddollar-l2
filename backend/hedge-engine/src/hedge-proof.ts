import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

/**
 * Auditable proof of a single executed (or dry-run) hedge. Each `runOnce`
 * call produces exactly one of these and writes it to `qa-proof/hedges/`.
 *
 * The `realTradingEnabled` field is the literal `false` constant from
 * `etoro-client/src/safety.ts` — it appears in every proof so reviewers can
 * confirm the fence held when this hedge was recorded.
 */
export interface HedgeProof {
  runId: string;
  orderId: string;
  symbol: string;
  side: 'buy' | 'sell';
  notionalUsd: number;
  timestamp: number;
  beforeExposure: ExposureSnapshot;
  afterExposure: ExposureSnapshot;
  dryRun: boolean;
  etoroMode: string;
  realTradingEnabled: false;
}

export interface ExposureSnapshot {
  netDelta: number;
  absExposure: number;
  blockNumber: number;
}

/**
 * Writes hedge proofs as JSON files under a configurable directory.
 * `write(proof)` always produces two files:
 *   - `<runId>.json` — durable per-run artifact
 *   - `latest.json`  — copy of the most recent proof for the frontend API
 *
 * Default directory is `<repo-root>/qa-proof/hedges` or `HEDGE_PROOF_DIR`.
 */
export class HedgeProofRecorder {
  private readonly dir: string;

  constructor(dir?: string) {
    this.dir = dir ?? defaultHedgeProofDir();
  }

  getDir(): string {
    return this.dir;
  }

  async write(proof: HedgeProof): Promise<string> {
    fs.mkdirSync(this.dir, { recursive: true });
    const filePath = path.join(this.dir, `${safeSlug(proof.runId)}.json`);
    const latestPath = path.join(this.dir, 'latest.json');
    const json = JSON.stringify(proof, null, 2);
    fs.writeFileSync(filePath, json);
    fs.writeFileSync(latestPath, json);
    return filePath;
  }

  async getLatest(): Promise<HedgeProof | null> {
    const latestPath = path.join(this.dir, 'latest.json');
    if (!fs.existsSync(latestPath)) return null;
    try {
      const raw = fs.readFileSync(latestPath, 'utf8');
      return JSON.parse(raw) as HedgeProof;
    } catch {
      return null;
    }
  }
}

export function newProofRunId(): string {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').replace('Z', '');
  const suffix = crypto.randomBytes(3).toString('hex');
  return `${stamp}-${suffix}`;
}

function defaultHedgeProofDir(): string {
  if (process.env.HEDGE_PROOF_DIR) return process.env.HEDGE_PROOF_DIR;
  let dir = __dirname;
  for (let i = 0; i < 10; i++) {
    if (
      fs.existsSync(path.join(dir, 'backend')) &&
      fs.existsSync(path.join(dir, 'frontend'))
    ) {
      return path.join(dir, 'qa-proof', 'hedges');
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return path.resolve(process.cwd(), 'qa-proof', 'hedges');
}

function safeSlug(s: string): string {
  return s.replace(/[^a-zA-Z0-9_-]+/g, '-').slice(0, 80);
}
