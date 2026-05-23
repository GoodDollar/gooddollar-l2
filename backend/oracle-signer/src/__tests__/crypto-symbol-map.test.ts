import { parseCryptoSymbolMap, CryptoSymbolMap } from '../crypto-symbol-map';

const WETH = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';
const USDC = '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0';
const WBTC = '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9';

describe('parseCryptoSymbolMap', () => {
  it('returns empty map for undefined/empty input', () => {
    expect(parseCryptoSymbolMap(undefined).size).toBe(0);
    expect(parseCryptoSymbolMap('').size).toBe(0);
    expect(parseCryptoSymbolMap('   ').size).toBe(0);
  });

  it('parses KEY=ADDR comma-separated form', () => {
    const map = parseCryptoSymbolMap(`WETH=${WETH},USDC=${USDC}`);
    expect(map.size).toBe(2);
    expect(map.resolve('WETH')!.toLowerCase()).toBe(WETH.toLowerCase());
    expect(map.resolve('USDC')!.toLowerCase()).toBe(USDC.toLowerCase());
  });

  it('parses JSON object form', () => {
    const json = JSON.stringify({ WETH, USDC, WBTC });
    const map = parseCryptoSymbolMap(json);
    expect(map.size).toBe(3);
    expect(map.resolve('WBTC')!.toLowerCase()).toBe(WBTC.toLowerCase());
  });

  it('resolves symbols case-insensitively', () => {
    const map = parseCryptoSymbolMap(`WETH=${WETH}`);
    expect(map.resolve('weth')!.toLowerCase()).toBe(WETH.toLowerCase());
    expect(map.resolve('WETH')!.toLowerCase()).toBe(WETH.toLowerCase());
    expect(map.resolve('wEtH')!.toLowerCase()).toBe(WETH.toLowerCase());
  });

  it('returns null for unknown symbol', () => {
    const map = parseCryptoSymbolMap(`WETH=${WETH}`);
    expect(map.resolve('FOOBAR')).toBeNull();
  });

  it('drops entries with invalid addresses', () => {
    const map = parseCryptoSymbolMap(`WETH=${WETH},BAD=notanaddress,USDC=${USDC}`);
    expect(map.size).toBe(2);
    expect(map.resolve('BAD')).toBeNull();
    expect(map.resolve('WETH')).not.toBeNull();
  });

  it('drops entries with missing values', () => {
    const map = parseCryptoSymbolMap(`WETH=,USDC=${USDC}`);
    expect(map.size).toBe(1);
    expect(map.resolve('WETH')).toBeNull();
    expect(map.resolve('USDC')).not.toBeNull();
  });

  it('drops entries with whitespace-only keys', () => {
    const map = parseCryptoSymbolMap(`  =${WETH},USDC=${USDC}`);
    expect(map.size).toBe(1);
    expect(map.resolve('USDC')).not.toBeNull();
  });

  it('exposes accepted symbols list (uppercased for logging)', () => {
    const map = parseCryptoSymbolMap(`weth=${WETH},Usdc=${USDC}`);
    expect(map.symbols().sort()).toEqual(['USDC', 'WETH']);
  });

  it('tolerates extra whitespace around tokens', () => {
    const map = parseCryptoSymbolMap(` WETH = ${WETH} , USDC = ${USDC} `);
    expect(map.size).toBe(2);
    expect(map.resolve('WETH')).not.toBeNull();
  });

  it('returns empty map when JSON is malformed', () => {
    const map = parseCryptoSymbolMap('{not-valid-json');
    // Falls through to KEY=ADDR parse which finds nothing useful
    expect(map.size).toBe(0);
  });
});

describe('CryptoSymbolMap', () => {
  it('size reflects accepted entries only', () => {
    const m = new CryptoSymbolMap();
    expect(m.size).toBe(0);
  });
});
