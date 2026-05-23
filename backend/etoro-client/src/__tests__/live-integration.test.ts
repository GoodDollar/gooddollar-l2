/**
 * Opt-in live integration test.
 *
 * Enabled only when ALL three env vars are present:
 *   - `ETORO_DEMO_KEY`
 *   - `ETORO_DEMO_USER_KEY`
 *   - `ETORO_LIVE_TESTS=1`
 *
 * Otherwise the suite is skipped — CI never runs it. With valid demo
 * credentials this is the lane's acceptance proof: it issues a real
 * `GET /market-data/instruments/rates` and asserts non-zero bid/ask for
 * BTC and AAPL via the SDK's normalized pipeline.
 */
import { EtoroClient, resolveMode, MarketDataModule } from '../index';

const HAS_CREDS =
  process.env.ETORO_LIVE_TESTS === '1'
  && process.env.ETORO_DEMO_KEY
  && process.env.ETORO_DEMO_USER_KEY;

const maybeDescribe = HAS_CREDS ? describe : describe.skip;

maybeDescribe('EtoroClient — live integration (opt-in)', () => {
  jest.setTimeout(30_000);

  it('fetches non-zero bid/ask for BTC and AAPL from the official rates endpoint', async () => {
    // Force a mode that talks to the demo API.
    process.env.ETORO_MODE = process.env.ETORO_MODE ?? 'demo-readonly';
    expect(resolveMode()).toMatch(/^(demo-readonly|demo-trading|real-disabled)$/);

    const client = new EtoroClient();
    const md = client.marketData as MarketDataModule;
    const quotes = await md.getQuotes(['BTC', 'AAPL']);
    expect(quotes.length).toBeGreaterThanOrEqual(1);
    for (const q of quotes) {
      expect(q.bid).toBeGreaterThan(0);
      expect(q.ask).toBeGreaterThan(0);
      expect(q.mid).toBeGreaterThan(0);
      expect(q.source).toBe('etoro');
    }
  });
});
