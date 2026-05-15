/**
 * PM2 ecosystem configuration for the 10 GoodDollar L2 backend services.
 *
 * Phase 1: Security Hardening requirements (initiative 0002):
 *   - max_restarts: 10, restart_delay: 5000 (graceful crash handling)
 *   - log_date_format for log rotation via pm2-logrotate
 *   - Env vars loaded from project-root .env (override defaults below)
 *   - watch disabled in production
 */

const fs = require('node:fs');
const path = require('node:path');

/**
 * Minimal .env loader (no extra dependency). Looks for a .env file in the
 * project root and falls back to process.env. Values already in process.env
 * win over file values, matching standard dotenv "preserve existing" rules.
 */
function loadDotenv(filePath) {
  const out = {};
  try {
    if (!fs.existsSync(filePath)) return out;
    const raw = fs.readFileSync(filePath, 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (key) out[key] = value;
    }
  } catch (_err) {
    // Swallow — services should still start with their hardcoded defaults.
  }
  return out;
}

const ROOT_ENV = loadDotenv(path.join(__dirname, '..', '.env'));
const ADDR_ENV = loadDotenv(path.join(__dirname, '..', '.autobuilder', 'addresses.env'));

function pick(key, fallback) {
  return process.env[key] || ROOT_ENV[key] || ADDR_ENV[key] || fallback;
}

const BASE_ENV = {
  L2_RPC_URL: pick('L2_RPC_URL', 'http://localhost:8545'),
  OPERATOR_PRIVATE_KEY: pick(
    'OPERATOR_PRIVATE_KEY',
    pick('PRIVATE_KEY', '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'),
  ),
  GDT_ADDRESS: pick('GDT_ADDRESS', '0x8f86403a4de0bb5791fa46b8e795c547942fe4cf'),
  UBI_FEE_SPLITTER: pick('UBI_FEE_SPLITTER', '0x809d550fca64d94bd9f66e60752a544199cfac3d'),
  CHAIN_ID: pick('CHAIN_ID', '42069'),
};

/**
 * Defaults applied to every PM2 app entry. Spread first so per-app values
 * (name, script, env, cwd) can override anything below if ever needed.
 */
const COMMON_APP = {
  cwd: __dirname,
  watch: false,
  autorestart: true,
  max_restarts: 10,
  restart_delay: 5000,
  exp_backoff_restart_delay: 100,
  max_memory_restart: '512M',
  kill_timeout: 5000,
  log_date_format: 'YYYY-MM-DD HH:mm:ss',
  merge_logs: true,
  out_file: undefined, // let PM2 default to ~/.pm2/logs/<name>-out.log
  error_file: undefined, // let PM2 default to ~/.pm2/logs/<name>-error.log
};

function app(extra) {
  return { ...COMMON_APP, ...extra };
}

