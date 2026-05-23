import {
  bootstrapEtoroSource,
  defaultBootstrapDeps,
  type BootstrapDeps,
} from '../bootstrap';
import { PriceService } from '../index';
import { InvalidModeError } from '@goodchain/etoro-client';
import type { MarketDataSource } from '../etoro-source';
import type { NormalizedQuote } from '../types';

function makeStubMarketData(): MarketDataSource {
  return {
    onQuote: (_cb: (q: NormalizedQuote) => void) => () => undefined,
    subscribe: (_symbols: string[]) => undefined,
    startStreaming: () => undefined,
    stopStreaming: () => undefined,
  };
}

function makeDeps(overrides: Partial<BootstrapDeps> = {}): BootstrapDeps {
  return {
    env: {},
    resolveMode: () => 'mock',
    resolveModeSource: () => 'default',
    createClient: () => ({ marketData: makeStubMarketData() }),
    ...overrides,
  };
}

function makeService(symbols?: string[]): PriceService {
  return new PriceService({ port: 0, wsPort: 0, ...(symbols ? { symbols } : {}) });
}

describe('bootstrapEtoroSource', () => {
  let logSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;
  let errSpy: jest.SpyInstance;

  beforeEach(() => {
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    errSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    logSpy.mockRestore();
    warnSpy.mockRestore();
    errSpy.mockRestore();
  });

  it('happy path: resolves mode, constructs client, subscribes, returns handle', () => {
    const subscribed: string[][] = [];
    const md: MarketDataSource = {
      ...makeStubMarketData(),
      subscribe: (s) => { subscribed.push(s); },
    };
    const service = makeService(['BTC', 'ETH']);
    const deps = makeDeps({
      env: {},
      resolveMode: () => 'mock',
      resolveModeSource: () => 'default',
      createClient: () => ({ marketData: md }),
    });

    const result = bootstrapEtoroSource(service, deps);

    expect(result.ok).toBe(true);
    expect(result.handle).toBeDefined();
    expect(subscribed).toEqual([['BTC', 'ETH']]);
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('eToro mode resolved: mock (from default)'),
    );
  });

  it('unset ETORO_MODE announces "mock (from default)"', () => {
    const service = makeService();
    const env: NodeJS.ProcessEnv = {};
    bootstrapEtoroSource(service, makeDeps({
      env,
      resolveMode: () => 'mock',
      resolveModeSource: () => 'default',
    }));

    expect(logSpy).toHaveBeenCalledWith(
      '[price-service] eToro mode resolved: mock (from default)',
    );
    expect(env.SERVICE_HEALTH_STATUS).toBeUndefined();
  });

  it('ETORO_MODE=sandbox fails closed: marks degraded and rethrows InvalidModeError', () => {
    const env: NodeJS.ProcessEnv = { ETORO_MODE: 'sandbox' };
    const service = makeService();
    const deps = makeDeps({
      env,
      resolveMode: () => {
        throw new InvalidModeError('sandbox', [
          'mock', 'demo-readonly', 'demo-trading', 'real-disabled',
        ]);
      },
    });

    expect(() => bootstrapEtoroSource(service, deps)).toThrow(InvalidModeError);
    expect(env.SERVICE_HEALTH_STATUS).toBe('degraded');
    expect(env.SERVICE_DISABLED_REASON).toMatch(/^Invalid ETORO_MODE:/);
  });

  it('soft mode: client init failure marks degraded and returns ok:false (does not throw)', () => {
    const env: NodeJS.ProcessEnv = { ETORO_MODE: 'demo-readonly' };
    const service = makeService();
    const deps = makeDeps({
      env,
      resolveMode: () => 'demo-readonly',
      resolveModeSource: () => 'env',
      createClient: () => {
        throw new Error('Missing eToro demo credentials for mode "demo-readonly"');
      },
    });

    const result = bootstrapEtoroSource(service, deps);

    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/Missing eToro demo credentials/);
    expect(env.SERVICE_HEALTH_STATUS).toBe('degraded');
    expect(env.SERVICE_DISABLED_REASON).toMatch(/Missing eToro demo credentials/);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('eToro source unavailable: Missing eToro demo credentials'),
    );
  });

  it('strict mode: client init failure marks degraded AND rethrows', () => {
    const env: NodeJS.ProcessEnv = {
      ETORO_MODE: 'demo-readonly',
      PRICE_SERVICE_STRICT_MODE: 'true',
    };
    const service = makeService();
    const deps = makeDeps({
      env,
      resolveMode: () => 'demo-readonly',
      resolveModeSource: () => 'env',
      createClient: () => {
        throw new Error('Missing eToro demo credentials for mode "demo-readonly"');
      },
    });

    expect(() => bootstrapEtoroSource(service, deps)).toThrow(/Missing eToro demo credentials/);
    expect(env.SERVICE_HEALTH_STATUS).toBe('degraded');
    expect(env.SERVICE_DISABLED_REASON).toMatch(/Missing eToro demo credentials/);
  });

  it('unknown symbols mark degraded but the service continues with the valid subset', () => {
    const env: NodeJS.ProcessEnv = { ORACLE_SYMBOLS: 'BTC,FOO,ETH,BAR' };
    const subscribed: string[][] = [];
    const md: MarketDataSource = {
      ...makeStubMarketData(),
      subscribe: (s) => { subscribed.push(s); },
    };
    const service = makeService();
    const deps = makeDeps({
      env,
      createClient: () => ({ marketData: md }),
    });

    const result = bootstrapEtoroSource(service, deps);

    expect(result.ok).toBe(true);
    expect(subscribed).toEqual([['BTC', 'ETH']]);
    expect(env.SERVICE_HEALTH_STATUS).toBe('degraded');
    expect(env.SERVICE_DISABLED_REASON).toBe('Unknown symbols: FOO,BAR');
    expect(errSpy).toHaveBeenCalledWith(
      expect.stringContaining('Unknown symbols: FOO, BAR'),
    );
  });

  it('defaultBootstrapDeps wires real env and SDK exports', () => {
    const deps = defaultBootstrapDeps();
    expect(deps.env).toBe(process.env);
    expect(typeof deps.resolveMode).toBe('function');
    expect(typeof deps.resolveModeSource).toBe('function');
    expect(typeof deps.createClient).toBe('function');
  });
});
