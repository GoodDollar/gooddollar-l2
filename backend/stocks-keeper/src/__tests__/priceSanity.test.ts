import { isStockPriceSane } from '../index';

describe('isStockPriceSane', () => {
  it('accepts valid stock prices', () => {
    expect(isStockPriceSane('AAPL', 178.72)).toBe(true);
    expect(isStockPriceSane('TSLA', 250.0)).toBe(true);
    expect(isStockPriceSane('SPY', 520.5)).toBe(true);
    expect(isStockPriceSane('NVDA', 950.0)).toBe(true);
  });

  it('accepts prices at exactly max bound', () => {
    expect(isStockPriceSane('BRK-A', 100000)).toBe(true);
  });

  it('rejects zero price', () => {
    expect(isStockPriceSane('AAPL', 0)).toBe(false);
  });

  it('rejects negative price', () => {
    expect(isStockPriceSane('AAPL', -178.72)).toBe(false);
  });

  it('rejects NaN', () => {
    expect(isStockPriceSane('AAPL', NaN)).toBe(false);
  });

  it('rejects Infinity', () => {
    expect(isStockPriceSane('AAPL', Infinity)).toBe(false);
  });

  it('rejects -Infinity', () => {
    expect(isStockPriceSane('AAPL', -Infinity)).toBe(false);
  });

  it('rejects prices above max bound', () => {
    expect(isStockPriceSane('BRK-A', 200000)).toBe(false);
  });

  it('accepts very small positive prices', () => {
    expect(isStockPriceSane('PENNY', 0.01)).toBe(true);
  });
});
