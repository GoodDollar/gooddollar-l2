import { createEtoroClientFromEnv, EtoroClient } from '../client';
import { EtoroCredentialRecord } from '../types';

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' }, ...init });
}

describe('EtoroClient', () => {
  const credential: EtoroCredentialRecord = {
    profile: 'paper',
    username: 'user@example.test',
    password: 'do-not-log',
    apiKey: 'api-key-test',
    clientId: 'client-1',
    accountId: 'account-1',
    raw: {},
  };

  it('fetches and normalizes mocked market quotes', async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const fetchFn: typeof fetch = jest.fn(async (url: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: String(url), init });
      const pathname = new URL(String(url)).pathname;
      if (pathname.endsWith('/instruments')) {
        return jsonResponse({
          instruments: [{ instrumentId: '1001', symbol: 'AAPL', exchange: 'NASDAQ', currency: 'USD', instrumentType: 'Stocks' }],
        });
      }
      return jsonResponse({
        quotes: [{ instrumentId: '1001', symbol: 'AAPL', bid: 199.1, ask: 199.3, timestamp: 1779196800000 }],
      });
    }) as typeof fetch;

    const client = new EtoroClient({
      baseUrl: 'https://api.example.test',
      credentials: credential,
      fetchFn,
      instrumentsPath: '/instruments',
      quotesPath: '/quotes',
    });

    const quotes = await client.getQuotes({ symbols: ['AAPL'] });

    expect(quotes).toHaveLength(1);
    expect(quotes[0].goodChainKey).toBe('ETORO:NASDAQ:AAPL');
    expect(quotes[0].priceE8).toBe(19_920_000_000n);
    expect(calls[0].url).toContain('symbols=AAPL');
    expect(calls[0].init?.headers).toMatchObject({ 'x-api-key': 'api-key-test', 'x-client-id': 'client-1' });
    expect(JSON.stringify(calls.map((call) => call.init?.headers))).not.toContain('do-not-log');
  });

  it('creates a client from env-shaped config without requiring secrets in code', () => {
    const client = createEtoroClientFromEnv(
      { ETORO_API_BASE_URL: 'https://api.example.test' } as NodeJS.ProcessEnv,
      { credentials: credential },
    );

    expect(client.hasCredentials()).toBe(true);
  });

  it('can authenticate with a mocked login endpoint and then use bearer auth', async () => {
    const authHeaders: string[] = [];
    const fetchFn: typeof fetch = jest.fn(async (url: string | URL | Request, init?: RequestInit) => {
      const pathname = new URL(String(url)).pathname;
      if (pathname.endsWith('/login')) return jsonResponse({ access_token: 'session-token' });
      authHeaders.push(String((init?.headers as Record<string, string>)?.Authorization ?? ''));
      return jsonResponse({ quotes: [{ symbol: 'TSLA', price: 250, timestamp: 1779196800000 }] });
    }) as typeof fetch;

    const client = new EtoroClient({
      baseUrl: 'https://api.example.test',
      credentials: credential,
      fetchFn,
      authPath: '/login',
      instrumentsPath: '/missing-instruments',
      quotesPath: '/quotes',
    });

    await client.authenticate();
    await client.getQuotes({ symbols: ['TSLA'] });

    expect(authHeaders).toContain('Bearer session-token');
  });
});
