import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import HedgeProofViewerPage from '../page';
import {
  copyForResponse,
  type ProofResponse,
} from '@/components/HedgeProofViewer/proof-response';

function mockJson(body: unknown, init: ResponseInit = { status: 200 }) {
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

describe('HedgeProofViewerPage', () => {
  it('copyForResponse handles invalid_id by surfacing the route reason (#0049)', () => {
    const copy = copyForResponse({
      status: 'invalid_id',
      reason: 'Missing or empty receipt id',
    });
    expect(copy.title).toBe('Receipt id was rejected');
    expect(copy.detail).toBe('Missing or empty receipt id');
  });

  it('copyForResponse returns a branded fallback for an unknown wire status without throwing (#0049)', () => {
    const unknown = { status: 'some_future_status' } as unknown as ProofResponse;
    const copy = copyForResponse(unknown);
    expect(copy.title).toBe('Hedge proof unavailable');
    expect(copy.detail).toMatch(/unexpected response/i);
  });

  it('renders the proof markdown as HTML on the happy path', async () => {
    mockJson({
      status: 'ok',
      markdown:
        '# Hedge proof\n\n- order: abc-123\n- side: sell\n- notional: $50\n',
      pointer: {
        path: '.autobuilder/initiatives/0007e-hedging-demo/proofs/run-2026-05-23.md',
        timestamp: 1700000000000,
        summary: 'demo — 1 receipts',
      },
    });
    render(<HedgeProofViewerPage />);
    const body = await screen.findByTestId('hedge-proof-body');
    const h1 = body.querySelector('h1');
    expect(h1).not.toBeNull();
    expect(h1!.textContent).toBe('Hedge proof');
    const items = body.querySelectorAll('li');
    expect(items.length).toBeGreaterThanOrEqual(3);
    // Summary chip + raw markdown escape hatch
    expect(screen.getByTestId('hedge-proof-summary')).toHaveTextContent(
      'demo — 1 receipts',
    );
    const raw = screen.getByTestId('hedge-proof-raw-link');
    expect(raw.getAttribute('href')).toBe('/api/hedge/proof/latest');
    expect(raw.getAttribute('target')).toBe('_blank');
    // Back-to-dashboard link is mandatory on every state.
    const back = screen.getByTestId('hedge-proof-back-link');
    expect(back.getAttribute('href')).toBe('/analytics');
  });

  it('shows a branded engine-down state with Retry + back link when the JSON route reports engine_down', async () => {
    mockJson(
      { status: 'engine_down', reason: 'Hedge engine unreachable' },
      { status: 502 },
    );
    render(<HedgeProofViewerPage />);
    const errPanel = await screen.findByTestId('hedge-proof-error');
    expect(errPanel.textContent).toMatch(/Hedge engine unreachable/i);
    expect(errPanel.textContent).toMatch(/proof pointer/i);
    expect(screen.getByTestId('hedge-proof-retry')).toBeInTheDocument();
    const back = screen.getByTestId('hedge-proof-back-link');
    expect(back.getAttribute('href')).toBe('/analytics');
  });

  it('shows "No hedge proof yet" when the JSON route reports no_proof', async () => {
    mockJson({ status: 'no_proof' }, { status: 404 });
    render(<HedgeProofViewerPage />);
    const errPanel = await screen.findByTestId('hedge-proof-error');
    expect(errPanel.textContent).toMatch(/No hedge proof yet/i);
    expect(errPanel.textContent).toMatch(/proof artifact/i);
    expect(screen.getByTestId('hedge-proof-retry')).toBeInTheDocument();
  });

  it('renders an "engine_error" status with the upstream HTTP status surfaced', async () => {
    mockJson(
      {
        status: 'engine_error',
        reason: 'Hedge engine returned an error',
        httpStatus: 503,
      },
      { status: 502 },
    );
    render(<HedgeProofViewerPage />);
    const errPanel = await screen.findByTestId('hedge-proof-error');
    expect(errPanel.textContent).toMatch(/Hedge engine returned an error/i);
    expect(errPanel.textContent).toMatch(/HTTP 503/i);
  });

  it('does NOT execute <script> in the markdown body (XSS regression)', async () => {
    mockJson({
      status: 'ok',
      markdown: 'Look:\n\n<script>alert(1)</script>\n\nrest of body',
      pointer: {
        path: '.autobuilder/initiatives/0007e-hedging-demo/proofs/x.md',
        timestamp: 1700000000000,
        summary: 'demo',
      },
    });
    const { container } = render(<HedgeProofViewerPage />);
    const body = await screen.findByTestId('hedge-proof-body');
    expect(body.textContent).toContain('<script>');
    expect(container.querySelector('script')).toBeNull();
  });

  it('renders the empty-body state with retry + raw link when markdown is "" (#0037)', async () => {
    mockJson({
      status: 'ok',
      markdown: '',
      pointer: {
        path: '.autobuilder/initiatives/0007e-hedging-demo/proofs/run-0.md',
        timestamp: 1700000000000,
        summary: 'demo — 0 receipts',
      },
    });
    render(<HedgeProofViewerPage />);
    const empty = await screen.findByTestId('hedge-proof-empty-body');
    expect(empty.textContent).toMatch(/Proof body is empty/i);
    // Metadata strip stays above the empty-state card so the operator
    // keeps pointer context (#0037 PRD: Proposed UX).
    expect(screen.getByTestId('hedge-proof-timestamp')).toBeInTheDocument();
    expect(screen.getByTestId('hedge-proof-summary')).toBeInTheDocument();
    expect(screen.getByTestId('hedge-proof-retry')).toBeInTheDocument();
    const raw = screen.getByTestId('hedge-proof-raw-link');
    expect(raw.getAttribute('href')).toBe('/api/hedge/proof/latest');
    expect(raw.getAttribute('target')).toBe('_blank');
    // Back-to-dashboard link still points at /analytics on this state.
    expect(screen.getByTestId('hedge-proof-back-link').getAttribute('href')).toBe(
      '/analytics',
    );
    // The OK body must not render alongside the empty-state shell.
    expect(screen.queryByTestId('hedge-proof-body')).toBeNull();
  });

  it('treats whitespace-only markdown as empty body (#0037)', async () => {
    mockJson({
      status: 'ok',
      markdown: '   \n\t\n ',
      pointer: {
        path: '.autobuilder/initiatives/0007e-hedging-demo/proofs/run-0.md',
        timestamp: 1700000000000,
        summary: 'demo — 0 receipts',
      },
    });
    render(<HedgeProofViewerPage />);
    const empty = await screen.findByTestId('hedge-proof-empty-body');
    expect(empty.textContent).toMatch(/Proof body is empty/i);
    expect(screen.queryByTestId('hedge-proof-body')).toBeNull();
  });

  it('renders the OK body unchanged for non-empty markdown (no regression #0037)', async () => {
    mockJson({
      status: 'ok',
      markdown: '# hello',
      pointer: {
        path: '.autobuilder/initiatives/0007e-hedging-demo/proofs/run-1.md',
        timestamp: 1700000000000,
        summary: 'demo — 1 receipts',
      },
    });
    render(<HedgeProofViewerPage />);
    const body = await screen.findByTestId('hedge-proof-body');
    expect(body.querySelector('h1')?.textContent).toBe('hello');
    expect(screen.queryByTestId('hedge-proof-empty-body')).toBeNull();
  });

  it('renders a branded "Receipt id was rejected" card when the route returns invalid_id (#0049, #0072)', async () => {
    mockJson(
      { status: 'invalid_id', reason: 'Missing or empty receipt id' },
      { status: 400 },
    );
    render(<HedgeProofViewerPage />);
    const errPanel = await screen.findByTestId('hedge-proof-error');
    expect(errPanel.textContent).toMatch(/Receipt id was rejected/i);
    expect(errPanel.textContent).toMatch(/Missing or empty receipt id/);
    expect(errPanel.className).toMatch(/border-red/);
    // #0072 — Retry is suppressed on invalid_id (deterministic verdict
    // on the URL itself; retrying the same request loops forever).
    // The primary recovery is an "Open receipts table" link instead.
    expect(screen.queryByTestId('hedge-proof-retry')).toBeNull();
    const recovery = screen.getByRole('link', {
      name: /open receipts table/i,
    });
    expect(recovery.getAttribute('href')).toBe('/analytics#hedge-status-card');
  });

  it('renders a branded fallback when the route returns an unknown status, without crashing (#0049)', async () => {
    mockJson({ status: 'some_future_status' }, { status: 500 });
    render(<HedgeProofViewerPage />);
    const errPanel = await screen.findByTestId('hedge-proof-error');
    expect(errPanel.textContent).toMatch(/Hedge proof unavailable/i);
    expect(errPanel.textContent).toMatch(/unexpected response/i);
    expect(screen.getByTestId('hedge-proof-retry')).toBeInTheDocument();
  });

  describe('error-state recovery row (#0071)', () => {
    it('renders raw markdown link, jump-to-receipts link, and endpoint recap when the JSON route reports engine_down', async () => {
      mockJson(
        { status: 'engine_down', reason: 'Hedge engine unreachable' },
        { status: 502 },
      );
      render(<HedgeProofViewerPage />);
      await screen.findByTestId('hedge-proof-error');
      const row = await screen.findByTestId('hedge-proof-recovery-row');
      const raw = row.querySelector(
        '[data-testid="hedge-proof-recovery-raw-link"]',
      );
      expect(raw).not.toBeNull();
      expect(raw!.getAttribute('href')).toBe('/api/hedge/proof/latest');
      expect(raw!.getAttribute('target')).toBe('_blank');
      expect(raw!.getAttribute('rel')).toBe('noopener noreferrer');
      const jump = row.querySelector(
        '[data-testid="hedge-proof-recovery-jump-link"]',
      );
      expect(jump).not.toBeNull();
      expect(jump!.getAttribute('href')).toBe(
        '/analytics#hedge-status-card',
      );
      const recap = row.querySelector(
        '[data-testid="hedge-proof-recovery-recap"]',
      );
      expect(recap).not.toBeNull();
      expect(recap!.textContent).toBe(
        'Endpoint: /api/hedge/proof/latest.json · status: engine_down',
      );
      expect(recap!.className).toMatch(/font-mono/);
      expect(recap!.className).toMatch(/text-gray-500/);
    });

    it('renders the recovery row with status:no_proof on the no_proof branch', async () => {
      mockJson({ status: 'no_proof' }, { status: 404 });
      render(<HedgeProofViewerPage />);
      await screen.findByTestId('hedge-proof-error');
      const row = await screen.findByTestId('hedge-proof-recovery-row');
      const recap = row.querySelector(
        '[data-testid="hedge-proof-recovery-recap"]',
      );
      expect(recap!.textContent).toBe(
        'Endpoint: /api/hedge/proof/latest.json · status: no_proof',
      );
      expect(
        row.querySelector('[data-testid="hedge-proof-recovery-raw-link"]'),
      ).not.toBeNull();
      expect(
        row.querySelector('[data-testid="hedge-proof-recovery-jump-link"]'),
      ).not.toBeNull();
    });

    it('surfaces network_error status when fetch rejects', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(
        new TypeError('Failed to fetch'),
      );
      render(<HedgeProofViewerPage />);
      await screen.findByTestId('hedge-proof-error');
      const recap = await screen.findByTestId('hedge-proof-recovery-recap');
      expect(recap.textContent).toBe(
        'Endpoint: /api/hedge/proof/latest.json · status: network_error',
      );
    });

    it('surfaces unreadable status when the response is not JSON', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response('<html>nope</html>', {
          status: 200,
          headers: { 'Content-Type': 'text/html' },
        }),
      );
      render(<HedgeProofViewerPage />);
      await screen.findByTestId('hedge-proof-error');
      const recap = await screen.findByTestId('hedge-proof-recovery-recap');
      expect(recap.textContent).toBe(
        'Endpoint: /api/hedge/proof/latest.json · status: unreadable',
      );
    });

    it('does NOT render the recovery row on the loading branch', async () => {
      // First fetch never resolves so the viewer stays in `loading`.
      vi.spyOn(globalThis, 'fetch').mockReturnValue(new Promise(() => {}));
      render(<HedgeProofViewerPage />);
      await screen.findByTestId('hedge-proof-loading');
      expect(
        screen.queryByTestId('hedge-proof-recovery-row'),
      ).toBeNull();
    });

    it('does NOT render the recovery row on the OK branch', async () => {
      mockJson({
        status: 'ok',
        markdown: '# hello',
        pointer: { path: 'x', timestamp: 1700000000000, summary: 'demo' },
      });
      render(<HedgeProofViewerPage />);
      await screen.findByTestId('hedge-proof-body');
      expect(
        screen.queryByTestId('hedge-proof-recovery-row'),
      ).toBeNull();
    });

    it('does NOT render the recovery row on the empty_body branch', async () => {
      mockJson({
        status: 'ok',
        markdown: '',
        pointer: { path: 'x', timestamp: 1700000000000, summary: 'demo' },
      });
      render(<HedgeProofViewerPage />);
      await screen.findByTestId('hedge-proof-empty-body');
      expect(
        screen.queryByTestId('hedge-proof-recovery-row'),
      ).toBeNull();
    });
  });

  it('retry on a network rejection re-fetches and recovers to the happy view', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            status: 'ok',
            markdown: '# Hedge proof\n',
            pointer: { path: 'x', timestamp: 1700000000000, summary: 'ok' },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      );
    render(<HedgeProofViewerPage />);
    const errPanel = await screen.findByTestId('hedge-proof-error');
    expect(errPanel.textContent).toMatch(/no network/i);
    fireEvent.click(screen.getByTestId('hedge-proof-retry'));
    await waitFor(() => {
      expect(screen.queryByTestId('hedge-proof-error')).toBeNull();
    });
    expect(await screen.findByTestId('hedge-proof-body')).toBeInTheDocument();
    expect(fetchSpy.mock.calls.length).toBeGreaterThanOrEqual(2);
  });
});
