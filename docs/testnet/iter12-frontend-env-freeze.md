# Iter 12 — Frontend env freeze

_Generated: 2026-05-17T20:42:59Z · commit: b38f47f · runner: scripts/testnet/iter12-frontend-env-freeze.sh_

## Verdict: GREEN

| Stage  | Verdict | Detail |
|--------|---------|--------|
| Before | GREEN | disallowed=0 allowed=0 scanned=387 |
| Build  | SKIP | duration=— rc=0 |
| After  | GREEN | disallowed=0 allowed=0 scanned=387 |
| Smoke  | GREEN | https://goodswap.goodclaw.org/testnet-guide status=200 localhost_in_html=0 |

**Live RPC row from /testnet-guide HTML:** `https://rpc.goodclaw.org`

## Stage 1 — Gate before rebuild

```text

==========================================
  Bundle localhost gate — verdict: GREEN
  exit code:        0
  files scanned:    387
  disallowed hits:  0
  allowed hits:     13
  report:           /home/goodclaw/gooddollar-l2/docs/testnet/iter12-bundle-before.md
==========================================
```

## Stage 2 — `npm run build` tail

```text
[iter12] SKIP_BUILD=1 — skipping fresh build
```

## Stage 3 — Gate after rebuild

```text

==========================================
  Bundle localhost gate — verdict: GREEN
  exit code:        0
  files scanned:    387
  disallowed hits:  0
  allowed hits:     13
  report:           /home/goodclaw/gooddollar-l2/docs/testnet/iter12-bundle-no-localhost.md
==========================================
```

## Stage 4 — Public site smoke

```text
$ curl -sS -o /dev/null -w %{http_code} https://goodswap.goodclaw.org/testnet-guide
200
```

## Sub-reports

- Bundle gate detail (after rebuild): `docs/testnet/iter12-bundle-no-localhost.md`
- Bundle gate detail (before rebuild): `docs/testnet/iter12-bundle-before.md`

## Source-level fixes

- `frontend/src/app/(app)/testnet-guide/page.tsx` — imports canonical RPC/chainID/explorer from `@/lib/devnet`.
- `frontend/src/lib/usePerpsHistory.ts` — empty-string fallback + short-circuit when `NEXT_PUBLIC_INDEXER_URL` is unset.
- `scripts/testnet/check-bundle-no-localhost.sh` — build-artifact gate with content-aware allowlist.

## Re-running locally

```bash
bash scripts/testnet/iter12-frontend-env-freeze.sh        # full run (~1-2 min)
SKIP_BUILD=1 bash scripts/testnet/iter12-frontend-env-freeze.sh   # gate + smoke only
```
