/**
 * Harvest Keeper — CLI entrypoint
 *
 * Usage:
 *   npx ts-node-dev src/index.ts              # Run with defaults
 *   npx ts-node-dev src/index.ts --dry-run    # Simulate only
 *   npx ts-node-dev src/index.ts --once       # Single cycle then exit
 *
 * Environment:
 *   RPC_URL           — Chain RPC (default: http://localhost:8545)
 *   PRIVATE_KEY       — Deployer/keeper key
 *   VAULT_FACTORY     — VaultFactory address
 *   HARVEST_INTERVAL  — Seconds between cycles (default: 3600)
 *   MIN_HARVEST_GAP   — Min seconds between harvests per vault (default: 3600)
 *   DRY_RUN           — Set to "true" for simulation mode
 */

import { getAddress, isAddress } from 'ethers';
import { HarvestKeeper, HarvestKeeperConfig } from './lib';
import { startHealthServer } from './healthServer';

/**
 * Defensive address sanitizer.
 *
 * `.autobuilder/addresses.env` historically contained inline `# comment`
 * markers that PM2's dotenv parser does not strip, producing values like
 * `0x66f6...3d  # DeployGoodYield.s.sol`. Passing such a string to ethers
 * falls through to ENS resolution, which the Anvil devnet does not
 * support — the service then crashes in an infinite restart loop.
 *
 * This helper strips trailing junk and either returns a checksummed
 * address or throws a loud, named error at startup. Failing here is
 * orders of magnitude cheaper than the ENS-loop failure mode.
 */
function sanitizeAddress(raw: string | undefined, name: string, fallback: string): string {
  const source = raw ?? fallback;
  const cleaned = source.split(/\s+/)[0].split('#')[0].trim();
  if (!isAddress(cleaned)) {
    throw new Error(
      `[harvest-keeper] ${name} is not a valid address. raw=${JSON.stringify(source)} cleaned=${JSON.stringify(cleaned)}`,
    );
  }
  if (cleaned !== source) {
    console.warn(`[sanitizeAddress] ${name}: stripped trailing junk; raw=${JSON.stringify(source)} → ${cleaned}`);
  }
  return getAddress(cleaned);
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run') || process.env.DRY_RUN === 'true';
  const once = args.includes('--once');

  const config: HarvestKeeperConfig = {
    rpcUrl: process.env.RPC_URL || 'http://localhost:8545',
    privateKey: process.env.PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
    factoryAddress: sanitizeAddress(process.env.VAULT_FACTORY, 'VAULT_FACTORY', '0xe70f935c32da4db13e7876795f1e175465e6458e'),
    minHarvestIntervalSeconds: parseInt(process.env.MIN_HARVEST_GAP || '3600'),
    minProfitThresholdBPS: 10,
    dryRun,
    maxGasPrice: BigInt(process.env.MAX_GAS_PRICE || '50000000000'), // 50 gwei
  };

  console.log('═══════════════════════════════════════════════');
  console.log('  GoodYield Harvest Keeper v0.2.1');
  console.log('═══════════════════════════════════════════════');
  console.log(`  RPC:       ${config.rpcUrl}`);
  console.log(`  Factory:   ${config.factoryAddress}`);
  console.log(`  Dry Run:   ${config.dryRun}`);
  console.log(`  Interval:  ${config.minHarvestIntervalSeconds}s`);
  console.log('═══════════════════════════════════════════════');

  const keeper = new HarvestKeeper(config);

  startHealthServer({
    name: 'harvest-keeper',
    port: parseInt(process.env.HEALTH_PORT ?? '9102', 10),
  });

  if (once) {
    const results = await keeper.runCycle();
    console.log(`\nCompleted: ${results.length} vault(s) harvested`);
    process.exit(0);
  } else {
    const intervalMs = parseInt(process.env.HARVEST_INTERVAL || '3600') * 1000;
    try {
      await keeper.startLoop(intervalMs);
    } catch (err) {
      process.env.SERVICE_HEALTH_STATUS = 'degraded';
      process.env.SERVICE_DISABLED_REASON = `VaultFactory unavailable at ${config.factoryAddress}`;
      console.error('[harvest-keeper] Loop disabled:', err);
    }
  }
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
