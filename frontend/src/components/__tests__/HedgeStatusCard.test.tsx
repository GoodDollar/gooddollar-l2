import { createRef } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import HedgeStatusCard, { type HedgeStatusCardHandle } from '../HedgeStatusCard';
import { normalizeHedgeError } from '@/lib/hedge-error';

const BASE_RESPONSE = {
  snapshot: {
    timestamp: Date.now() - 5_000,
    hedgesExecuted: [],
  },
  capSnapshot: {
    dailyNotionalUsd: 150,
    dailyOrders: 3,
    cycleOrders: 1,
    dayKey: '2026-05-23',
  },
  breakerState: { tripped: false },
  killSwitchEngaged: false,
  mode: 'demo' as const,
  receipts: [
    {
      v: 1,
      id: 'abc12345defg',
      timestamp: 1700000000000,
      symbol: 'AAPL',
      side: 'buy',
      notionalUsd: 50,
      success: true,
      etoroOrderId: 'etoro-1',
      beforeExposure: 100,
      afterExposure: 50,
      dryRun: false,
      mode: 'demo',
    },
  ],
  proof: {
    path: '.autobuilder/initiatives/0007e-hedging-demo/proofs/run-2026-05-23.md',
    timestamp: 1700000000000,
    summary: 'demo — 1 receipts',
  },
};

function mockFetchOnce(body: unknown, init: ResponseInit = { status: 200 }) {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response(JSON.stringify(body), {
      status: init.status,
      headers: { 'Content-Type': 'application/json' },
    }),
  );
}

beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('HedgeStatusCard', () => {
  it('renders the mode badge (demo) once the first fetch resolves', async () => {
    mockFetchOnce({ ...BASE_RESPONSE, mode: 'demo' });
    render(<HedgeStatusCard />);
    const badge = await screen.findByTestId('hedge-mode-badge');
    expect(badge).toHaveTextContent('demo');
    expect(badge.className).toContain('bg-goodgreen/15');
  });

  it('renders the sandbox mode badge in yellow when snapshot.mode === sandbox', async () => {
    mockFetchOnce({ ...BASE_RESPONSE, mode: 'sandbox' });
    render(<HedgeStatusCard />);
    const badge = await screen.findByTestId('hedge-mode-badge');
    expect(badge).toHaveTextContent('sandbox');
    expect(badge.className).toContain('bg-yellow-500/15');
  });

  it('renders the real mode badge in red when snapshot.mode === real', async () => {
    mockFetchOnce({ ...BASE_RESPONSE, mode: 'real' });
    render(<HedgeStatusCard />);
    const badge = await screen.findByTestId('hedge-mode-badge');
    expect(badge).toHaveTextContent('real');
    expect(badge.className).toContain('bg-red-500/15');
  });

  it('engine unreachable: header pill reads "engine down" in red, no grey mode badge (#0024)', async () => {
    mockFetchOnce(
      {
        error: 'Hedge engine unreachable',
        snapshot: null,
        mode: null,
        receipts: [],
        proof: null,
      },
      { status: 503 },
    );
    render(<HedgeStatusCard />);
    const pill = await screen.findByTestId('hedge-engine-state-pill');
    expect(pill).toHaveTextContent(/engine down/i);
    expect(pill.className).toContain('text-red-300');
    expect(screen.queryByTestId('hedge-mode-badge')).toBeNull();
  });

  it('kill switch engaged: header pill reads "engine halted" in yellow (#0024)', async () => {
    mockFetchOnce({ ...BASE_RESPONSE, killSwitchEngaged: true });
    render(<HedgeStatusCard />);
    const pill = await screen.findByTestId('hedge-engine-state-pill');
    expect(pill).toHaveTextContent(/engine halted/i);
    expect(pill.className).toContain('text-yellow-300');
    expect(screen.queryByTestId('hedge-mode-badge')).toBeNull();
  });

  it('breaker tripped: header pill reads "engine degraded" in yellow (#0024)', async () => {
    mockFetchOnce({
      ...BASE_RESPONSE,
      breakerState: { tripped: true, reason: 'exposure_stale' },
    });
    render(<HedgeStatusCard />);
    const pill = await screen.findByTestId('hedge-engine-state-pill');
    expect(pill).toHaveTextContent(/engine degraded/i);
    expect(pill.className).toContain('text-yellow-300');
    expect(screen.queryByTestId('hedge-mode-badge')).toBeNull();
  });

  it('happy path: header still renders ModeBadge with "demo" (no #0008 regression) (#0024)', async () => {
    mockFetchOnce(BASE_RESPONSE);
    render(<HedgeStatusCard />);
    const badge = await screen.findByTestId('hedge-mode-badge');
    expect(badge).toHaveTextContent('demo');
    expect(screen.queryByTestId('hedge-engine-state-pill')).toBeNull();
  });

  it('header pill keeps a "last receipt mode" title attribute when a prior mode is known (#0024)', async () => {
    mockFetchOnce(BASE_RESPONSE);
    render(<HedgeStatusCard />);
    const badge = await screen.findByTestId('hedge-mode-badge');
    const wrapper = badge.closest('[title]');
    expect(wrapper).not.toBeNull();
    expect(wrapper!.getAttribute('title')).toMatch(/last receipt mode:\s+demo/i);
  });

  it('renders a receipt row with short id and monospace styling', async () => {
    mockFetchOnce(BASE_RESPONSE);
    render(<HedgeStatusCard />);
    const row = await screen.findByTestId('hedge-receipt-row');
    expect(row).toBeInTheDocument();
    expect(row).toHaveTextContent('abc12345');
    // not the full id
    expect(row).not.toHaveTextContent('abc12345defg');
    // monospace via className
    expect(row.className).toContain('font-mono');
  });

  it('shows the kill-switch callout when engaged', async () => {
    mockFetchOnce({ ...BASE_RESPONSE, killSwitchEngaged: true });
    render(<HedgeStatusCard />);
    expect(await screen.findByTestId('hedge-killswitch-callout')).toBeInTheDocument();
  });

  it('shows the breaker callout with reason when tripped', async () => {
    mockFetchOnce({
      ...BASE_RESPONSE,
      breakerState: { tripped: true, reason: 'exposure_stale', detail: 'oldest read age=30000ms' },
    });
    render(<HedgeStatusCard />);
    const callout = await screen.findByTestId('hedge-breaker-callout');
    expect(callout).toHaveTextContent('exposure_stale');
    expect(callout).toHaveTextContent('oldest read age=30000ms');
  });

  it('shows the healthy empty state when snapshot present + no receipts (#0019)', async () => {
    mockFetchOnce({ ...BASE_RESPONSE, receipts: [] });
    render(<HedgeStatusCard />);
    const empty = await screen.findByTestId('hedge-receipts-empty');
    expect(empty).toHaveTextContent(/No hedge activity yet/i);
    expect(empty).toHaveTextContent(/appear here/i);
  });

  it('receipts empty state honestly says "engine unreachable" when there is an error and no snapshot (#0019)', async () => {
    mockFetchOnce(
      {
        error: 'Hedge engine unreachable',
        snapshot: null,
        receipts: [],
        proof: null,
      },
      { status: 503 },
    );
    render(<HedgeStatusCard />);
    const empty = await screen.findByTestId('hedge-receipts-empty');
    expect(empty).toHaveTextContent(/engine unreachable/i);
    expect(empty).not.toHaveTextContent(/No hedge activity yet/i);
  });

  it('receipts empty state surfaces the degraded reason when receipts source is degraded (#0019)', async () => {
    mockFetchOnce({
      ...BASE_RESPONSE,
      receipts: [],
      degraded: { receipts: 'cache miss' },
    });
    render(<HedgeStatusCard />);
    const empty = await screen.findByTestId('hedge-receipts-empty');
    expect(empty).toHaveTextContent(/degraded/i);
    expect(empty).toHaveTextContent(/cache miss/i);
  });

  it('shows an error fallback when the API rejects', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('ECONNREFUSED'));
    render(<HedgeStatusCard />);
    await waitFor(() => {
      expect(screen.getByTestId('hedge-status-error')).toBeInTheDocument();
    });
    expect(screen.getByTestId('hedge-status-error')).toHaveTextContent('ECONNREFUSED');
  });

  it('error banner has bottom-margin (mb-3) so it does not butt against the receipts panel', async () => {
    // Regression guard for #0018: every other callout (throttle, kill-switch,
    // breaker) carries `mb-3`; the error banner had no margin, causing the
    // red pill to touch the dark "Recent receipts" panel below it.
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('ECONNREFUSED'));
    render(<HedgeStatusCard />);
    const banner = await screen.findByTestId('hedge-status-error');
    expect(banner.className.split(/\s+/)).toContain('mb-3');
  });

  it('shows a loading skeleton before the first fetch resolves', () => {
    vi.spyOn(globalThis, 'fetch').mockReturnValue(new Promise(() => {}));
    render(<HedgeStatusCard />);
    expect(screen.getByTestId('hedge-status-loading')).toBeInTheDocument();
  });

  it('renders a Retry button inside the error banner and refetches on click', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('ECONNREFUSED'));
    render(<HedgeStatusCard />);
    const retry = await screen.findByTestId('hedge-retry-button');
    expect(retry).toBeInTheDocument();
    const firstCallCount = fetchSpy.mock.calls.length;
    fireEvent.click(retry);
    await waitFor(() => {
      expect(fetchSpy.mock.calls.length).toBeGreaterThan(firstCallCount);
    });
  });

  it('shows "Retrying…" label and disables the Retry button while a refetch is in flight', async () => {
    let resolveFn: (value: Response) => void = () => {};
    const inFlight = new Promise<Response>((resolve) => { resolveFn = resolve; });
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
      .mockRejectedValueOnce(new Error('ECONNREFUSED'))
      .mockReturnValueOnce(inFlight);
    render(<HedgeStatusCard />);
    const retry = await screen.findByTestId('hedge-retry-button');
    expect(retry).toHaveTextContent('Retry');
    fireEvent.click(retry);
    await waitFor(() => {
      expect(retry).toHaveTextContent('Retrying');
    });
    expect((retry as HTMLButtonElement).disabled).toBe(true);
    await act(async () => {
      resolveFn(new Response(JSON.stringify(BASE_RESPONSE), { status: 200, headers: { 'Content-Type': 'application/json' } }));
      await inFlight;
    });
    expect(fetchSpy.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it('header keeps refresh button anchored to the title row even when no proof block exists (#0017)', async () => {
    // Mobile-orphan-strip regression guard: with no proof loaded (engine
    // unreachable case), the refresh button must NOT wrap onto its own
    // row. Structurally we assert title and refresh button share a parent
    // that does not contain the conditional metadata row.
    mockFetchOnce(
      {
        error: 'Hedge engine unreachable',
        snapshot: null,
        receipts: [],
        proof: null,
      },
      { status: 503 },
    );
    render(<HedgeStatusCard />);
    const refreshBtn = await screen.findByTestId('hedge-header-refresh-button');
    // After #0024 the engine-unreachable header pill is the engine-state
    // pill, not the trading-mode badge. Either pill must live in row 1.
    const headerPill =
      (await screen.findByTestId('hedge-engine-state-pill').catch(() => null)) ??
      (await screen.findByTestId('hedge-mode-badge'));
    const titleRow = refreshBtn.closest('[data-testid="hedge-header-row1"]');
    expect(titleRow).not.toBeNull();
    expect(titleRow!.contains(headerPill)).toBe(true);
    expect(screen.queryByTestId('hedge-proof-link')).toBeNull();
    // After 0020 lands, row 2 always renders to host the "Updated"
    // timestamp + auto-refresh hint, but it must NOT contain the
    // refresh button — that stays anchored in row 1.
    const row2 = screen.queryByTestId('hedge-header-row2');
    if (row2) {
      expect(row2.contains(refreshBtn)).toBe(false);
    }
  });

  it('header places proof link in a separate row-2 metadata block when a proof is present (#0017)', async () => {
    mockFetchOnce(BASE_RESPONSE);
    render(<HedgeStatusCard />);
    const refreshBtn = await screen.findByTestId('hedge-header-refresh-button');
    const proofLink = await screen.findByTestId('hedge-proof-link');
    const row1 = refreshBtn.closest('[data-testid="hedge-header-row1"]');
    const row2 = proofLink.closest('[data-testid="hedge-header-row2"]');
    expect(row1).not.toBeNull();
    expect(row2).not.toBeNull();
    expect(row1!.contains(proofLink)).toBe(false);
    expect(row2!.contains(refreshBtn)).toBe(false);
  });

  it('renders a header refresh button that triggers a refetch on click', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(BASE_RESPONSE), { status: 200, headers: { 'Content-Type': 'application/json' } }),
    );
    render(<HedgeStatusCard />);
    const headerBtn = await screen.findByTestId('hedge-header-refresh-button');
    expect(headerBtn).toBeInTheDocument();
    const before = fetchSpy.mock.calls.length;
    fireEvent.click(headerBtn);
    await waitFor(() => {
      expect(fetchSpy.mock.calls.length).toBeGreaterThan(before);
    });
  });

  it('refresh button reads "Refresh" with an icon in idle state (#0020)', async () => {
    mockFetchOnce(BASE_RESPONSE);
    render(<HedgeStatusCard />);
    const btn = await screen.findByTestId('hedge-header-refresh-button');
    expect(btn).toHaveTextContent(/Refresh/);
    expect(btn.querySelector('svg')).not.toBeNull();
  });

  it('refresh button label switches to "Refreshing…" with a spinning icon during fetch (#0020)', async () => {
    let resolveFn: (value: Response) => void = () => {};
    const inFlight = new Promise<Response>((resolve) => { resolveFn = resolve; });
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify(BASE_RESPONSE), {
        status: 200, headers: { 'Content-Type': 'application/json' },
      }))
      .mockReturnValueOnce(inFlight);
    render(<HedgeStatusCard />);
    const btn = await screen.findByTestId('hedge-header-refresh-button');
    fireEvent.click(btn);
    await waitFor(() => {
      expect(btn).toHaveTextContent(/Refreshing/);
    });
    const svg = btn.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg!.getAttribute('class') ?? '').toContain('animate-spin');
    await act(async () => {
      resolveFn(new Response(JSON.stringify(BASE_RESPONSE), {
        status: 200, headers: { 'Content-Type': 'application/json' },
      }));
      await inFlight;
    });
  });

  it('refresh button label switches to "Retry in Ns" when the limiter returns 429 (#0020)', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'Too many requests', retryAfterSeconds: 5 }), {
        status: 429,
        headers: { 'Content-Type': 'application/json', 'Retry-After': '5' },
      }),
    );
    render(<HedgeStatusCard />);
    const btn = await screen.findByTestId('hedge-header-refresh-button');
    await waitFor(() => {
      expect(btn).toHaveTextContent(/Retry in \d+s/);
    });
  });

  it('header surfaces an "auto-refresh" hint with the poll interval in seconds (#0020)', async () => {
    mockFetchOnce(BASE_RESPONSE);
    render(<HedgeStatusCard />);
    await screen.findByTestId('hedge-mode-badge');
    expect(screen.getByText(/auto-refresh 10s/i)).toBeInTheDocument();
  });

  it('freshness label reads "Last tick: never" before any fetch resolves (#0020/#0023)', async () => {
    vi.spyOn(globalThis, 'fetch').mockReturnValue(new Promise(() => {}));
    render(<HedgeStatusCard />);
    const stamp = await screen.findByTestId('hedge-last-success');
    expect(stamp.textContent ?? '').toMatch(/Last tick\s+never/i);
  });

  it('freshness label collapses to "Last tick Ns ago" after a healthy fetch (#0020/#0023)', async () => {
    mockFetchOnce(BASE_RESPONSE);
    render(<HedgeStatusCard />);
    await screen.findByTestId('hedge-mode-badge');
    const stamp = await screen.findByTestId('hedge-last-success');
    expect(stamp.textContent ?? '').toMatch(/Last tick\s+\d+s ago/i);
  });

  it('exposes an imperative refresh() method via ref', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(BASE_RESPONSE), { status: 200, headers: { 'Content-Type': 'application/json' } }),
    );
    const ref = createRef<HedgeStatusCardHandle>();
    render(<HedgeStatusCard ref={ref} />);
    await screen.findByTestId('hedge-mode-badge');
    const before = fetchSpy.mock.calls.length;
    await act(async () => {
      ref.current?.refresh();
      await Promise.resolve();
    });
    await waitFor(() => {
      expect(fetchSpy.mock.calls.length).toBeGreaterThan(before);
    });
  });

  it('happy path: renders ENGINE: ok in green', async () => {
    mockFetchOnce(BASE_RESPONSE);
    render(<HedgeStatusCard />);
    const grid = await screen.findByTestId('hedge-stat-grid');
    expect(grid).toBeInTheDocument();
    expect(grid).toHaveTextContent('ok');
    const engineStat = await screen.findByTestId('hedge-engine-stat');
    expect(engineStat.className).toContain('text-goodgreen');
  });

  it('breaker tripped: renders ENGINE: degraded in yellow', async () => {
    mockFetchOnce({
      ...BASE_RESPONSE,
      breakerState: { tripped: true, reason: 'exposure_stale' },
    });
    render(<HedgeStatusCard />);
    const engineStat = await screen.findByTestId('hedge-engine-stat');
    expect(engineStat).toHaveTextContent('degraded');
    expect(engineStat.className).toContain('text-yellow-400');
  });

  it('kill switch engaged: renders ENGINE: halted', async () => {
    mockFetchOnce({ ...BASE_RESPONSE, killSwitchEngaged: true });
    render(<HedgeStatusCard />);
    const engineStat = await screen.findByTestId('hedge-engine-stat');
    expect(engineStat).toHaveTextContent('halted');
    expect(engineStat.className).toContain('text-yellow-400');
  });

  it('engine unreachable: still renders the stat grid with em-dash placeholders + unreachable engine label (#0016)', async () => {
    // Layout-stability fix: the grid must stay mounted in all states so
    // the card height does not collapse + reflow as the engine flaps.
    mockFetchOnce(
      {
        error: 'Hedge engine unreachable',
        snapshot: null,
        receipts: [],
        proof: null,
      },
      { status: 503 },
    );
    render(<HedgeStatusCard />);
    await waitFor(() => {
      expect(screen.getByTestId('hedge-status-error')).toBeInTheDocument();
    });
    const grid = screen.getByTestId('hedge-stat-grid');
    expect(grid).toBeInTheDocument();
    const engineStat = screen.getByTestId('hedge-engine-stat');
    expect(engineStat).toHaveTextContent('unreachable');
    expect(engineStat.className).toContain('text-red-400');
  });

  it('initial loading: renders the stat grid shell so the card height does not jump on first fetch (#0016)', () => {
    vi.spyOn(globalThis, 'fetch').mockReturnValue(new Promise(() => {}));
    render(<HedgeStatusCard />);
    expect(screen.getByTestId('hedge-stat-grid')).toBeInTheDocument();
    expect(screen.getByTestId('hedge-status-loading')).toBeInTheDocument();
  });

  it('snapshot present but no cap: stat grid still renders with em-dash + awaiting-tick sub-copy (#0016)', async () => {
    mockFetchOnce({
      ...BASE_RESPONSE,
      capSnapshot: null,
    });
    render(<HedgeStatusCard />);
    const grid = await screen.findByTestId('hedge-stat-grid');
    expect(grid).toBeInTheDocument();
    expect(grid).toHaveTextContent('—');
  });

  it('latest-proof link points at the markdown route and surfaces the summary chip', async () => {
    mockFetchOnce(BASE_RESPONSE);
    render(<HedgeStatusCard />);
    const link = await screen.findByTestId('hedge-proof-link');
    expect(link.getAttribute('href')).toBe('/api/hedge/proof/latest');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toContain('noopener');
    const summary = screen.getByTestId('hedge-proof-summary');
    expect(summary).toHaveTextContent('demo — 1 receipts');
  });

  it('renders a degraded hint when body.degraded.receipts is set', async () => {
    mockFetchOnce({
      ...BASE_RESPONSE,
      degraded: { receipts: 'timeout' },
    });
    render(<HedgeStatusCard />);
    const hint = await screen.findByTestId('hedge-degraded-hint');
    expect(hint).toHaveTextContent('receipts source degraded: timeout');
  });

  it('renders a degraded hint near the proof link when body.degraded.proof is set', async () => {
    mockFetchOnce({
      ...BASE_RESPONSE,
      degraded: { proof: 'http_500' },
    });
    render(<HedgeStatusCard />);
    const hints = await screen.findAllByTestId('hedge-degraded-hint');
    expect(hints.some((h) => h.textContent?.includes('http_500'))).toBe(true);
  });

  it('renders no degraded hints when body.degraded is absent', async () => {
    mockFetchOnce(BASE_RESPONSE);
    render(<HedgeStatusCard />);
    await screen.findByTestId('hedge-mode-badge');
    expect(screen.queryAllByTestId('hedge-degraded-hint')).toHaveLength(0);
  });

  it('discards a slow earlier response when a faster newer one has already won', async () => {
    // Two pending fetches: A (mount) resolves slowly with an error body;
    // B (triggered via the imperative ref, mirroring analytics' page-level
    // Refresh) resolves quickly with the healthy snapshot. We assert the
    // late A response does NOT clobber the freshly-applied B state.
    let resolveA: (value: Response) => void = () => {};
    let resolveB: (value: Response) => void = () => {};
    const pendingA = new Promise<Response>((r) => { resolveA = r; });
    const pendingB = new Promise<Response>((r) => { resolveB = r; });
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
      .mockReturnValueOnce(pendingA)
      .mockReturnValueOnce(pendingB);

    const ref = createRef<HedgeStatusCardHandle>();
    render(<HedgeStatusCard ref={ref} />);
    await waitFor(() => {
      expect(fetchSpy.mock.calls.length).toBe(1);
    });

    // Imperative refresh while mount fetch is still pending → triggers B.
    await act(async () => {
      void ref.current?.refresh();
      await Promise.resolve();
    });
    expect(fetchSpy.mock.calls.length).toBe(2);

    // Resolve B first → card flips to healthy snapshot.
    await act(async () => {
      resolveB(new Response(JSON.stringify(BASE_RESPONSE), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }));
      await pendingB.catch(() => {});
    });
    expect(await screen.findByTestId('hedge-mode-badge')).toHaveTextContent('demo');

    // Now resolve A with an error body. The stale response must be
    // dropped — the card must still show the healthy snapshot.
    await act(async () => {
      resolveA(new Response(JSON.stringify({
        error: 'engine timeout', snapshot: null, mode: null, receipts: [], proof: null,
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }));
      await pendingA.catch(() => {});
    });
    expect(screen.queryByTestId('hedge-status-error')).toBeNull();
    expect(screen.getByTestId('hedge-mode-badge')).toHaveTextContent('demo');
  });

  it('auto-poll skips when a fetch is still in flight (no stacking)', async () => {
    vi.useFakeTimers();
    try {
      // First fetch never resolves — we want to confirm the poll silently
      // coalesces rather than kicking off a second concurrent fetch.
      const fetchSpy = vi.spyOn(globalThis, 'fetch')
        .mockReturnValue(new Promise(() => {}));
      render(<HedgeStatusCard />);
      // mount fetch is fired synchronously
      expect(fetchSpy.mock.calls.length).toBe(1);
      // advance well past the 10 s poll interval
      await act(async () => {
        vi.advanceTimersByTime(35_000);
      });
      expect(fetchSpy.mock.calls.length).toBe(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('header refresh button is disabled while any fetch (including the mount fetch) is in flight', async () => {
    vi.spyOn(globalThis, 'fetch').mockReturnValue(new Promise(() => {}));
    render(<HedgeStatusCard />);
    const headerBtn = await screen.findByTestId('hedge-header-refresh-button');
    expect((headerBtn as HTMLButtonElement).disabled).toBe(true);
  });

  it('imperative refresh() returns a promise that resolves only after the underlying fetch settles', async () => {
    let resolveFetch: (value: Response) => void = () => {};
    const pending = new Promise<Response>((r) => { resolveFetch = r; });
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify(BASE_RESPONSE), {
        status: 200, headers: { 'Content-Type': 'application/json' },
      }))
      .mockReturnValueOnce(pending);
    const ref = createRef<HedgeStatusCardHandle>();
    render(<HedgeStatusCard ref={ref} />);
    await screen.findByTestId('hedge-mode-badge');

    let refreshSettled = false;
    let refreshPromise: Promise<void> | undefined;
    await act(async () => {
      refreshPromise = ref.current?.refresh();
      void refreshPromise?.then(() => { refreshSettled = true; });
      await Promise.resolve();
    });
    expect(refreshSettled).toBe(false);

    await act(async () => {
      resolveFetch(new Response(JSON.stringify(BASE_RESPONSE), {
        status: 200, headers: { 'Content-Type': 'application/json' },
      }));
      await refreshPromise;
    });
    expect(refreshSettled).toBe(true);
  });

  it('receipts table renders eToro order id, exposure delta, and a timestamp tooltip', async () => {
    mockFetchOnce(BASE_RESPONSE);
    render(<HedgeStatusCard />);
    const row = await screen.findByTestId('hedge-receipt-row');
    // full internal id reachable via row title
    expect(row.getAttribute('title')).toBe('abc12345defg');
    // eToro id rendered in its dedicated cell
    const etoro = screen.getByTestId('hedge-receipt-etoro-id');
    expect(etoro).toHaveTextContent('etoro-1');
    // exposure delta cell: before → after + signed delta
    const delta = screen.getByTestId('hedge-receipt-exposure-delta');
    expect(delta).toHaveTextContent('100 → 50');
    expect(delta).toHaveTextContent('−50');
    // time cell ISO title equals the receipt timestamp in UTC
    const timeCell = row.querySelector('td[title]');
    expect(timeCell?.getAttribute('title')).toBe(new Date(1700000000000).toISOString());
  });

  it('notional cell formats four-digit values with thousands separators', async () => {
    mockFetchOnce({
      ...BASE_RESPONSE,
      receipts: [{ ...BASE_RESPONSE.receipts[0], notionalUsd: 12500 }],
    });
    render(<HedgeStatusCard />);
    const row = await screen.findByTestId('hedge-receipt-row');
    expect(row).toHaveTextContent('$12,500.00');
    expect(row).not.toHaveTextContent('$12500.00');
  });

  it('notional cell places the sign before the currency symbol for negatives', async () => {
    mockFetchOnce({
      ...BASE_RESPONSE,
      receipts: [{ ...BASE_RESPONSE.receipts[0], notionalUsd: -50 }],
    });
    render(<HedgeStatusCard />);
    const row = await screen.findByTestId('hedge-receipt-row');
    expect(row).toHaveTextContent('-$50.00');
    expect(row).not.toHaveTextContent('$-50.00');
  });

  it('daily notional stat tile uses thousands separators', async () => {
    mockFetchOnce({
      ...BASE_RESPONSE,
      capSnapshot: { ...BASE_RESPONSE.capSnapshot, dailyNotionalUsd: 12500 },
    });
    render(<HedgeStatusCard />);
    const grid = await screen.findByTestId('hedge-stat-grid');
    expect(grid).toHaveTextContent('$12,500.00');
  });

  it('receipts table renders an em-dash placeholder when etoroOrderId is missing', async () => {
    mockFetchOnce({
      ...BASE_RESPONSE,
      receipts: [{ ...BASE_RESPONSE.receipts[0], etoroOrderId: undefined }],
    });
    render(<HedgeStatusCard />);
    const etoro = await screen.findByTestId('hedge-receipt-etoro-id');
    expect(etoro).toHaveTextContent('—');
    expect(etoro).not.toHaveTextContent('etoro-1');
  });

  it('renders a yellow throttled banner with countdown when the limiter returns 429', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'Too many requests', retryAfterSeconds: 5 }), {
        status: 429,
        headers: { 'Content-Type': 'application/json', 'Retry-After': '5' },
      }),
    );
    render(<HedgeStatusCard />);
    const banner = await screen.findByTestId('hedge-status-throttled');
    expect(banner).toHaveTextContent('Throttled');
    expect(banner.className).toContain('bg-yellow-500/10');
    expect(banner.className).toContain('border-yellow-500/30');
    const countdown = screen.getByTestId('hedge-throttle-countdown');
    expect(countdown).toHaveTextContent('5s');
    const retry = screen.getByTestId('hedge-retry-button');
    expect((retry as HTMLButtonElement).disabled).toBe(true);
    expect(retry).toHaveTextContent(/Retry in \ds/);
    // Critical: the red "engine unavailable" banner must NOT render for 429.
    expect(screen.queryByTestId('hedge-status-error')).toBeNull();
  });

  it('auto-retries once the throttle countdown elapses and shows the healthy snapshot', async () => {
    vi.useFakeTimers();
    try {
      const fetchSpy = vi.spyOn(globalThis, 'fetch')
        .mockResolvedValueOnce(new Response(JSON.stringify({ error: 'Too many requests', retryAfterSeconds: 1 }), {
          status: 429,
          headers: { 'Content-Type': 'application/json', 'Retry-After': '1' },
        }))
        .mockResolvedValueOnce(new Response(JSON.stringify(BASE_RESPONSE), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }));
      render(<HedgeStatusCard />);
      // Drain microtasks so the 429 response is consumed and throttle state is set.
      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });
      expect(fetchSpy.mock.calls.length).toBe(1);
      // Advance past retry-after window
      await act(async () => {
        vi.advanceTimersByTime(1200);
      });
      // Drain microtasks for the second fetch
      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
        await Promise.resolve();
      });
      expect(fetchSpy.mock.calls.length).toBe(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it('falls back to body.retryAfterSeconds when Retry-After header is absent', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'Too many requests', retryAfterSeconds: 7 }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    render(<HedgeStatusCard />);
    const countdown = await screen.findByTestId('hedge-throttle-countdown');
    expect(countdown).toHaveTextContent('7s');
  });

  it('awaiting tick: snapshot null, no error → grid shows ENGINE: awaiting tick in neutral grey', async () => {
    mockFetchOnce({
      snapshot: null,
      capSnapshot: null,
      breakerState: null,
      killSwitchEngaged: false,
      receipts: [],
      proof: null,
    });
    render(<HedgeStatusCard />);
    const engineStat = await screen.findByTestId('hedge-engine-stat');
    expect(engineStat).toHaveTextContent('awaiting tick');
    expect(engineStat.className).toContain('text-gray-400');
  });

  it('engine stat sub line: ok state matches /last tick/i (#0021)', async () => {
    mockFetchOnce(BASE_RESPONSE);
    render(<HedgeStatusCard />);
    const engineStat = await screen.findByTestId('hedge-engine-stat');
    const tile = engineStat.closest('div');
    expect(tile).not.toBeNull();
    expect(tile!.textContent ?? '').toMatch(/last tick/i);
  });

  it('engine stat sub line: unreachable state matches /auto-retry/i in red (#0021)', async () => {
    mockFetchOnce(
      {
        error: 'Hedge engine unreachable',
        snapshot: null,
        mode: null,
        receipts: [],
        proof: null,
      },
      { status: 503 },
    );
    render(<HedgeStatusCard />);
    const engineStat = await screen.findByTestId('hedge-engine-stat');
    const tile = engineStat.closest('div');
    expect(tile).not.toBeNull();
    expect(tile!.textContent ?? '').toMatch(/auto-retry/i);
    const subSpan = tile!.querySelector('[data-testid="hedge-engine-stat-sub"]');
    expect(subSpan).not.toBeNull();
    expect(subSpan!.className).toContain('text-red-400/80');
  });

  it('engine stat sub line: halted state reads /kill-switch engaged/i (#0021)', async () => {
    mockFetchOnce({ ...BASE_RESPONSE, killSwitchEngaged: true });
    render(<HedgeStatusCard />);
    const engineStat = await screen.findByTestId('hedge-engine-stat');
    const tile = engineStat.closest('div');
    expect(tile!.textContent ?? '').toMatch(/kill-switch engaged/i);
  });

  it('engine stat sub line: degraded state shows breaker.reason (#0021)', async () => {
    mockFetchOnce({
      ...BASE_RESPONSE,
      breakerState: { tripped: true, reason: 'exposure_stale' },
    });
    render(<HedgeStatusCard />);
    const engineStat = await screen.findByTestId('hedge-engine-stat');
    const tile = engineStat.closest('div');
    expect(tile!.textContent ?? '').toContain('exposure_stale');
  });

  it('engine stat sub line: awaiting tick state reads /warming up/i (#0021)', async () => {
    mockFetchOnce({
      snapshot: null,
      capSnapshot: null,
      breakerState: null,
      killSwitchEngaged: false,
      receipts: [],
      proof: null,
    });
    render(<HedgeStatusCard />);
    const engineStat = await screen.findByTestId('hedge-engine-stat');
    const tile = engineStat.closest('div');
    expect(tile!.textContent ?? '').toMatch(/warming up/i);
  });

  describe('receipts panel reserved height + centered empty state (#0025)', () => {
    it('empty state engine-down: 28px icon, headline + sub line, red color', async () => {
      mockFetchOnce(
        {
          error: 'Hedge engine unreachable',
          snapshot: null,
          mode: null,
          receipts: [],
          proof: null,
        },
        { status: 503 },
      );
      render(<HedgeStatusCard />);
      const empty = await screen.findByTestId('hedge-receipts-empty');
      expect(empty.textContent).toMatch(/Hedge engine unreachable/i);
      expect(empty.textContent).toMatch(/No receipts available\./i);
      expect(empty.textContent).toMatch(/Retrying every 10s\./i);
      const svg = empty.querySelector('svg');
      expect(svg).not.toBeNull();
      expect(svg!.getAttribute('width')).toBe('28');
      expect(empty.className).toContain('text-red-300');
    });

    it('empty state degraded: 28px yellow icon, two-line copy with reason', async () => {
      mockFetchOnce({
        ...BASE_RESPONSE,
        receipts: [],
        degraded: { receipts: 'feed_lag' },
      });
      render(<HedgeStatusCard />);
      const empty = await screen.findByTestId('hedge-receipts-empty');
      expect(empty.textContent).toMatch(/Receipts source degraded/i);
      expect(empty.textContent).toContain('feed_lag');
      const svg = empty.querySelector('svg');
      expect(svg!.getAttribute('width')).toBe('28');
      expect(empty.className).toContain('text-yellow-300');
    });

    it('empty state idle-healthy: 28px neutral icon, headline + softer sub', async () => {
      mockFetchOnce({ ...BASE_RESPONSE, receipts: [] });
      render(<HedgeStatusCard />);
      const empty = await screen.findByTestId('hedge-receipts-empty');
      expect(empty.textContent).toMatch(/No hedge activity yet/i);
      expect(empty.textContent).toMatch(/Receipts will appear here/i);
      const svg = empty.querySelector('svg');
      expect(svg!.getAttribute('width')).toBe('28');
      expect(empty.className).toContain('text-gray-500');
    });

    it('receipts panel reserves min-h-[7rem] so empty→populated does not jump', async () => {
      mockFetchOnce({ ...BASE_RESPONSE, receipts: [] });
      render(<HedgeStatusCard />);
      const reserved = await screen.findByTestId('hedge-receipts-reserved');
      expect(reserved.className).toContain('min-h-[7rem]');
    });

    it('populated receipts panel also lives inside the reserved wrapper', async () => {
      mockFetchOnce(BASE_RESPONSE);
      render(<HedgeStatusCard />);
      const row = await screen.findByTestId('hedge-receipt-row');
      const reserved = row.closest('[data-testid="hedge-receipts-reserved"]');
      expect(reserved).not.toBeNull();
      expect(reserved!.className).toContain('min-h-[7rem]');
    });
  });

  describe('error banner copy (#0022)', () => {
    it('reads as one coherent sentence with no duplicate subject', async () => {
      mockFetchOnce(
        {
          error: 'Hedge engine unreachable',
          snapshot: null,
          mode: null,
          receipts: [],
          proof: null,
        },
        { status: 503 },
      );
      render(<HedgeStatusCard />);
      const banner = await screen.findByTestId('hedge-status-error');
      const occurrences = (banner.textContent ?? '').match(/hedge engine/gi);
      expect(occurrences?.length ?? 0).toBe(1);
      expect(banner.textContent).toMatch(/Hedge engine is unreachable/i);
      expect(banner.textContent).toMatch(/Auto-retrying every 10s/i);
    });

    it('preserves non-prefix backend errors verbatim', async () => {
      mockFetchOnce(
        {
          error: 'HTTP 500',
          snapshot: null,
          mode: null,
          receipts: [],
          proof: null,
        },
        { status: 503 },
      );
      render(<HedgeStatusCard />);
      const banner = await screen.findByTestId('hedge-status-error');
      expect(banner.textContent).toContain('HTTP 500');
      expect(banner.textContent).toMatch(/Auto-retrying every 10s/i);
    });

    it('Retry button still triggers a refetch', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(
          JSON.stringify({
            error: 'Hedge engine unreachable',
            snapshot: null,
            mode: null,
            receipts: [],
            proof: null,
          }),
          { status: 503, headers: { 'Content-Type': 'application/json' } },
        ),
      );
      render(<HedgeStatusCard />);
      const retry = await screen.findByTestId('hedge-retry-button');
      const before = fetchSpy.mock.calls.length;
      fireEvent.click(retry);
      await waitFor(() => {
        expect(fetchSpy.mock.calls.length).toBeGreaterThan(before);
      });
    });
  });

  describe('freshness label (#0023)', () => {
    it('error-shell response: "Last tick: never · last polled Ns ago"', async () => {
      mockFetchOnce(
        {
          error: 'Hedge engine unreachable',
          snapshot: null,
          mode: null,
          receipts: [],
          proof: null,
        },
        { status: 503 },
      );
      render(<HedgeStatusCard />);
      const row = await screen.findByTestId('hedge-header-row2');
      await waitFor(() => {
        expect(row.textContent ?? '').toMatch(/Last tick\s+never/i);
      });
      expect(row.textContent ?? '').toMatch(/last polled\s+\d+s ago/i);
      expect(row.textContent ?? '').not.toMatch(/auto-refresh/i);
    });

    it('healthy converged path collapses to a single line with auto-refresh hint', async () => {
      mockFetchOnce(BASE_RESPONSE);
      render(<HedgeStatusCard />);
      const stamp = await screen.findByTestId('hedge-last-success');
      await waitFor(() => {
        expect(stamp.textContent ?? '').toMatch(/Last tick\s+\d+s ago/i);
      });
      expect(stamp.textContent ?? '').toMatch(/auto-refresh\s+10s/i);
      expect(stamp.textContent ?? '').not.toMatch(/last polled/i);
    });
  });

  describe('normalizeHedgeError (#0022)', () => {
    it('strips the "Hedge engine" subject prefix', () => {
      expect(normalizeHedgeError('Hedge engine unreachable')).toBe('unreachable');
      expect(normalizeHedgeError('hedge engine: unreachable')).toBe('unreachable');
      expect(normalizeHedgeError('hedge engine - timeout')).toBe('timeout');
    });

    it('preserves unrelated subjects verbatim', () => {
      expect(normalizeHedgeError('HTTP 500')).toBe('HTTP 500');
    });

    it('falls back to "unreachable" when the message is empty after stripping', () => {
      expect(normalizeHedgeError('Hedge engine')).toBe('unreachable');
      expect(normalizeHedgeError(null)).toBe('unreachable');
      expect(normalizeHedgeError(undefined)).toBe('unreachable');
    });

    it('keeps a leading "is " so the caller does not inject a second one', () => {
      expect(normalizeHedgeError('Hedge engine is unreachable')).toBe('is unreachable');
    });
  });
});
