import { randomUUID } from 'crypto';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import {
  loadCredentialsFromEnv,
  loadDemoCapConfig,
  redactCredentials,
  REAL_TRADING_ENABLED,
  MODE_CAPABILITIES,
} from './auth';
import { HttpDispatcher, RateLimiter, RateLimiterConfig } from './rate-limiter';
import { AuditLogger } from './audit-logger';
import {
  MarketDataModule,
  StreamFailureKind,
  formatStreamFailures,
} from './market-data';
import { InstrumentResolver } from './instrument-resolver';
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
  /**
   * Count of inbound quote records dropped because their payload lacked
   * every recognized symbol field. Optional so `MockEtoroSource` (which
   * never produces malformed quotes) can omit it; `EtoroClient.getSummary`
   * defaults to `0` when absent.
   */
  getMalformedQuoteCount?(): number;
  /**
   * Per-kind counters for streaming-path silent failures (WS construct,
   * WS parse, WS error events, REST fallback). Optional so mock-mode
   * sources without a real WS/REST surface can omit it; `getSummary`
   * defaults to all-zeros.
   */
  getStreamFailureCounts?(): Record<StreamFailureKind, number>;
  /**
   * Per-action counter of 200-OK list responses whose envelope shape was
   * not recognized. Aggregated into the SDK-wide
   * `malformedListResponses` summary field. Optional so the mock source
   * can omit it.
   */
  getMalformedListResponseCounts?(): Record<string, number>;
}

