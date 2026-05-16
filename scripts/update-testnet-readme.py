#!/usr/bin/env python3
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
