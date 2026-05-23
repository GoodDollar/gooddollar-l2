import {
  parseAllowedChainIds,
  assertDevnetChain,
  DEFAULT_ALLOWED_CHAIN_IDS,
} from '../chain-guard';

describe('parseAllowedChainIds', () => {
  it('returns defaults when raw is undefined', () => {
    const set = parseAllowedChainIds(undefined);
    expect(Array.from(set).sort()).toEqual(DEFAULT_ALLOWED_CHAIN_IDS.slice().sort());
  });

  it('returns defaults when raw is empty', () => {
    expect(Array.from(parseAllowedChainIds('')).sort()).toEqual(
      DEFAULT_ALLOWED_CHAIN_IDS.slice().sort(),
    );
  });

  it('parses comma-separated integers', () => {
    const set = parseAllowedChainIds('31337,1337,11155111');
    expect(set.has(31337)).toBe(true);
    expect(set.has(1337)).toBe(true);
    expect(set.has(11155111)).toBe(true);
  });

  it('trims whitespace and ignores empty entries', () => {
    const set = parseAllowedChainIds(' 31337 , , 1337 ,');
    expect(Array.from(set).sort()).toEqual([1337, 31337]);
  });

  it('falls back to defaults when nothing parses (all malformed)', () => {
    const set = parseAllowedChainIds('foo,bar,baz');
    expect(Array.from(set).sort()).toEqual(DEFAULT_ALLOWED_CHAIN_IDS.slice().sort());
  });

  it('drops non-integer tokens but keeps valid ones', () => {
    const set = parseAllowedChainIds('31337,foo,1337');
    expect(Array.from(set).sort()).toEqual([1337, 31337]);
  });

  it('rejects negative chain ids and zero', () => {
    const set = parseAllowedChainIds('-1,0,31337');
    expect(Array.from(set).sort()).toEqual([31337]);
  });
});

describe('assertDevnetChain', () => {
  it('resolves allowed=true for chain id in allowlist', async () => {
    const result = await assertDevnetChain(async () => 31337, new Set([31337, 1337]));
    expect(result).toEqual({ allowed: true, chainId: 31337 });
  });

  it('resolves allowed=false for chain id outside allowlist', async () => {
    const result = await assertDevnetChain(async () => 1, new Set([31337, 1337]));
    expect(result).toEqual({ allowed: false, chainId: 1 });
  });

  it('propagates getChainId errors', async () => {
    await expect(
      assertDevnetChain(async () => { throw new Error('rpc down'); }, new Set([31337])),
    ).rejects.toThrow('rpc down');
  });

  it('coerces bigint chainId via getter', async () => {
    const result = await assertDevnetChain(async () => Number(31337n), new Set([31337]));
    expect(result.allowed).toBe(true);
    expect(result.chainId).toBe(31337);
  });
});
