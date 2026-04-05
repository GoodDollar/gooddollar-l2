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
export {};
