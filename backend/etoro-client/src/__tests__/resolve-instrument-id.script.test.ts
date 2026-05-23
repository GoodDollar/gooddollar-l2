import { runResolveInstrumentId } from '../../scripts/resolve-instrument-id';
import { createMockAxios } from './test-helpers';

const SEARCH_HIT_AAPL = {
  instrumentId: 'INST-1001',
  internalSymbolFull: 'AAPL',
  symbol: 'AAPL',
  displayname: 'Apple Inc.',
  instrumentType: 'Stock',
  isCurrentlyTradable: true,
};

const SEARCH_HIT_BTC = {
  instrumentId: 'INST-100100',
  internalSymbolFull: 'BTC',
  symbol: 'BTC',
  displayname: 'Bitcoin',
  instrumentType: 'CryptoCurrency',
  isCurrentlyTradable: true,
};

interface CapturedStreams {
  out: string[];
  err: string[];
}

function captureStreams(): CapturedStreams {
  return { out: [], err: [] };
}

function streamsAsDeps(c: CapturedStreams) {
  return {
    stdout: { write: (s: string) => { c.out.push(s); } },
    stderr: { write: (s: string) => { c.err.push(s); } },
  };
}

describe('resolve-instrument-id script', () => {
  it('refuses mock mode with exit 2 and a clear stderr message', async () => {
    const c = captureStreams();
    const code = await runResolveInstrumentId(['AAPL'], {
      env: { ETORO_MODE: 'mock' },
      ...streamsAsDeps(c),
    });
    expect(code).toBe(2);
    expect(c.out.join('')).toBe('');
    expect(c.err.join('')).toMatch(/refusing.*mock/i);
  });

  it('exits 2 with a Usage message when no symbols are passed', async () => {
    const c = captureStreams();
    const code = await runResolveInstrumentId([], {
      env: { ETORO_MODE: 'mock' },
      ...streamsAsDeps(c),
    });
    expect(code).toBe(2);
    expect(c.err.join('')).toMatch(/usage/i);
  });

  it('prints one TSV row per resolved symbol on stdout (success path)', async () => {
    const http = createMockAxios({
      search: {
        AAPL: [SEARCH_HIT_AAPL],
        BTC: [SEARCH_HIT_BTC],
      },
    });
    const c = captureStreams();
    const code = await runResolveInstrumentId(['AAPL', 'BTC'], {
      env: {
        ETORO_MODE: 'demo-readonly',
        ETORO_DEMO_KEY: 'k',
        ETORO_DEMO_SECRET: 's',
        ETORO_DEMO_USER_KEY: 'u',
      },
      http,
      ...streamsAsDeps(c),
    });
    expect(code).toBe(0);
    const rows = c.out.join('').split('\n').filter(Boolean);
    expect(rows).toEqual([
      'AAPL\tINST-1001\tStock\tApple Inc.',
      'BTC\tINST-100100\tCryptoCurrency\tBitcoin',
    ]);
  });

  it('exits 2 with partial successes on stdout and unresolved on stderr', async () => {
    const http = createMockAxios({
      search: {
        AAPL: [SEARCH_HIT_AAPL],
        FOO: [],
      },
    });
    const c = captureStreams();
    const code = await runResolveInstrumentId(['AAPL', 'FOO'], {
      env: {
        ETORO_MODE: 'demo-readonly',
        ETORO_DEMO_KEY: 'k',
        ETORO_DEMO_SECRET: 's',
        ETORO_DEMO_USER_KEY: 'u',
      },
      http,
      ...streamsAsDeps(c),
    });
    expect(code).toBe(2);
    expect(c.out.join('')).toContain('AAPL\tINST-1001\tStock\tApple Inc.');
    expect(c.err.join('')).toMatch(/unresolved.*FOO/i);
  });

  it('never echoes secret env values to stdout or stderr', async () => {
    const http = createMockAxios({ search: { AAPL: [SEARCH_HIT_AAPL] } });
    const c = captureStreams();
    const SECRET_KEY = 'super-secret-key-XYZ';
    const SECRET_SECRET = 'super-secret-secret-XYZ';
    const SECRET_USER = 'super-secret-user-XYZ';
    await runResolveInstrumentId(['AAPL'], {
      env: {
        ETORO_MODE: 'demo-readonly',
        ETORO_DEMO_KEY: SECRET_KEY,
        ETORO_DEMO_SECRET: SECRET_SECRET,
        ETORO_DEMO_USER_KEY: SECRET_USER,
      },
      http,
      ...streamsAsDeps(c),
    });
    const all = c.out.join('') + c.err.join('');
    expect(all).not.toContain(SECRET_KEY);
    expect(all).not.toContain(SECRET_SECRET);
    expect(all).not.toContain(SECRET_USER);
  });
});
