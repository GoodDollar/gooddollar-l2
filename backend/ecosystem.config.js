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
 * Minimal .env-file parser (no extra dependency). Precedence is applied by
 * pick(): generated deployment address artifacts first, then root .env, then
 * process.env as the final operator override/backstop.
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
const GOODCHAIN_LANE = process.env.GOODCHAIN_LANE || ROOT_ENV.GOODCHAIN_LANE || '';

function loadAddressJsonEnv(filePath) {
  const out = {};
  try {
    if (!fs.existsSync(filePath)) return out;
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const contracts = data.contracts && typeof data.contracts === 'object' ? data.contracts : {};
    const aliases = {
      GoodDollarToken: ['GDT', 'GDT_ADDRESS', 'GDOLLAR_ADDRESS'],
      UBIFeeSplitter: ['FEE_SPLITTER', 'UBI_FEE_SPLITTER'],
      LiFiBridgeAggregator: ['LIFI', 'BRIDGE_ADDRESS'],
      ValidatorStaking: ['UBI'],
      FundingRate: ['FUNDING_RATE'],
      MarginVault: ['VAULT'],
      PerpPriceOracle: ['PERP_ORACLE', 'PRICE_ORACLE_ADDRESS'],
      PerpEngine: ['PERP', 'PERP_ENGINE'],
      ConditionalTokens: ['CONDITIONAL_TOKENS'],
      MarketFactory: ['MF', 'MARKET_FACTORY'],
      AgentRegistry: ['AGENT_REGISTRY'],
      StocksPriceOracle: ['PRICE_ORACLE_ADDRESS'],
      SyntheticAssetFactory: ['STOCKS', 'SYNTHETIC_FACTORY'],
      CollateralVault: ['COLLATERAL_VAULT'],
      GoodLendPool: ['LEND', 'LEND_POOL'],
      GoodSwapRouter: ['SWAP', 'SWAP_ROUTER'],
      SwapPriceOracle: ['SWAP_ORACLE', 'SWAP_ORACLE_ADDRESS'],
      VaultManager: ['VAULT_MANAGER'],
      VaultFactory: ['VAULT_FACTORY'],
      gUSD: ['GUSD'],
      MockWETH: ['WETH', 'WETH_ADDRESS'],
      MockUSDC: ['USDC', 'USDC_ADDRESS'],
      CollateralRegistry: ['COLLATERAL_REGISTRY'],
      GoodLendToken: ['GTOKEN'],
      UBIRevenueTracker: ['UBI_REVENUE_TRACKER'],
      StockOracleV2: ['STOCK_ORACLE_V2', 'STOCK_ORACLE_V2_ADDRESS'],
      StockOracleV2Adapter: ['STOCK_ORACLE_V2_ADAPTER'],
    };
    for (const [name, value] of Object.entries(contracts)) {
      if (!value || typeof value !== 'string') continue;
      out[name] = value;
      out[name.toUpperCase()] = value;
      for (const key of aliases[name] || []) out[key] = value;
    }
  } catch (_err) {
    // Swallow — services should still start from addresses.env/.env/fallbacks.
  }
  return out;
}

const ADDR_JSON_ENV = loadAddressJsonEnv(path.join(__dirname, '..', 'op-stack', 'addresses.json'));
const LANE7_ADDR_JSON_ENV = GOODCHAIN_LANE === 'lane7'
  ? loadAddressJsonEnv(path.join(__dirname, '..', 'op-stack', 'addresses.lane7.json'))
  : {};

function pick(key, fallback) {
  // Prefer canonical deployed-address artifacts over .env and the PM2 parent
  // process. Parent/root env can retain stale devnet addresses after an Anvil
  // reset, which made services restart against contracts with no bytecode.
  return ADDR_JSON_ENV[key] || ADDR_ENV[key] || ROOT_ENV[key] || process.env[key] || fallback;
}

function pickAny(keys, fallback) {
  for (const key of keys) {
    const value = pick(key, undefined);
    if (value) return value;
  }
  return fallback;
}

function pickRuntimeAny(keys, fallback) {
  // Runtime lane wiring such as StockOracleV2 may intentionally diverge from
  // generated deployment artifacts after a lane-local Anvil reset. Let the
  // operator's exported env/.env win for those keys, then fall back to the
  // lane7 overlay when explicitly opted in, then canonical address artifacts.
  for (const key of keys) {
    const value =
      process.env[key] ||
      ROOT_ENV[key] ||
      LANE7_ADDR_JSON_ENV[key] ||
      ADDR_JSON_ENV[key] ||
      ADDR_ENV[key];
    if (value) return value;
  }
  return fallback;
}

function lane7Default(value, fallback = '') {
  return GOODCHAIN_LANE === 'lane7' ? value : fallback;
}

