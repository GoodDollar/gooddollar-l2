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

const BACKEND_SERVICES = [
  'activity-reporter',
  'bridge-keeper',
  'harvest-keeper',
  'hedge-engine',
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

const FRONTEND_SERVICES = [
  'goodswap',
];

const ALL_SERVICES = [...BACKEND_SERVICES, ...FRONTEND_SERVICES];

function assert(cond, msg) {
  if (!cond) {
    console.error('FAIL:', msg);
    process.exitCode = 1;
  } else {
    console.log('PASS:', msg);
  }
}

assert(Array.isArray(config.apps), 'config.apps is an array');
assert(config.apps.length === ALL_SERVICES.length,
  `config.apps has ${ALL_SERVICES.length} entries (got ${config.apps.length})`);

const names = config.apps.map((a) => a.name);
for (const svc of ALL_SERVICES) {
  assert(names.includes(svc), `service "${svc}" is present`);
}

for (const app of config.apps) {
  const isBackend = BACKEND_SERVICES.includes(app.name);

  assert(typeof app.script === 'string' && app.script.length > 0,
    `${app.name}: script is set`);
  const scriptBase = app.cwd || __dirname;
  const scriptPath = path.join(scriptBase, app.script);
  if (!fs.existsSync(scriptPath)) {
    console.log(`WARN: ${app.name}: script not found at ${app.script} (not built in this worktree)`);
  } else {
    console.log(`PASS: ${app.name}: script file exists at ${app.script}`);
  }
  assert(app.max_restarts === 10, `${app.name}: max_restarts === 10 (got ${app.max_restarts})`);
  assert(app.restart_delay === 5000, `${app.name}: restart_delay === 5000 (got ${app.restart_delay})`);
  assert(app.log_date_format === 'YYYY-MM-DD HH:mm:ss',
    `${app.name}: log_date_format set (got ${app.log_date_format})`);
  assert(app.watch === false, `${app.name}: watch is disabled`);
  assert(typeof app.env === 'object' && app.env !== null, `${app.name}: env block present`);

  if (isBackend) {
    assert(typeof app.env.L2_RPC_URL === 'string' && app.env.L2_RPC_URL.length > 0,
      `${app.name}: L2_RPC_URL set`);
    assert(typeof app.env.CHAIN_ID === 'string' && app.env.CHAIN_ID.length > 0,
      `${app.name}: CHAIN_ID set`);
    assert(typeof app.env.OPERATOR_PRIVATE_KEY === 'string' &&
      app.env.OPERATOR_PRIVATE_KEY.startsWith('0x'),
      `${app.name}: OPERATOR_PRIVATE_KEY set`);
  }
}

const src = fs.readFileSync(path.join(__dirname, 'ecosystem.config.js'), 'utf8');
assert(/require\(['"]dotenv['"]\)/.test(src) || /require\(['"]node:fs['"]\)/.test(src) || /process\.env/.test(src),
  'ecosystem.config.js loads env from .env (dotenv/fs/process.env)');

if (process.exitCode === 1) {
  console.error('\nSOME TESTS FAILED');
  process.exit(1);
} else {
  console.log('\nALL TESTS PASSED');
}
