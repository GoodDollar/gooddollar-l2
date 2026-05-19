import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { loadCredentialsFromEnv, redactCredentials } from './auth';
import { RateLimiter, RateLimiterConfig } from './rate-limiter';
import { AuditLogger } from './audit-logger';
import { MarketDataModule } from './market-data';
import { TradingModule } from './trading';
import { AccountModule } from './account';
import { EtoroClientConfig, EtoroCredentials, MarketDataConfig } from './types';

export class EtoroClient {
  readonly credentials: EtoroCredentials;
  readonly marketData: MarketDataModule;
  readonly trading: TradingModule;
  readonly account: AccountModule;

  private readonly http: AxiosInstance;
  private readonly rateLimiter: RateLimiter;
  private readonly audit: AuditLogger;
  private sessionToken?: string;

  constructor(config?: Partial<EtoroClientConfig & { rateLimiter?: RateLimiterConfig; marketData?: MarketDataConfig }>) {
    this.credentials = config?.credentials ?? loadCredentialsFromEnv();
    this.rateLimiter = new RateLimiter(config?.rateLimiter);
    this.audit = new AuditLogger(this.credentials.mode);

    this.http = axios.create({
      baseURL: this.credentials.baseUrl,
      timeout: config?.timeoutMs ?? 10_000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': config?.userAgent ?? 'GoodChainEtoroSDK/0.1',
        'x-api-key': this.credentials.apiKey,
      },
    });

    this.marketData = new MarketDataModule(this.http, config?.marketData);
    this.trading = new TradingModule();
    this.account = new AccountModule();
  }

  async authenticate(): Promise<string> {
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

  getMode(): string {
    return this.credentials.mode;
  }

  getSummary(): Record<string, string> {
    return {
      ...redactCredentials(this.credentials),
      authenticated: String(this.isAuthenticated()),
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
  config?: Partial<EtoroClientConfig & { rateLimiter?: RateLimiterConfig }>,
): EtoroClient {
  return new EtoroClient(config);
}

export { loadCredentialsFromEnv, redactCredentials } from './auth';
export { RateLimiter } from './rate-limiter';
export { AuditLogger } from './audit-logger';
export { MarketDataModule } from './market-data';
export { TradingModule } from './trading';
export { AccountModule } from './account';
export type * from './types';
