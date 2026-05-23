#!/usr/bin/env node
/**
 * Smoke check: backend/ecosystem.config.js must register every lane-1
 * service so `pm2 start backend/ecosystem.config.js` brings up the full
 * `eToro → price-service → oracle-signer → on-chain` pipeline without
 * the operator threading missing producers together by hand.
 *
 * Invoked from scripts/test-lane1-backend.sh before the per-package
 * jest loop.
 */
'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');

const ECOSYSTEM_PATH = path.resolve(__dirname, '..', 'backend', 'ecosystem.config.js');

const REQUIRED = [
  { name: 'price-service', script: /price-service\/dist\/index\.js$/ },
  { name: 'oracle-signer', script: /oracle-signer\/dist\/index\.js$/ },
  { name: 'hedge-engine',  script: /hedge-engine\/dist\/index\.js$/ },
];

const cfg = require(ECOSYSTEM_PATH);
const apps = (cfg && cfg.apps) || [];

for (const { name, script } of REQUIRED) {
  const entry = apps.find((a) => a && a.name === name);
  assert.ok(entry, `[check-pm2-ecosystem] missing PM2 entry: ${name}`);
  assert.match(
    entry.script,
    script,
    `[check-pm2-ecosystem] wrong script for ${name}: ${entry.script}`,
  );
}

console.log(
  '[check-pm2-ecosystem] ok — lane-1 PM2 entries present:',
  REQUIRED.map((r) => r.name).join(', '),
);
