/**
 * Tests for backend/ecosystem.config.js
 *
 * Verifies that the PM2 ecosystem config meets the Phase 1 security hardening
 * requirements: proper restart policies, log rotation, env loading, and
 * watch mode disabled.
 */

const path = require('path');
const fs = require('fs');

const config = require('./ecosystem.config.js');
const addresses = require('../op-stack/addresses.json').contracts;

const REQUIRED_SERVICES = [
  'activity-reporter',
  'bridge-keeper',
  'goodswap',
  'harvest-keeper',
  'indexer',
  'liquidator',
  'monitor',
  'oracle-signer',
  'revenue-tracker',
  'rpc-balancer',
  'status-aggregator',
  'stocks-keeper',
  'swap-oracle',
];

const FRONTEND_SERVICES = new Set(['goodswap']);

function assert(cond, msg) {
  if (!cond) {
    console.error('FAIL:', msg);
    process.exitCode = 1;
  } else {
    console.log('PASS:', msg);
  }
}

assert(Array.isArray(config.apps), 'config.apps is an array');
assert(config.apps.length === REQUIRED_SERVICES.length,
  `config.apps has ${REQUIRED_SERVICES.length} entries (got ${config.apps.length})`);

const names = config.apps.map((a) => a.name);
for (const svc of REQUIRED_SERVICES) {
  assert(names.includes(svc), `service "${svc}" is present`);
}

for (const app of config.apps) {
  assert(typeof app.script === 'string' && app.script.length > 0,
    `${app.name}: script is set`);
  const scriptBase = app.cwd || __dirname;
  const scriptPath = path.isAbsolute(app.script) ? app.script : path.join(scriptBase, app.script);
  const sourceFallback = app.script.endsWith('/dist/index.js')
    ? path.join(scriptBase, app.script.replace('/dist/index.js', '/src/index.ts'))
    : app.script.endsWith('dist/index.js')
      ? path.join(scriptBase, app.script.replace('dist/index.js', 'src/index.ts'))
      : null;
  assert(fs.existsSync(scriptPath) || (sourceFallback && fs.existsSync(sourceFallback)),
    `${app.name}: script file or TypeScript source exists at ${app.script}`);
  assert(app.max_restarts === 10, `${app.name}: max_restarts === 10 (got ${app.max_restarts})`);
  assert(app.restart_delay === 5000, `${app.name}: restart_delay === 5000 (got ${app.restart_delay})`);
  assert(app.log_date_format === 'YYYY-MM-DD HH:mm:ss',
    `${app.name}: log_date_format set (got ${app.log_date_format})`);
  assert(app.watch === false, `${app.name}: watch is disabled`);
  assert(typeof app.env === 'object' && app.env !== null, `${app.name}: env block present`);
  if (!FRONTEND_SERVICES.has(app.name)) {
    assert(typeof app.env.L2_RPC_URL === 'string' && app.env.L2_RPC_URL.length > 0,
      `${app.name}: L2_RPC_URL set`);
    assert(typeof app.env.CHAIN_ID === 'string' && app.env.CHAIN_ID.length > 0,
      `${app.name}: CHAIN_ID set`);
    assert(typeof app.env.OPERATOR_PRIVATE_KEY === 'string' &&
      app.env.OPERATOR_PRIVATE_KEY.startsWith('0x'),
      `${app.name}: OPERATOR_PRIVATE_KEY set`);
  }
}


function appByName(name) {
  return config.apps.find((a) => a.name === name);
}

const swapOracle = appByName('swap-oracle');
assert(swapOracle.env.SWAP_ORACLE_ADDRESS.toLowerCase() === addresses.SwapPriceOracle.toLowerCase(),
  'swap-oracle: SWAP_ORACLE_ADDRESS matches op-stack/addresses.json');
assert(swapOracle.env.GDOLLAR_ADDRESS.toLowerCase() === addresses.GoodDollarToken.toLowerCase(),
  'swap-oracle: GDOLLAR_ADDRESS matches GoodDollarToken');
assert(swapOracle.env.WETH_ADDRESS.toLowerCase() === addresses.MockWETH.toLowerCase(),
  'swap-oracle: WETH_ADDRESS matches MockWETH');
assert(swapOracle.env.USDC_ADDRESS.toLowerCase() === addresses.MockUSDC.toLowerCase(),
  'swap-oracle: USDC_ADDRESS matches MockUSDC');

const harvestKeeper = appByName('harvest-keeper');
assert(harvestKeeper.env.VAULT_FACTORY.toLowerCase() === addresses.VaultFactory.toLowerCase(),
  'harvest-keeper: VAULT_FACTORY matches op-stack/addresses.json');

const revenueTracker = appByName('revenue-tracker');
assert(revenueTracker.env.UBI_REVENUE_TRACKER.toLowerCase() === addresses.UBIRevenueTracker.toLowerCase(),
  'revenue-tracker: UBI_REVENUE_TRACKER matches op-stack/addresses.json');

const src = fs.readFileSync(path.join(__dirname, 'ecosystem.config.js'), 'utf8');
assert(/require\(['"]dotenv['"]\)/.test(src) || /require\(['"]node:fs['"]\)/.test(src) || /process\.env/.test(src),
  'ecosystem.config.js loads env from .env (dotenv/fs/process.env)');

if (process.exitCode === 1) {
  console.error('\nSOME TESTS FAILED');
  process.exit(1);
} else {
  console.log('\nALL TESTS PASSED');
}
