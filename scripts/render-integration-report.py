#!/usr/bin/env python3
"""
render-integration-report.py
============================

Render `.autobuilder/integration-results.md` from the existing JSON receipts in
`.autobuilder/integration-receipts/`, live `pm2 jlist`, and a small handful of
live `cast call` reads.

Why a separate renderer (instead of extending verify-onchain-integration.sh)?
  - The on-chain verifier already produced the per-protocol JSON receipts.
    Re-running it is destructive (uses nonces, takes seconds-to-minutes, and
    can introduce new failures during a routine documentation refresh).
  - The Markdown report is a *view* over receipts + live state, so a pure
    renderer is simpler, faster, and safer to re-run.
  - The verifier still owns transaction execution; this renderer only
    summarises.

Idempotency contract:
  Running this twice in a row produces files that differ only in:
  - the "Generated" timestamp at the top, and
  - the "snapshot taken at" timestamps in live sections (swap-oracle health,
    UBI splitter row).
  Per-protocol rows are derived from JSON receipts which do not change unless
  the verifier is re-run.

Honesty rules:
  - We do not invent values. Missing data is rendered as `n/a` with a short
    explanation of *why* it's missing.
  - Reverts are rendered as ❌ with the available revert excerpt.
  - swap-oracle PM2 status comes from `pm2 jlist`, not from PR text.

Inputs (all read at runtime):
  - .autobuilder/addresses.env
  - .autobuilder/integration-receipts/*.json
  - .autobuilder/integration-receipts/swap-oracle-fix.json (task 0015 output)
  - `pm2 jlist`  (subprocess)
  - `cast call <FEE_SPLITTER> claimableBalance()` and goodDollar()
  - $HOME/.pm2/logs/swap-oracle-out.log (last 200 lines, optional)

Output:
  - .autobuilder/integration-results.md  (overwritten; canonical path per
    initiative 0002 DoD).

Exit codes:
  0 — markdown written
  2 — addresses.env missing or malformed
  3 — receipts directory missing
"""

from __future__ import annotations

import datetime as _dt
import json
import os
import re
import subprocess
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple


REPO_ROOT = Path(__file__).resolve().parent.parent
ADDR_ENV = REPO_ROOT / ".autobuilder" / "addresses.env"
RECEIPTS_DIR = REPO_ROOT / ".autobuilder" / "integration-receipts"
OUTPUT_MD = REPO_ROOT / ".autobuilder" / "integration-results.md"
ORACLE_LOG = Path.home() / ".pm2" / "logs" / "swap-oracle-out.log"

TRANSFER_TOPIC = (
    "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
)

BACKEND_SERVICES = [
    "activity-reporter",
    "bridge-keeper",
    "harvest-keeper",
    "indexer",
    "liquidator",
    "monitor",
    "revenue-tracker",
    "rpc-balancer",
    "stocks-keeper",
    "swap-oracle",
]

# Protocol → (receipt filename, action label, source-of-tx note).
# Order matches the initiative spec.
PROTOCOL_ROWS: List[Tuple[str, Optional[str], str, str]] = [
    (
        "GoodSwap",
        "GoodSwap.json",
        "swapExactTokensForTokens(1 GDT → WETH)",
        "router-pool with seeded GDT/WETH liquidity",
    ),
    (
        "GoodPerps",
        "GoodPerps.json",
        "vault.deposit(10 GDT)",
        "MarginVault deposit; openPosition + closePosition receipts archived separately",
    ),
    (
        "GoodLend",
        "GoodLend.json",
        "supply(GDT, 5 GDT)",
        "GDT reserve initialised by `script/InitGoodLendGDTReserve.s.sol` (task 0022); supply receipt captured live",
    ),
    (
        "GoodStable",
        "GoodStable.json",
        "depositCollateral(ETH, 5 WETH) + mintGUSD(ETH, 100 gUSD)",
        "MockWETH minted to tester, approved VaultManager, then deposit + mint via VaultManager (task 0023). Receipt is the mintGUSD tx; explicit --gas-limit set to avoid cold-storage gas under-estimation",
    ),
    (
        "GoodStocks",
        "GoodStocks.json",
        "CollateralVault.depositCollateral + mint(AAPL, 0.01 sAAPL)",
        "Real mint via CollateralVault.depositCollateral + mint (task 0024); SyntheticAsset.mint is vault-gated, factory only lists assets",
    ),
    (
        "GoodPredict",
        "GoodPredict.json",
        "createMarket(\"Will BTC hit $100K by 2026?\", endTime, resolver=0)",
        "tester key creates market directly via `MarketFactory.marketCreators` allowlist (task 0042); admin grants role idempotently before each run",
    ),
]


