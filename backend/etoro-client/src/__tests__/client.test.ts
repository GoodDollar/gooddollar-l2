import path from 'path';
import { EtoroClient, InvalidModeError, AccountUnavailableError } from '../index';
import { MockEtoroSource } from '../mock-source';
import { EtoroCredentials } from '../types';

jest.mock('fs', () => ({
  appendFileSync: jest.fn(),
  mkdirSync: jest.fn(),
}));

const DEMO_CREDENTIALS: EtoroCredentials = {
  apiKey: 'test-key-12345',
  apiSecret: 'test-secret-67890',
  userKey: 'test-user-key-9999',
  baseUrl: 'https://mock.etoro.com/api/v1',
  wsUrl: 'wss://mock.etoro.com/sapi/demo',
  mode: 'demo-readonly',
};

describe('EtoroClient — construction', () => {
  it('instantiates with explicit credentials', () => {
    const client = new EtoroClient({ credentials: DEMO_CREDENTIALS });
    expect(client.getMode()).toBe('demo-readonly');
    expect(client.isAuthenticated()).toBe(false);
  });

  it('exposes redacted summary including realTradingEnabled flag', () => {
    const client = new EtoroClient({ credentials: DEMO_CREDENTIALS });
    const summary = client.getSummary();
    expect(summary.mode).toBe('demo-readonly');
    expect(summary.apiKey).not.toBe('test-key-12345');
    expect(summary.apiKey).toContain('...');
    expect(summary.authenticated).toBe('false');
    expect(summary.realTradingEnabled).toBe('false');
  });

  it('exposes mode capabilities', () => {
    const client = new EtoroClient({ credentials: DEMO_CREDENTIALS });
    const caps = client.getModeCapabilities();
    expect(caps.marketData).toBe('demo');
    expect(caps.trading).toBe('disabled');
  });

  it('exposes module stubs', () => {
    const client = new EtoroClient({ credentials: DEMO_CREDENTIALS });
    expect(client.marketData).toBeDefined();
    expect(client.trading).toBeDefined();
    expect(client.account).toBeDefined();
    expect(client.capEnforcer).toBeDefined();
  });

  it('all modules are functional (not stubs)', () => {
    const client = new EtoroClient({ credentials: DEMO_CREDENTIALS });
    expect(typeof client.marketData.subscribe).toBe('function');
    expect(typeof client.marketData.startStreaming).toBe('function');
    expect(typeof client.trading.openPosition).toBe('function');
    expect(typeof client.trading.closePosition).toBe('function');
    expect(typeof client.trading.cancelOrder).toBe('function');
    expect(typeof client.account.getBalance).toBe('function');
    expect(typeof client.account.getPositions).toBe('function');
    expect(typeof client.account.getPortfolioPnl).toBe('function');
  });

  it('uses MockEtoroSource for market data when mode=mock', () => {
    const mockCreds: EtoroCredentials = {
      apiKey: 'mock-api-key',
      apiSecret: 'mock-api-secret',
      userKey: 'mock-user-key',
      baseUrl: 'mock://etoro.local',
      wsUrl: 'mock://etoro.local/ws',
      mode: 'mock',
    };
    const client = new EtoroClient({ credentials: mockCreds });
    expect(client.marketData).toBeInstanceOf(MockEtoroSource);
  });

  it('mock mode authenticate returns a synthetic token without HTTP', async () => {
    const mockCreds: EtoroCredentials = {
      apiKey: 'mock-api-key',
      apiSecret: 'mock-api-secret',
      userKey: 'mock-user-key',
      baseUrl: 'mock://etoro.local',
      wsUrl: 'mock://etoro.local/ws',
      mode: 'mock',
    };
    const client = new EtoroClient({ credentials: mockCreds });
    const token = await client.authenticate();
    expect(token).toBe('mock-token');
    expect(client.isAuthenticated()).toBe(true);
  });
});

