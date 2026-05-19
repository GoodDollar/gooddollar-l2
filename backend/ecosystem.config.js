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
      // Strip inline comments (anything after a whitespace+# pair) when value is
      // unquoted. This protects downstream consumers from malformed env files
      // that legacy generators may still produce. See iter04 task 0005.
      const hashIdx = value.search(/\s+#/);
      if (hashIdx !== -1) {
        value = value.slice(0, hashIdx).trim();
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
  // Prefer file artifacts over the gateway/PM2 parent process env. The parent
  // env can retain stale devnet addresses after an Anvil reset, which made
  // services restart against contracts with no bytecode.
  return ROOT_ENV[key] || ADDR_ENV[key] || process.env[key] || fallback;
}

function pickAny(keys, fallback) {
  for (const key of keys) {
    const value = pick(key, undefined);
    if (value) return value;
  }
  return fallback;
}

const BASE_ENV = {
  L2_RPC_URL: pickAny(['L2_RPC_URL', 'RPC'], 'http://localhost:8545'),
  OPERATOR_PRIVATE_KEY: pick(
    'OPERATOR_PRIVATE_KEY',
    pickAny(['PRIVATE_KEY', 'DEPLOYER_KEY'], '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'),
  ),
  GDT_ADDRESS: pickAny(['GDT_ADDRESS', 'GDT'], '0x8f86403a4de0bb5791fa46b8e795c547942fe4cf'),
  UBI_FEE_SPLITTER: pickAny(['UBI_FEE_SPLITTER', 'FEE_SPLITTER'], '0x809d550fca64d94bd9f66e60752a544199cfac3d'),
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
        SWAP_ORACLE_ADDRESS: pickAny(['SWAP_ORACLE_ADDRESS', 'SWAP_ORACLE'], '0x19ceccd6942ad38562ee10bafd44776ceb67e923'),
        GDOLLAR_ADDRESS: pickAny(['GDOLLAR_ADDRESS', 'GDT_ADDRESS', 'GDT'], BASE_ENV.GDT_ADDRESS),
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
        PRICE_ORACLE_ADDRESS: pick('PRICE_ORACLE_ADDRESS', '0x20d7b364e8ed1f4260b5b90c41c2dec3c1f6d367'),
        SYNTHETIC_FACTORY: pickAny(['SYNTHETIC_FACTORY', 'STOCKS'], '0xfaaddc93baf78e89dcf37ba67943e1be8f37bb8c'),
        COLLATERAL_VAULT: pick('COLLATERAL_VAULT', '0x276c216d241856199a83bf27b2286659e5b877d3'),
      },
    }),
    app({
      name: 'activity-reporter',
      script: 'activity-reporter/dist/index.js',
      env: {
        ...BASE_ENV,
        AGENT_REGISTRY: pick('AGENT_REGISTRY', '0x8a791620dd6260079bf849dc5567adc3f2fdc318'),
        SWAP_ROUTER: pickAny(['SWAP_ROUTER', 'SWAP'], '0x922d6956c99e12dfeb3224dea977d0939758a1fe'),
        PERP_ENGINE: pickAny(['PERP_ENGINE', 'PERP'], '0x172076e0166d1f9cc711c77adf8488051744980c'),
        LEND_POOL: pickAny(['LEND_POOL', 'LEND'], '0xcbeaf3bde82155f56486fb5a1072cb8baaf547cc'),
        MARKET_FACTORY: pickAny(['MARKET_FACTORY', 'MF'], '0xfaA7b3a4b5c3f54a934a2e33D34C7bC099f96CCE'),
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
        LEND_POOL: pickAny(['LEND_POOL', 'LEND'], '0xcbeaf3bde82155f56486fb5a1072cb8baaf547cc'),
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
        PERP_ENGINE: pickAny(['PERP_ENGINE', 'PERP'], '0x172076e0166d1f9cc711c77adf8488051744980c'),
        LEND_POOL: pickAny(['LEND_POOL', 'LEND'], '0xcbeaf3bde82155f56486fb5a1072cb8baaf547cc'),
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
    app({
      name: 'status-aggregator',
      cwd: path.join(__dirname, 'status-aggregator'),
      script: 'node_modules/.bin/ts-node',
      args: 'src/index.ts',
      env: {
        ...BASE_ENV,
        PORT: pick('STATUS_AGGREGATOR_PORT', '9200'),
      },
    }),
    app({
      name: 'oracle-signer',
      script: 'oracle-signer/dist/index.js',
      env: {
        ...BASE_ENV,
        PRICE_SERVICE_URL: pick('PRICE_SERVICE_URL', 'ws://localhost:4001'),
        STOCK_ORACLE_V2_ADDRESS: pickAny(['STOCK_ORACLE_V2_ADDRESS', 'STOCK_ORACLE_V2'], ''),
        ORACLE_SIGNER_KEY: pick('ORACLE_SIGNER_KEY', ''),
        ORACLE_UPDATE_INTERVAL: pick('ORACLE_UPDATE_INTERVAL', '5000'),
        ORACLE_MIN_DEVIATION: pick('ORACLE_MIN_DEVIATION', '10'),
        ORACLE_SYMBOLS: pick('ORACLE_SYMBOLS', 'AAPL,TSLA,NVDA,MSFT,META,AMZN,GOOGL,SPY,QQQ,NFLX'),
      },
    }),
    // Iter 3 (testnet-readiness-gate): adopt the goodswap Next.js frontend
    // into ecosystem.config.js so PM2 supervises it with production-grade
    // restart policies and a pinned NEXT_SERVER_ACTIONS_ENCRYPTION_KEY.
    //
    // Without the pinned key Next 14 generates a fresh action ID on every
    // `next build`, producing the `Failed to find Server Action "x"` crash
    // loop that accumulated 4,400+ restarts on the ad-hoc PM2 entry.
    //
    // Layout note: the repo is an npm workspace (frontend, sdk) so the
    // `next` binary is hoisted to the repo-root node_modules. We invoke it
    // directly to bypass `npx`, which swallows signals and re-resolves the
    // binary on every restart.
    app({
      name: 'goodswap',
      cwd: path.resolve(__dirname, '..', 'frontend'),
      script: path.resolve(__dirname, '..', 'node_modules', '.bin', 'next'),
      args: 'start -p 3100',
      min_uptime: '30s',
      max_memory_restart: '1G',
      kill_timeout: 10000,
      node_args: '--max-old-space-size=896',
      env: {
        NODE_ENV: 'production',
        PORT: '3100',
        NEXT_SERVER_ACTIONS_ENCRYPTION_KEY: pick(
          'NEXT_SERVER_ACTIONS_ENCRYPTION_KEY',
          '',
        ),
      },
    }),
  ],
};