# ──────────────────────────────────────────────────────────────────────────────
# Small helpers
# ──────────────────────────────────────────────────────────────────────────────


def utcnow() -> _dt.datetime:
    return _dt.datetime.now(_dt.timezone.utc)


def utcnow_iso() -> str:
    return utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")


def hexint(s: Optional[str]) -> Optional[int]:
    if not s:
        return None
    try:
        return int(s, 16)
    except (TypeError, ValueError):
        return None


def parse_addresses(path: Path) -> Dict[str, str]:
    if not path.is_file():
        print(f"FATAL: {path} not found — run scripts/refresh-addresses.py first",
              file=sys.stderr)
        sys.exit(2)
    out: Dict[str, str] = {}
    with path.open() as fh:
        for raw in fh:
            line = raw.strip()
            if not line or line.startswith("#"):
                continue
            # Strip inline `# comment` from value.
            if "#" in line:
                line = line.split("#", 1)[0].rstrip()
            if "=" not in line:
                continue
            k, v = line.split("=", 1)
            out[k.strip()] = v.strip()
    return out


def cast_call(addr: str, sig: str, *args: str, rpc: str) -> Optional[str]:
    """Run `cast call` and return stdout stripped, or None on failure."""
    cmd = ["cast", "call", addr, sig, *args, "--rpc-url", rpc]
    try:
        out = subprocess.run(cmd, capture_output=True, text=True, timeout=15)
    except (FileNotFoundError, subprocess.TimeoutExpired):
        return None
    if out.returncode != 0:
        return None
    return out.stdout.strip()


def parse_first_int_token(s: Optional[str]) -> Optional[int]:
    """`cast` may print `1999800000000000 [1.999e15]` — take the first int."""
    if not s:
        return None
    tok = s.split()[0]
    try:
        return int(tok)
    except ValueError:
        try:
            return int(tok, 16)
        except ValueError:
            return None


def pm2_jlist() -> List[Dict[str, Any]]:
    try:
        out = subprocess.run(["pm2", "jlist"], capture_output=True,
                             text=True, timeout=15)
    except (FileNotFoundError, subprocess.TimeoutExpired):
        return []
    if out.returncode != 0:
        return []
    try:
        return json.loads(out.stdout)
    except json.JSONDecodeError:
        return []


def topic_to_address(topic_hex: str) -> str:
    """Topic-encoded address is the last 40 hex chars, lowercased + 0x-prefixed."""
    if not topic_hex:
        return ""
    return "0x" + topic_hex[-40:].lower()


def sum_transfers_to(receipt: Dict[str, Any], to_addr: str) -> int:
    total = 0
    target = to_addr.lower()
    for log in receipt.get("logs", []):
        topics = log.get("topics", [])
        if len(topics) < 3:
            continue
        if topics[0].lower() != TRANSFER_TOPIC:
            continue
        if topic_to_address(topics[2]) != target:
            continue
        try:
            total += int(log.get("data", "0x0"), 16)
        except ValueError:
            continue
    return total


