import { describe, it, expect } from 'vitest';

import {
  buildHedgeErrorHeadline,
  classifyClientError,
  normalizeHedgeError,
} from '@/lib/hedge-error';

describe('normalizeHedgeError', () => {
  it('strips the "Hedge engine" subject prefix', () => {
    expect(normalizeHedgeError('Hedge engine unreachable')).toBe('unreachable');
    expect(normalizeHedgeError('hedge engine: unreachable')).toBe('unreachable');
    expect(normalizeHedgeError('hedge engine - timeout')).toBe('timeout');
  });

  it('preserves unrelated subjects verbatim', () => {
    expect(normalizeHedgeError('HTTP 500')).toBe('HTTP 500');
  });

  it('falls back to "unreachable" when the message is empty after stripping', () => {
    expect(normalizeHedgeError('Hedge engine')).toBe('unreachable');
    expect(normalizeHedgeError(null)).toBe('unreachable');
    expect(normalizeHedgeError(undefined)).toBe('unreachable');
  });

  it('keeps a leading "is " so the caller does not inject a second one', () => {
    expect(normalizeHedgeError('Hedge engine is unreachable')).toBe('is unreachable');
  });
});

describe('buildHedgeErrorHeadline', () => {
  it('produces a single coherent sentence for the canonical "is …" tail', () => {
    expect(buildHedgeErrorHeadline('Hedge engine is unreachable')).toBe(
      'Hedge engine is unreachable.',
    );
  });

  it('inserts "is " when the tail starts with a noun-ish word', () => {
    expect(buildHedgeErrorHeadline('unreachable')).toBe('Hedge engine is unreachable.');
  });

  it('does not emit double "is" for tails already shaped like "is …"', () => {
    const out = buildHedgeErrorHeadline('is unreachable');
    expect(out).toBe('Hedge engine is unreachable.');
    expect(out.match(/\bis\b/g)?.length ?? 0).toBe(1);
  });

  it('renders verb-shaped tails as a single sentence without a redundant "is"', () => {
    expect(buildHedgeErrorHeadline('returned an error')).toBe(
      'Hedge engine returned an error.',
    );
    expect(buildHedgeErrorHeadline('Hedge engine returned an error')).toBe(
      'Hedge engine returned an error.',
    );
    expect(buildHedgeErrorHeadline('timed out')).toBe('Hedge engine timed out.');
  });

  it('falls back to "is unreachable" on null/undefined/empty input', () => {
    expect(buildHedgeErrorHeadline(null)).toBe('Hedge engine is unreachable.');
    expect(buildHedgeErrorHeadline(undefined)).toBe('Hedge engine is unreachable.');
    expect(buildHedgeErrorHeadline('')).toBe('Hedge engine is unreachable.');
  });
});

describe('classifyClientError', () => {
  it('maps Chrome "Failed to fetch" to a no-network tail', () => {
    const tail = classifyClientError(new TypeError('Failed to fetch'));
    expect(tail).toMatch(/no network/i);
    expect(tail).not.toMatch(/failed to fetch/i);
  });

  it('maps Firefox "NetworkError when attempting to fetch resource." to no-network', () => {
    const tail = classifyClientError(
      new TypeError('NetworkError when attempting to fetch resource.'),
    );
    expect(tail).toMatch(/no network/i);
  });

  it('maps Safari "Load failed" to no-network', () => {
    const tail = classifyClientError(new TypeError('Load failed'));
    expect(tail).toMatch(/no network/i);
  });

  it('maps JSON parse errors (HTML body) to "unreadable response"', () => {
    const tail = classifyClientError(
      new SyntaxError('Unexpected token \'<\', "<!DOCTYPE "... is not valid JSON'),
    );
    expect(tail).toMatch(/unreadable/i);
    expect(tail).not.toMatch(/unexpected token/i);
    expect(tail).not.toMatch(/<!doctype/i);
  });

  it('maps timeout-shaped errors to "timed out"', () => {
    expect(classifyClientError(new Error('Request timed out'))).toMatch(/timed out/i);
    expect(classifyClientError(new Error('connection timeout'))).toMatch(/timed out/i);
  });

  it('falls back to "is unreachable" for unknown Error messages', () => {
    expect(classifyClientError(new Error('something exotic'))).toBe('is unreachable');
  });

  it('falls back to "is unreachable" for non-Error values', () => {
    expect(classifyClientError('not an Error instance')).toBe('is unreachable');
    expect(classifyClientError(null)).toBe('is unreachable');
    expect(classifyClientError(undefined)).toBe('is unreachable');
    expect(classifyClientError(42)).toBe('is unreachable');
  });

  it('renders cleanly through buildHedgeErrorHeadline for each mapped category', () => {
    const failedToFetch = classifyClientError(new TypeError('Failed to fetch'));
    expect(buildHedgeErrorHeadline(failedToFetch)).toMatch(
      /^Hedge engine[^.]*\.$/,
    );
    expect(buildHedgeErrorHeadline(failedToFetch)).not.toMatch(/\bis is\b/);

    const parse = classifyClientError(
      new SyntaxError('Unexpected token \'<\', "<!DOCTYPE "... is not valid JSON'),
    );
    expect(buildHedgeErrorHeadline(parse)).toMatch(/^Hedge engine[^.]*\.$/);

    const timeout = classifyClientError(new Error('Request timed out'));
    expect(buildHedgeErrorHeadline(timeout)).toMatch(/^Hedge engine[^.]*\.$/);

    const fallback = classifyClientError('weird');
    expect(buildHedgeErrorHeadline(fallback)).toBe('Hedge engine is unreachable.');
  });
});
