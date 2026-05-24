/**
 * Lane 3 end-to-end smoke wrapper.
 *
 * SKIPPED BY DEFAULT to keep `npm test` fast. Set `RUN_LANE3_SMOKE=1` to
 * exercise the full local-devnet pipeline (anvil + forge deploy + mock
 * price source + oracle-signer + on-chain price reads).
 *
 *   RUN_LANE3_SMOKE=1 npx jest -i src/__tests__/lane3-smoke.test.ts
 *
 * The test spawns `scripts/testnet/lane3-oracle-publishing-smoke.sh`,
 * waits for exit 0 with a 90s timeout, then asserts the proof JSON
 * written to `.autobuilder/lane-proof/lane3-oracle-publishing.json` has
 * the expected shape (chain id, txs, prices).
 */

import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

const ROOT = path.resolve(__dirname, '../../../../');
const SCRIPT = path.join(ROOT, 'scripts/testnet/lane3-oracle-publishing-smoke.sh');
const PROOF = path.join(ROOT, '.autobuilder/lane-proof/lane3-oracle-publishing.json');

const enabled = process.env.RUN_LANE3_SMOKE === '1';
const runIf = enabled ? describe : describe.skip;

runIf('lane3 oracle publishing smoke (RUN_LANE3_SMOKE=1)', () => {
  jest.setTimeout(120_000);

  it('runs the full smoke and writes a proof artefact', async () => {
    expect(fs.existsSync(SCRIPT)).toBe(true);

    const exitCode: number = await new Promise((resolve) => {
      const child = spawn('bash', [SCRIPT], {
        stdio: ['ignore', 'inherit', 'inherit'],
        env: { ...process.env, SMOKE_TIMEOUT_S: process.env.SMOKE_TIMEOUT_S ?? '60' },
      });
      child.on('exit', (code) => resolve(code ?? 1));
    });

    expect(exitCode).toBe(0);
    expect(fs.existsSync(PROOF)).toBe(true);

    const proof = JSON.parse(fs.readFileSync(PROOF, 'utf8')) as Record<string, unknown>;
    expect(proof.lane).toBe('lane3-oracle-publishing');
    expect(proof.chainId).toBe(31337);
    expect(typeof proof.stockTx).toBe('string');
    expect(String(proof.stockTx)).toMatch(/^0x[0-9a-fA-F]{64}$/);
    expect(typeof proof.swapTx).toBe('string');
    expect(String(proof.swapTx)).toMatch(/^0x[0-9a-fA-F]{64}$/);
    expect(typeof proof.aaplPrice8).toBe('number');
    expect(proof.aaplPrice8 as number).toBeGreaterThan(0);
    expect(typeof proof.wethPrice8).toBe('number');
    expect(proof.wethPrice8 as number).toBeGreaterThan(0);
  });
});