def load_receipt(name: str) -> Optional[Dict[str, Any]]:
    path = RECEIPTS_DIR / name
    if not path.is_file():
        return None
    try:
        return json.loads(path.read_text())
    except json.JSONDecodeError:
        return None


# ──────────────────────────────────────────────────────────────────────────────
# Rendering
# ──────────────────────────────────────────────────────────────────────────────


def render_protocol_row(
    proto: str,
    receipt_name: Optional[str],
    action: str,
    note: str,
    fee_splitter: str,
) -> str:
    if receipt_name is None:
        return (
            f"| {proto} | `{action}` | n/a | ⏭️  skipped | n/a | n/a | n/a | "
            f"{note} |"
        )
    receipt = load_receipt(receipt_name)
    if receipt is None:
        return (
            f"| {proto} | `{action}` | n/a | ❌ no receipt file | n/a | n/a | n/a | "
            f"`{receipt_name}` is missing — re-run verify-onchain-integration.sh |"
        )

    tx = receipt.get("transactionHash", "n/a")
    status_hex = receipt.get("status", "")
    status = "✅ success" if status_hex == "0x1" else f"❌ status={status_hex or '?'}"
    gas_used = hexint(receipt.get("gasUsed")) or 0
    eff_gas_price = hexint(receipt.get("effectiveGasPrice")) or 0
    fee_paid_wei = gas_used * eff_gas_price
    ubi_routed = sum_transfers_to(receipt, fee_splitter)

    tx_short = f"`{tx[:14]}…`" if isinstance(tx, str) and tx.startswith("0x") else tx
    return (
        f"| {proto} | `{action}` | {tx_short} | {status} | "
        f"{gas_used:,} | {fee_paid_wei:,} wei | {ubi_routed:,} wei | {note} |"
    )


def render_swap_oracle_health(addresses: Dict[str, str]) -> List[str]:
    procs = pm2_jlist()
    proc = next((p for p in procs if p.get("name") == "swap-oracle"), None)
    fix_path = RECEIPTS_DIR / "swap-oracle-fix.json"
    fix_data = None
    if fix_path.is_file():
        try:
            fix_data = json.loads(fix_path.read_text())
        except json.JSONDecodeError:
            fix_data = None

    lines: List[str] = []
    lines.append("## swap-oracle Health (live snapshot)")
    lines.append("")
    lines.append(f"- Snapshot taken at: `{utcnow_iso()}`")
    if proc is None:
        lines.append("- ❌ swap-oracle is **not present** in `pm2 jlist` — start with "
                     "`pm2 start backend/ecosystem.config.js --only swap-oracle`.")
    else:
        env = proc.get("pm2_env", {}) or {}
        status = env.get("status", "?")
        pid = proc.get("pid", "?")
        restart_total = env.get("restart_time", "?")
        unstable = env.get("unstable_restarts", "?")
        uptime_ms = env.get("pm_uptime")
        uptime_s = (
            int((utcnow().timestamp() * 1000 - uptime_ms) / 1000)
            if isinstance(uptime_ms, int) else "?"
        )
        ok = "✅" if status == "online" and unstable == 0 else "⚠️"
        lines.append(
            f"- {ok} PM2 status: **{status}** "
            f"(pid={pid}, uptime≈{uptime_s}s, restart_time={restart_total}, "
            f"unstable_restarts={unstable})"
        )

    # Last "Updated N prices on-chain" line (parsed from out.log).
    last_update = _last_oracle_update_line()
    if last_update is not None:
        when_iso, tx_hash, gas_used, updated_str = last_update
        lines.append(
            f"- Last successful price-push: `{when_iso}` "
            f"tx=`{tx_hash[:14]}…` gas={gas_used} prices=`{updated_str}`"
        )
    else:
        lines.append(
            "- Last successful price-push: n/a "
            f"(no `Updated N prices on-chain` line found in `{ORACLE_LOG}`)"
        )

    if fix_data is not None:
        post = fix_data.get("post_fix", {}) or {}
        regs = fix_data.get("registrations", []) or []
        lines.append(
            f"- Post-fix verification (task 0015) recorded "
            f"{len(regs)} token re-registrations; "
            f"recovery batch tx="
            f"`{post.get('first_recovery_batch_tx_hash', 'n/a')[:14]}…` "
            f"(gas {post.get('first_recovery_batch_gas_used', 'n/a')}); "
            f"CALL_EXCEPTION count since restart: "
            f"{post.get('post_fix_call_exception_count_since_restart', 'n/a')}."
        )
        # Per-token last on-chain price (from the recovery snapshot).
        configs = post.get("token_configs_on_chain", []) or []
        if configs:
            lines.append("- Per-token last known on-chain config (from task 0015 snapshot):")
            for c in configs:
                lines.append(
                    f"  - `{c.get('token','?')}` (`{c.get('address','?')}`): "
                    f"active={c.get('active')}, decimals={c.get('decimals')}, "
                    f"max_age={c.get('max_age_seconds')}s"
                )
    else:
        lines.append("- ⚠️  `swap-oracle-fix.json` not found — task 0015 receipt is missing.")
    lines.append("")
    return lines


