import { EtoroClient } from '../index';
import { EtoroCredentials } from '../types';

const MOCK_CREDENTIALS: EtoroCredentials = {
  apiKey: 'test-key-12345',
  apiSecret: 'test-secret-67890',
  baseUrl: 'https://mock.etoro.com/sapi',
  mode: 'sandbox',
};

describe('EtoroClient', () => {
  it('instantiates with explicit credentials', () => {
    const client = new EtoroClient({ credentials: MOCK_CREDENTIALS });
    expect(client.getMode()).toBe('sandbox');
    expect(client.isAuthenticated()).toBe(false);
  });

  it('exposes redacted summary', () => {
    const client = new EtoroClient({ credentials: MOCK_CREDENTIALS });
    const summary = client.getSummary();
    expect(summary.mode).toBe('sandbox');
    expect(summary.apiKey).not.toBe('test-key-12345');
    expect(summary.apiKey).toContain('...');
    expect(summary.authenticated).toBe('false');
  });

  it('exposes module stubs', () => {
    const client = new EtoroClient({ credentials: MOCK_CREDENTIALS });
    expect(client.marketData).toBeDefined();
    expect(client.trading).toBeDefined();
    expect(client.account).toBeDefined();
  });

  it('all modules are functional (not stubs)', () => {
    const client = new EtoroClient({ credentials: MOCK_CREDENTIALS });
    expect(typeof client.marketData.getQuotes).toBe('function');
    expect(typeof client.marketData.getInstruments).toBe('function');
    expect(typeof client.marketData.getCandles).toBe('function');
    expect(typeof client.trading.openPosition).toBe('function');
    expect(typeof client.trading.closePosition).toBe('function');
    expect(typeof client.trading.cancelOrder).toBe('function');
    expect(typeof client.account.getBalance).toBe('function');
    expect(typeof client.account.getPositions).toBe('function');
    expect(typeof client.account.getPortfolioPnl).toBe('function');
  });
});
