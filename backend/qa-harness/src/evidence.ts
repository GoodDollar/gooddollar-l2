import fs from 'fs';
import path from 'path';

export interface EvidenceEntry {
  check: string;
  ok: boolean;
  details: Record<string, unknown>;
  timestamp: string;
  runId: string;
}

export interface SummaryEntry {
  check: string;
  ok: boolean;
  evidencePath: string;
  durationMs: number;
}

/**
 * Returns the absolute directory for the current run's evidence,
 * resolving from `QA_PROOF_DIR` (default `<repo-root>/qa-proof`).
 *
 * The repo root is computed by walking up from this file to the nearest
 * directory with both `backend/` and `frontend/` siblings.
 */
export function evidenceRootForRun(runId: string): string {
  const root = process.env.QA_PROOF_DIR ?? path.resolve(repoRoot(), 'qa-proof');
  return path.join(root, 'evidence', runId);
}

export function repoRoot(): string {
  let dir = __dirname;
  for (let i = 0; i < 10; i++) {
    if (
      fs.existsSync(path.join(dir, 'backend')) &&
      fs.existsSync(path.join(dir, 'frontend'))
    ) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return process.cwd();
}

export function writeEvidence(entry: Omit<EvidenceEntry, 'timestamp' | 'runId'> & { runId: string }): string {
  const dir = evidenceRootForRun(entry.runId);
  fs.mkdirSync(dir, { recursive: true });
  const full: EvidenceEntry = {
    ...entry,
    timestamp: new Date().toISOString(),
  };
  const file = path.join(dir, `${safeSlug(entry.check)}.json`);
  fs.writeFileSync(file, JSON.stringify(full, null, 2));
  return file;
}

export function writeSummary(runId: string, entries: SummaryEntry[]): string {
  const dir = evidenceRootForRun(runId);
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'summary.json');
  const allOk = entries.every((e) => e.ok);
  fs.writeFileSync(
    file,
    JSON.stringify(
      {
        runId,
        status: allOk ? 'ok' : 'fail',
        completedAt: new Date().toISOString(),
        steps: entries,
      },
      null,
      2,
    ),
  );
  return file;
}

function safeSlug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}