describe('EtoroClient — mode-resolved audit line', () => {
  it('writes exactly one mode-resolved entry on construction', () => {
    const writes: string[] = [];
    const fsMock = jest.requireMock('fs') as { appendFileSync: jest.Mock };
    fsMock.appendFileSync.mockClear();
    fsMock.appendFileSync.mockImplementation((_p: string, line: string) => { writes.push(line); });

    new EtoroClient({ credentials: DEMO_CREDENTIALS });

    const lines = writes
      .map((l) => JSON.parse(l) as Record<string, unknown>)
      .filter((e) => e.action === 'mode-resolved');
    expect(lines).toHaveLength(1);
    expect(lines[0].resolvedMode).toBe('demo-readonly');
    expect(lines[0].modeSource).toBe('explicit');
  });
});

describe('InvalidModeError export', () => {
  it('is exported from @goodchain/etoro-client', () => {
    expect(InvalidModeError).toBeDefined();
    const err = new InvalidModeError('demo', ['mock', 'demo-readonly', 'demo-trading', 'real-disabled']);
    expect(err.name).toBe('InvalidModeError');
    expect(err.rawValue).toBe('demo');
  });
});

describe('EtoroClient — audit-log path surfacing', () => {
  it('honors EtoroClientConstructorConfig.auditLogPath end-to-end', () => {
    const client = new EtoroClient({
      credentials: DEMO_CREDENTIALS,
      auditLogPath: '/tmp/audit-explicit.log',
    });
    const summary = client.getSummary();
    expect(summary.auditLogPath).toBe('/tmp/audit-explicit.log');
    expect(summary.auditWriteFailures).toBe('0');
  });

  it('default-resolved auditLogPath never lives under node_modules and getSummary exposes failure count', () => {
    const client = new EtoroClient({ credentials: DEMO_CREDENTIALS });
    const summary = client.getSummary();
    expect(summary.auditLogPath).toBeDefined();
    expect(summary.auditLogPath.split(path.sep)).not.toContain('node_modules');
    expect(summary.auditWriteFailures).toBe('0');
  });

  it('records resolvedAuditLogPath on the mode-resolved audit line', () => {
    const writes: string[] = [];
    const fsMock = jest.requireMock('fs') as { appendFileSync: jest.Mock };
    fsMock.appendFileSync.mockClear();
    fsMock.appendFileSync.mockImplementation((_p: string, line: string) => { writes.push(line); });

    new EtoroClient({
      credentials: DEMO_CREDENTIALS,
      auditLogPath: '/tmp/audit-resolved.log',
    });

    const lines = writes
      .map((l) => JSON.parse(l) as Record<string, unknown>)
      .filter((e) => e.action === 'mode-resolved');
    expect(lines).toHaveLength(1);
    expect(lines[0].resolvedAuditLogPath).toBe('/tmp/audit-resolved.log');
  });
});

describe('EtoroClient — account mode-gate wiring', () => {
  it('default mock-mode client refuses account.getBalance() with AccountUnavailableError', async () => {
    const mockCreds: EtoroCredentials = {
      apiKey: 'mock',
      apiSecret: 'mock',
      userKey: 'mock-user-key',
      baseUrl: 'mock://etoro.local',
      wsUrl: 'mock://etoro.local/ws',
      mode: 'mock',
    };
    const client = new EtoroClient({ credentials: mockCreds });
    await expect(client.account.getBalance()).rejects.toBeInstanceOf(AccountUnavailableError);
  });
});

describe('EtoroClient — getSummary.malformedQuotes', () => {
  it('reports "0" on a fresh client regardless of mode', () => {
    const readonly = new EtoroClient({ credentials: DEMO_CREDENTIALS });
    expect(readonly.getSummary().malformedQuotes).toBe('0');

    const mockCreds: EtoroCredentials = {
      apiKey: 'mock',
      apiSecret: 'mock',
      userKey: 'mock-user-key',
      baseUrl: 'mock://etoro.local',
      wsUrl: 'mock://etoro.local/ws',
      mode: 'mock',
    };
    const mock = new EtoroClient({ credentials: mockCreds });
    expect(mock.getSummary().malformedQuotes).toBe('0');
  });
});

