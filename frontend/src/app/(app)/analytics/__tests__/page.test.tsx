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
