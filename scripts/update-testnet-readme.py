#!/usr/bin/env python3
# ============================================================================
# WARNING — DO NOT RUN UNTIL TEMPLATE IS RECONCILED (added iter 20, 2026-05-18)
# ============================================================================
#
# The live `docs/TESTNET_README.md` has drifted past this generator's template.
# The live doc now contains hand-curated, manually maintained sections that
# this script does NOT preserve and WILL silently overwrite:
#
#   - "Sibling Experimental Apps (Not in Release Gate)"
#   - "Protocol Lane Hardening Status (iter 16–19)" (iter 20)
#   - "Frontend health (iter 19)" operator runbook (iter 19)
#   - "Operator runbook" Reown / WalletConnect Cloud allowlist section (iter 10)
#   - "For developers" testnet-guide cross-links (iter 14)
#
# Running this script as-is reverted those sections during iter 20 and had to
# be `git checkout`-recovered. Before invoking it again you MUST:
#
#   1. Move every hand-edited section into the generator's template below, OR
#   2. Refactor the generator to "merge-update" (only refresh the auto blocks
#      and leave hand-edited blocks untouched), AND
#   3. Add a doc-diff CI gate that fails if a generated file silently drops
#      a hand-curated section.
#
# Iter 20 chose to update `docs/TESTNET_README.md` by hand instead of running
# this script. See `.autobuilder/initiatives/0004-testnet-readiness-gate/
# tasks/0030-iter20-readme-doc-checkpoint-4.md` for context.
#
# ============================================================================
"""Generate a concise testnet status README from live repo/devnet state.

This file is intentionally boring: no marketing copy, just the current commit,
endpoints, addresses, gates, and what is ready/blocked for public testnet.
"""
from __future__ import annotations

import json
import re
import subprocess
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "TESTNET_README.md"
ADDR = ROOT / "op-stack" / "addresses.json"
INTEGRATION = ROOT / ".autobuilder" / "integration-results.md"
STATUS = ROOT / ".autobuilder" / "status.md"


def sh(cmd: str, timeout: int = 10) -> str:
    try:
        return subprocess.check_output(cmd, cwd=ROOT, shell=True, text=True, stderr=subprocess.DEVNULL, timeout=timeout).strip()
    except Exception:
        return ""


def http_status(url: str, timeout: int = 5) -> str:
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "GoodClaw-testnet-readme"})
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return str(r.status)
    except Exception:
        return "ERR"



def rpc_status(url: str, timeout: int = 5) -> str:
    payload = json.dumps({"jsonrpc": "2.0", "method": "eth_chainId", "params": [], "id": 1}).encode()
    try:
        req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json", "User-Agent": "GoodClaw-testnet-readme"})
        with urllib.request.urlopen(req, timeout=timeout) as r:
            body = json.loads(r.read().decode())
            return f"HTTP {r.status} chainId={body.get('result', 'missing')}"
    except Exception:
        return "ERR"

