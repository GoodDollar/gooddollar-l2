#!/usr/bin/env python3
"""Scan source trees for hardcoded contract addresses that are NOT in the
canonical registry.

The canonical registry is the union of:

  - ``op-stack/addresses.json``           (frontend source of truth)
  - ``.autobuilder/addresses.env``        (backend / scripts source of truth)

A hex address is OK if any of:

  1. It appears (lower-cased) in the canonical registry.
  2. It is on the bake-in allowlist (zero, dead, OP Stack predeploys,
     well-known Anvil dev wallets, etc.).
  3. The line itself or one of the preceding non-blank lines (within
     ``LOOKBACK_LINES``, stopping at the first blank line) contains a
     known marker keyword (case-insensitive): ``stale``, ``hardcoded``,
     ``redeploy``, or ``allowlist:``. The intent is that a human has
     knowingly parked a dead address there awaiting redeploy and tagged
     it so it shows up in audits.

Usage:
  python3 scripts/check_no_stale_addresses.py
  python3 scripts/check_no_stale_addresses.py --paths frontend/src backend/swap-oracle/src
  python3 scripts/check_no_stale_addresses.py --json     # machine-readable output

Exits 0 when every hex address in the scanned tree is canonical or
explicitly allowlisted, 1 otherwise -- letting CI block stale references
that drift away from broadcast+chain truth.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent

DEFAULT_PATHS = ["frontend/src"]

EXCLUDE_DIR_NAMES = {
    "node_modules",
    "dist",
    "build",
    ".next",
    "coverage",
    "out",
    "cache",
    "broadcast",
    "lib",
    ".git",
    "archive",
    "__pycache__",
}

INCLUDE_EXTS = {".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json"}

ADDR_RE = re.compile(r"0x[a-fA-F0-9]{40}")

# Backward window for STALE/redeploy/hardcoded markers. Stops at first
# blank line (treated as a section break).
LOOKBACK_LINES = 20

# Markers that authorise a non-canonical hex literal. Case-insensitive
# substring match against the line text.
STALE_MARKERS = ("stale", "hardcoded", "redeploy", "allowlist:")

# Always-OK addresses that do not need to live in the registry.
BAKED_IN_ALLOWLIST = {
    # Sentinel zero / dead
    "0x0000000000000000000000000000000000000000",
    "0x000000000000000000000000000000000000dead",
    # Anvil default mnemonic test wallets — used in dev tooling and tests.
    "0xf39fd6e51aad88f6f4ce6ab8827279cffFb92266".lower(),  # Anvil[0]
    "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",            # Anvil[1]
    "0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc",            # Anvil[2]
    "0x90f79bf6eb2c4f870365e785982e1f101e93b906",            # Anvil[3]
}

# OP Stack predeploys live in 0x4200…00 – 0x4200…FF.
OP_PREDEPLOY_PREFIX = "0x42000000000000000000000000000000000000"


def load_canonical(repo_root: Path) -> set[str]:
    """Return the union of addresses in op-stack/addresses.json and
    .autobuilder/addresses.env, lower-cased."""
    addrs: set[str] = set()
    json_path = repo_root / "op-stack" / "addresses.json"
    if json_path.exists():
        try:
            data = json.loads(json_path.read_text())
            for v in (data.get("contracts") or {}).values():
                if isinstance(v, str) and ADDR_RE.fullmatch(v):
                    addrs.add(v.lower())
        except json.JSONDecodeError as exc:
            print(
                f"[no-stale-addresses] WARN: failed to parse {json_path}: {exc}",
                file=sys.stderr,
            )

    env_path = repo_root / ".autobuilder" / "addresses.env"
    if env_path.exists():
        for line in env_path.read_text().splitlines():
            stripped = line.strip()
            if not stripped or stripped.startswith("#") or "=" not in stripped:
                continue
            _key, _, val = stripped.partition("=")
            val = val.strip().strip('"').strip("'")
            if ADDR_RE.fullmatch(val):
                addrs.add(val.lower())

    return addrs


def is_allowed_address(addr: str, canonical: set[str]) -> bool:
    """Return True if ``addr`` is canonical, on the bake-in list, or in
    the OP Stack predeploy range."""
    if addr in canonical:
        return True
    if addr in BAKED_IN_ALLOWLIST:
        return True
    if addr.startswith(OP_PREDEPLOY_PREFIX):
        return True
    return False


def line_or_window_marks_stale(lines: list[str], idx: int) -> bool:
    """Return True if line ``idx`` (0-based) or any preceding non-blank
    line within ``LOOKBACK_LINES`` contains a stale marker.

    Blank lines act as a hard stop -- a fresh paragraph means the marker
    above no longer applies.
    """
    target_lc = lines[idx].lower()
    if any(m in target_lc for m in STALE_MARKERS):
        return True
    start = max(0, idx - LOOKBACK_LINES)
    for j in range(idx - 1, start - 1, -1):
        line = lines[j]
        if not line.strip():
            return False
        if any(m in line.lower() for m in STALE_MARKERS):
            return True
    return False


def walk_paths(paths: list[Path]) -> list[Path]:
    out: list[Path] = []
    for root in paths:
        if root.is_file():
            out.append(root)
            continue
        if not root.is_dir():
            continue
        for p in root.rglob("*"):
            if not p.is_file():
                continue
            if p.suffix.lower() not in INCLUDE_EXTS:
                continue
            if any(seg in EXCLUDE_DIR_NAMES for seg in p.parts):
                continue
            out.append(p)
    return out


def scan_file(
    path: Path, canonical: set[str]
) -> list[tuple[Path, int, str, str]]:
    """Return a list of (path, lineno, addr, line) tuples for stale hits."""
    try:
        text = path.read_text(errors="replace")
    except OSError:
        return []
    lines = text.splitlines()
    hits: list[tuple[Path, int, str, str]] = []
    for idx, raw_line in enumerate(lines):
        for m in ADDR_RE.finditer(raw_line):
            addr = m.group(0).lower()
            if is_allowed_address(addr, canonical):
                continue
            if line_or_window_marks_stale(lines, idx):
                continue
            hits.append((path, idx + 1, addr, raw_line.rstrip()))
    return hits


def main() -> int:
    ap = argparse.ArgumentParser(
        description="Fail when source trees reference hex addresses that are "
        "neither canonical (op-stack/addresses.json + .autobuilder/addresses.env) "
        "nor explicitly tagged STALE/hardcoded/redeploy."
    )
    ap.add_argument(
        "--paths",
        nargs="*",
        default=None,
        help=f"Override scan paths (default: {DEFAULT_PATHS})",
    )
    ap.add_argument(
        "--json",
        action="store_true",
        help="Emit JSON instead of human-readable output",
    )
    args = ap.parse_args()

    canonical = load_canonical(REPO_ROOT)
    if not canonical:
        print(
            "[no-stale-addresses] ERROR: canonical registry is empty -- "
            "refusing to scan. Run scripts/refresh-addresses.py first.",
            file=sys.stderr,
        )
        return 2

    scan_roots = [REPO_ROOT / p for p in (args.paths or DEFAULT_PATHS)]
    files = walk_paths(scan_roots)

    all_hits: list[tuple[Path, int, str, str]] = []
    for f in files:
        all_hits.extend(scan_file(f, canonical))

    def _rel(p: Path) -> str:
        # relative_to raises ValueError for paths outside REPO_ROOT (e.g.
        # when --paths points at a tmpdir for testing). Fall back to the
        # absolute path so the script never crashes mid-report.
        try:
            return str(p.relative_to(REPO_ROOT))
        except ValueError:
            return str(p)

    if args.json:
        out = [
            {
                "path": _rel(p),
                "line": ln,
                "address": addr,
                "content": content,
            }
            for (p, ln, addr, content) in all_hits
        ]
        print(
            json.dumps(
                {
                    "scanned_files": len(files),
                    "canonical_addresses": len(canonical),
                    "hit_count": len(out),
                    "hits": out,
                },
                indent=2,
            )
        )
    else:
        for p, ln, addr, content in all_hits:
            print(f"{_rel(p)}:{ln}: {addr}\n    {content.strip()}")
        if all_hits:
            files_with_hits = len({h[0] for h in all_hits})
            print(
                f"\n[no-stale-addresses] FAIL: {len(all_hits)} stale hex address(es) "
                f"in {files_with_hits} file(s) across {len(files)} scanned file(s).",
                file=sys.stderr,
            )
            print(
                "[no-stale-addresses] Fix by either (a) adding the contract to "
                "scripts/refresh-addresses.py SYMBOL_MAP and re-running it, or "
                "(b) tagging the line with `// STALE: …` so it is visible in audits.",
                file=sys.stderr,
            )
        else:
            print(
                f"[no-stale-addresses] OK -- scanned {len(files)} file(s); "
                f"every hex address is canonical or explicitly tagged."
            )

    return 1 if all_hits else 0


if __name__ == "__main__":
    sys.exit(main())