describe('EtoroClient — getSummary.consecutiveThrottles', () => {
  it('reports "0" on a fresh client', () => {
    const client = new EtoroClient({ credentials: DEMO_CREDENTIALS });
    expect(client.getSummary().consecutiveThrottles).toBe('0');
  });
});

describe('EtoroClient — getSummary.streamFailures', () => {
  it('reports all-zero counters on a fresh client (demo and mock modes)', () => {
    const demo = new EtoroClient({ credentials: DEMO_CREDENTIALS });
    expect(demo.getSummary().streamFailures).toBe(
      'ws-construct=0 ws-parse=0 ws-error=0 rest-fallback=0',
    );

    const mockCreds: EtoroCredentials = {
      apiKey: 'mock',
      apiSecret: 'mock',
      userKey: 'mock-user-key',
      baseUrl: 'mock://etoro.local',
      wsUrl: 'mock://etoro.local/ws',
      mode: 'mock',
    };
    const mock = new EtoroClient({ credentials: mockCreds });
    expect(mock.getSummary().streamFailures).toBe(
      'ws-construct=0 ws-parse=0 ws-error=0 rest-fallback=0',
    );
  });
});

describe('EtoroClient — getSummary.malformedListResponses', () => {
  it('reports "0" on a fresh client (demo mode)', () => {
    const client = new EtoroClient({ credentials: DEMO_CREDENTIALS });
    expect(client.getSummary().malformedListResponses).toBe('0');
  });

  it('reports "0" on a fresh client (mock mode)', () => {
    const mockCreds: EtoroCredentials = {
      apiKey: 'mock',
      apiSecret: 'mock',
      userKey: 'mock-user-key',
      baseUrl: 'mock://etoro.local',
      wsUrl: 'mock://etoro.local/ws',
      mode: 'mock',
    };
    const mock = new EtoroClient({ credentials: mockCreds });
    expect(mock.getSummary().malformedListResponses).toBe('0');
  });
});

describe('EtoroClient — live-quote wiring through MockEtoroSource', () => {
  const MOCK_CREDENTIALS: EtoroCredentials = {
    apiKey: 'mock-api-key',
    apiSecret: 'mock-api-secret',
    userKey: 'mock-user-key',
    baseUrl: 'mock://etoro.local',
    wsUrl: 'mock://etoro.local/ws',
    mode: 'mock',
  };

  it('feeds MockEtoroSource.getCachedQuote into TradingModule.liveQuoteSource', () => {
    const client = new EtoroClient({ credentials: MOCK_CREDENTIALS });
    client.marketData.subscribe(['BTC']);
    const source = client.marketData as MockEtoroSource;
    source.tick();
    const cached = client.marketData.getCachedQuote?.('BTC');
    expect(cached).toBeDefined();
    expect(cached?.mid).toBeGreaterThan(0);
  });
});

describe('EtoroClient — config-loaded audit line', () => {
  it('writes exactly one config-loaded entry with cap values and overrides applied', () => {
    const writes: string[] = [];
    const fsMock = jest.requireMock('fs') as { appendFileSync: jest.Mock };
    fsMock.appendFileSync.mockClear();
    fsMock.appendFileSync.mockImplementation((_p: string, line: string) => { writes.push(line); });

    new EtoroClient({
      credentials: DEMO_CREDENTIALS,
      capConfig: { maxOrderNotionalUsd: 250, maxDailyNotionalUsd: 2_500 },
    });

    const configLines = writes
      .map((l) => JSON.parse(l) as Record<string, unknown>)
      .filter((e) => e.action === 'config-loaded');
    expect(configLines).toHaveLength(1);
    expect(configLines[0].capOrderUsd).toBe(250);
    expect(configLines[0].capDailyUsd).toBe(2_500);
    expect(Array.isArray(configLines[0].instrumentOverridesApplied)).toBe(true);
  });
});
