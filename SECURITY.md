# Security Report — GoodDollar L2

Last updated: 2026-05-17

## Smart Contract Analysis (Slither)

**Tool:** Slither v0.10.x
**Scope:** All contracts in `src/` (excluding `lib/`, `test/`, `node_modules/`)
**Excluded checks:** naming-convention, solc-version, pragma, dead-code, unused-state

### Results

| Severity      | Count | Status         |
|---------------|-------|----------------|
| HIGH          | 0     | PASS           |
| MEDIUM        | 0     | PASS           |
| Low           | 326   | Accepted       |
| Informational | 76    | Accepted       |

**Gate: 0 HIGH findings — PASSED**

### Low Findings Summary

The 326 Low findings are predominantly:
- **shadowing-local**: Local variables shadowing state variables or function parameters in governance and token contracts. These are intentional patterns (e.g., constructor parameters matching state variable names) and do not affect correctness.
- Standard Solidity patterns that Slither flags conservatively.

These are accepted risks that do not impact protocol security.

## Frontend Dependencies (npm audit)

**Scope:** Production dependencies only (`npm audit --production`)

### Results

| Severity  | Count | Status                          |
|-----------|-------|---------------------------------|
| Critical  | 0     | PASS                            |
| High      | 1     | Deferred — requires Next.js 16  |
| Moderate  | 1     | Deferred — requires Next.js 16  |
| Low       | 0     | PASS                            |

### Remaining Vulnerabilities

1. **next <15.3.3** (High) — Multiple vulnerabilities:
   - DoS in Image Optimization API (GHSA-h64f-5h5j-jqjh)
   - SSRF via WebSocket upgrades (GHSA-c4j6-fc7j-m34r)
   - Cache poisoning in RSC responses (GHSA-wfc6-r584-vfw7)
   - Middleware i18n bypass (GHSA-36qx-fr4f-26g5)
   - **Mitigation:** CSP headers restrict external connections; rate limiting on API routes; Image Optimization not exposed; i18n not used.
   - **Resolution:** Upgrade to Next.js 15+ planned for Phase 2 (OP Stack migration). Breaking changes require frontend refactoring.

2. **postcss <8.5.10** (Moderate) — XSS via unescaped `</style>` in CSS Stringify:
   - Transitive dependency of `next`
   - **Mitigation:** PostCSS runs at build time only, not user-facing. Output CSP includes strict `style-src`.
   - **Resolution:** Will be resolved by Next.js upgrade.

### Fixed Vulnerabilities (this pass)

- axios <1.8.2 (Moderate) — SSRF via unexpected behavior with requests → Fixed
- @coinbase/cdp-sdk via hono <4.7.10 (High) — Info leak via stacktraces → Fixed
- icu-minify (Moderate) — ReDoS in ICU data → Fixed

## Security Measures

### Smart Contracts
- Reentrancy guards on all state-changing external functions
- UBI fee routing verified via invariant tests (20% ubiBPS)
- 837+ Foundry tests passing across all protocols
- Fuzz tests on PerpEngine and MarginVault (tasks 0016, 0017)
- Invariant tests on UBIFeeSplitter (task 0018)

### Frontend
- Content Security Policy with restricted `img-src`, `connect-src`, `frame-src 'none'`
- `upgrade-insecure-requests` enforced
- Rate limiting on `/api/*` routes (token bucket, 60 req/min default)
- `worker-src` and `manifest-src` restricted to `'self'`

### Infrastructure
- All backend services behind Caddy reverse proxy
- No direct database exposure to frontend

## Next Steps

1. Upgrade Next.js to v15+ to resolve remaining npm audit findings
2. External audit engagement (Trail of Bits / OpenZeppelin) for core contracts
3. Bug bounty program on Immunefi
4. Formal verification of UBI fee routing logic
5. Add CSP `report-uri` / `report-to` for production violation monitoring
