import fs from 'fs';
import path from 'path';
import { evidenceRootForRun } from './evidence';
import { getRunId } from './run-id';

interface Step {
  check: string;
  ok: boolean;
  evidencePath: string;
  durationMs: number;
}

export default async function globalTeardown(): Promise<void> {
  const runId = getRunId();
  const dir = evidenceRootForRun(runId);
  if (!fs.existsSync(dir)) return;

  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json') && f !== 'summary.json');
  const steps: Step[] = files
    .map((file) => {
      try {
        const raw = fs.readFileSync(path.join(dir, file), 'utf8');
        const parsed = JSON.parse(raw) as { check?: string; ok?: boolean; details?: { durationMs?: number } };
        return {
          check: parsed.check ?? file,
          ok: parsed.ok === true,
          evidencePath: path.join(dir, file),
          durationMs: parsed.details?.durationMs ?? 0,
        };
      } catch {
        return { check: file, ok: false, evidencePath: path.join(dir, file), durationMs: 0 };
      }
    })
    .sort((a, b) => a.check.localeCompare(b.check));

  const allOk = steps.length >= 6 && steps.every((s) => s.ok);
  const summary = {
    runId,
    status: allOk ? 'ok' : 'fail',
    completedAt: new Date().toISOString(),
    stepCount: steps.length,
    steps,
  };
  fs.writeFileSync(path.join(dir, 'summary.json'), JSON.stringify(summary, null, 2));
  console.log(`\n[qa-harness] summary written: ${path.join(dir, 'summary.json')} (status=${summary.status})\n`);
}
