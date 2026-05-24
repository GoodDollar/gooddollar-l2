import {
  KNOWN_REJECTION_REASONS,
  METRICS_CONTENT_TYPE,
  MetricsSnapshot,
  escapeLabelValue,
  renderMetrics,
  renderMinimalMetrics,
} from '../metrics';

const RUNTIME = {
  etoroMode: 'sandbox',
  network: 'testnet',
  fixtureOnly: true,
  realTradingEnabled: false,
};

function makeSnap(overrides: Partial<MetricsSnapshot> = {}): MetricsSnapshot {
  return {
    version: '0.1.0',
    uptimeSeconds: 42.3,
    runtime: RUNTIME,
    cacheSize: 0,
    cacheFreshSize: 0,
    cacheAges: [],
    ingestTotal: 0,
    acceptedTotal: 0,
    rejectedTotalByReason: {},
    sourceReason: 'connected',
    sourceConnected: true,
    wsListening: true,
    wsClients: 0,
    auditWriteErrorsTotal: 0,
    auditBufferedDropsTotal: 0,
    ...overrides,
  };
}

describe('metrics — content type', () => {
  it('METRICS_CONTENT_TYPE matches Prometheus 0.0.4 spec exactly', () => {
    expect(METRICS_CONTENT_TYPE).toBe(
      'text/plain; version=0.0.4; charset=utf-8',
    );
  });
});

describe('escapeLabelValue (Prometheus spec)', () => {
  it('passes ASCII alphanum through unchanged', () => {
    expect(escapeLabelValue('AAPL')).toBe('AAPL');
  });

  it('escapes backslash to double backslash', () => {
    expect(escapeLabelValue('a\\b')).toBe('a\\\\b');
  });

  it('escapes double quote to backslash-quote', () => {
    expect(escapeLabelValue('a"b')).toBe('a\\"b');
  });

  it('escapes newline to backslash-n', () => {
    expect(escapeLabelValue('a\nb')).toBe('a\\nb');
  });

  it('escapes a mixed payload in one pass', () => {
    expect(escapeLabelValue('a"b\\c\nd')).toBe('a\\"b\\\\c\\nd');
  });

  it('leaves a forward slash alone (no escape required)', () => {
    expect(escapeLabelValue('EUR/USD')).toBe('EUR/USD');
  });
});

describe('renderMetrics — empty snapshot', () => {
  const body = renderMetrics(makeSnap());
  const FAMILIES = [
    'price_service_info',
    'price_service_uptime_seconds',
    'price_service_cache_size',
    'price_service_cache_fresh_size',
    'price_service_cache_age_seconds',
    'price_service_ingest_total',
    'price_service_accepted_total',
    'price_service_rejected_total',
    'price_service_source_connected',
    'price_service_ws_listening',
    'price_service_ws_clients',
    'price_service_audit_write_errors_total',
    'price_service_audit_buffered_drops_total',
  ];

  it.each(FAMILIES)('emits a `# HELP` line for %s', (name) => {
    expect(body).toMatch(new RegExp(`^# HELP ${name} `, 'm'));
  });

  it.each(FAMILIES)('emits a `# TYPE` line for %s', (name) => {
    expect(body).toMatch(new RegExp(`^# TYPE ${name} (gauge|counter)$`, 'm'));
  });

  it('ends with a single trailing newline', () => {
    expect(body.endsWith('\n')).toBe(true);
    expect(body.endsWith('\n\n')).toBe(false);
  });

  it('emits exactly one source_connected sample (active reason "connected", value 1)', () => {
    const matches = body.match(/^price_service_source_connected\{[^}]*\} \d+$/gm);
    expect(matches).not.toBeNull();
    expect(matches!.length).toBe(1);
    expect(matches![0]).toBe('price_service_source_connected{reason="connected"} 1');
  });

  it('emits zero cache_age_seconds samples when cache is empty', () => {
    const matches = body.match(/^price_service_cache_age_seconds[^a-z_]/gm);
    expect(matches).toBeNull();
  });

  it('cache_age_seconds HELP line documents the empty-rows semantics', () => {
    expect(body).toMatch(
      /^# HELP price_service_cache_age_seconds .* Empty when no quotes are cached\.$/m,
    );
  });

  it('emits one zero-baseline rejected_total row per known reason when cold', () => {
    const matches = body.match(/^price_service_rejected_total\{reason="[^"]+"\} \d+$/gm);
    expect(matches).toEqual(
      [...KNOWN_REJECTION_REASONS]
        .sort()
        .map((r) => `price_service_rejected_total{reason="${r}"} 0`),
    );
  });
});

