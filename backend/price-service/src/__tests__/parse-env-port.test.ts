import { parseEnvPort } from '../index';

describe('parseEnvPort', () => {
  it('returns the default when the env var is unset', () => {
    expect(parseEnvPort(undefined, 9300, 'PRICE_SERVICE_PORT')).toBe(9300);
  });

  it('returns the default when the env var is the empty string', () => {
    expect(parseEnvPort('', 9300, 'PRICE_SERVICE_PORT')).toBe(9300);
  });

  it('parses a valid numeric string', () => {
    expect(parseEnvPort('9410', 9300, 'PRICE_SERVICE_PORT')).toBe(9410);
  });

  it('tolerates surrounding whitespace on a valid integer', () => {
    expect(parseEnvPort('  9410  ', 9300, 'PRICE_SERVICE_PORT')).toBe(9410);
  });

  it('throws on non-numeric input', () => {
    expect(() => parseEnvPort('abc', 9300, 'PRICE_SERVICE_PORT')).toThrow(
      /PRICE_SERVICE_PORT="abc".*must be 1\.\.65535/,
    );
  });

  it('throws on partially-numeric input (no silent parseInt salvage)', () => {
    expect(() => parseEnvPort('9410abc', 9300, 'PRICE_SERVICE_PORT')).toThrow(
      /PRICE_SERVICE_PORT="9410abc".*must be 1\.\.65535/,
    );
  });

  it('rejects port 0 (kernel-assigned ports are confusing for advertised services)', () => {
    expect(() => parseEnvPort('0', 9300, 'PRICE_SERVICE_PORT')).toThrow(
      /PRICE_SERVICE_PORT="0".*must be 1\.\.65535/,
    );
  });

  it('rejects out-of-range port (> 65535)', () => {
    expect(() => parseEnvPort('99999', 9300, 'PRICE_SERVICE_PORT')).toThrow(
      /PRICE_SERVICE_PORT="99999".*must be 1\.\.65535/,
    );
  });

  it('rejects negative port', () => {
    expect(() => parseEnvPort('-1', 9300, 'PRICE_SERVICE_PORT')).toThrow(
      /PRICE_SERVICE_PORT="-1".*must be 1\.\.65535/,
    );
  });

  it('error message echoes the env var name supplied', () => {
    expect(() => parseEnvPort('xx', 9301, 'PRICE_SERVICE_WS_PORT')).toThrow(
      /PRICE_SERVICE_WS_PORT/,
    );
  });

  it('accepts the boundary values 1 and 65535', () => {
    expect(parseEnvPort('1', 9300, 'X')).toBe(1);
    expect(parseEnvPort('65535', 9300, 'X')).toBe(65535);
  });
});
