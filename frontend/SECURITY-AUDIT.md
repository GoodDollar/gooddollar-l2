# Security Audit — npm Dependencies

**Date**: 2026-05-17
**Auditor**: Security Agent (automated pass)
**Tool**: `npm audit` (npm v10)
**Scope**: `frontend/` package (goodswap@0.2.0)

## Summary

| # | Package | Severity | Direct? | Status |
|---|---------|----------|---------|--------|
| 1 | `next` (14.2.x) | HIGH | Yes | Deferred — Next.js 16 migration required |
| 2 | `glob` (10.3.10) | HIGH | No | Accepted — not exploitable, dev tooling only |
| 3 | `@next/eslint-plugin-next` | HIGH | No | Accepted — transitive via glob, dev only |
| 4 | `eslint-config-next` | HIGH | No | Accepted — transitive via glob, dev only |
| 5 | `postcss` | MODERATE | No | Deferred — dev tooling only |
| 6 | `elliptic` / `@storybook/*` | LOW | No | Not exploitable — dev tooling only |

## Detailed Findings

### 1. `next` — Multiple CVEs (HIGH)

**Advisories**:
- GHSA-9g9p-9gw9-jx7f — DoS via Image Optimizer `remotePatterns`
- GHSA-h25m-26qc-wcjf — HTTP request deserialization DoS (insecure RSC)
- GHSA-ggv3-7p47-pfv8 — HTTP request smuggling in rewrites
- GHSA-3x4c-7xq6-9pq8 — Unbounded `next/image` disk cache growth
- GHSA-q4gf-8mx6-v5v3 — DoS with Server Components
- GHSA-8h8q-6873-q5fj — DoS with Server Components (variant)
- GHSA-3g8h-86w9-wvmq — Middleware/Proxy redirect cache poisoning
- GHSA-ffhc-5mcf-pf4q — XSS in App Router with CSP nonces
- GHSA-vfv6-92ff-j949 — Cache poisoning via RSC cache-busting collisions
- GHSA-gx5p-jg67-6x7h — XSS in `beforeInteractive` scripts
- GHSA-h64f-5h5j-jqjh — DoS in Image Optimization API
- GHSA-c4j6-fc7j-m34r — SSRF via WebSocket upgrades
- GHSA-wfc6-r584-vfw7 — Cache poisoning in RSC responses
- GHSA-36qx-fr4f-26g5 — Middleware bypass in Pages Router i18n

**Fix available**: Next.js >= 15.x / 16.x (semver-major)

**Exploitability in our context**: LOW-MEDIUM
- Image Optimizer: We serve mostly SVGs and static assets; `remotePatterns` is tightly scoped.
- Request smuggling / cache poisoning: Mitigated by our strict CSP headers and rate limiting middleware.
- DoS via Server Components: Our pages are relatively simple; no deeply nested RSC trees.
- XSS via CSP nonces: We use a static CSP policy without nonces.
- WebSocket SSRF: We do not use WebSocket upgrades in our Next.js routes.

**Mitigation status**: DEFERRED
- CSP headers configured with strict `script-src`, `connect-src`, `img-src` (see `next.config.js`)
- Rate limiting middleware active on all API routes (token bucket, 60 RPM default)
- CSP violation reporting endpoint active (`/api/csp-report`)
- **Remediation plan**: Migrate to Next.js 16 in Phase 4 (Weeks 12-20)

### 2. `glob` (10.3.10) — CLI Command Injection (HIGH)

**Advisory**: GHSA-5j98-mcp5-4vw2
**CVE**: Command injection via `-c`/`--cmd` flag executes glob matches with `shell: true`

**Exploitability in our context**: NOT EXPLOITABLE
- The `glob` CLI binary is never invoked in our build or runtime.
- This is a transitive dependency via `@next/eslint-plugin-next` (dev tooling).
- No user input ever reaches the `glob` CLI.

**Mitigation status**: ACCEPTED RISK
- Fix requires upgrading `eslint-config-next` to 16.x (semver-major, requires Next.js 16 + ESLint 9).
- No override is viable — npm cannot force-resolve when the parent pins an exact version.
- Will be resolved alongside the Next.js 16 migration in Phase 4.

### 3-4. `@next/eslint-plugin-next` / `eslint-config-next` (HIGH)

These are HIGH only because they depend on vulnerable `glob@10.3.10`. They are dev-only lint plugins — never shipped to production.

**Mitigation status**: ACCEPTED RISK — dev-only lint plugins, never shipped to production. Fix requires semver-major upgrade to eslint-config-next@16 (requires Next.js 16 + ESLint 9).

### 5. `postcss` — XSS via unescaped `</style>` (MODERATE)

**Advisory**: GHSA-qx2v-qp2m-jg93
**Exploitability**: LOW — PostCSS processes trusted CSS files at build time; no user-controlled CSS input.
**Status**: Deferred — dev tooling only.

### 6. `elliptic` / Storybook chain — Risky crypto implementation (LOW)

**Advisory**: GHSA-848j-6mx2-7j84
**Via**: `@storybook/nextjs` → `node-polyfill-webpack-plugin` → `crypto-browserify` → `elliptic`
**Exploitability**: NOT EXPLOITABLE — Storybook is a dev-only tool, never deployed to production.
**Status**: Accepted risk — dev tooling only.

## Remediation Plan

| Action | Target Date | Blocks |
|--------|-------------|--------|
| Accept `glob` risk (dev-only, not exploitable) | 2026-05-17 (this sprint) | — |
| Migrate to Next.js 16 | Phase 4 (Week 12-20) | Breaking changes in routing, middleware |
| Upgrade `eslint-config-next` to 16.x | With Next.js 16 migration | Requires ESLint 9 |
| Evaluate `postcss` update | With Next.js 16 migration | — |
