import {
  GENERATED_REQUEST_ID_REGEX,
  REQUEST_ID_REGEX,
  generateRequestId,
  resolveRequestId,
} from '../request-id';

describe('request-id pure helpers (task 0078)', () => {
  it('generated IDs match the canonical server-generated regex', () => {
    for (let i = 0; i < 20; i++) {
      const id = generateRequestId();
      expect(id).toMatch(GENERATED_REQUEST_ID_REGEX);
    }
  });

  it('generateRequestId is deterministic with injected factories', () => {
    const id = generateRequestId({
      now: () => 1700000000000,
      randomHex: () => '1f2e3d4a',
    });
    expect(id).toBe(`${(1700000000000).toString(36)}-1f2e3d4a`);
  });

  it('REQUEST_ID_REGEX accepts safe alphanumeric + underscore + dash inputs', () => {
    for (const ok of ['trace-abc-123', 'req_42', 'A1', 'a'.repeat(128)]) {
      expect(REQUEST_ID_REGEX.test(ok)).toBe(true);
    }
  });

  it('REQUEST_ID_REGEX rejects whitespace, control chars, length > 128', () => {
    for (const bad of ['foo bar', 'foo\nbar', 'foo:bar', 'foo/bar', '', 'a'.repeat(129)]) {
      expect(REQUEST_ID_REGEX.test(bad)).toBe(false);
    }
  });

  it('resolveRequestId echoes a safe client value verbatim', () => {
    expect(resolveRequestId('trace-abc-123')).toBe('trace-abc-123');
    expect(resolveRequestId('req_42')).toBe('req_42');
  });

  it('resolveRequestId generates a fresh ID when client value fails the safe gate', () => {
    const generated = resolveRequestId('foo bar', {
      now: () => 100,
      randomHex: () => 'deadbeef',
    });
    expect(generated).toBe(`${(100).toString(36)}-deadbeef`);
  });

  it('resolveRequestId generates a fresh ID when client value is undefined', () => {
    const id = resolveRequestId(undefined);
    expect(id).toMatch(GENERATED_REQUEST_ID_REGEX);
  });

  it('resolveRequestId generates a fresh ID when client value is empty string', () => {
    const id = resolveRequestId('');
    expect(id).toMatch(GENERATED_REQUEST_ID_REGEX);
  });
});