function pickOperatorAny(keys, fallback) {
  for (const key of keys) {
    const value = process.env[key] || ROOT_ENV[key];
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
  GDT_ADDRESS: pickAny(['GDT_ADDRESS', 'GDT'], '0x5fbdb2315678afecb367f032d93f642f64180aa3'),
  UBI_FEE_SPLITTER: pickAny(['UBI_FEE_SPLITTER', 'FEE_SPLITTER'], '0xdc64a140aa3e981100a9beca4e685f962f0cf6c9'),
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
        SWAP_ORACLE_ADDRESS: pickAny(['SWAP_ORACLE_ADDRESS', 'SWAP_ORACLE'], '0x40a42baf86fc821f972ad2ac878729063ceef403'),
        GDOLLAR_ADDRESS: pickAny(['GDOLLAR_ADDRESS', 'GDT_ADDRESS', 'GDT'], '0x5fbdb2315678afecb367f032d93f642f64180aa3'),
        WETH_ADDRESS: pick('WETH_ADDRESS', '0x8f86403a4de0bb5791fa46b8e795c547942fe4cf'),
        USDC_ADDRESS: pick('USDC_ADDRESS', '0x0e801d84fa97b50751dbf25036d067dcf18858bf'),
        UPDATE_INTERVAL_MS: pick('SWAP_ORACLE_UPDATE_INTERVAL_MS', '900000'),
      },
    }),
    app({
      name: 'stocks-keeper',
      script: 'stocks-keeper/dist/index.js',
      env: {
        ...BASE_ENV,
        PRICE_ORACLE_ADDRESS: pickOperatorAny(['PRICE_ORACLE_ADDRESS'], ''),
        STOCK_ORACLE_V2_ADDRESS: pickRuntimeAny(['STOCK_ORACLE_V2_ADDRESS', 'STOCK_ORACLE_V2'], '0xF357118EBd576f3C812c7875B1A1651a7f140E9C'),
        SYNTHETIC_FACTORY: pickAny(['SYNTHETIC_FACTORY', 'STOCKS'], '0x4b6ab5f819a515382b0deb6935d793817bb4af28'),
        COLLATERAL_VAULT: pick('COLLATERAL_VAULT', '0xcace1b78160ae76398f486c8a18044da0d66d86d'),
        UPDATE_INTERVAL_MS: pick('STOCKS_KEEPER_UPDATE_INTERVAL_MS', '900000'),
      },
    }),
    app({
      name: 'activity-reporter',
      script: 'activity-reporter/dist/index.js',
      env: {
        ...BASE_ENV,
        AGENT_REGISTRY: pick('AGENT_REGISTRY', '0x8a791620dd6260079bf849dc5567adc3f2fdc318'),
        SWAP_ROUTER: pickAny(['SWAP_ROUTER', 'SWAP'], '0x262e2b50219620226c5fb5956432a88fffd94ba7'),
        PERP_ENGINE: pickAny(['PERP_ENGINE', 'PERP'], '0x90c84237fddf091b1e63f369af122eb46000bc70'),
        LEND_POOL: pickAny(['LEND_POOL', 'LEND'], '0x5f3f1dbd7b74c6b46e8c44f98792a1daf8d69154'),
        MARKET_FACTORY: pickAny(['MARKET_FACTORY', 'MF'], '0x54b8d8e2455946f2a5b8982283f2359812e815ce'),
        COLLATERAL_VAULT: pick('COLLATERAL_VAULT', '0xcace1b78160ae76398f486c8a18044da0d66d86d'),
        VAULT_FACTORY: pick('VAULT_FACTORY', '0x6a59cc73e334b018c9922793d96df84b538e6fd5'),
      },
    }),
    app({
      name: 'bridge-keeper',
      script: 'bridge-keeper/dist/index.js',
      env: {
        ...BASE_ENV,
        BRIDGE_ADDRESS: pick('BRIDGE_ADDRESS', '0x0165878a594ca255338adfa4d48449f69242eb8f'),
      },
    }),
    app({
      name: 'harvest-keeper',
      script: 'harvest-keeper/dist/index.js',
      env: {
        ...BASE_ENV,
        LEND_POOL: pickAny(['LEND_POOL', 'LEND'], '0x5f3f1dbd7b74c6b46e8c44f98792a1daf8d69154'),
        VAULT_FACTORY: pick('VAULT_FACTORY', '0x6a59cc73e334b018c9922793d96df84b538e6fd5'),
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
        PERP_ENGINE: pickAny(['PERP_ENGINE', 'PERP'], '0x90c84237fddf091b1e63f369af122eb46000bc70'),
        LEND_POOL: pickAny(['LEND_POOL', 'LEND'], '0x5f3f1dbd7b74c6b46e8c44f98792a1daf8d69154'),
        VAULT_MANAGER: pick('VAULT_MANAGER', '0x5d42ebdbba61412295d7b0302d6f50ac449ddb4f'),
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
        UBI_REVENUE_TRACKER: pick('UBI_REVENUE_TRACKER', '0x162700d1613dfec978032a909de02643bc55df1a'),
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
      name: 'hedge-engine',
      script: 'hedge-engine/dist/index.js',
      env: {
        ...BASE_ENV,
        // RISK_ENGINE_ADDRESS intentionally defaults to '' when not deployed.
        // The service starts in health-only mode (engine loop disabled) until
        // this is set, so the health port (9106) stays bound and the
        // status-aggregator can reach it.
        RISK_ENGINE_ADDRESS: pick('RISK_ENGINE_ADDRESS', ''),
        HEDGE_ENGINE_PORT: pick('HEDGE_ENGINE_PORT', '9106'),
        HEDGE_DRY_RUN: pick('HEDGE_DRY_RUN', 'true'),
        HEDGE_POLL_INTERVAL_MS: pick('HEDGE_POLL_INTERVAL_MS', '30000'),
        HEDGE_SYMBOLS: pick('HEDGE_SYMBOLS', 'AAPL,TSLA,NVDA,MSFT,META,AMZN,GOOGL,SPY,QQQ'),
        HEDGE_DELTA_THRESHOLD_USD: pick('HEDGE_DELTA_THRESHOLD_USD', '5000'),
        HEDGE_DELTA_THRESHOLD_PCT: pick('HEDGE_DELTA_THRESHOLD_PCT', '2'),
      },
    }),
    // Lane-1 price producer — defaults to ETORO_MODE=mock so PM2 can bring
    // up the lane on any host without demo credentials. The downstream
    // oracle-signer entry below points its PRICE_SERVICE_URL at this
    // service's WS broadcaster (9301). Set ETORO_MODE (and demo creds)
    // via the host's environment to switch to live demo.
    //
    // Lane-7 (0007g/0004) fence: REAL_TRADING_ENABLED defaults to 'false'
    // so the price producer cannot issue real eToro execution calls until
    // the operator explicitly opts in via the host environment. Lane-7's
    // initiative spec mandates this default for any testnet host.
    app({
      name: 'price-service',
      script: 'price-service/dist/index.js',
      env: {
        ...BASE_ENV,
        ETORO_MODE: pick('ETORO_MODE', 'mock'),
        REAL_TRADING_ENABLED: pick('REAL_TRADING_ENABLED', 'false'),
        ORACLE_SYMBOLS: pick('ORACLE_SYMBOLS', 'AAPL,TSLA,NVDA,MSFT,META,AMZN,GOOGL,SPY,QQQ,NFLX'),
      },
    }),
    app({
      name: 'oracle-signer',
      script: 'oracle-signer/dist/index.js',
      env: {
        ...BASE_ENV,
        PRICE_SERVICE_URL: pick('PRICE_SERVICE_URL', 'ws://localhost:4001'),
        STOCK_ORACLE_V2_ADDRESS: pickRuntimeAny(['STOCK_ORACLE_V2_ADDRESS', 'STOCK_ORACLE_V2'], '0xF357118EBd576f3C812c7875B1A1651a7f140E9C'),
        // ORACLE_SIGNER_KEY intentionally defaults to '' when not provisioned.
        // The service starts in health-only mode (submission loop disabled) until
        // this is set, so the health port (9107) stays bound and the
        // status-aggregator can reach it.
        ORACLE_SIGNER_KEY: pick('ORACLE_SIGNER_KEY', ''),
        ORACLE_SIGNER_PORT: pick('ORACLE_SIGNER_PORT', '9107'),
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
        GOODCHAIN_LANE,
        PRICE_SERVICE_URL: pickRuntimeAny(
          ['PRICE_SERVICE_URL'],
          lane7Default('http://127.0.0.1:49300/status/quotes'),
        ),
        NEXT_PUBLIC_PRICE_SERVICE_URL: pickRuntimeAny(
          ['NEXT_PUBLIC_PRICE_SERVICE_URL', 'PRICE_SERVICE_URL'],
          lane7Default('http://127.0.0.1:49300'),
        ),
        ORACLE_SIGNER_URL: pickRuntimeAny(
          ['ORACLE_SIGNER_URL'],
          lane7Default('http://127.0.0.1:49107/proof'),
        ),
        STATUS_AGGREGATOR_URL: pickRuntimeAny(
          ['STATUS_AGGREGATOR_URL'],
          lane7Default('http://127.0.0.1:49200/status.json'),
        ),
        NEXT_PUBLIC_STOCK_ORACLE_V2_ADDRESS: pickOperatorAny(['NEXT_PUBLIC_STOCK_ORACLE_V2_ADDRESS', 'STOCK_ORACLE_V2_ADDRESS', 'STOCK_ORACLE_V2'], ''),
      },
    }),
  ],
};
