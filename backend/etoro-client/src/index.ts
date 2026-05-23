import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import {
  loadCredentialsFromEnv,
  loadDemoCapConfig,
  redactCredentials,
  REAL_TRADING_ENABLED,
  MODE_CAPABILITIES,
} from './auth';
import { RateLimiter, RateLimiterConfig } from './rate-limiter';
import { AuditLogger } from './audit-logger';
import { MarketDataModule } from './market-data';
import { TradingModule } from './trading';
import { AccountModule } from './account';
import { DemoCapEnforcer } from './cap-enforcer';
import {
  INSTRUMENT_MAP,
  applyInstrumentOverrides,
  loadInstrumentOverrides,
} from './instruments';
import { MockEtoroSource } from './mock-source';
import {
  DemoCapConfig,
  EtoroClientConfig,
  EtoroCredentials,
  EtoroMode,
  MarketDataConfig,
  NormalizedQuote,
  QuoteCallback,
} from './types';

/**
 * Minimal interface the SDK satisfies for downstream services that just
 * want to consume streaming quotes. Mirrors price-service's
 * `MarketDataSource` so that `mock` mode can substitute a `MockEtoroSource`
 * for a `MarketDataModule` without consumer changes.
 */
export interface EtoroMarketDataSource {
  onQuote(callback: QuoteCallback): () => void;
  subscribe(symbols: string[]): void;
  startStreaming(): void;
  stopStreaming(): void;
  getCachedQuote?(symbol: string): NormalizedQuote | undefined;
}

export interface EtoroClientConstructorConfig
  extends Partial<EtoroClientConfig> {
  rateLimiter?: RateLimiterConfig;
  marketData?: MarketDataConfig;
  capConfig?: DemoCapConfig;
}

export class EtoroClient {
  readonly credentials: EtoroCredentials;
  readonly marketData: EtoroMarketDataSource;
  readonly trading: TradingModule;
  readonly account: AccountModule;
  readonly capEnforcer: DemoCapEnforcer;

  private readonly http: AxiosInstance;
  private readonly rateLimiter: RateLimiter;
  private readonly audit: AuditLogger;
  private sessionToken?: string;

  constructor(config?: EtoroClientConstructorConfig) {
    const modeSource: 'env' | 'explicit' = config?.credentials ? 'explicit' : 'env';
    this.credentials = config?.credentials ?? loadCredentialsFromEnv();
    this.rateLimiter = new RateLimiter(config?.rateLimiter);
    this.audit = new AuditLogger(this.credentials.mode);
    this.audit.log({
      action: 'mode-resolved',
      method: 'INIT',
      path: '/mode',
      resolvedMode: this.credentials.mode,
      modeSource,
    });
    const capConfig = config?.capConfig ?? loadDemoCapConfig();
    this.capEnforcer = new DemoCapEnforcer(capConfig);

    this.http = axios.create({
      baseURL: this.credentials.baseUrl,
      timeout: config?.timeoutMs ?? 10_000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': config?.userAgent ?? 'GoodChainEtoroSDK/0.1',
        'x-api-key': this.credentials.apiKey,
      },
    });

    if (this.credentials.mode === 'mock') {
      this.marketData = new MockEtoroSource();
    } else {
      const mdConfig: MarketDataConfig = {
        ...(config?.marketData ?? {}),
        wsUrl: config?.marketData?.wsUrl ?? this.credentials.wsUrl,
      };
      this.marketData = new MarketDataModule(this.http, mdConfig);
    }

    const overrides = loadInstrumentOverrides();
    const mergedInstruments = applyInstrumentOverrides(
      INSTRUMENT_MAP,
      overrides,
    );

    this.audit.log({
      action: 'config-loaded',
      method: 'INIT',
      path: '/config',
      capOrderUsd: capConfig.maxOrderNotionalUsd,
      capDailyUsd: capConfig.maxDailyNotionalUsd,
      instrumentOverridesApplied: Object.keys(overrides),
    });

