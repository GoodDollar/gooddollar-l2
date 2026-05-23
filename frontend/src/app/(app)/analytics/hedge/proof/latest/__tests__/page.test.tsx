import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import HedgeProofViewerPage from '../page';

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
