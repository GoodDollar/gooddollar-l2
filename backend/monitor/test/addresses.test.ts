/**
 * Unit tests for loadContracts().
 *
 * The monitor used to hardcode 8 contract addresses from the local Anvil
 * deterministic-deploy. Those addresses don't exist on the real chain and
 * caused every contract check to fail. The fix is to read the canonical
 * addresses from `op-stack/addresses.json` at startup.
 *
 * Non-negotiable: if the addresses file is missing or unparseable, the
 * monitor must NOT silently fall back to stale hardcoded values — it must
 * start with an empty contract list and log clearly.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadContracts, MONITORED_CONTRACTS } from '../src/addresses';

function withTempFile(contents: string | null, fn: (p: string) => void) {
  const dir = mkdtempSync(join(tmpdir(), 'monitor-addr-'));
  const file = join(dir, 'addresses.json');
  if (contents !== null) writeFileSync(file, contents, 'utf8');
  try {
    fn(file);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test('returns [name, address] tuples for the 8 monitored contracts when file is valid', () => {
  const body = JSON.stringify({
    contracts: {
      GoodDollarToken: '0x8f86403a4de0bb5791fa46b8e795c547942fe4cf',
      UBIFeeSplitter: '0x809d550fca64d94bd9f66e60752a544199cfac3d',
      PerpEngine: '0x084815d1330ecc3ef94193a19ec222c0c73dff2d',
      MarginVault: '0x82bbaa3b0982d88741b275ae1752db85cafe3c65',
      MarketFactory: '0xfaA7b3a4b5c3f54a934a2e33D34C7bC099f96CCE',
      ConditionalTokens: '0x12AC093Ef862b0DF59a9207dDFA35A82cf3eb7a5',
      SyntheticAssetFactory: '0xfaaddc93baf78e89dcf37ba67943e1be8f37bb8c',
      CollateralVault: '0x276c216d241856199a83bf27b2286659e5b877d3',
    },
  });
  withTempFile(body, (file) => {
    const result = loadContracts(file);
    assert.equal(result.length, 8, 'all 8 monitored contracts present');
    const map = Object.fromEntries(result);
    assert.equal(map.GoodDollarToken, '0x8f86403a4de0bb5791fa46b8e795c547942fe4cf');
    assert.equal(map.UBIFeeSplitter, '0x809d550fca64d94bd9f66e60752a544199cfac3d');
  });
});

test('filters out contracts not in the monitored allowlist', () => {
  // Real `op-stack/addresses.json` contains ~30+ contracts. Monitor scope
  // must not silently expand to all of them.
  const body = JSON.stringify({
    contracts: {
      GoodDollarToken: '0x8f86403a4de0bb5791fa46b8e795c547942fe4cf',
      // Extra contracts that should NOT be monitored:
      VoteEscrowedGD: '0x36b58f5c1969b7b6591d752ea6f5486d069010ab',
      GoodDAO: '0x8198f5d8f8cffe8f9c413d98a0a55aeb8ab9fbb7',
      GoodSwapRouter: '0x975cdd867acb99f0195be09c269e2440aa1b1fa8',
    },
  });
  withTempFile(body, (file) => {
    const result = loadContracts(file);
    assert.equal(result.length, 1, 'only GoodDollarToken is in the allowlist');
    assert.equal(result[0][0], 'GoodDollarToken');
  });
});

test('silently skips monitored names missing from the file (warn-log, not crash)', () => {
  // If a redeploy hasn't added a contract yet, monitor should still
  // report on the rest, not refuse to start.
  const body = JSON.stringify({
    contracts: {
      GoodDollarToken: '0x8f86403a4de0bb5791fa46b8e795c547942fe4cf',
      UBIFeeSplitter: '0x809d550fca64d94bd9f66e60752a544199cfac3d',
    },
  });
  withTempFile(body, (file) => {
    const result = loadContracts(file);
    assert.equal(result.length, 2);
    const names = result.map(([n]: [string, string]) => n);
    assert.deepEqual(names.sort(), ['GoodDollarToken', 'UBIFeeSplitter']);
  });
});

test('returns [] when the file is missing — no fallback to stale Anvil addresses', () => {
  const result = loadContracts('/tmp/definitely-does-not-exist-' + Date.now() + '.json');
  assert.deepEqual(result, []);
});

test('returns [] when the file is unparseable JSON', () => {
  withTempFile('this is { not valid json', (file) => {
    assert.deepEqual(loadContracts(file), []);
  });
});

test('returns [] when the file is valid JSON but has no `contracts` object', () => {
  withTempFile(JSON.stringify({ chain_id: 42069 }), (file) => {
    assert.deepEqual(loadContracts(file), []);
  });
});

test('returns [] when `contracts` is present but empty', () => {
  withTempFile(JSON.stringify({ contracts: {} }), (file) => {
    assert.deepEqual(loadContracts(file), []);
  });
});

test('MONITORED_CONTRACTS still lists the original 8 names for behavior compatibility', () => {
  assert.deepEqual(
    [...MONITORED_CONTRACTS].sort(),
    [
      'CollateralVault',
      'ConditionalTokens',
      'GoodDollarToken',
      'MarginVault',
      'MarketFactory',
      'PerpEngine',
      'SyntheticAssetFactory',
      'UBIFeeSplitter',
    ],
  );
});
