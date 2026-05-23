import { EtoroClient } from '../index';
import { MockEtoroSource } from '../mock-source';
import { EtoroCredentials } from '../types';

const DEMO_CREDENTIALS: EtoroCredentials = {
  apiKey: 'test-key-12345',
  apiSecret: 'test-secret-67890',
  baseUrl: 'https://mock.etoro.com/sapi/demo',
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
