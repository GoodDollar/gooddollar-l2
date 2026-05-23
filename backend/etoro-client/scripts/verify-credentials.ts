/**
 * Smoke verifier for the lane-1 demo credential rotation.
 *
 * Resolves the SDK's mode + credentials from the current shell env via
 * `loadCredentialsFromEnv()` and exits:
 *   0  — `ETORO_MODE` is a demo* / `real-disabled` mode AND the three
 *        `ETORO_DEMO_*` vars resolve cleanly. A single redacted summary
 *        line is written to stdout.
 *   2  — any caller-fixable failure (mock mode, unknown mode, missing
 *        demo creds). The failure reason is written to stderr.
 *
 * Used by `scripts/rotate-etoro-keys.sh` as the post-rotation smoke
 * (printed verification command). Lives in the SDK package because the
 * env contract is owned by `src/auth.ts` and we want the smoke to drift
 * in lock-step with the source of truth.
 */
import { loadCredentialsFromEnv, resolveMode } from '../src/auth';

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

function main(env: NodeJS.ProcessEnv): number {
  let mode;
  try {
    mode = resolveMode(env);
  } catch (err) {
    process.stderr.write(`[verify-credentials] ${errorMessage(err)}\n`);
    return 2;
  }
  if (mode === 'mock') {
    process.stderr.write(
      '[verify-credentials] mode is mock; rotation verification needs ' +
        'ETORO_MODE=demo-readonly (or demo-trading / real-disabled) so the SDK ' +
        'reads the rotated demo trio.\n',
    );
    return 2;
  }
  let creds;
  try {
    creds = loadCredentialsFromEnv(env, { silent: true });
  } catch (err) {
    process.stderr.write(`[verify-credentials] ${errorMessage(err)}\n`);
    return 2;
  }
  const apiKey = creds.apiKey;
  const masked =
    apiKey.length <= 6 ? '***' : `${apiKey.slice(0, 3)}...${apiKey.slice(-3)}`;
  process.stdout.write(
    `[verify-credentials] mode=${creds.mode} apiKey=${masked} baseUrl=${creds.baseUrl}\n`,
  );
  return 0;
}

if (require.main === module) {
  process.exit(main(process.env));
}

export { main };
