/**
 * Focused test: the analytics page-level "Refresh" button must also nudge
 * the hedge card via its imperative `refresh()` ref. This ensures the
 * page-level refresh action and the card-level polling stay in sync —
 * see task 0010.
 */

import { forwardRef, useImperativeHandle } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, render, screen, fireEvent, waitFor } from '@testing-library/react';

const hedgeRefreshSpy = vi.fn<[], Promise<void>>(() => Promise.resolve());

vi.mock('@/components/HedgeStatusCard', () => {
  const Stub = forwardRef<{ refresh: () => Promise<void> }>(function StubHedgeCard(_, ref) {
    useImperativeHandle(ref, () => ({ refresh: hedgeRefreshSpy }));
    return <div data-testid="hedge-card-stub" />;
  });
  return { __esModule: true, default: Stub };
});

import AnalyticsPage from '../page';

const OVERVIEW_BODY = {
  ok: true,
  summary: {
    totalProtocols: 1,
    totalContracts: 1,
    addressBookVersion: 'v1',
    addressBookGeneratedAt: '2026-05-23',
    generatedAt: '2026-05-23',
  },
  status: { ok: true, overall: 'healthy', healthy: 1, total: 1 },
  indexer: {
    ok: true,
    totalEvents: 0,
    lastBlock: 1,
    protocols: [],
    topEvents: [],
    lagBlocks: 0,
    lagStatus: 'fresh',
  },
  chain: { ok: true, blockNumber: 1 },
  ubi: {
    totalRoutes: 0,
    routes: [],
    pendingCount: 0,
    pendingSplitters: [],
    feeSplitBps: { protocol: 5000, ubi: 5000 },
  },
  protocols: [],
};