def _last_oracle_update_line() -> Optional[Tuple[str, str, str, str]]:
    """Return (iso_when, tx_hash, gas_used, updated_str) for the most recent
    `Updated N prices on-chain` log entry, or None."""
    if not ORACLE_LOG.is_file():
        return None
    try:
        # Read tail without loading the whole file.
        with ORACLE_LOG.open("rb") as fh:
            fh.seek(0, os.SEEK_END)
            size = fh.tell()
            fh.seek(max(0, size - 64 * 1024))
            tail = fh.read().decode("utf-8", errors="replace")
    except OSError:
        return None
    last_line = None
    for raw in tail.splitlines():
        if "Updated " in raw and "prices on-chain" in raw:
            last_line = raw
    if not last_line:
        return None
    # PM2 prefixes lines with `YYYY-MM-DD HH:MM:SS: ` then the JSON payload.
    m = re.match(r"^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}):\s+(\{.*\})\s*$", last_line)
    if not m:
        return None
    ts_local, payload_raw = m.groups()
    try:
        payload = json.loads(payload_raw)
    except json.JSONDecodeError:
        return None
    return (
        ts_local,
        str(payload.get("txHash", "n/a")),
        str(payload.get("gasUsed", "n/a")),
        str(payload.get("updated", "n/a")),
    )


def render_pm2_summary() -> List[str]:
    procs = pm2_jlist()
    have = {p.get("name"): p for p in procs}
    online = 0
    rows: List[str] = []
    for svc in BACKEND_SERVICES:
        p = have.get(svc)
        if not p:
            rows.append(f"| {svc} | ❌ MISSING | n/a | n/a |")
            continue
        env = p.get("pm2_env", {}) or {}
        status = env.get("status", "?")
        unstable = env.get("unstable_restarts", "?")
        restart_total = env.get("restart_time", "?")
        if status == "online" and unstable == 0:
            online += 1
        marker = "✅" if status == "online" and unstable == 0 else "⚠️"
        rows.append(
            f"| {svc} | {marker} {status} | restart_time={restart_total} | "
            f"unstable_restarts={unstable} |"
        )

    lines: List[str] = []
    lines.append("## Backend Services (live PM2 snapshot)")
    lines.append("")
    lines.append(f"- Snapshot taken at: `{utcnow_iso()}`")
    lines.append(f"- Online (status=online & unstable_restarts=0): "
                 f"**{online} / {len(BACKEND_SERVICES)}**")
    lines.append("")
    lines.append("| Service | Status | Total restarts | Unstable restarts |")
    lines.append("|---------|--------|----------------|-------------------|")
    lines.extend(rows)
    lines.append("")
    return lines, online


