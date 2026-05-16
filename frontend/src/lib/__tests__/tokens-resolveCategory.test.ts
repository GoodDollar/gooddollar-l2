import { describe, it, expect } from 'vitest'
import { resolveCategory, TOKEN_CATEGORIES } from '@/lib/tokens'

// Tests the pure URL-param → category resolver used by /explore. The
// resolver is the single source of truth for "given the raw ?category=
// query string, what category should be selected and does the URL need
// to be canonicalised?". This file is the TDD red→green spec.

describe('resolveCategory', () => {
  it("returns mode='all' for the explicit 'All' string", () => {
    const result = resolveCategory('All', TOKEN_CATEGORIES)
    expect(result.value).toBe('All')
    expect(result.mode).toBe('all')
  })

  it("returns mode='all' for empty / missing param", () => {
    const result = resolveCategory('', TOKEN_CATEGORIES)
    expect(result.value).toBe('All')
    expect(result.mode).toBe('all')
  })

  it("returns mode='exact' for a canonical category match", () => {
    const result = resolveCategory('DeFi', TOKEN_CATEGORIES)
    expect(result.value).toBe('DeFi')
    expect(result.mode).toBe('exact')
  })

  it("returns mode='exact' for every category in TOKEN_CATEGORIES", () => {
    for (const cat of TOKEN_CATEGORIES) {
      const result = resolveCategory(cat, TOKEN_CATEGORIES)
      expect(result.value).toBe(cat)
      expect(result.mode).toBe('exact')
    }
  })

  it("returns mode='case-fixed' for a case-mismatched match (defi → DeFi)", () => {
    const result = resolveCategory('defi', TOKEN_CATEGORIES)
    expect(result.value).toBe('DeFi')
    expect(result.mode).toBe('case-fixed')
  })

  it("returns mode='case-fixed' for uppercase mismatch (STABLECOINS → Stablecoins)", () => {
    const result = resolveCategory('STABLECOINS', TOKEN_CATEGORIES)
    expect(result.value).toBe('Stablecoins')
    expect(result.mode).toBe('case-fixed')
  })

  it("returns mode='case-fixed' for the multi-word category 'layer 2' (lowercase)", () => {
    const result = resolveCategory('layer 2', TOKEN_CATEGORIES)
    expect(result.value).toBe('Layer 2')
    expect(result.mode).toBe('case-fixed')
  })

  it("returns mode='case-fixed' for the special-cased 'gooddollar' (all lowercase)", () => {
    const result = resolveCategory('gooddollar', TOKEN_CATEGORIES)
    expect(result.value).toBe('GoodDollar')
    expect(result.mode).toBe('case-fixed')
  })

  it("returns mode='unknown' for a value that matches no category, even case-insensitively", () => {
    const result = resolveCategory('NOSUCH', TOKEN_CATEGORIES)
    expect(result.value).toBe('All')
    expect(result.mode).toBe('unknown')
  })

  it("returns mode='unknown' for whitespace-only param", () => {
    const result = resolveCategory('   ', TOKEN_CATEGORIES)
    expect(result.value).toBe('All')
    // Whitespace-only is not 'All' nor empty after trimming the routing
    // layer's logic, so we treat it as a typo / unknown value. The
    // helper itself does NOT trim — that's a routing concern. We
    // accept either 'unknown' or 'all' depending on whether the helper
    // treats raw whitespace as empty. Here we lock in 'unknown' so a
    // future refactor that auto-trims doesn't silently change behaviour.
    expect(result.mode).toBe('unknown')
  })

  it("treats the literal string 'all' (any case) as 'All' without a case-fixed canonicalisation", () => {
    // 'All' is a synthetic value owned by ExplorePage, not a category in
    // TOKEN_CATEGORIES. We accept any case as the canonical 'All'.
    expect(resolveCategory('all', TOKEN_CATEGORIES).mode).toBe('all')
    expect(resolveCategory('ALL', TOKEN_CATEGORIES).mode).toBe('all')
    expect(resolveCategory('All', TOKEN_CATEGORIES).mode).toBe('all')
  })

  it('exposes a raw field equal to the input for unknown-mode results', () => {
    // The /explore page needs to display the user's typo verbatim in the
    // unknown-value notice ("Unknown category 'NOSUCH'"), so the helper
    // must surface the original input on unknown matches.
    const result = resolveCategory('NOSUCH', TOKEN_CATEGORIES)
    expect(result.raw).toBe('NOSUCH')
  })
})
