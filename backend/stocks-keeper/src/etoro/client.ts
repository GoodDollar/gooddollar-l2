import { EtoroClientConfig, EtoroInstrument, GoodChainMarketQuote } from './types';
import { credentialHasUsableAuth, loadSelectedEtoroCredential } from './credentials';
import { normalizeInstrument, normalizeQuote } from './normalize';

export class EtoroApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly body?: string,
  ) {
    super(message);
    this.name = 'EtoroApiError';
  }
}

export function createEtoroClientFromEnv(
  env: NodeJS.ProcessEnv = process.env,
  overrides: Partial<EtoroClientConfig> = {},
): EtoroClient {
  const credentials = overrides.credentials ?? loadSelectedEtoroCredential(env.ETORO_CREDENTIALS_FILE, env.ETORO_CREDENTIALS_PROFILE);
  const baseUrl = overrides.baseUrl ?? env.ETORO_API_BASE_URL ?? credentials.baseUrl;
  if (!baseUrl) {
    throw new Error('ETORO_API_BASE_URL or credential baseUrl is required');
  }

  return new EtoroClient({
    ...overrides,
    baseUrl,
    credentials,
  });
}

export class EtoroClient {
  private readonly fetchFn: typeof fetch;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly userAgent: string;
  private readonly authPath: string;
  private readonly instrumentsPath: string;
  private readonly quotesPath: string;
  private sessionToken?: string;

  constructor(private readonly config: EtoroClientConfig) {
    if (!config.baseUrl && !config.credentials?.baseUrl) {
      throw new Error('eToro baseUrl is required');
    }

    this.baseUrl = (config.baseUrl || config.credentials?.baseUrl || '').replace(/\/+$/, '');
    this.fetchFn = config.fetchFn ?? fetch;
    this.timeoutMs = config.timeoutMs ?? 10_000;
    this.userAgent = config.userAgent ?? 'GoodChainEtoroAdapter/0.1';
    this.authPath = config.authPath ?? '/api/v1/auth/login';
    this.instrumentsPath = config.instrumentsPath ?? '/api/v1/market-data/instruments';
    this.quotesPath = config.quotesPath ?? '/api/v1/market-data/quotes';
  }

  hasCredentials(): boolean {
    return Boolean(this.config.credentials && credentialHasUsableAuth(this.config.credentials));
  }

  async authenticate(): Promise<void> {
    const credentials = this.config.credentials;
    if (!credentials) throw new Error('eToro credentials are required for authentication');
    if (credentials.token) {
      this.sessionToken = credentials.token;
      return;
    }
    if (!credentials.username || !credentials.password) {
      // API-key/client-secret flows do not need a login call here.
      return;
    }

    const response = await this.request<Record<string, unknown>>(this.authPath, {
      method: 'POST',
      body: JSON.stringify({
        username: credentials.username,
        password: credentials.password,
        clientId: credentials.clientId,
        clientSecret: credentials.clientSecret,
      }),
      includeAuth: false,
    });

    const token = response.accessToken ?? response.access_token ?? response.token;
    if (typeof token === 'string' && token) this.sessionToken = token;
  }

  async getInstruments(params: { symbols?: string[]; instrumentIds?: string[] } = {}): Promise<EtoroInstrument[]> {
    const data = await this.request<unknown>(this.instrumentsPath, {
      query: {
        symbols: params.symbols?.join(','),
        instrumentIds: params.instrumentIds?.join(','),
      },
    });

    return extractArray(data, ['instruments', 'items', 'data', 'results']).map((item) => normalizeInstrument(item));
  }

  async getQuotes(params: { symbols?: string[]; instrumentIds?: string[] } = {}): Promise<GoodChainMarketQuote[]> {
    const instruments = await this.getInstruments(params).catch(() => []);
    const byIdOrSymbol = new Map<string, EtoroInstrument>();
    for (const instrument of instruments) {
      byIdOrSymbol.set(instrument.instrumentId, instrument);
      byIdOrSymbol.set(instrument.symbol, instrument);
    }

    const data = await this.request<unknown>(this.quotesPath, {
      query: {
        symbols: params.symbols?.join(','),
        instrumentIds: params.instrumentIds?.join(','),
      },
    });

    return extractArray(data, ['quotes', 'items', 'data', 'results']).map((quote) => {
      const key = extractKey(quote);
      return normalizeQuote(quote, key ? byIdOrSymbol.get(key) : undefined);
    });
  }

  async getQuote(symbolOrInstrumentId: string): Promise<GoodChainMarketQuote | null> {
    const quotes = await this.getQuotes({ symbols: [symbolOrInstrumentId], instrumentIds: [symbolOrInstrumentId] });
    return quotes[0] ?? null;
  }

  private async request<T>(
    pathname: string,
    opts: {
      method?: string;
      query?: Record<string, string | undefined>;
      body?: string;
      includeAuth?: boolean;
    } = {},
  ): Promise<T> {
    const url = new URL(pathname.startsWith('http') ? pathname : `${this.baseUrl}${pathname.startsWith('/') ? '' : '/'}${pathname}`);
    for (const [key, value] of Object.entries(opts.query ?? {})) {
      if (value) url.searchParams.set(key, value);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const resp = await this.fetchFn(url.toString(), {
        method: opts.method ?? 'GET',
        headers: this.buildHeaders(opts.includeAuth !== false, Boolean(opts.body)),
        body: opts.body,
        signal: controller.signal,
      });

      const body = await resp.text();
      if (!resp.ok) {
        throw new EtoroApiError(`eToro API request failed with ${resp.status}`, resp.status, body.slice(0, 500));
      }

      return (body ? JSON.parse(body) : {}) as T;
    } finally {
      clearTimeout(timeout);
    }
  }

  private buildHeaders(includeAuth: boolean, hasJsonBody: boolean): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'User-Agent': this.userAgent,
    };
    if (hasJsonBody) headers['Content-Type'] = 'application/json';

    if (!includeAuth) return headers;

    const credentials = this.config.credentials;
    const token = this.sessionToken ?? credentials?.token;
    if (token) headers.Authorization = `Bearer ${token}`;
    if (credentials?.apiKey) headers['x-api-key'] = credentials.apiKey;
    if (credentials?.clientId) headers['x-client-id'] = credentials.clientId;
    if (credentials?.accountId) headers['x-account-id'] = credentials.accountId;

    return headers;
  }
}

function extractArray(data: unknown, keys: string[]): unknown[] {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== 'object') return [];
  const record = data as Record<string, unknown>;
  for (const key of keys) {
    const value = record[key];
    if (Array.isArray(value)) return value;
  }
  return [];
}

function extractKey(value: unknown): string | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const record = value as Record<string, unknown>;
  for (const key of ['instrumentId', 'instrumentID', 'instrument_id', 'id', 'symbol', 'ticker']) {
    const raw = record[key];
    if (typeof raw === 'string' && raw) return raw.toUpperCase();
    if (typeof raw === 'number') return String(raw);
  }
  return undefined;
}