def render_dod(
    online_count: int,
    receipts_with_status_one: int,
    ubi_routed_total_wei: int,
    ubi_balance_after_wei: Optional[int],
) -> List[str]:
    lines: List[str] = []
    lines.append("## Definition of Done — Live Status")
    lines.append("")

    # Slither / Foundry counts: we don't re-run them here. Surface the last
    # authoritative claim and point at the task that produced it.
    lines.append(
        "- Slither HIGH count: **0** "
        "(verified in task `0008-slither-high-zero-budget`; not re-run by this renderer)"
    )
    lines.append(
        "- Foundry test failures: **0 / 1016** "
        "(verified in task `0007-foundry-test-pass-zero-failures`; not re-run by this renderer)"
    )

    pm2_ok = "✅" if online_count == len(BACKEND_SERVICES) else "⚠️"
    lines.append(
        f"- PM2 backend services online: {pm2_ok} **{online_count} / "
        f"{len(BACKEND_SERVICES)}**"
    )

    receipts_ok = "✅" if receipts_with_status_one >= 1 else "❌"
    lines.append(
        f"- Integration receipts with `status=0x1` "
        f"(per-protocol .json files in `.autobuilder/integration-receipts/`): "
        f"{receipts_ok} **{receipts_with_status_one}** present"
    )

    ubi_ok = "✅" if ubi_routed_total_wei > 0 or (ubi_balance_after_wei or 0) > 0 else "❌"
    lines.append(
        f"- UBI fee routing: {ubi_ok} "
        f"summed Transfer-to-splitter from this run's receipts = "
        f"**{ubi_routed_total_wei:,} wei**; "
        f"current `claimableBalance` = "
        f"`{ubi_balance_after_wei if ubi_balance_after_wei is not None else 'n/a'}` wei"
    )
    lines.append("")
    lines.append(
        "_Notes on live counts: Slither + Foundry are intentionally not re-run "
        "by this renderer to keep it fast and side-effect-free; their last "
        "verified values are surfaced from the tasks listed above. Re-run "
        "`slither .` or `forge test` if you need a fresh number._"
    )
    lines.append("")
    return lines


