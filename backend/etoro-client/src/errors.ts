import { EtoroMode } from './types';

/**
 * Thrown by `resolveMode` when `ETORO_MODE` is set but is not one of the
 * four canonical modes (`mock`, `demo-readonly`, `demo-trading`,
 * `real-disabled`). Carries the offending raw value (safe to log — mode
 * names are not secret) and the list of valid modes so operators can fix
 * the typo without grepping source.
 */
/**
 * Thrown by `loadDemoCapConfig` when `MAX_DEMO_ORDER_NOTIONAL_USD` or
 * `MAX_DAILY_DEMO_NOTIONAL_USD` is set to a value that cannot be a
 * legitimate cap (negative or non-numeric). Note: `0` is explicitly valid
 * and means "no orders may be placed" — it is NOT a parse failure.
 */
export class InvalidCapConfigError extends Error {
  readonly field: 'maxOrder' | 'maxDaily';
  readonly rawValue: string;
  readonly reason: string;
  readonly envKey: string;

  constructor(input: {
    field: 'maxOrder' | 'maxDaily';
    rawValue: string;
    reason: string;
  }) {
    const envKey = input.field === 'maxOrder'
      ? 'MAX_DEMO_ORDER_NOTIONAL_USD'
      : 'MAX_DAILY_DEMO_NOTIONAL_USD';
    super(
      `Invalid ${envKey}="${input.rawValue}": ${input.reason}. ` +
      `Valid range is any finite non-negative number; 0 means "no orders allowed", ` +
      `unset uses the default cap.`,
    );
    this.name = 'InvalidCapConfigError';
    this.field = input.field;
    this.rawValue = input.rawValue;
    this.reason = input.reason;
    this.envKey = envKey;
  }
}

/**
 * Thrown by `loadInstrumentOverrides` when `ETORO_INSTRUMENT_OVERRIDES` is
 * set but cannot be parsed safely:
 *   - `field: 'json'`   — JSON.parse failed
 *   - `field: 'shape'`  — top-level is not an object, or per-symbol slice
 *                          contains an empty `etoroInstrumentId`,
 *                          empty `displayName`, or non-positive
 *                          `referencePriceUsd`
 *   - `field: 'symbol'` — key is not one of `INSTRUMENT_SYMBOLS`
 */
export class InvalidInstrumentOverridesError extends Error {
  readonly field: 'json' | 'shape' | 'symbol';
  readonly reason: string;
  readonly offendingKey?: string;

  constructor(input: {
    field: 'json' | 'shape' | 'symbol';
    reason: string;
    offendingKey?: string;
  }) {
    super(
      `Invalid ETORO_INSTRUMENT_OVERRIDES (field=${input.field}): ${input.reason}.`,
    );
    this.name = 'InvalidInstrumentOverridesError';
    this.field = input.field;
    this.reason = input.reason;
    this.offendingKey = input.offendingKey;
  }
}

export class InvalidModeError extends Error {
  readonly rawValue: string;
  readonly validModes: readonly EtoroMode[];

  constructor(rawValue: string, validModes: readonly EtoroMode[]) {
    super(
      `ETORO_MODE="${rawValue}" is not a recognized mode. ` +
      `Valid modes: ${validModes.join(', ')}. ` +
      `Note: the older "sandbox" and bare "demo" / "real" names were retired in lane 0007; ` +
      `use "demo-readonly" or "demo-trading" instead.`,
    );
    this.name = 'InvalidModeError';
    this.rawValue = rawValue;
    this.validModes = validModes;
  }
}

/**
 * Thrown by any trading-mutating method when the SDK is not in a mode
 * that allows real-money or demo trading. The lane's `REAL_TRADING_ENABLED`
 * fence guarantees this is also thrown for `real-disabled` mode regardless
 * of what env vars are present.
 */
export class RealTradingDisabledError extends Error {
  readonly mode: EtoroMode;
  readonly action: string;

