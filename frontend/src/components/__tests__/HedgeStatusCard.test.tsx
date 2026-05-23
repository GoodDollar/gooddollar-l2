import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import HedgeStatusCard from '../HedgeStatusCard';

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

  it('renders the unknown mode badge in grey when the engine is unreachable', async () => {
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
    const badge = await screen.findByTestId('hedge-mode-badge');
    expect(badge).toHaveTextContent('unknown');
    expect(badge.className).toContain('bg-gray-500/15');
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

  it('shows the empty state when no receipts exist', async () => {
    mockFetchOnce({ ...BASE_RESPONSE, receipts: [] });
    render(<HedgeStatusCard />);
    expect(await screen.findByTestId('hedge-receipts-empty')).toHaveTextContent(
      'No hedge activity yet.',
    );
  });

  it('shows an error fallback when the API rejects', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('ECONNREFUSED'));
    render(<HedgeStatusCard />);
    await waitFor(() => {
      expect(screen.getByTestId('hedge-status-error')).toBeInTheDocument();
    });
    expect(screen.getByTestId('hedge-status-error')).toHaveTextContent('ECONNREFUSED');
  });

  it('shows a loading skeleton before the first fetch resolves', () => {
    vi.spyOn(globalThis, 'fetch').mockReturnValue(new Promise(() => {}));
    render(<HedgeStatusCard />);
    expect(screen.getByTestId('hedge-status-loading')).toBeInTheDocument();
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

  it('engine unreachable: does NOT render the stat grid, only the red banner', async () => {
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
    expect(screen.queryByTestId('hedge-stat-grid')).toBeNull();
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
});
