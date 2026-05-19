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

  it('trading and account stubs throw not-implemented errors', async () => {
    const client = new EtoroClient({ credentials: MOCK_CREDENTIALS });
    await expect(client.trading.openPosition({} as never)).rejects.toThrow('not yet implemented');
    await expect(client.account.getBalance()).rejects.toThrow('not yet implemented');
  });

  it('marketData module is functional (not a stub)', () => {
    const client = new EtoroClient({ credentials: MOCK_CREDENTIALS });
    expect(typeof client.marketData.getQuotes).toBe('function');
    expect(typeof client.marketData.getInstruments).toBe('function');
    expect(typeof client.marketData.getCandles).toBe('function');
  });
});