  constructor(action: string, mode: EtoroMode) {
    super(
      `Trading is disabled in mode "${mode}". Action "${action}" refused. ` +
      `Real trading is fenced at the source level (REAL_TRADING_ENABLED=false). ` +
      `Use ETORO_MODE=demo-trading with demo credentials to place demo orders.`,
    );
    this.name = 'RealTradingDisabledError';
    this.mode = mode;
    this.action = action;
  }
}

/**
 * Thrown when a demo order would exceed either the per-order or
 * cumulative-day notional cap. The cap-enforcer audits the attempt and
 * never lets the request reach the HTTP layer.
 */
export type DemoCapKind = 'per-order' | 'daily' | 'reference-drift';

export class DemoCapExceededError extends Error {
  readonly cap: DemoCapKind;
  readonly capLimitUsd: number;
  readonly attemptedNotionalUsd: number;
  readonly currentDailyTotalUsd: number;

  constructor(input: {
    cap: DemoCapKind;
    capLimitUsd: number;
    attemptedNotionalUsd: number;
    currentDailyTotalUsd: number;
  }) {
    super(
      `Demo cap "${input.cap}" exceeded: ` +
      `attempt=${input.attemptedNotionalUsd.toFixed(2)} USD, ` +
      `cap=${input.capLimitUsd.toFixed(2)} USD, ` +
      `dailyTotal=${input.currentDailyTotalUsd.toFixed(2)} USD.`,
    );
    this.name = 'DemoCapExceededError';
    this.cap = input.cap;
    this.capLimitUsd = input.capLimitUsd;
    this.attemptedNotionalUsd = input.attemptedNotionalUsd;
    this.currentDailyTotalUsd = input.currentDailyTotalUsd;
  }
}

/**
 * Thrown by `AccountModule` read-only methods when the SDK is in a mode
 * that has no demo HTTP base (i.e. `mock`). Parallel to
 * `RealTradingDisabledError` for write paths: every public method on
 * `AccountModule` checks the mode up-front and refuses with this typed
 * error instead of letting axios surface `Unsupported protocol mock:`.
 *
 * `action`, `mode`, `reason` are readonly fields so consumers can pattern
 * match without grepping the message string.
 */
export class AccountUnavailableError extends Error {
  readonly action: string;
  readonly mode: EtoroMode;
  readonly reason: string;

  constructor(input: { action: string; mode: EtoroMode; reason: string }) {
    super(
      `Account API unavailable in mode "${input.mode}". ` +
      `Action "${input.action}" refused: ${input.reason}. ` +
      `Set ETORO_MODE to one of: demo-readonly, demo-trading, real-disabled, ` +
      `and provide ETORO_DEMO_KEY / ETORO_DEMO_SECRET.`,
    );
    this.name = 'AccountUnavailableError';
    this.action = input.action;
    this.mode = input.mode;
    this.reason = input.reason;
  }
}

/**
 * Thrown by `TradingModule` mutating methods when the caller hands in an
 * obviously invalid request (NaN amount, empty symbol, invalid side, etc.).
 * Caught and audit-logged as a PRE-CHECK entry; no HTTP call is ever made.
 *
 * `field` identifies the offending field name (safe to log — not secret).
 * `reason` is a short human-readable description of why the value was
 * rejected; raw request bodies are deliberately NOT echoed so secrets or
 * order details never leak to logs.
 */
export class InvalidOrderError extends Error {
  readonly field: string;
  readonly reason: string;

  constructor(input: { field: string; reason: string }) {
    super(`Invalid order: field "${input.field}" — ${input.reason}.`);
    this.name = 'InvalidOrderError';
    this.field = input.field;
    this.reason = input.reason;
  }
}

/**
 * Thrown by `TradingModule` when the USD notional of a market order cannot
 * be resolved. Market orders never carry a `price`, so the SDK needs either
 * an injected `notionalSizer`, an `INSTRUMENT_MAP.referencePriceUsd` via the
 * `symbolReferencePriceUsd` hook, or an explicit limit-order `price`. When
 * none are available we refuse the order rather than letting the cap math
 * silently treat a unit count as a USD figure.
 */
