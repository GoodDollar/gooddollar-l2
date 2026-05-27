// PM2 Ecosystem Config — GoodDollar L2 Services
// Usage: pm2 start pm2-ecosystem.config.js && pm2 save && pm2 startup
//
// Before running: kill unsupervised GoodSwap PIDs 735615 735627 735628
const path = require('path');

function pickEnv(key, fallback = '') {
  return process.env[key] || fallback;
}

const GOODCHAIN_LANE = process.env.GOODCHAIN_LANE || '';

function lane7Default(value, fallback = '') {
  return GOODCHAIN_LANE === 'lane7' ? value : fallback;
}

module.exports = {
  apps: [
    {
      // goodswap: Next.js production server. The ONLY supported way to
      // roll a new build into this app is `cd frontend && npm run deploy`,
      // which runs `next build` and then `pm2 reload goodswap --update-env`.
      // Running `next build` without the reload leaves a stale BUILD_ID in
      // this process and breaks all CSS site-wide (HTTP 400 on
      // _next/static/css/*.css). See:
      //   .autobuilder/initiatives/0002-security-hardening/tasks/
      //     0060-fix-frontend-deploy-stale-buildid-pm2-reload.md
      //
      // The `script` below is `pm2-launch-next.mjs`, a structural fence that
      // validates `.next/` integrity (BUILD_ID, build-manifest.json, chunk
      // sampling) before spawning `next start`. If validation fails, the
      // launcher exits non-zero so PM2 keeps the previous instance running
      // and surfaces a clear error in `pm2 logs goodswap --err`. See:
      //   .autobuilder/initiatives/0004-testnet-readiness-gate/tasks/
      //     0018-iter18-blocker-frontend-build-regression-fence.md
      name: 'goodswap',
      script: 'scripts/pm2-launch-next.mjs',
      args: '--port 3100',
      interpreter: 'node',
      cwd: '/home/goodclaw/gooddollar-l2/frontend',
      restart_delay: 3000,
      max_restarts: 10,
      kill_timeout: 5000,
      env: {
        NODE_ENV: 'production',
        GOODCHAIN_LANE,
        PRICE_SERVICE_URL: pickEnv(
          'PRICE_SERVICE_URL',
          lane7Default('http://127.0.0.1:49300/status/quotes'),
        ),
        NEXT_PUBLIC_PRICE_SERVICE_URL: pickEnv(
          'NEXT_PUBLIC_PRICE_SERVICE_URL',
          lane7Default('http://127.0.0.1:49300'),
        ),
        ORACLE_SIGNER_URL: pickEnv(
          'ORACLE_SIGNER_URL',
          lane7Default('http://127.0.0.1:49107/proof'),
        ),
        ORACLE_SIGNER_PROOF_URL: pickEnv('ORACLE_SIGNER_PROOF_URL'),
        NEXT_PUBLIC_STOCK_ORACLE_V2_ADDRESS: pickEnv(
          'NEXT_PUBLIC_STOCK_ORACLE_V2_ADDRESS',
          process.env.STOCK_ORACLE_V2_ADDRESS || process.env.STOCK_ORACLE_V2 || '',
        ),
      },
    },
    {
      name: 'goodperps',
      script: 'dist/index.js',
      cwd: '/home/goodclaw/gooddollar-l2/backend/perps',
      restart_delay: 3000,
      max_restarts: 10,
      env: { NODE_ENV: 'production', PORT: '8082' },
    },
    {
      name: 'goodpredict',
      script: 'dist/index.js',
      cwd: '/home/goodclaw/gooddollar-l2/backend/predict',
      restart_delay: 3000,
      max_restarts: 10,
      env: {
        NODE_ENV: 'production',
        PORT: '3040',
        L2_RPC_URL: 'https://rpc.goodclaw.org',
        MARKET_FACTORY_ADDRESS: '0x2fe9Dfa9FaF3Ebcc293Df4832BCAd687999CD63E',
        CONDITIONAL_TOKENS_ADDRESS: '0x903D0d0b1521FDB3999b4044E1d15109038F00Fe',
        GOOD_DOLLAR_ADDRESS: '0x68d2ecd85bdebffd075fb6d87ffd829ad025dd5c',
        UBI_FEE_SPLITTER_ADDRESS: '0xdc64a140aa3e981100a9beca4e685f962f0cf6c9',
        OPERATOR_PRIVATE_KEY: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
        POLYMARKET_POLL_MS: '30000',
      },
    },
    {
      // goodprice: backend/price-service (Lane 2 of 0007 live-prices).
      // Normalizes eToro market data, applies risk filters (staleness,
      // spread, deviation, asset-class session rules), serves quotes via
      // REST (9300) and WebSocket (9301), and writes a JSONL audit log
      // for every ingestion event.
      //
      // SAFE-BY-DEFAULT. ETORO_MODE=sandbox and REAL_TRADING_ENABLED=false
      // are hardcoded here so the eToro client cannot accidentally hit a
      // real-money endpoint. No supported code path enables real trading.
      //
      // cwd resolves portably: honor GOODPRICE_CWD, otherwise resolve
      // relative to this config file. Works from the autobuilder worktree
      // (~/goodchain-live-prices-lanes/lane2-price-service) and from the
      // main repo (~/gooddollar-l2) once merged.
      name: 'goodprice',
      script: 'dist/index.js',
      cwd: process.env.GOODPRICE_CWD
        ?? path.resolve(__dirname, 'backend/price-service'),
      restart_delay: 3000,
      max_restarts: 10,
      kill_timeout: 5000,
      env: {
        NODE_ENV: 'production',
        ETORO_MODE: 'sandbox',
        REAL_TRADING_ENABLED: 'false',
        PRICE_SERVICE_PORT: '9300',
        PRICE_SERVICE_WS_PORT: '9301',
      },
    },
  ],
};
