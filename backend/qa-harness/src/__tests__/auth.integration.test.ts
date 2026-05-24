import { REAL_TRADING_ENABLED, EtoroClient } from '../../../etoro-client/src';
import { writeEvidence } from '../evidence';
import { getRunId } from '../run-id';

describe('Lane 6 / auth — eToro client authenticates against mock server', () => {
  it('REAL_TRADING_ENABLED is hardcoded false (precondition)', () => {
    expect(REAL_TRADING_ENABLED).toBe(false);
  });

  it('authenticate() succeeds against the mock; audit entry logged; no secret leaks in summary', async () => {
    const runId = getRunId();
    const t0 = Date.now();

    const client = new EtoroClient({
      credentials: {
        mode: 'mock',
        apiKey: 'sandbox-test-key',
        apiSecret: 'sandbox-test-secret',
        userKey: 'sandbox-test-user-key',
        baseUrl: 'mock://etoro.local',
        wsUrl: 'mock://etoro.local/ws',
      },
    });


    let token: string | null = null;
    let error: string | null = null;
    try {
      token = await client.authenticate();
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
    }

    const summary = client.getSummary();
    const ok = token !== null && token === 'mock-token' && client.isAuthenticated();
    const evidencePath = writeEvidence({
      check: '01-auth',
      ok,
      runId,
      details: {
        durationMs: Date.now() - t0,
        token: token ? `${token.slice(0, 12)}…` : null,
        summary,
        error,
        realTradingEnabled: REAL_TRADING_ENABLED,
      },
    });


    // Assertions — fail loudly with the evidence path so reviewers know where to look.
    expect(token).not.toBeNull();
    expect(token).toBe('mock-token');
    expect(client.isAuthenticated()).toBe(true);
    // No raw secret in summary
    const dumped = JSON.stringify(summary);
    expect(dumped).not.toContain('sandbox-test-key');
    expect(dumped).not.toContain('sandbox-test-secret');
    expect(evidencePath).toMatch(/01-auth\.json$/);
  });
});
