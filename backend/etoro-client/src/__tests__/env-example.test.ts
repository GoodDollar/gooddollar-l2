import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { DEMO_BASE_URL_DEFAULT, DEMO_WS_URL_DEFAULT } from '../auth';

/**
 * Drift guard between the SDK's `loadCredentialsFromEnv` contract and the
 * two `.env.example` files an operator might `cp` from. The SDK reads six
 * env vars (`ETORO_DEMO_KEY`, `ETORO_DEMO_SECRET`, `ETORO_DEMO_USER_KEY`,
 * `ETORO_USER_KEY`, `ETORO_DEMO_BASE_URL`, `ETORO_DEMO_WS_URL`) and two
 * URL constants (`DEMO_BASE_URL_DEFAULT`, `DEMO_WS_URL_DEFAULT`). Both
 * `.env.example` files MUST stay in lockstep with that surface so a
 * `cp .env.example .env` flow doesn't miss a required var or document
 * the deprecated `api.etoro.com/sapi/demo` host.
 *
 * The per-package file (`backend/etoro-client/.env.example`) is
 * additionally required to never mention the deprecated host — the SDK's
 * own source still references it in a deprecation comment, but the
 * operator-copy artifact must be clean.
 */

const REQUIRED_ENV_VARS = [
  'ETORO_DEMO_KEY',
  'ETORO_DEMO_SECRET',
  'ETORO_DEMO_USER_KEY',
  'ETORO_USER_KEY',
  'ETORO_DEMO_BASE_URL',
  'ETORO_DEMO_WS_URL',
];

const DEPRECATED_DEMO_HOST = 'api.etoro.com/sapi/demo';

const REPO_ROOT_ENV_EXAMPLE = resolve(__dirname, '..', '..', '..', '..', '.env.example');
const PACKAGE_ENV_EXAMPLE = resolve(__dirname, '..', '..', '.env.example');

function read(filePath: string): string {
  return readFileSync(filePath, 'utf8');
}

describe('repo-root .env.example', () => {
  const content = read(REPO_ROOT_ENV_EXAMPLE);

  it.each(REQUIRED_ENV_VARS)('mentions %s (env var read by loadCredentialsFromEnv)', (name) => {
    expect(content).toContain(name);
  });

  it('documents the canonical demo REST base URL default', () => {
    expect(content).toContain(DEMO_BASE_URL_DEFAULT);
  });

  it('documents the canonical demo WS URL default', () => {
    expect(content).toContain(DEMO_WS_URL_DEFAULT);
  });
});

describe('backend/etoro-client/.env.example', () => {
  const content = read(PACKAGE_ENV_EXAMPLE);

  it.each([
    'ETORO_DEMO_KEY',
    'ETORO_DEMO_SECRET',
    'ETORO_DEMO_USER_KEY',
    'ETORO_DEMO_BASE_URL',
    'ETORO_DEMO_WS_URL',
  ])('mentions %s (env var read by loadCredentialsFromEnv)', (name) => {
    expect(content).toContain(name);
  });

  it('references ETORO_USER_KEY (the real-disabled-mode variant) at least as a pointer', () => {
    expect(content).toContain('ETORO_USER_KEY');
  });

  it('documents the canonical demo REST base URL default', () => {
    expect(content).toContain(DEMO_BASE_URL_DEFAULT);
  });

  it('documents the canonical demo WS URL default', () => {
    expect(content).toContain(DEMO_WS_URL_DEFAULT);
  });

  it('does NOT document the deprecated api.etoro.com/sapi/demo host', () => {
    expect(content).not.toContain(DEPRECATED_DEMO_HOST);
  });
});