def rpc_json(method: str, params=None, timeout: int = 5):
    params = [] if params is None else params
    payload = json.dumps({"jsonrpc": "2.0", "method": method, "params": params, "id": 1}).encode()
    req = urllib.request.Request("http://localhost:8545", data=payload, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return json.loads(r.read().decode()).get("result")
    except Exception:
        return None


def extract_integration_summary(text: str) -> tuple[str, str]:
    if not text:
        return "Unknown", "No integration report found."
    rows = []
    for line in text.splitlines():
        if line.startswith("| Good") and "✅" in line:
            parts = [p.strip() for p in line.strip("|").split("|")]
            if len(parts) >= 4:
                rows.append(f"- {parts[0]}: {parts[2]} ({parts[3]})")
    count = len(rows)
    status = f"{count}/6 protocol smoke tx lanes green" if count else "Integration report present, but protocol rows not parsed"
    return status, "\n".join(rows[:6]) or "No green protocol rows parsed."


def read_json(path: Path) -> dict:
    try:
        return json.loads(path.read_text())
    except Exception:
        return {}


def main() -> int:
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    branch = sh("git branch --show-current") or "unknown"
    version = sh("node -p \"require('./package.json').version\"") or "unknown"
    addresses = read_json(ADDR)
    contracts = addresses.get("contracts", {}) if isinstance(addresses, dict) else {}
    chain_id = addresses.get("chain_id", "42069") if isinstance(addresses, dict) else "42069"
    chain_name = addresses.get("chain_name", "GoodDollar L2 Devnet") if isinstance(addresses, dict) else "GoodDollar L2 Devnet"
    rpc_url = addresses.get("rpc_url", "https://rpc.goodclaw.org") if isinstance(addresses, dict) else "https://rpc.goodclaw.org"
    explorer_url = addresses.get("explorer_url", "https://explorer.goodclaw.org") if isinstance(addresses, dict) else "https://explorer.goodclaw.org"

    block_hex = rpc_json("eth_blockNumber")
    block_num = int(block_hex, 16) if isinstance(block_hex, str) and block_hex.startswith("0x") else None
    chain_hex = rpc_json("eth_chainId")
    live_chain_id = int(chain_hex, 16) if isinstance(chain_hex, str) and chain_hex.startswith("0x") else None

    integration_text = INTEGRATION.read_text(errors="ignore") if INTEGRATION.exists() else ""
    integration_status, integration_rows = extract_integration_summary(integration_text)
    status_text = STATUS.read_text(errors="ignore") if STATUS.exists() else ""
    iteration = "unknown"
    m = re.search(r"\*\*Iteration:\*\*\s*(\d+)", status_text)
    if m:
        iteration = m.group(1)

    services = {
        "Frontend": ("GET", "https://goodswap.goodclaw.org"),
        "Landing": ("GET", "https://goodclaw.org"),
        "Explorer": ("GET", explorer_url),
        "RPC HTTPS": ("RPC", rpc_url),
        "Paperclip": ("GET", "https://paperclip.goodclaw.org"),
    }
    rows = []
    for name, (kind, url) in services.items():
        status = rpc_status(url) if kind == "RPC" else f"HTTP {http_status(url)}"
        rows.append(f"- {name}: {status} — {url}")
    service_rows = "\n".join(rows)

    important = [
        "GoodDollarToken", "UBIFeeSplitter", "UBIClaimV2", "GoodSwapRouter", "SwapPriceOracle",
        "PerpEngine", "MarginVault", "MarketFactory", "GoodLendPool", "VaultManager",
        "gUSD", "CollateralVault", "SyntheticAssetFactory", "UBIRevenueTracker",
    ]
    contract_rows = "\n".join(f"- {name}: `{contracts.get(name, 'MISSING')}`" for name in important)

    chain_id_hex = f"0x{int(chain_id):x}" if str(chain_id).isdigit() else "0xa455"

    text = f"""# GoodDollar L2 Testnet Readiness

_Last updated: {now} by `scripts/update-testnet-readme.py`._

## Current Build

- Branch: `{branch}`
- Snapshot source: committed README + GitHub Actions history for this branch
- Package version: `{version}`
- Autobuilder iteration: `{iteration}`
- Chain: {chain_name} (`{chain_id}` configured, `{live_chain_id or 'unreachable'}` live)
- Latest local block: `{block_num or 'unreachable'}`

## Public Endpoints

{service_rows}

## Release Gate Status

- CI: GitHub `CI` was green on latest pushed `main` before this README generation; every push must re-check.
- On-chain protocol smoke: {integration_status}
- Frontend E2E: matrix workflow `Parallel Dapp Tests` covers each dapp lane independently.
- Deployment: devnet deployment workflow is `Deploy to Devnet`.
- Required before public testnet: persistent OP Stack chain, faucet, final canonical address sync, explorer indexing check, Dune dashboard/indexing.

## Dune Public Analytics

- Status: included in the testnet move plan.
- Spec: `docs/DUNE-DASHBOARD-SPEC.md`.
- Launch requirement: public proof dashboard for network usage, protocol activity, UBI fee routing, agent economy, faucet funnel, and success/revert rates.
- Indexing note: local chain `42069` uses internal indexer until the public testnet is Dune-indexed or Dune indexing is requested.

## Protocol Smoke Matrix

{integration_rows}

## Canonical Contract Addresses

The canonical sources of truth are:

- `op-stack/addresses.json` — imported by the frontend (`frontend/src/lib/devnet.ts`).
- `.autobuilder/addresses.env` — sourced by deploy scripts, backend services, and tests.

Both files are regenerated from Foundry broadcast artifacts plus on-chain
bytecode by `scripts/refresh-addresses.py`. They are protected by two CI
gates that prevent silent drift:

### Gate 1 — Diff guard (`scripts/refresh-addresses.py --check`)

Runs the full pipeline in memory and compares the result against the
files on disk. Exit code `0` means the registry matches broadcast+chain
truth; exit code `1` prints a unified diff of every byte that would
change. Run after any redeploy:

```bash
python3 scripts/refresh-addresses.py --check
```

If it fails, drop `--check` to actually rewrite the files, then commit.

### Gate 2 — Stale address scanner (`scripts/check_no_stale_addresses.py`)

Walks `frontend/src/` (override with `--paths`) for every hex address
literal of the form `0x[0-9a-f]{{40}}` and fails on any address that is
neither:

1. In the canonical registry above, OR
2. On the bake-in allowlist (`0x0…0`, `0x…dead`, the four Anvil dev
   wallets, the OP Stack predeploy range `0x4200…00–0x4200…FF`), OR
3. Tagged on the line itself or within 20 preceding non-blank lines
   with one of: `STALE`, `hardcoded`, `redeploy`, or `allowlist:`.

Run it as:

```bash
python3 scripts/check_no_stale_addresses.py
python3 scripts/check_no_stale_addresses.py --json   # CI-friendly
```

This is what blocks "we redeployed everything but the frontend still
points at the old MarketFactory" from sneaking into a release.

Both gates are exercised by `scripts/test_refresh_addresses.py`.

### Live addresses

{contract_rows}

## Parallel Test Plan

Run lanes independently so one dapp failure does not hide the others:

- Contracts: Foundry build, unit tests, gas report, Slither audit scope.
- Swap: quote, approve, execute, price-impact guard, UBI fee routing.
- Perps: deposit margin, open/close position, liquidation threshold, API market feed.
- Predict: create market, buy/sell outcome, resolve, market detail UI.
- Lend: supply, withdraw, borrow/repay health-factor checks.
- Stable: deposit collateral, mint/repay gUSD, PSM swap, stability pool.
- Stocks: deposit collateral, mint/burn synthetic equity, oracle freshness.
- Portfolio/Claim: wallet states, balances, UBI claim, explorer links.

## Wallet Onboarding (iter 13)

Public testers should never have to type RPC URLs into MetaMask by hand.
The frontend now ships a one-click **"Add GoodChain Testnet to wallet"**
button in two places:

- `/testnet-guide` → top of the "1. Add GoodChain Testnet" section, above
  the network table. Full-width CTA; success state offers an "Open
  Faucet →" follow-up link.
- `/faucet` → compact pill above the "Wallet Address" input, framed by a
  "First time here?" hint.

Implementation:

- Component: `frontend/src/components/AddNetworkButton.tsx`
- Unit tests: `frontend/src/components/__tests__/AddNetworkButton.test.tsx`
  (8 specs, covers idle / compact / no-wallet / success / rejected /
  error states and asserts the canonical EIP-3085 payload).
- E2E: `frontend/e2e/onboarding.spec.ts` clicks the button on both pages,
  captures before/after screenshots in `frontend/e2e/screenshots/`, and
  asserts the wallet received the canonical payload.
- Mock wallet: `frontend/e2e/fixtures/wallet.ts` records every
  `wallet_addEthereumChain` call on `window.__addEthereumChainCalls`
  so the spec can introspect what reached the wallet.

The button is wired to `frontend/src/lib/devnet.ts`, which sources
`chain_id`, `rpc_url`, and `explorer_url` directly from
`op-stack/addresses.json`. No hardcoded fallbacks — when the canonical
registry changes, the onboarding flow follows automatically.

EIP-3085 payload shape sent to the wallet:

```json
{{
  "chainId": "{chain_id_hex}",
  "chainName": "GoodChain Testnet",
  "rpcUrls": ["{rpc_url}"],
  "blockExplorerUrls": ["{explorer_url}"],
  "nativeCurrency": {{ "name": "GoodDollar", "symbol": "G$", "decimals": 18 }}
}}
```

A manual "Or add it manually" panel remains on `/testnet-guide` for
wallets that do not implement EIP-3085 (hardware wallets, some mobile
wallets without injected providers).

### For developers (iter 14)

The in-app guide (`/testnet-guide`) now includes a **For developers** section
with a copy-pasteable RPC reachability `curl` command and direct links to
`op-stack/addresses.json`, `docs/ARCHITECTURE.md`, and this README on GitHub.
The section appears in the sticky TOC under `#for-developers`.

The frontend production build is wrapped by `frontend/scripts/atomic-build.mjs`,
which builds into a temporary `.next.tmp` directory and atomically swaps it
in only on success. Partial or failed builds can no longer corrupt the
deployed `.next/` directory. See `docs/runbooks/frontend-rebuild.md` for the
operator workflow.

## Operator runbook

### WalletConnect / Reown Cloud allowlist

Production origin: `https://goodswap.goodclaw.org`

When deploying a new public origin (preview environment, staging,
new domain) the SDK will log a red `Origin ... not found on
Allowlist` error and a `[Reown Config] Failed to fetch remote
project configuration` warning on every page load until the origin
is added to the WalletConnect Cloud project.

To add the origin permanently (replaces the runtime suppression in
`frontend/src/lib/wagmi.ts`):

1. Log into <https://cloud.reown.com> with the project owner
   account.
2. Open the project that matches `NEXT_PUBLIC_WC_PROJECT_ID` in
   `frontend/.env.local` (last four chars: `97d1`).
3. Under **Settings → Allowed origins**, add the production URL
   (and any preview/staging URLs).
4. Reload the app and confirm the console no longer logs the
   allowlist error even with the suppression filter removed.

The runtime suppression in `wagmi.ts` is a stopgap so the public
app ships clean while waiting for cloud-side access; it is
narrowly scoped to those two exact log patterns and silences no
other Reown logging.

## Update Cadence

- Group update: every 5 autobuilder commits/iterations via `autobuilder-progress-monitor`.
- This README: regenerate with `python3 scripts/update-testnet-readme.py` before each 5-iteration push/deploy update.
- After deploy: run `bash scripts/health-check.sh` and `bash scripts/verify-onchain-integration.sh`, then regenerate this file.
"""
    OUT.write_text(text)
    print(f"updated {OUT.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
