#!/usr/bin/env python3
"""Validate links in repository documentation.

Used by the testnet-readiness doc checkpoints (iter 5, 10, 15, ...).
Stdlib-only on purpose so any agent or CI environment can run it without
extra dependencies.

Usage:

    python3 scripts/check-doc-links.py [DOC ...]

If no doc paths are given, defaults to README.md, docs/TESTNET_README.md,
and docs/ARCHITECTURE.md (relative to repo root).

Rules:

- Markdown links `[text](target)` and bare `https?://...` URLs are extracted.
- mailto: and pure-anchor (`#section`) links are skipped.
- Relative paths must exist on disk. A trailing `#anchor` is stripped.
- http(s) URLs are fetched: HEAD first, fallback to GET on 4xx or socket
  errors. 2xx and 3xx count as OK. Anything else is broken.
- Exits 0 only if every link is OK.
"""
from __future__ import annotations

import json
import re
import socket
import ssl
import sys
import urllib.error
import urllib.request
from pathlib import Path
from typing import Iterable
from urllib.parse import unquote, urlparse

ROOT = Path(__file__).resolve().parents[1]

DEFAULT_DOCS = [
    "README.md",
    "docs/TESTNET_README.md",
    "docs/ARCHITECTURE.md",
]

USER_AGENT = "GoodClaw-doc-link-check/1.0"
TIMEOUT = 8.0

MD_LINK = re.compile(r"\[[^\]]*\]\(\s*(<)?([^)\s'\"<>]+)(?:>)?(?:\s+\"[^\"]*\")?\s*\)")
BARE_URL = re.compile(r"https?://[^\s)`'\"<>]+")


def extract_links(text: str) -> list[str]:
    """Pull markdown links and bare URLs out of `text`."""
    seen: list[str] = []
    inside_fence = False
    for line in text.splitlines():
        # Skip fenced code blocks entirely; they routinely contain
        # placeholders that are not real links.
        if line.lstrip().startswith("```"):
            inside_fence = not inside_fence
            continue
        if inside_fence:
            continue
        for match in MD_LINK.finditer(line):
            seen.append(match.group(2))
        for match in BARE_URL.finditer(line):
            url = match.group(0).rstrip(".,;:")
            seen.append(url)
    return seen


def normalize(link: str) -> str:
    link = link.strip()
    # markdown angle-bracket form `<https://...>`
    if link.startswith("<") and link.endswith(">"):
        link = link[1:-1]
    return link


def is_skippable(link: str) -> bool:
    if not link:
        return True
    if link.startswith("#"):
        return True
    if link.startswith("mailto:"):
        return True
    if link.startswith("tel:"):
        return True
    return False


def check_relative(link: str, source: Path) -> tuple[bool, str]:
    target = link.split("#", 1)[0]
    target = target.split("?", 1)[0]
    # URL-decode so paths like ../foo/%28app%29/page.tsx resolve to (app).
    # Next.js route groups use literal parentheses in folder names which
    # collide with markdown link syntax, so authors percent-encode them.
    target = unquote(target)
    if not target:
        return True, "anchor-only"
    candidate = (source.parent / target).resolve()
    # Allow either repo-root-relative or doc-relative.
    if candidate.exists():
        return True, "exists"
    root_candidate = (ROOT / target).resolve()
    if root_candidate.exists():
        return True, "exists-from-root"
    return False, f"missing file: {target}"


def looks_like_rpc(url: str) -> bool:
    parsed = urlparse(url)
    host = (parsed.hostname or "").lower()
    path = (parsed.path or "").lower()
    return host.startswith("rpc.") or path.endswith("/rpc") or "/rpc/" in path