describe('renderMetrics — populated snapshot', () => {
  const snap = makeSnap({
    cacheSize: 3,
    cacheFreshSize: 2,
    cacheAges: [
      { symbol: 'AAPL', ageSeconds: 1.234 },
      { symbol: 'MSFT', ageSeconds: 3.7 },
      { symbol: 'NVDA', ageSeconds: 0.05 },
    ],
    ingestTotal: 1234,
    acceptedTotal: 1100,
    rejectedTotalByReason: {
      stale: 22,
      'spread-too-wide': 10,
    },
    sourceReason: 'source-unavailable',
    sourceConnected: false,
    wsListening: true,
    wsClients: 4,
    auditWriteErrorsTotal: 0,
    auditBufferedDropsTotal: 0,
  });
  const body = renderMetrics(snap);

  it('emits a cache_age_seconds sample per cached symbol with the correct seconds value', () => {
    expect(body).toContain('price_service_cache_age_seconds{symbol="AAPL"} 1.234');
    expect(body).toContain('price_service_cache_age_seconds{symbol="MSFT"} 3.7');
    expect(body).toContain('price_service_cache_age_seconds{symbol="NVDA"} 0.05');
  });

  it('overlays observed counts onto the zero-baseline rows in sorted-key order', () => {
    const matches = body.match(/^price_service_rejected_total\{reason="[^"]+"\} \d+$/gm);
    expect(matches).toEqual([
      'price_service_rejected_total{reason="crossed"} 0',
      'price_service_rejected_total{reason="deviation"} 0',
      'price_service_rejected_total{reason="halted"} 0',
      'price_service_rejected_total{reason="invalid"} 0',
      'price_service_rejected_total{reason="market-closed"} 0',
      'price_service_rejected_total{reason="spread-too-wide"} 10',
      'price_service_rejected_total{reason="stale"} 22',
      'price_service_rejected_total{reason="unknown"} 0',
    ]);
  });

  it('emits source_connected=0 with the active non-connected reason label', () => {
    expect(body).toMatch(
      /^price_service_source_connected\{reason="source-unavailable"\} 0$/m,
    );
  });

  it('emits ingest_total as accepted + rejected (consumer-side math)', () => {
    expect(body).toContain('price_service_ingest_total 1234');
  });

  it('emits ws_clients with the integer count', () => {
    expect(body).toMatch(/^price_service_ws_clients 4$/m);
  });

  it('emits price_service_info with the labeled identity gauge of 1', () => {
    expect(body).toContain(
      'price_service_info{version="0.1.0",etoro_mode="sandbox",network="testnet",fixture_only="true",real_trading_enabled="false"} 1',
    );
  });
});

describe('renderMetrics — future rejection reason resilience', () => {
  it('emits an extra row for a not-yet-cataloged reason without dropping baselines', () => {
    const body = renderMetrics(
      makeSnap({ rejectedTotalByReason: { 'new-future-reason': 7 } }),
    );
    const matches = body.match(/^price_service_rejected_total\{reason="[^"]+"\} \d+$/gm);
    const expected = [
      ...KNOWN_REJECTION_REASONS.map((r) => `price_service_rejected_total{reason="${r}"} 0`),
      'price_service_rejected_total{reason="new-future-reason"} 7',
    ].sort();
    expect(matches).toEqual(expected);
  });
});

describe('renderMetrics — defensive coercion', () => {
  it('coerces NaN values to 0 (Prometheus parsers reject NaN gauges)', () => {
    const body = renderMetrics(makeSnap({ uptimeSeconds: Number.NaN }));
    expect(body).toMatch(/^price_service_uptime_seconds 0$/m);
  });

  it('coerces +Infinity to 0', () => {
    const body = renderMetrics(makeSnap({ uptimeSeconds: Number.POSITIVE_INFINITY }));
    expect(body).toMatch(/^price_service_uptime_seconds 0$/m);
  });

  it('escapes a forward-slash-bearing symbol label correctly', () => {
    const body = renderMetrics(
      makeSnap({ cacheAges: [{ symbol: 'EUR/USD', ageSeconds: 0.5 }] }),
    );
    expect(body).toContain('price_service_cache_age_seconds{symbol="EUR/USD"} 0.5');
  });

  it('escapes embedded quotes / backslashes in a hostile symbol label', () => {
    const body = renderMetrics(
      makeSnap({ cacheAges: [{ symbol: 'AA\\PL"', ageSeconds: 1 }] }),
    );
    expect(body).toContain(
      'price_service_cache_age_seconds{symbol="AA\\\\PL\\""} 1',
    );
  });
});

describe('renderMetrics — line ordering is stable', () => {
  it('# HELP precedes # TYPE precedes the sample line for every family', () => {
    const body = renderMetrics(makeSnap());
    const lines = body.split('\n');
    const helpIdx = lines.indexOf('# HELP price_service_uptime_seconds Seconds since the service booted.');
    const typeIdx = lines.indexOf('# TYPE price_service_uptime_seconds gauge');
    const sampleIdx = lines.findIndex((l) => l.startsWith('price_service_uptime_seconds '));
    expect(helpIdx).toBeGreaterThan(-1);
    expect(typeIdx).toBe(helpIdx + 1);
    expect(sampleIdx).toBe(typeIdx + 1);
  });

  it('is byte-stable across calls with the same snapshot', () => {
    const snap = makeSnap({
      rejectedTotalByReason: { 'stale-spread': 1, 'stale-timestamp': 2 },
    });
    expect(renderMetrics(snap)).toBe(renderMetrics(snap));
  });
});

describe('renderMinimalMetrics — defence-in-depth fallback', () => {
  it('emits at minimum a price_service_info line and an UNAVAILABLE comment', () => {
    const body = renderMinimalMetrics(RUNTIME, '0.1.0', 'snapshot threw');
    expect(body).toContain('# UNAVAILABLE: snapshot threw');
    expect(body).toContain('price_service_info{');
  });

  it('sanitises newlines in the UNAVAILABLE comment', () => {
    const body = renderMinimalMetrics(RUNTIME, '0.1.0', 'line one\nline two');
    expect(body).toContain('# UNAVAILABLE: line one line two');
    expect(body.match(/^# UNAVAILABLE/gm)?.length).toBe(1);
  });

  it('ends with a trailing newline', () => {
    expect(renderMinimalMetrics(RUNTIME, '0.1.0', 'x').endsWith('\n')).toBe(true);
  });
});