module.exports = {
  apps: [
    app({
      name: 'swap-oracle',
      script: 'swap-oracle/dist/index.js',
      env: {
        ...BASE_ENV,
        SWAP_ORACLE_ADDRESS: pick('SWAP_ORACLE_ADDRESS', '0x19ceccd6942ad38562ee10bafd44776ceb67e923'),
        GDOLLAR_ADDRESS: pick('GDOLLAR_ADDRESS', BASE_ENV.GDT_ADDRESS),
        WETH_ADDRESS: pick('WETH_ADDRESS', '0xcd8a1c3ba11cf5ecfa6267617243239504a98d90'),
        USDC_ADDRESS: pick('USDC_ADDRESS', '0xb7278a61aa25c888815afc32ad3cc52ff24fe575'),
        UPDATE_INTERVAL_MS: pick('UPDATE_INTERVAL_MS', '60000'),
      },
    }),
    app({
      name: 'stocks-keeper',
      script: 'stocks-keeper/dist/index.js',
      env: {
        ...BASE_ENV,
        PRICE_ORACLE_ADDRESS: pick('PRICE_ORACLE_ADDRESS', '0x5067457698fd6fa1c6964e416b3f42713513b3dd'),
        SYNTHETIC_FACTORY: pick('SYNTHETIC_FACTORY', '0xfaaddc93baf78e89dcf37ba67943e1be8f37bb8c'),
        COLLATERAL_VAULT: pick('COLLATERAL_VAULT', '0x276c216d241856199a83bf27b2286659e5b877d3'),
      },
    }),
    app({
      name: 'activity-reporter',
      script: 'activity-reporter/dist/index.js',
      env: {
        ...BASE_ENV,
        AGENT_REGISTRY: pick('AGENT_REGISTRY', '0x8a791620dd6260079bf849dc5567adc3f2fdc318'),
        SWAP_ROUTER: pick('SWAP_ROUTER', '0x922d6956c99e12dfeb3224dea977d0939758a1fe'),
        PERP_ENGINE: pick('PERP_ENGINE', '0x172076e0166d1f9cc711c77adf8488051744980c'),
        LEND_POOL: pick('LEND_POOL', '0xcbeaf3bde82155f56486fb5a1072cb8baaf547cc'),
        MARKET_FACTORY: pick('MARKET_FACTORY', '0x02df3a3f960393f5b349e40a599feda91a7cc1a7'),
        COLLATERAL_VAULT: pick('COLLATERAL_VAULT', '0x276c216d241856199a83bf27b2286659e5b877d3'),
        VAULT_FACTORY: pick('VAULT_FACTORY', '0x66f625b8c4c635af8b74ece2d7ed0d58b4af3c3d'),
      },
    }),
    app({
      name: 'bridge-keeper',
      script: 'bridge-keeper/dist/index.js',
      env: {
        ...BASE_ENV,
        BRIDGE_ADDRESS: pick('BRIDGE_ADDRESS', '0xd42912755319665397ff090fbb63b1a31ae87cee'),
      },
    }),
    app({
      name: 'harvest-keeper',
      script: 'harvest-keeper/dist/index.js',
      env: {
        ...BASE_ENV,
        LEND_POOL: pick('LEND_POOL', '0xcbeaf3bde82155f56486fb5a1072cb8baaf547cc'),
        VAULT_FACTORY: pick('VAULT_FACTORY', '0x66f625b8c4c635af8b74ece2d7ed0d58b4af3c3d'),
      },
    }),
    app({
      name: 'indexer',
      script: 'indexer/dist/index.js',
      env: { ...BASE_ENV },
    }),
    app({
      name: 'liquidator',
      script: 'liquidator/dist/index.js',
      env: {
        ...BASE_ENV,
        PERP_ENGINE: pick('PERP_ENGINE', '0x172076e0166d1f9cc711c77adf8488051744980c'),
        LEND_POOL: pick('LEND_POOL', '0xcbeaf3bde82155f56486fb5a1072cb8baaf547cc'),
        VAULT_MANAGER: pick('VAULT_MANAGER', '0xe039608e695d21ab11675ebba00261a0e750526c'),
      },
    }),
    app({
      name: 'monitor',
      script: 'monitor/dist/index.js',
      env: { ...BASE_ENV },
    }),
    app({
      name: 'revenue-tracker',
      script: 'revenue-tracker/dist/index.js',
      env: {
        ...BASE_ENV,
        UBI_REVENUE_TRACKER: pick('UBI_REVENUE_TRACKER', '0xfd6f7a6a5c21a3f503ebae7a473639974379c351'),
        UBI_FEE_SPLITTER: BASE_ENV.UBI_FEE_SPLITTER,
      },
    }),
    app({
      name: 'rpc-balancer',
      script: 'rpc-balancer/dist/index.js',
      env: {
        ...BASE_ENV,
        PORT: pick('RPC_BALANCER_PORT', '8547'),
        UPSTREAM_RPCS: pick('UPSTREAM_RPCS', 'http://localhost:8545'),
      },
    }),
  ],
};
