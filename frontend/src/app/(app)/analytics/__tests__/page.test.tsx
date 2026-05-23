/**
 * Focused test: the analytics page-level "Refresh" button must also nudge
 * the hedge card via its imperative `refresh()` ref. This ensures the
 * page-level refresh action and the card-level polling stay in sync —
 * see task 0010.
 */

import { forwardRef, useImperativeHandle } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const hedgeRefreshSpy = vi.fn();

vi.mock('@/components/HedgeStatusCard', () => {
  const Stub = forwardRef<{ refresh: () => void }>(function StubHedgeCard(_, ref) {
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
  hedgeRefreshSpy.mockClear();
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
});