export interface EtoroClientConstructorConfig
  extends Partial<EtoroClientConfig> {
  rateLimiter?: RateLimiterConfig;
  marketData?: MarketDataConfig;
  capConfig?: DemoCapConfig;
  /**
   * Explicit audit log path override. Falls through to
   * `ETORO_AUDIT_LOG_PATH` env, then `<cwd>/.etoro-audit/<mode>.log`, then
   * `<os.tmpdir()>/etoro-audit/<mode>.log`. The default NEVER lands under
   * `node_modules`.
   */
  auditLogPath?: string;
  /**
   * Tunables for the live-quote notional resolver. When unset, market
   * orders fall through to the (frozen) reference-price fallback after
   * the default 60 s freshness window expires.
   */
  notional?: {
    /** Live-quote freshness window (ms). Default 60_000. */
    maxQuoteAgeMs?: number;
    /**
     * If set, reject orders whose live-quote diverges from the reference
     * by more than this absolute ratio (`|live - ref| / ref`). Default:
     * unset (no drift check).
     */
    maxReferenceDriftRatio?: number;
  };
  /**
   * Strict-mode opt-in for malformed list responses. When `true`, every
   * list-returning SDK method (`getQuotes`, `getInstruments`,
   * `getCandles`, `getOpenPositions`, `getTradeHistory`, `getPositions`,
   * `getPendingOrders`) throws `MalformedListResponseError` when the
   * upstream payload is a 200-OK with a shape the SDK does not
   * recognize. Defaults to `false` — drift is audit-logged and counted,
   * but methods still return `[]` to preserve back-compat for
   * price-service / hedge-engine consumers that don't yet handle the
   * throw.
   */
  throwOnMalformedListResponse?: boolean;
  /**
   * Injectable factory for the `x-request-id` header. Defaults to
   * `crypto.randomUUID()`. Tests pin a deterministic ID by supplying
   * `() => 'req-1'`.
   */
  requestIdFactory?: () => string;
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
    this.audit = new AuditLogger(this.credentials.mode, {
      logPath: config?.auditLogPath,
    });
    this.audit.log({
      action: 'mode-resolved',
      method: 'INIT',
      path: '/mode',
      resolvedMode: this.credentials.mode,
      modeSource,
      resolvedAuditLogPath: this.audit.getResolvedLogPath(),
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
        'x-user-key': this.credentials.userKey,
      },
    });

    const requestIdFactory = config?.requestIdFactory ?? (() => randomUUID());
    this.http.interceptors.request.use((req) => {
      req.headers = req.headers ?? {};
      req.headers['x-request-id'] = requestIdFactory();
      return req;
    });

    const dispatch: HttpDispatcher = (fn) => this.rateLimiter.executeWithTelemetry(fn);

    const throwOnMalformedListResponse =
      config?.throwOnMalformedListResponse ?? false;

    if (this.credentials.mode === 'mock') {
      this.marketData = new MockEtoroSource();
    } else {
      const resolver = new InstrumentResolver({
        http: this.http,
        audit: this.audit,
        dispatch,
      });
      const mdConfig: MarketDataConfig = {
        ...(config?.marketData ?? {}),
        wsUrl: config?.marketData?.wsUrl ?? this.credentials.wsUrl,
      };
      this.marketData = new MarketDataModule(this.http, mdConfig, {
        audit: this.audit,
        dispatch,
        throwOnMalformedListResponse,
        resolver,
      });
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
      liveQuoteSource: (symbol) => {
        const cached = this.marketData.getCachedQuote?.(symbol);
        return cached ? { mid: cached.mid, timestamp: cached.timestamp } : undefined;
      },
      maxQuoteAgeMs: config?.notional?.maxQuoteAgeMs,
      maxReferenceDriftRatio: config?.notional?.maxReferenceDriftRatio,
      dispatch,
      throwOnMalformedListResponse,
    });
    this.account = new AccountModule(this.http, this.audit, {
      mode: this.credentials.mode,
      dispatch,
      throwOnMalformedListResponse,
    });
  }

  /**
   * No-op session populate for the official eToro public API: auth is
   * header-based (x-api-key, x-user-key, x-request-id) per request, so
   * there is no `/auth/login` round-trip to make. Returns the
   * deterministic literal `'header-auth'` (or `'mock-token'` in mock
   * mode) so callers that gate on `isAuthenticated()` keep working.
   *
   * The previous `/auth/login` implementation called an internal-API
   * endpoint that the lane no longer addresses (lane task 0017). It is
   * scheduled for outright deletion once consumers stop calling
   * `authenticate()` entirely; see the follow-up task referenced in
   * `docs/ETORO_GOODCHAIN_ADAPTER.md`.
   */
  async authenticate(): Promise<string> {
    this.sessionToken = this.credentials.mode === 'mock'
      ? 'mock-token'
      : 'header-auth';
    this.audit.log({
      action: 'authenticate',
      method: 'INIT',
      path: '/auth/header-auth',
      durationMs: 0,
    });
    return this.sessionToken;
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
    const totalMalformedLists = sumCounts(
      this.marketData.getMalformedListResponseCounts?.(),
      this.trading.getMalformedListResponseCounts(),
      this.account.getMalformedListResponseCounts(),
    );
    return {
      ...redactCredentials(this.credentials),
      authenticated: String(this.isAuthenticated()),
      realTradingEnabled: String(REAL_TRADING_ENABLED),
      auditLogPath: this.audit.getResolvedLogPath(),
      auditWriteFailures: String(this.audit.getWriteFailureCount()),
      malformedQuotes: String(this.marketData.getMalformedQuoteCount?.() ?? 0),
      consecutiveThrottles: String(this.rateLimiter.getConsecutiveThrottles()),
      streamFailures: formatStreamFailures(this.marketData.getStreamFailureCounts?.()),
      malformedListResponses: String(totalMalformedLists),
    };
  }

  async request<T = unknown>(config: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    const start = Date.now();
    try {
      const { value: response, attempts, totalBackoffMs } =
        await this.rateLimiter.executeWithTelemetry(() => this.http.request<T>(config));
      this.audit.log({
        action: 'request',
        method: config.method?.toUpperCase() ?? 'GET',
        path: config.url ?? '',
        statusCode: response.status,
        durationMs: Date.now() - start,
        attempts,
        totalBackoffMs,
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
  resolveModeSource,
  REAL_TRADING_ENABLED,
  DEMO_BASE_URL_DEFAULT,
  DEMO_WS_URL_DEFAULT,
  MODE_CAPABILITIES,
} from './auth';
export {
  RateLimiter,
  identityDispatcher,
} from './rate-limiter';
export type { HttpDispatcher, RetryTelemetry } from './rate-limiter';
export { AuditLogger } from './audit-logger';
export { MarketDataModule, computeConfidence } from './market-data';
export type { StreamFailureKind, StreamErrorSnapshot, MarketDataDeps } from './market-data';
export { TradingModule, TradingError } from './trading';
export { AccountModule } from './account';
export { DemoCapEnforcer, computeOrderNotionalUsd } from './cap-enforcer';
export { MockEtoroSource } from './mock-source';
export {
  INSTRUMENT_SYMBOLS,
  INSTRUMENT_MAP,
  DEFAULT_LANE_SYMBOLS,
  SUPPLEMENTARY_STOCK_SYMBOLS,
  getInstrument,
  isLaneSymbol,
  loadInstrumentOverrides,
  applyInstrumentOverrides,
  partitionLaneSymbols,
} from './instruments';
export type {
  LaneSymbol,
  LaneInstrument,
  InstrumentOverrides,
  SupplementaryStockSymbol,
} from './instruments';
export {
  RealTradingDisabledError,
  DemoCapExceededError,
  MissingNotionalError,
  InvalidModeError,
  InvalidOrderError,
  InvalidCapConfigError,
  InvalidInstrumentOverridesError,
  InstrumentNotFoundError,
  AccountUnavailableError,
  MalformedListResponseError,
} from './errors';
export { InstrumentResolver } from './instrument-resolver';
export type { ResolvedInstrument, InstrumentResolverDeps } from './instrument-resolver';
export type { MalformedListResponseShape } from './errors';
export { LIST_ENVELOPE_KEYS, readListEnvelope } from './util/list-envelope';
export type { EnvelopeOutcome } from './util/list-envelope';
export type * from './types';

function sumCounts(...maps: Array<Record<string, number> | undefined>): number {
  let total = 0;
  for (const m of maps) {
    if (!m) continue;
    for (const v of Object.values(m)) total += v;
  }
  return total;
}