beforeEach(() => {
  hedgeRefreshSpy.mockReset();
  hedgeRefreshSpy.mockResolvedValue(undefined);
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response(JSON.stringify(OVERVIEW_BODY), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }),
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('AnalyticsPage refresh', () => {
  it('page-level Refresh button calls the hedge card refresh ref', async () => {
    render(<AnalyticsPage />);
    await waitFor(() => {
      expect(screen.getByTestId('hedge-card-stub')).toBeInTheDocument();
    });
    const refreshBtn = await screen.findByRole('button', { name: /refresh/i });
    fireEvent.click(refreshBtn);
    await waitFor(() => {
      expect(hedgeRefreshSpy).toHaveBeenCalled();
    });
  });

  it('Refresh button stays disabled until the hedge card refresh settles', async () => {
    let resolveHedge: () => void = () => {};
    hedgeRefreshSpy.mockImplementationOnce(
      () => new Promise<void>((r) => { resolveHedge = r; }),
    );

    render(<AnalyticsPage />);
    await waitFor(() => {
      expect(screen.getByTestId('hedge-card-stub')).toBeInTheDocument();
    });
    const btn = await screen.findByTestId('analytics-refresh-button');
    expect((btn as HTMLButtonElement).disabled).toBe(false);

    fireEvent.click(btn);
    await waitFor(() => {
      expect((btn as HTMLButtonElement).disabled).toBe(true);
    });
    expect(btn).toHaveTextContent('Refreshing');

    // Spam click while the hedge refresh is still pending: must NOT stack
    // a second hedge fetch.
    fireEvent.click(btn);
    fireEvent.click(btn);
    expect(hedgeRefreshSpy).toHaveBeenCalledTimes(1);

    // Resolve the hedge promise → button must re-enable.
    await act(async () => {
      resolveHedge();
      await Promise.resolve();
    });
    await waitFor(() => {
      expect((btn as HTMLButtonElement).disabled).toBe(false);
    });
    expect(btn).toHaveTextContent('Refresh');
  });
});

describe('AnalyticsPage visibility-gated overview polling (#0033)', () => {
  let visibilityState: DocumentVisibilityState;
  let originalDescriptor: PropertyDescriptor | undefined;

  beforeEach(() => {
    visibilityState = 'visible';
    originalDescriptor = Object.getOwnPropertyDescriptor(
      Document.prototype,
      'visibilityState',
    );
    Object.defineProperty(Document.prototype, 'visibilityState', {
      configurable: true,
      get: () => visibilityState,
    });
  });

  afterEach(() => {
    if (originalDescriptor) {
      Object.defineProperty(Document.prototype, 'visibilityState', originalDescriptor);
    }
  });

  function setVisibility(state: DocumentVisibilityState): void {
    visibilityState = state;
    document.dispatchEvent(new Event('visibilitychange'));
  }

  it('overview poll stops while the tab is hidden and resumes on return', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify(OVERVIEW_BODY), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );
      render(<AnalyticsPage />);
      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });
      const baseline = fetchSpy.mock.calls.length;

      await act(async () => {
        setVisibility('hidden');
      });
      await act(async () => {
        vi.advanceTimersByTime(60_000);
      });
      expect(fetchSpy.mock.calls.length).toBe(baseline);

      await act(async () => {
        setVisibility('visible');
      });
      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });
      expect(fetchSpy.mock.calls.length).toBeGreaterThan(baseline);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('AnalyticsPage section nav (#0078)', () => {
  it('renders an in-page section nav with one anchor per section in page order', async () => {
    const { container } = render(<AnalyticsPage />);
    await waitFor(() => {
      expect(screen.getByTestId('analytics-section-nav')).toBeInTheDocument();
    });
    const nav = screen.getByTestId('analytics-section-nav');
    const anchors = Array.from(
      nav.querySelectorAll('a[data-testid^="analytics-section-nav-"]'),
    ) as HTMLAnchorElement[];
    expect(anchors.map((a) => a.getAttribute('href'))).toEqual([
      '#service-health',
      '#chain-indexer-activity',
      '#ubi-fee-landscape',
      '#hedge-status-card',
      '#protocols',
    ]);
    // Every anchor must have a matching `id` on the page so the
    // browser anchor jump actually lands somewhere. `HedgeStatusCard`
    // is stubbed here so the `#hedge-status-card` id is asserted in
    // `HedgeStatusCard.test.tsx`; the analytics-side ids are checked
    // directly via the rendered DOM.
    expect(container.querySelector('#service-health')).not.toBeNull();
    expect(container.querySelector('#chain-indexer-activity')).not.toBeNull();
    expect(container.querySelector('#ubi-fee-landscape')).not.toBeNull();
    expect(container.querySelector('#protocols')).not.toBeNull();
  });

  it('Hedge proof chip carries href="#hedge-status-card" so a click triggers the browser anchor jump', async () => {
    render(<AnalyticsPage />);
    const chip = await screen.findByTestId(
      'analytics-section-nav-hedge-status-card',
    );
    expect(chip.getAttribute('href')).toBe('#hedge-status-card');
    expect(chip.textContent).toBe('Hedge proof');
  });

  it('section nav uses flex-wrap so chips reflow on narrow viewports (mobile)', async () => {
    render(<AnalyticsPage />);
    const nav = await screen.findByTestId('analytics-section-nav');
    expect(nav.className).toContain('flex-wrap');
  });

  it('section nav anchor labels use the condensed copy (Service health, Chain activity, UBI fees, Hedge proof, Protocols)', async () => {
    render(<AnalyticsPage />);
    const nav = await screen.findByTestId('analytics-section-nav');
    const labels = Array.from(
      nav.querySelectorAll('a[data-testid^="analytics-section-nav-"]'),
    ).map((a) => a.textContent);
    expect(labels).toEqual([
      'Service health',
      'Chain activity',
      'UBI fees',
      'Hedge proof',
      'Protocols',
    ]);
  });

  it('section wrappers apply scroll-mt-20 so anchor jumps land cleanly under the sticky site header', async () => {
    const { container } = render(<AnalyticsPage />);
    await waitFor(() => {
      expect(container.querySelector('#service-health')).not.toBeNull();
    });
    const ids = [
      '#service-health',
      '#chain-indexer-activity',
      '#ubi-fee-landscape',
      '#protocols',
    ];
    for (const id of ids) {
      const el = container.querySelector(id) as HTMLElement;
      expect(el).not.toBeNull();
      expect(el.className).toContain('scroll-mt-20');
    }
  });
});
