# Iter 14 — Restore goodswap

_Generated: 2026-05-17T21:37:49Z · commit: dafa6e5 · runner: scripts/testnet/iter14-restore-goodswap.sh_

## Verdict: GREEN

| Stage           | Verdict | Detail |
|-----------------|---------|--------|
| Build           | GREEN | rc=0 duration=25s SKIP_PM2_RELOAD=1 |
| Assert BUILD_ID | GREEN | 1fU6NFl8R67h2w6jzCzMN |
| Assert CSS file | GREEN | .next/static/css/0d9e1d496a11b779.css |
| PM2 reload      | GREEN | rc=0 pre_pid=2800708 post_pid=2893009 |
| Live health     | GREEN | curl http://127.0.0.1:3100/ → 200 |
| Live asset      | GREEN | /_next/static/css/950f114248636da1.css → status=200 ct=text/css; charset=UTF-8 |

## Build tail

```text
├ ○ /predict                             10.8 kB         191 kB
├ ƒ /predict/[marketId]                  11 kB           379 kB
├ ○ /predict/create                      5.42 kB         321 kB
├ ○ /predict/portfolio                   11.5 kB         260 kB
├ ○ /stable                              7.9 kB          221 kB
├ ○ /stocks                              10 kB           160 kB
├ ƒ /stocks/[ticker]                     11.4 kB         382 kB
├ ○ /stocks/portfolio                    4.18 kB         303 kB
├ ○ /test-dashboard                      5.8 kB          203 kB
├ ○ /testnet-guide                       5.01 kB        99.2 kB
├ ○ /tests                               252 B          88.3 kB
├ ○ /ubi-impact                          7.17 kB         149 kB
└ ○ /yield                               9.29 kB         362 kB
+ First Load JS shared by all            88.1 kB
  ├ chunks/2364-afbdaf9ace7980f9.js      31.9 kB
  ├ chunks/618f8807-4b9095aa84720473.js  53.6 kB
  └ other shared chunks (total)          2.54 kB


ƒ Middleware                             26.8 kB

○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand


> goodswap@0.2.0 postbuild
> node scripts/postbuild-reload-pm2.mjs

[postbuild-reload-pm2] SKIP_PM2_RELOAD=1 set — skipping reload.
  .autobuilder/initiatives/0002-security-hardening/tasks/0087-frontend-postbuild-auto-reload-pm2.md
```

## PM2 reload output

```text
[PM2] Applying action reloadProcessId on app [goodswap](ids: [ 34 ])
[PM2] [goodswap](34) ✓
```

## Live asset HEAD response

```text
HTTP/1.1 200 OK
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
Permissions-Policy: camera=(), microphone=(), geolocation=()
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://assets.coingecko.com https://raw.githubusercontent.com https://goodswap.goodclaw.org; connect-src 'self' https://*.alchemyapi.io https://*.g.alchemy.com wss://*.alchemyapi.io wss://*.g.alchemy.com https://api.coingecko.com https://*.infura.io wss://*.infura.io https://api.walletconnect.com wss://*.walletconnect.com https://explorer-api.walletconnect.com https://rpc.gooddollar.org https://clapi.gooddollar.org https://rpc.goodclaw.org wss://rpc.goodclaw.org https://pulse.walletconnect.org wss://pulse.walletconnect.org https://api.web3modal.org; worker-src 'self' blob:; manifest-src 'self'; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests; report-uri /api/csp-report; report-to csp-violations
Report-To: {"group":"csp-violations","max_age":86400,"endpoints":[{"url":"/api/csp-report"}]}
Cache-Control: public, max-age=31536000, immutable
Accept-Ranges: bytes
Last-Modified: Sun, 17 May 2026 21:37:31 GMT
ETag: W/"1073c-19e37df754f"
Content-Type: text/css; charset=UTF-8
Content-Length: 67388
Vary: Accept-Encoding
Date: Sun, 17 May 2026 21:37:48 GMT
Connection: keep-alive
Keep-Alive: timeout=5

```

## Re-running locally

```bash
# full restore (~30-60s, runs next build)
bash scripts/testnet/iter14-restore-goodswap.sh

# reload + verify only (existing .next/ assumed good)
SKIP_BUILD=1 bash scripts/testnet/iter14-restore-goodswap.sh
```
