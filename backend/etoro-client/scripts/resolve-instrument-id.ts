/**
 * Resolves one or more lane symbols to their eToro `instrumentId` via the
 * official `/market-data/search` endpoint. Operator utility so a fresh
 * deployer can fill in `PROOF_INSTRUMENT_ID` for the lane's demo-hedge
 * proof without hand-crafting curls or reading SDK source.
 *
 * Usage:
 *   ETORO_MODE=demo-readonly \
 *   ETORO_DEMO_KEY=… ETORO_DEMO_SECRET=… ETORO_DEMO_USER_KEY=… \
 *   node -r ts-node/register backend/etoro-client/scripts/resolve-instrument-id.ts AAPL BTC
 *
 * Or, equivalently, from inside the package:
 *   npm run resolve-instrument-id -- AAPL BTC
 *
 * Output (stdout): one TSV row per symbol —
 *   <symbol>\t<instrumentId>\t<instrumentType>\t<displayName>
 *
 * Exit codes:
 *   0 — every passed symbol resolved.
 *   2 — usage error, mock-mode refusal, missing creds, or any unresolved
 *       symbol (other symbols in the same call still print to stdout).
 *
 * Mock-mode safety: the script refuses to run in `mock` mode. Printing
 * fake instrument IDs would exactly defeat the lane's purpose (operators
 * pasting placeholders into `PROOF_INSTRUMENT_ID`).
 *
 * Secret hygiene: the script never echoes `ETORO_DEMO_KEY`,
 * `ETORO_DEMO_SECRET`, or `ETORO_DEMO_USER_KEY`. Only the resolved
 * `instrumentId` (public catalog data) is written.
 */
import axios, { AxiosInstance } from 'axios';
import { randomUUID } from 'crypto';
import { loadCredentialsFromEnv, resolveMode } from '../src/auth';
import { InstrumentResolver } from '../src/instrument-resolver';

export interface ResolveInstrumentIdDeps {
  /** Process env shadow. Defaults to `process.env`. */
  env?: NodeJS.ProcessEnv;
  /** Pre-built axios instance — tests inject `createMockAxios()`. */
  http?: AxiosInstance;
  stdout?: { write: (s: string) => void };
  stderr?: { write: (s: string) => void };
}

const USAGE =
  'Usage: resolve-instrument-id <SYMBOL> [SYMBOL ...]\n' +
  '  ETORO_MODE=demo-readonly\n' +
  '  ETORO_DEMO_KEY=… ETORO_DEMO_SECRET=… ETORO_DEMO_USER_KEY=…\n' +
  '  npm run resolve-instrument-id -- AAPL BTC\n';

/**
 * Run the resolver as a CLI. Returns the exit code (0 success, 2 any
 * caller-fixable failure). Never throws; all error paths are caught and
 * reported via `stderr`.
 */
export async function runResolveInstrumentId(
  symbols: readonly string[],
  deps: ResolveInstrumentIdDeps = {},
): Promise<number> {
  const env = deps.env ?? process.env;
  const stdout = deps.stdout ?? process.stdout;
  const stderr = deps.stderr ?? process.stderr;

  if (symbols.length === 0) {
    stderr.write(USAGE);
    return 2;
  }

  const mode = resolveMode(env);
  if (mode === 'mock') {
    stderr.write(
      '[resolve-instrument-id] refusing mock mode: would print deterministic ' +
        'placeholders, not real eToro IDs. Set ETORO_MODE=demo-readonly with ' +
        'real demo credentials.\n',
    );
    return 2;
  }

  let creds;
  try {
    creds = loadCredentialsFromEnv(env, { silent: true });
  } catch (err) {
    stderr.write(`[resolve-instrument-id] ${errorMessage(err)}\n`);
    return 2;
  }

  const http = deps.http ?? buildHttp(creds.baseUrl, creds.apiKey, creds.userKey);
  const resolver = new InstrumentResolver({ http });

  let unresolved = 0;
  for (const sym of symbols) {
    try {
      const r = await resolver.resolve(sym);
      stdout.write(
        `${sym.toUpperCase()}\t${r.instrumentId}\t${r.instrumentType}\t${r.displayName}\n`,
      );
    } catch (err) {
      unresolved += 1;
      stderr.write(
        `[resolve-instrument-id] unresolved: ${sym.toUpperCase()}: ${errorMessage(err)}\n`,
      );
    }
  }

  return unresolved === 0 ? 0 : 2;
}

function buildHttp(baseUrl: string, apiKey: string, userKey: string): AxiosInstance {
  const http = axios.create({
    baseURL: baseUrl,
    timeout: 10_000,
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'GoodChainResolveInstrumentId/0.1',
      'x-api-key': apiKey,
      'x-user-key': userKey,
    },
  });
  http.interceptors.request.use((req) => {
    req.headers = req.headers ?? {};
    req.headers['x-request-id'] = randomUUID();
    return req;
  });
  return http;
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

if (require.main === module) {
  const argv = process.argv.slice(2);
  runResolveInstrumentId(argv).then(
    (code) => process.exit(code),
    (err) => {
      process.stderr.write(`[resolve-instrument-id] fatal: ${errorMessage(err)}\n`);
      process.exit(1);
    },
  );
}
