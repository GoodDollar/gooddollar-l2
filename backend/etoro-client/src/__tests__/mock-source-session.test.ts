import { classifyUsEquitySession, MockEtoroSource } from '../mock-source';

/**
 * UTC→ET fixture math:
 *   - Standard time (EST, UTC-5):   add 5h to ET → UTC
 *   - Daylight time (EDT, UTC-4):   add 4h to ET → UTC
 *
 * 2025 calendar anchors used here:
 *   - Mon 2025-01-06 (EST week)
 *   - Fri 2025-01-10 (EST week)
 *   - Sat 2025-01-11
 *   - Sun 2025-01-12
 *   - Mon 2025-03-17 (EDT, after the 2025-03-09 DST jump)
 */

describe('classifyUsEquitySession', () => {
  it('Mon 09:30 ET → open', () => {
    expect(classifyUsEquitySession(new Date('2025-01-06T14:30:00Z'))).toBe('open');
  });

  it('Mon 09:29:59 ET → pre-market (open boundary is half-open)', () => {
    expect(classifyUsEquitySession(new Date('2025-01-06T14:29:59Z'))).toBe('pre-market');
  });

  it('Mon 04:00 ET → pre-market (pre-market window starts inclusive)', () => {
    expect(classifyUsEquitySession(new Date('2025-01-06T09:00:00Z'))).toBe('pre-market');
  });

  it('Mon 03:59 ET → closed (still overnight)', () => {
    expect(classifyUsEquitySession(new Date('2025-01-06T08:59:00Z'))).toBe('closed');
  });

  it('Mon 10:00 ET → open', () => {
    expect(classifyUsEquitySession(new Date('2025-01-06T15:00:00Z'))).toBe('open');
  });

  it('Mon 16:00 ET → after-hours (regular close is exclusive)', () => {
    expect(classifyUsEquitySession(new Date('2025-01-06T21:00:00Z'))).toBe('after-hours');
  });

  it('Fri 17:00 ET → after-hours', () => {
    expect(classifyUsEquitySession(new Date('2025-01-10T22:00:00Z'))).toBe('after-hours');
  });

  it('Fri 20:00 ET → closed (after-hours window is exclusive at the top)', () => {
    expect(classifyUsEquitySession(new Date('2025-01-11T01:00:00Z'))).toBe('closed');
  });

  it('Fri 21:00 ET → closed', () => {
    expect(classifyUsEquitySession(new Date('2025-01-11T02:00:00Z'))).toBe('closed');
  });

  it('Sat 14:00 ET → closed', () => {
    expect(classifyUsEquitySession(new Date('2025-01-11T19:00:00Z'))).toBe('closed');
  });

  it('Sun 11:00 ET → closed', () => {
    expect(classifyUsEquitySession(new Date('2025-01-12T16:00:00Z'))).toBe('closed');
  });

  it('handles EDT correctly (Mon 2025-03-17 10:00 ET → open)', () => {
    expect(classifyUsEquitySession(new Date('2025-03-17T14:00:00Z'))).toBe('open');
  });

  it('accepts a number (epoch ms) as input', () => {
    const ms = new Date('2025-01-06T15:00:00Z').getTime();
    expect(classifyUsEquitySession(ms)).toBe('open');
  });
});

describe('MockEtoroSource session integration', () => {
  it('AAPL quote at Mon 10:00 ET has sessionState=open', () => {
    const fixed = new Date('2025-01-06T15:00:00Z').getTime();
    const src = new MockEtoroSource({ clock: () => fixed });
    src.subscribe(['AAPL']);
    const [q] = src.tick();
    expect(q.symbol).toBe('AAPL');
    expect(q.sessionState).toBe('open');
  });

  it('AAPL quote on Saturday is closed', () => {
    const sat = new Date('2025-01-11T19:00:00Z').getTime();
    const src = new MockEtoroSource({ clock: () => sat });
    src.subscribe(['AAPL']);
    const [q] = src.tick();
    expect(q.sessionState).toBe('closed');
  });

  it('TSLA quote in pre-market window has sessionState=pre-market', () => {
    const preMarket = new Date('2025-01-06T13:00:00Z').getTime(); // Mon 08:00 ET
    const src = new MockEtoroSource({ clock: () => preMarket });
    src.subscribe(['TSLA']);
    const [q] = src.tick();
    expect(q.sessionState).toBe('pre-market');
  });

  it('SPY quote after the close has sessionState=after-hours', () => {
    const afterHours = new Date('2025-01-10T22:30:00Z').getTime(); // Fri 17:30 ET
    const src = new MockEtoroSource({ clock: () => afterHours });
    src.subscribe(['SPY']);
    const [q] = src.tick();
    expect(q.sessionState).toBe('after-hours');
  });

  it('BTC quote is always open regardless of clock', () => {
    const sat = new Date('2025-01-11T19:00:00Z').getTime();
    const src = new MockEtoroSource({ clock: () => sat });
    src.subscribe(['BTC']);
    const [q] = src.tick();
    expect(q.symbol).toBe('BTC');
    expect(q.sessionState).toBe('open');
  });

  it('crypto stays open even at 03:00 ET on a weekday (closed for stocks)', () => {
    const overnight = new Date('2025-01-06T08:00:00Z').getTime(); // Mon 03:00 ET
    const src = new MockEtoroSource({ clock: () => overnight });
    src.subscribe(['ETH', 'AAPL']);
    const quotes = src.tick();
    const eth = quotes.find((q) => q.symbol === 'ETH');
    const aapl = quotes.find((q) => q.symbol === 'AAPL');
    expect(eth?.sessionState).toBe('open');
    expect(aapl?.sessionState).toBe('closed');
  });

  it('never emits the legacy "unknown" sessionState for stocks', () => {
    // Sweep across a day at 1-hour increments at every weekday + weekend
    // anchor used elsewhere in this suite. Confirms the binary
    // crypto-vs-unknown branch is fully gone for the lane's instrument map.
    const anchors = [
      '2025-01-06', // Mon
      '2025-01-08', // Wed
      '2025-01-10', // Fri
      '2025-01-11', // Sat
      '2025-01-12', // Sun
    ];
    for (const day of anchors) {
      for (let h = 0; h < 24; h++) {
        const hh = h.toString().padStart(2, '0');
        const fixed = new Date(`${day}T${hh}:00:00Z`).getTime();
        const src = new MockEtoroSource({ clock: () => fixed });
        src.subscribe(['AAPL']);
        const [q] = src.tick();
        expect(q.sessionState).not.toBe('unknown');
      }
    }
  });
});
