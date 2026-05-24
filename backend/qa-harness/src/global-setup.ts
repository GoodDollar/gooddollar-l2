import { getRunId } from './run-id';

export default async function globalSetup(): Promise<void> {
  const runId = getRunId();
  console.log(`\n[qa-harness] runId=${runId}\n`);
}
