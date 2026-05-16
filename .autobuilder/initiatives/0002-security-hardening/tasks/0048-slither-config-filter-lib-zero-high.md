---
id: gooddollar-l2-slither-config-filter-lib-zero-high
title: "Slither — Add slither.config.json to filter lib/ and document Math.mulDiv false-positive HIGH"
parent: gooddollar-l2
deps: []
split: false
depth: 1
planned: true
executed: true
priority: P0
labels: [contracts, slither, security, config, false-positive, ci]
---

# Slither — Add slither.config.json to filter lib/ and document Math.mulDiv false-positive HIGH

## Problem

The Phase 1 initiative spec (`0002-security-hardening/spec.md`) lists
**"Zero Slither HIGH findings"** as acceptance criterion #1 and the
Definition of Done says `slither .` must report 0 HIGH findings.

Today, running `slither .` from the project root reports exactly **1
HIGH finding**, but it is in
`lib/openzeppelin-contracts/contracts/utils/math/Math.sol` — third-party
audited code we vendor as-is. The flagged line is the bitwise XOR
inside `mulDiv`:

```solidity
inverse *= 2 - denominator * inverse; // inverse mod 2^8
```

Slither's `incorrect-exp` detector mistakes this Newton's-method modular
inverse iteration for an exponentiation operator (`**`). It is a
well-known false positive — OpenZeppelin's own `slither.config.json`
inside `lib/openzeppelin-contracts/` already excludes it from their
analyses, and the function has been audited multiple times.

The README already correctly states "0 Slither HIGH in `src/`", but the
`slither .` command itself still surfaces 1 HIGH because there is no
project-root `slither.config.json` telling the analyzer to skip
`lib/`, `node_modules/`, `frontend/`, and `research/`. This blocks the
Definition-of-Done check from being mechanically satisfiable in CI.

## Scope

Create `/home/goodclaw/gooddollar-l2/slither.config.json` with:

1. `filter_paths` excluding paths that are out of audit scope:
   - `lib/` — vendored dependencies (OpenZeppelin, forge-std, etc.)
   - `node_modules/`
   - `frontend/`
   - `research/`
   - `test/` — Foundry test contracts (mocks, helpers — not deployed)
   - `script/` — deployment scripts (run once, not on-chain residents)
2. `solc_remaps` matching `foundry.toml` so Slither can compile from
   the same import roots Forge uses.
3. A short comment block (via separate `slither.config.notes.md`) that
   documents:
   - **Why** `lib/` is excluded (vendored audited code).
   - **Specifically** the `Math.mulDiv` `incorrect-exp` finding and why
     it is a false positive (Newton's method modular inverse, not
     exponentiation).
   - The link to OpenZeppelin's own slither config exclusion.

Then run `slither . --config-file slither.config.json` and confirm:

- 0 HIGH findings reported.
- The MEDIUM/LOW counts only cover `src/` (project code), not vendored
  libraries.

## Out of Scope

- Fixing any individual MEDIUM finding (those are tracked by
  per-contract tasks like `0040-goodlendpool-fix-reentrancy-no-eth.md`,
  `0049-stabilitypool-cei-deposit-offset.md`, etc.).
- Suppressing legitimate findings in `src/` — only filtering vendored
  paths and known third-party false positives.

## Verification

```bash
cd /home/goodclaw/gooddollar-l2
slither . --config-file slither.config.json --json /tmp/slither-iter23.json
python3 -c "import json; d=json.load(open('/tmp/slither-iter23.json')); \
  high=[r for r in d['results']['detectors'] if r['impact']=='High']; \
  print(f'HIGH findings: {len(high)}')"
```

Expected output: `HIGH findings: 0`.

Also confirm via `forge test` that we have not changed any `.sol` file
(this task only adds a config JSON):

```bash
forge test --no-match-test "Skip" -vv | tail -20
```

Expected: still 1030/1030 passing.

## Documentation

Update `README.md` "Security Hardening" section to add:

> `slither .` runs with `slither.config.json` (added in iter#23) which
> filters `lib/`, `node_modules/`, `frontend/`, `research/`, `test/`,
> and `script/` from analysis. With this scoping, the project reports
> **0 HIGH findings** in the audit-scope codebase. The single HIGH
> previously reported in `lib/openzeppelin-contracts/.../Math.sol` is a
> well-known `incorrect-exp` false positive on the Newton's-method
> modular inverse and is excluded along with the rest of the vendored
> library.

Also update the `Updated:` timestamp in README.md.

## One-week decision

**One-shot.** This is a single config-file addition + README sentence.
No splits needed.

## Architecture diagram

```
┌─────────────────────────┐
│   slither.config.json   │  (new — project root)
│                         │
│  filter_paths:          │
│   lib/                  │
│   node_modules/         │
│   frontend/             │
│   research/             │
│   test/                 │
│   script/               │
│                         │
│  solc_remaps:           │
│   (mirror foundry.toml) │
└──────────┬──────────────┘
           │
           ▼
   slither . --config-file …
           │
           ▼
   /tmp/slither-iter23.json
           │
           ▼
   HIGH count == 0   ────►  Phase 1 acceptance #1 satisfied