/**
 * Thrown by any SDK list-returning read endpoint when the eToro API
 * returns a 200-OK with a shape the SDK does not recognize (neither a
 * raw array nor an object carrying one of `LIST_ENVELOPE_KEYS`).
 *
 * The error is opt-in: only fired when the client is constructed with
 * `throwOnMalformedListResponse: true`. The default path returns `[]`
 * and audit-logs the drift, preserving back-compat.
 *
 * `action` identifies the SDK method (`'getQuotes'`, `'getInstruments'`,
 * etc.), `observedShape` mirrors the discriminator from
 * `readListEnvelope`, and `topLevelKeys` is the alphabetically-sorted
 * set of top-level keys observed on the payload — together they give
 * an operator everything needed to identify the upstream rename
 * without re-running the request.
 */
export type MalformedListResponseShape =
  | 'null'
  | 'primitive'
  | 'object-no-match';

export class MalformedListResponseError extends Error {
  readonly action: string;
  readonly observedShape: MalformedListResponseShape;
  readonly topLevelKeys: readonly string[];
  readonly path: string;

  constructor(input: {
    action: string;
    observedShape: MalformedListResponseShape;
    topLevelKeys: readonly string[];
    path: string;
  }) {
    super(
      `Malformed list response from "${input.path}" (action="${input.action}"): ` +
      `observedShape=${input.observedShape}, ` +
      `topLevelKeys=[${input.topLevelKeys.join(',')}]. ` +
      `eToro returned a 200-OK with a body shape the SDK does not recognize. ` +
      `Either add the new envelope key to LIST_ENVELOPE_KEYS or set ` +
      `throwOnMalformedListResponse=false to fall back to the empty-list default.`,
    );
    this.name = 'MalformedListResponseError';
    this.action = input.action;
    this.observedShape = input.observedShape;
    this.topLevelKeys = input.topLevelKeys;
    this.path = input.path;
  }
}

/**
 * Thrown by `InstrumentResolver` when a symbol has no exact match in the
 * `/market-data/search` response. The eToro public API's search endpoint
 * returns fuzzy matches (e.g. searching `BTC` yields `BTC`, `BTCEUR`,
 * `BTCGBP`, …). The resolver explicitly REFUSES to accept the first
 * fuzzy result per the lane constraint; an unresolvable symbol is a
 * hard error so the operator notices instead of silently pricing the
 * wrong instrument.
 */
export class InstrumentNotFoundError extends Error {
  readonly symbol: string;
  readonly candidates: readonly string[];

  constructor(input: { symbol: string; candidates: readonly string[] }) {
    super(
      `No exact match for symbol "${input.symbol}" in /market-data/search response. ` +
      `Candidates returned: [${input.candidates.join(', ')}]. ` +
      `Add an exact internalSymbolFull/symbol match or set ETORO_INSTRUMENT_OVERRIDES ` +
      `to pin the instrumentId manually (see docs/ETORO_GOODCHAIN_ADAPTER.md).`,
    );
    this.name = 'InstrumentNotFoundError';
    this.symbol = input.symbol;
    this.candidates = input.candidates;
  }
}

export class MissingNotionalError extends Error {
  readonly symbol: string;
  readonly attemptedAmount: number;
  readonly reason: string;

  constructor(input: {
    symbol: string;
    attemptedAmount: number;
    reason: string;
  }) {
    super(
      `Cannot resolve USD notional for order on symbol "${input.symbol}" ` +
      `(amount=${input.attemptedAmount}): ${input.reason}. ` +
      `Provide a limit-order price, a notionalSizer, or a ` +
      `symbolReferencePriceUsd hook with a reference price for the symbol.`,
    );
    this.name = 'MissingNotionalError';
    this.symbol = input.symbol;
    this.attemptedAmount = input.attemptedAmount;
    this.reason = input.reason;
  }
}