    this.trading = new TradingModule(this.http, this.audit, {
      mode: this.credentials.mode,
      capEnforcer: this.capEnforcer,
      symbolReferencePriceUsd: (symbol) => {
        const sym = symbol as keyof typeof mergedInstruments;
        return mergedInstruments[sym]?.referencePriceUsd;
      },
    });
    this.account = new AccountModule(this.http, this.audit);
  }

  async authenticate(): Promise<string> {
    if (this.credentials.mode === 'mock') {
      this.sessionToken = 'mock-token';
      return this.sessionToken;
    }

    return this.rateLimiter.executeWithRetry(async () => {
      const start = Date.now();
      try {
        const response = await this.http.post('/auth/login', {
          apiKey: this.credentials.apiKey,
          apiSecret: this.credentials.apiSecret,
        });

        const token: string =
          response.data?.accessToken ??
          response.data?.access_token ??
          response.data?.token ??
          '';

        if (!token) {
          throw new Error('Authentication response missing token');
        }

        this.sessionToken = token;
        this.http.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        this.audit.log({
          action: 'authenticate',
          method: 'POST',
          path: '/auth/login',
          statusCode: response.status,
          durationMs: Date.now() - start,
        });

        return token;
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        this.audit.log({
          action: 'authenticate',
          method: 'POST',
          path: '/auth/login',
          durationMs: Date.now() - start,
          error: msg,
        });
        throw error;
      }
    });
  }

  isAuthenticated(): boolean {
    return Boolean(this.sessionToken);
  }

  getMode(): EtoroMode {
    return this.credentials.mode;
  }

  getModeCapabilities() {
    return MODE_CAPABILITIES[this.credentials.mode];
  }

  getSummary(): Record<string, string> {
    return {
      ...redactCredentials(this.credentials),
      authenticated: String(this.isAuthenticated()),
      realTradingEnabled: String(REAL_TRADING_ENABLED),
    };
  }

  async request<T = unknown>(config: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.rateLimiter.executeWithRetry(async () => {
      const start = Date.now();
      try {
        const response = await this.http.request<T>(config);
        this.audit.log({
          action: 'request',
          method: config.method?.toUpperCase() ?? 'GET',
          path: config.url ?? '',
          statusCode: response.status,
          durationMs: Date.now() - start,
        });
        return response;
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        this.audit.log({
          action: 'request',
          method: config.method?.toUpperCase() ?? 'GET',
          path: config.url ?? '',
          durationMs: Date.now() - start,
          error: msg,
        });
        throw error;
      }
    });
  }
}

export function createEtoroClient(
  config?: EtoroClientConstructorConfig,
): EtoroClient {
  return new EtoroClient(config);
}

export {
  loadCredentialsFromEnv,
  loadDemoCapConfig,
  redactCredentials,
  resolveMode,
  REAL_TRADING_ENABLED,
  DEMO_BASE_URL_DEFAULT,
  DEMO_WS_URL_DEFAULT,
  MODE_CAPABILITIES,
} from './auth';
export { RateLimiter } from './rate-limiter';
export { AuditLogger } from './audit-logger';
export { MarketDataModule, computeConfidence } from './market-data';
export { TradingModule, TradingError } from './trading';
export { AccountModule } from './account';
export { DemoCapEnforcer, computeOrderNotionalUsd } from './cap-enforcer';
export { MockEtoroSource } from './mock-source';
export {
  INSTRUMENT_SYMBOLS,
  INSTRUMENT_MAP,
  getInstrument,
  isLaneSymbol,
  loadInstrumentOverrides,
  applyInstrumentOverrides,
} from './instruments';
export type { LaneSymbol, LaneInstrument, InstrumentOverrides } from './instruments';
export {
  RealTradingDisabledError,
  DemoCapExceededError,
  MissingNotionalError,
  InvalidModeError,
  InvalidOrderError,
  InvalidCapConfigError,
  InvalidInstrumentOverridesError,
} from './errors';
export type * from './types';
