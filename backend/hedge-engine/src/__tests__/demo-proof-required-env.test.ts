import { readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * The demo-proof script's documented contract (runbook +
 * deep adapter doc) lists `RPC_URL=https://…` as required. Source
 * must match: `requireEnv('RPC_URL')` is the only loud-failure path
 * for a missing chain RPC. A silent localhost default would surface
 * as ECONNREFUSED 30 seconds later inside `ExposureReader`.
 */
describe('demo-proof.ts required env contract', () => {
  const src = readFileSync(
    resolve(__dirname, '..', '..', 'scripts', 'demo-proof.ts'),
    'utf8',
  );

  it('requires RPC_URL via requireEnv()', () => {
    expect(src).toMatch(/requireEnv\(['"]RPC_URL['"]\)/);
  });

  it('does not silently default RPC_URL to localhost', () => {
    expect(src).not.toMatch(/process\.env\.RPC_URL\s*\?\?\s*['"]http:\/\/localhost/);
  });
});