def main() -> int:
    if not RECEIPTS_DIR.is_dir():
        print(f"FATAL: {RECEIPTS_DIR} not found", file=sys.stderr)
        return 3

    addrs = parse_addresses(ADDR_ENV)
    rpc = addrs.get("RPC", "http://localhost:8545")
    fee_splitter = addrs.get("FEE_SPLITTER", "")
    gdt = addrs.get("GDT", "")
    swap_oracle = addrs.get("SWAP_ORACLE", "")

    # Live UBI state.
    splitter_token_raw = cast_call(fee_splitter, "goodDollar()(address)", rpc=rpc)
    splitter_token = (splitter_token_raw or "").lower().split()[0] if splitter_token_raw else ""
    ubi_balance_now_str = cast_call(fee_splitter, "claimableBalance()(uint256)", rpc=rpc)
    ubi_balance_now = parse_first_int_token(ubi_balance_now_str)

    # Per-protocol rows + UBI totals derived from receipts.
    protocol_rows_md: List[str] = []
    ubi_routed_total = 0
    receipts_with_status_one = 0
    for proto, receipt_name, action, note in PROTOCOL_ROWS:
        protocol_rows_md.append(
            render_protocol_row(proto, receipt_name, action, note, fee_splitter)
        )
        if receipt_name:
            r = load_receipt(receipt_name)
            if r and r.get("status") == "0x1":
                receipts_with_status_one += 1
                ubi_routed_total += sum_transfers_to(r, fee_splitter)

    pm2_section, online_count = render_pm2_summary()
    swap_oracle_section = render_swap_oracle_health(addrs)
    dod_section = render_dod(online_count, receipts_with_status_one,
                             ubi_routed_total, ubi_balance_now)

    # List all receipts for the receipts table.
    receipt_files = sorted(p.name for p in RECEIPTS_DIR.glob("*.json"))

    # Mismatch warning for splitter ↔ GDT.
    splitter_warning = ""
    if splitter_token and gdt and splitter_token != gdt.lower():
        splitter_warning = (
            "- ⚠️  **MISMATCH**: splitter `goodDollar` does not equal current "
            f"GDT (`{gdt}`). Fees will not accrue until "
            f"`UBIFeeSplitter.setGoodDollar({gdt})` is called by admin.\n"
        )
    elif splitter_token and gdt:
        splitter_warning = "- ✅ splitter is wired to current GDT.\n"

    # Compose the file.
    out: List[str] = []
    out.append("# Phase 1 — Integration Test Results")
    out.append("")
    out.append(
        "_Auto-generated by `scripts/render-integration-report.py` from per-protocol "
        "JSON receipts in `.autobuilder/integration-receipts/`, live `pm2 jlist`, and "
        "live `cast call` reads against the splitter. Do not hand-edit; rerun the "
        "renderer to refresh._"
    )
    out.append("")
    out.append(f"- Generated: `{utcnow_iso()}`")
    out.append(f"- RPC: `{rpc}`  |  Chain ID: 42069")
    out.append(f"- Tester: `{addrs.get('TESTER_WALLET','?')}`")
    out.append("- Deployer (per `addresses.env` convention): "
               "`0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`")
    out.append("")
    out.append("## Per-Protocol Results")
    out.append("")
    out.append("| Protocol | Action | Tx | Status | Gas used | Fee paid | UBI fee routed | Notes |")
    out.append("|----------|--------|----|--------|----------|----------|----------------|-------|")
    out.extend(protocol_rows_md)
    out.append("")
    out.append("> `Tx` is truncated for table width; full hash lives in the JSON receipt.")
    out.append("> `UBI fee routed` is the sum of `Transfer` logs whose `to` is the "
               "splitter, parsed directly from the receipt logs (not the splitter's "
               "own balance).")
    out.append("")
    out.append("## UBI Fee Splitter (live snapshot)")
    out.append("")
    out.append(f"- Splitter address: `{fee_splitter}`")
    out.append(f"- Configured `goodDollar`: `{splitter_token or 'n/a'}`")
    out.append(f"- Current `GDT`: `{gdt}`")
    out.append(splitter_warning.rstrip("\n"))
    out.append(
        f"- `claimableBalance` now: "
        f"`{ubi_balance_now if ubi_balance_now is not None else 'n/a'}` wei"
    )
    out.append(
        f"- Sum of UBI-routed amounts from this run's receipts: "
        f"`{ubi_routed_total}` wei "
        "(per-receipt log inspection — independent of splitter balance)"
    )
    out.append("")
    out.extend(swap_oracle_section)
    out.extend(pm2_section)
    out.append("## Receipts on Disk")
    out.append("")
    out.append("Raw cast-receipt JSON saved under `.autobuilder/integration-receipts/`:")
    out.append("")
    for name in receipt_files:
        out.append(f"- `{name}`")
    out.append("")
    out.extend(dod_section)
    out.append("## Source Inputs")
    out.append("")
    out.append("- Addresses: `.autobuilder/addresses.env`")
    out.append("- JSON receipts: `.autobuilder/integration-receipts/*.json`")
    out.append("- swap-oracle remediation receipt: "
               "`.autobuilder/integration-receipts/swap-oracle-fix.json` "
               "(produced by task 0015)")
    out.append("- Verifier (writes the JSON receipts): "
               "`scripts/verify-onchain-integration.sh`")
    out.append("- Renderer (writes this file): `scripts/render-integration-report.py`")
    out.append("")
    out.append(
        "_For the full historical narrative across iterations, see "
        "`.autobuilder/initiatives/0002-security-hardening/integration-results.md`._"
    )
    out.append("")

    OUTPUT_MD.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_MD.write_text("\n".join(out))
    print(f"wrote {OUTPUT_MD}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
