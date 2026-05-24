/**
 * Drift guard for the `KNOWN_REJECTION_REASONS` baseline catalog.
 *
 * The Prometheus `price_service_rejected_total` family pre-registers
 * one zero-valued row per known rejection bucket so `rate()` and
 * `increase()` queries return 0 (not NaN) on cold boot. The catalog
 * lives in `metrics.ts`; the producers live in `risk-filter.ts`
 * (every reason literal) and `audit-logger.ts` (the `'unknown'`
 * fallback when no reason is supplied).
 *
 * If a future risk-filter rule introduces a new `reason: '<prefix>:…'`
 * literal without adding the prefix to the catalog, the cold-boot
 * scrape silently regresses on that bucket — operators see NaN/blank
 * for the new dashboard row instead of a flat zero. This test
 * grep-parses the source file and fails loudly when that happens, so
 * the fix is a one-line catalog edit named in the error message.
 *
 * Implementation note: we read the source file directly rather than
 * importing risk-filter and inspecting runtime behaviour. Reason
 * strings are constructed in error paths that require valid quote
 * context; spinning up enough fixture to exercise every branch is
 * heavier than scanning the literal text and far more brittle.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { KNOWN_REJECTION_REASONS } from '../metrics';

const RISK_FILTER_PATH = join(__dirname, '..', 'risk-filter.ts');

/**
 * Extract every reason-bucket prefix the risk filter emits. A bucket
 * is the slice before the first `:` of the `reason:` literal — the
 * same slice `AuditLogger.reasonBucket` takes at runtime. Matches
 * both single- and double-quoted literals, plus template literals
 * (which start with a literal prefix before any interpolation).
 */
function extractRiskFilterBuckets(src: string): Set<string> {
  const buckets = new Set<string>();
  const literalRe = /reason:\s*['"`]([a-z][a-z0-9-]*)/gi;
  let m: RegExpExecArray | null;
  while ((m = literalRe.exec(src)) !== null) {
    buckets.add(m[1]);
  }
  return buckets;
}

describe('KNOWN_REJECTION_REASONS — drift from producers', () => {
  const src = readFileSync(RISK_FILTER_PATH, 'utf8');
  const observed = extractRiskFilterBuckets(src);

  it('parses at least one bucket from risk-filter.ts (sanity)', () => {
    expect(observed.size).toBeGreaterThan(0);
  });

  it.each([...observed].sort())(
    'catalog contains risk-filter reason bucket %s',
    (bucket) => {
      expect(KNOWN_REJECTION_REASONS).toContain(bucket);
    },
  );

  it('catalog contains the audit-logger `unknown` fallback', () => {
    expect(KNOWN_REJECTION_REASONS).toContain('unknown');
  });

  it('catalog is sorted alphabetically (matches emission order)', () => {
    const sorted = [...KNOWN_REJECTION_REASONS].sort();
    expect([...KNOWN_REJECTION_REASONS]).toEqual(sorted);
  });

  it('catalog has no duplicates', () => {
    const unique = new Set(KNOWN_REJECTION_REASONS);
    expect(unique.size).toBe(KNOWN_REJECTION_REASONS.length);
  });
});