def rpc_probe(url: str) -> tuple[bool, str]:
    """JSON-RPC eth_chainId probe.

    JSON-RPC endpoints typically reject GET/HEAD with 400/405, so a normal
    HTTP check produces false positives. This sends a real eth_chainId
    request the same way clients (and scripts/update-testnet-readme.py) do.
    """
    ctx = ssl.create_default_context()
    payload = json.dumps(
        {"jsonrpc": "2.0", "method": "eth_chainId", "params": [], "id": 1}
    ).encode()
    headers = {
        "User-Agent": USER_AGENT,
        "Content-Type": "application/json",
        "Accept": "application/json",
    }
    req = urllib.request.Request(url, data=payload, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT, context=ctx) as resp:
            body = resp.read().decode("utf-8", errors="replace")
            try:
                parsed = json.loads(body)
            except json.JSONDecodeError:
                return False, f"HTTP {resp.status} non-JSON body"
            if "result" in parsed:
                return True, f"HTTP {resp.status} chainId={parsed['result']}"
            if "error" in parsed:
                return False, f"HTTP {resp.status} JSON-RPC error: {parsed['error']}"
            return False, f"HTTP {resp.status} unexpected body"
    except (urllib.error.URLError, socket.timeout, ConnectionError, OSError) as e:
        return False, f"{type(e).__name__}: {e}"


def http_check(url: str) -> tuple[bool, str]:
    ctx = ssl.create_default_context()
    headers = {"User-Agent": USER_AGENT, "Accept": "*/*"}

    def attempt(method: str) -> tuple[bool, str]:
        req = urllib.request.Request(url, headers=headers, method=method)
        try:
            with urllib.request.urlopen(req, timeout=TIMEOUT, context=ctx) as resp:
                code = resp.status
                if 200 <= code < 400:
                    return True, f"HTTP {code}"
                return False, f"HTTP {code}"
        except urllib.error.HTTPError as e:
            if 200 <= e.code < 400:
                return True, f"HTTP {e.code}"
            return False, f"HTTP {e.code}"
        except (urllib.error.URLError, socket.timeout, ConnectionError, OSError) as e:
            return False, f"{type(e).__name__}: {e}"

    ok, why = attempt("HEAD")
    if ok:
        return ok, why
    # Some sites reject HEAD with 403/405; try GET.
    ok, why = attempt("GET")
    if ok:
        return ok, why
    # JSON-RPC endpoints commonly reject HEAD/GET with 400/405. Probe properly.
    if looks_like_rpc(url):
        rpc_ok, rpc_why = rpc_probe(url)
        if rpc_ok:
            return True, f"rpc-probe {rpc_why}"
        return False, f"rpc-probe failed: {rpc_why}"
    return ok, why


def check_doc(path: Path) -> list[tuple[str, bool, str]]:
    """Return list of (link, ok, detail) for `path`."""
    text = path.read_text(encoding="utf-8")
    links = [normalize(link) for link in extract_links(text)]
    # de-dup while preserving order
    deduped: list[str] = []
    seen: set[str] = set()
    for link in links:
        if link in seen:
            continue
        seen.add(link)
        deduped.append(link)

    results: list[tuple[str, bool, str]] = []
    for link in deduped:
        if is_skippable(link):
            continue
        if link.startswith(("http://", "https://")):
            ok, detail = http_check(link)
        else:
            ok, detail = check_relative(link, path)
        results.append((link, ok, detail))
    return results


def main(argv: Iterable[str]) -> int:
    docs = list(argv) or DEFAULT_DOCS
    overall_broken = 0
    overall_checked = 0
    failures: list[str] = []

    for doc in docs:
        path = (ROOT / doc) if not Path(doc).is_absolute() else Path(doc)
        if not path.exists():
            print(f"SKIP {doc} (file not found)")
            continue
        print(f"== {doc} ==")
        results = check_doc(path)
        for link, ok, detail in results:
            overall_checked += 1
            tag = "OK    " if ok else "BROKEN"
            print(f"  {tag} {link}  ({detail})")
            if not ok:
                overall_broken += 1
                failures.append(f"{doc}: {link} -> {detail}")

    print()
    print(f"checked={overall_checked} broken={overall_broken}")
    if overall_broken:
        print("Broken links:")
        for line in failures:
            print(f"  - {line}")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
