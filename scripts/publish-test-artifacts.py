#!/usr/bin/env python3
"""Publish browsable, public test artifacts for the GoodDollar L2 tests page.

The artifact portal intentionally publishes only test outputs that are already
local/public-testnet evidence: Playwright screenshots/reports and Foundry
broadcast transaction JSON. It does not copy .env files, node_modules, caches,
or source worktrees.
"""
from __future__ import annotations

import html
import json
import os
import re
import shutil
import urllib.parse
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_PUBLIC_ROOT = Path("/home/goodclaw/goodclaw-landing/tests/artifacts")
DOCS_REGISTRY = ROOT / "docs" / "tests" / "artifactRegistry.json"
FRONTEND_REGISTRY = ROOT / "frontend" / "src" / "lib" / "tests" / "artifactRegistry.json"
PUBLIC_BASE_URL = os.environ.get("GOODCLAW_TESTS_PUBLIC_BASE_URL", "https://goodclaw.org/tests/artifacts")
EXPLORER_TX_BASE_URL = os.environ.get("GOODCHAIN_EXPLORER_TX_BASE_URL", "https://explorer.goodclaw.org/tx")
GREEN = "#13C636"

IMAGE_ROOTS = [
    "frontend/playwright-report/data",
    "frontend/e2e/screenshots",
    ".playwright-test-results",
    "docs/screenshots",
    "docs/testnet",
    ".autobuilder/screenshots",
    ".autobuilder/review-screenshots",
    ".autobuilder/iter23-screenshots",
    ".autobuilder/iter36-screenshots",
]
EVIDENCE_ROOTS = ["docs/evidence", "docs/security", "docs/testnet"]
IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp"}
TX_HASH_RE = re.compile(r"^0x[a-fA-F0-9]{64}$")


def esc(value: object) -> str:
    return html.escape(str(value))


def public_root() -> Path:
    return Path(os.environ.get("GOODCLAW_TESTS_ARTIFACTS_DIR", DEFAULT_PUBLIC_ROOT))


def rel(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def artifact_url(*parts: str) -> str:
    encoded = "/".join(urllib.parse.quote(part.strip("/")) for part in parts if part)
    return f"{PUBLIC_BASE_URL.rstrip('/')}/{encoded}" if encoded else PUBLIC_BASE_URL.rstrip("/")


def safe_copy(src: Path, dst: Path) -> None:
    dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, dst)


def discover_images() -> list[dict[str, Any]]:
    images: list[dict[str, Any]] = []
    for root_name in IMAGE_ROOTS:
        root = ROOT / root_name
        if not root.exists():
            continue
        for src in sorted(root.rglob("*")):
            if not src.is_file() or src.suffix.lower() not in IMAGE_EXTENSIONS:
                continue
            source = rel(src)
            public_path = f"files/{source}"
            images.append(
                {
                    "source": source,
                    "filename": src.name,
                    "sizeBytes": src.stat().st_size,
                    "publicPath": public_path,
                    "url": artifact_url("playwright-images", public_path),
                }
            )
    return images


def discover_evidence_json() -> list[Path]:
    files: list[Path] = []
    for root_name in EVIDENCE_ROOTS:
        root = ROOT / root_name
        if root.exists():
            files.extend(path for path in root.rglob("*.json") if path.is_file())
    return sorted(files)


def extract_hashes(value: Any) -> list[str]:
    hashes: list[str] = []
    if isinstance(value, dict):
        for key, item in value.items():
            if isinstance(item, str) and ("hash" in key.lower() or key.lower() in {"tx", "txid"}) and TX_HASH_RE.match(item):
                hashes.append(item)
            hashes.extend(extract_hashes(item))
    elif isinstance(value, list):
        for item in value:
            hashes.extend(extract_hashes(item))
    elif isinstance(value, str) and TX_HASH_RE.match(value):
        hashes.append(value)
    return hashes


def discover_transactions() -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    tx_files: list[dict[str, Any]] = []
    tx_rows: list[dict[str, Any]] = []
    files = sorted((ROOT / "broadcast").rglob("*.json")) if (ROOT / "broadcast").exists() else []
    files += discover_evidence_json()
    seen_files: set[str] = set()
    seen_rows: set[tuple[str, str]] = set()
    for src in files:
        source = rel(src)
        if source in seen_files:
            continue
        seen_files.add(source)
        public_path = f"files/{source}"
        hashes: list[str] = []
        chain_id: str | int | None = None
        try:
            data = json.loads(src.read_text())
            chain_id = data.get("chain") or data.get("chainId") if isinstance(data, dict) else None
            hashes = sorted(set(extract_hashes(data)))
        except Exception:
            data = None
        tx_files.append(
            {
                "source": source,
                "sizeBytes": src.stat().st_size,
                "hashCount": len(hashes),
                "chainId": chain_id,
                "publicPath": public_path,
                "url": artifact_url("blockchain-transactions", public_path),
            }
        )
        script = src.parts[src.parts.index("broadcast") + 1] if "broadcast" in src.parts else src.parent.name
        for tx_hash in hashes:
            key = (source, tx_hash)
            if key in seen_rows:
                continue
            seen_rows.add(key)
            tx_rows.append(
                {
                    "hash": tx_hash,
                    "script": script,
                    "source": source,
                    "chainId": chain_id,
                    "explorerUrl": f"{EXPLORER_TX_BASE_URL.rstrip('/')}/{tx_hash}",
                    "jsonUrl": artifact_url("blockchain-transactions", public_path),
                }
            )
    return tx_files, tx_rows


def copy_playwright_artifacts(out: Path, images: list[dict[str, Any]]) -> None:
    image_root = out / "playwright-images"
    for item in images:
        safe_copy(ROOT / item["source"], image_root / item["publicPath"])
    write_playwright_images_index(image_root, images)

    report_src = ROOT / "frontend" / "playwright-report"
    report_dst = out / "playwright-report"
    if report_src.exists():
        if report_dst.exists():
            shutil.rmtree(report_dst)
        shutil.copytree(report_src, report_dst)


def copy_transaction_artifacts(out: Path, tx_files: list[dict[str, Any]], tx_rows: list[dict[str, Any]]) -> None:
    tx_root = out / "blockchain-transactions"
    for item in tx_files:
        safe_copy(ROOT / item["source"], tx_root / item["publicPath"])
    (tx_root / "transactions.json").write_text(json.dumps(tx_rows, indent=2) + "\n")
    (tx_root / "files.json").write_text(json.dumps(tx_files, indent=2) + "\n")
    write_transactions_index(tx_root, tx_files, tx_rows)


def write_playwright_images_index(root: Path, images: list[dict[str, Any]]) -> None:
    cards = "\n".join(
        f"""
        <article class=\"card\">
          <a href=\"{esc(item['url'])}\"><img src=\"{esc(item['url'])}\" loading=\"lazy\" /></a>
          <a class=\"mono path\" href=\"{esc(item['url'])}\">{esc(item['source'])}</a>
          <div class=\"small\">{item['sizeBytes']:,} bytes</div>
        </article>"""
        for item in images
    )
    write_html(
        root / "index.html",
        "Playwright images",
        f"<p>{len(images)} screenshots/images from Playwright reports, e2e screenshot specs, and autobuilder visual reviews.</p><div class=\"grid images\">{cards}</div>",
    )


def write_transactions_index(root: Path, tx_files: list[dict[str, Any]], tx_rows: list[dict[str, Any]]) -> None:
    rows = "\n".join(
        f"""
        <tr>
          <td><a class=\"mono\" href=\"{esc(row['explorerUrl'])}\">{esc(row['hash'])}</a></td>
          <td>{esc(row['script'])}</td>
          <td>{esc(row.get('chainId') or '')}</td>
          <td><a class=\"mono\" href=\"{esc(row['jsonUrl'])}\">{esc(row['source'])}</a></td>
        </tr>"""
        for row in tx_rows[:2500]
    )
    files = "\n".join(
        f"<li><a class=\"mono\" href=\"{esc(item['url'])}\">{esc(item['source'])}</a> <span class=\"small\">· {item['hashCount']} tx hashes</span></li>"
        for item in tx_files
    )
    body = f"""
      <p>{len(tx_rows)} transaction hashes across {len(tx_files)} Foundry broadcast/evidence JSON files.</p>
      <p><a class=\"button\" href=\"{esc(artifact_url('blockchain-transactions', 'transactions.json'))}\">Download transactions.json</a></p>
      <h2>Transaction hashes</h2>
      <div class=\"table-wrap\"><table><thead><tr><th>Hash / explorer</th><th>Script</th><th>Chain</th><th>Broadcast JSON</th></tr></thead><tbody>{rows}</tbody></table></div>
      <h2>Broadcast/evidence JSON files</h2>
      <ul>{files}</ul>
    """
    write_html(root / "index.html", "Blockchain transactions", body)


def write_process_pages(out: Path, registry: dict[str, Any]) -> None:
    process_root = out / "process"
    for category in registry["processes"]:
        links = "\n".join(
            f"<li><a href=\"{esc(link['href'])}\">{esc(link['label'])}</a> <span class=\"small\">· {esc(link.get('description', ''))}</span></li>"
            for link in category["artifactLinks"]
        )
        files = "\n".join(f"<li class=\"mono\">{esc(path)}</li>" for path in category.get("sampleFiles", []))
        body = f"""
          <p>Artifact hub for <strong>{esc(category['title'])}</strong>.</p>
          <ul>{links}</ul>
          <h2>Sample test files</h2>
          <ul>{files}</ul>
        """
        write_html(process_root / f"{category['id']}.html", category["title"], body)


def write_root_index(out: Path, registry: dict[str, Any]) -> None:
    links = "\n".join(
        f"""
        <article class=\"card\">
          <h2>{esc(category['title'])}</h2>
          <p class=\"small\">{esc(category['kind'])}</p>
          <ul>{''.join(f'<li><a href=\"{esc(link["href"])}\">{esc(link["label"])}</a></li>' for link in category['artifactLinks'])}</ul>
        </article>"""
        for category in registry["processes"]
    )
    body = f"""
      <p>Public artifacts for GoodDollar L2 test processes: Playwright screenshots/reports and blockchain transaction broadcasts.</p>
      <p class=\"small\">Generated {esc(registry['updatedAt'])}. Images: {registry['summary']['playwrightImages']} · transaction files: {registry['summary']['transactionFiles']} · tx hashes: {registry['summary']['transactionHashes']}</p>
      <div class=\"grid\">{links}</div>
    """
    write_html(out / "index.html", "GoodDollar L2 test artifacts", body)


def write_html(path: Path, title: str, body: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    doc = f"""<!doctype html>
<html lang=\"en\">
<head>
  <meta charset=\"utf-8\" />
  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />
  <title>{esc(title)}</title>
  <style>
    :root {{ color-scheme: dark; --green:{GREEN}; --bg:#071311; --card:#101d1b; --muted:#9ca3af; --border:#263633; }}
    * {{ box-sizing:border-box; }}
    body {{ margin:0; font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,\"Segoe UI\",sans-serif; background:radial-gradient(circle at top,rgba(19,198,54,.14),transparent 34rem),var(--bg); color:#fff; }}
    main {{ width:min(1280px,calc(100% - 32px)); margin:0 auto; padding:44px 0; }}
    a {{ color:var(--green); }}
    .mono {{ font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace; }}
    .small {{ color:var(--muted); font-size:13px; }}
    .grid {{ display:grid; grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); gap:16px; }}
    .card {{ border:1px solid var(--border); border-radius:18px; background:rgba(16,29,27,.82); padding:16px; overflow:hidden; }}
    .images img {{ width:100%; max-height:260px; object-fit:cover; border-radius:12px; border:1px solid rgba(255,255,255,.08); }}
    .path {{ display:block; margin-top:10px; font-size:12px; word-break:break-all; }}
    .button {{ display:inline-flex; padding:10px 14px; border-radius:999px; background:rgba(19,198,54,.12); text-decoration:none; font-weight:700; }}
    .table-wrap {{ overflow:auto; border:1px solid var(--border); border-radius:16px; }}
    table {{ width:100%; border-collapse:collapse; font-size:12px; }}
    th,td {{ border-bottom:1px solid rgba(255,255,255,.08); padding:9px; text-align:left; vertical-align:top; }}
    li {{ margin:7px 0; word-break:break-all; }}
  </style>
</head>
<body><main><p><a href=\"https://goodclaw.org/tests/\">← All tests</a></p><h1>{esc(title)}</h1>{body}</main></body>
</html>
"""
    path.write_text("\n".join(line.rstrip() for line in doc.splitlines()) + "\n")


def build_registry(images: list[dict[str, Any]], tx_files: list[dict[str, Any]], tx_rows: list[dict[str, Any]]) -> dict[str, Any]:
    process_links = {
        "frontend-vitest": [
            ("Process artifact hub", artifact_url("process", "frontend-vitest.html"), "source files and runner command"),
            ("All tests JSON", "https://goodclaw.org/tests/allTestsRegistry.json", "full file inventory"),
        ],
        "playwright-e2e": [
            ("Process artifact hub", artifact_url("process", "playwright-e2e.html"), "Playwright-specific links"),
            ("Playwright HTML report", artifact_url("playwright-report", "index.html"), "latest copied report"),
            ("All Playwright images", artifact_url("playwright-images", "index.html"), f"{len(images)} screenshots/images"),
        ],
        "foundry-contracts": [
            ("Process artifact hub", artifact_url("process", "foundry-contracts.html"), "contract-test artifacts"),
            ("Blockchain transactions", artifact_url("blockchain-transactions", "index.html"), f"{len(tx_rows)} tx hashes"),
            ("Broadcast JSON files", artifact_url("blockchain-transactions", "files.json"), f"{len(tx_files)} JSON files"),
        ],
        "backend-node": [
            ("Process artifact hub", artifact_url("process", "backend-node.html"), "backend/service test paths"),
            ("All tests JSON", "https://goodclaw.org/tests/allTestsRegistry.json", "full file inventory"),
        ],
        "sdk-node": [
            ("Process artifact hub", artifact_url("process", "sdk-node.html"), "SDK test paths"),
            ("All tests JSON", "https://goodclaw.org/tests/allTestsRegistry.json", "full file inventory"),
        ],
        "quality-checks": [
            ("Process artifact hub", artifact_url("process", "quality-checks.html"), "quality/perf check artifacts"),
            ("Visual screenshots", artifact_url("playwright-images", "index.html"), f"{len(images)} screenshots/images"),
        ],
    }
    all_tests_path = ROOT / "frontend" / "src" / "lib" / "tests" / "allTestsRegistry.json"
    categories: list[dict[str, Any]] = []
    if all_tests_path.exists():
        try:
            all_tests = json.loads(all_tests_path.read_text())
            categories = all_tests.get("categories", [])
        except Exception:
            categories = []
    processes = []
    for category in categories:
        links = [
            {"label": label, "href": href, "description": description}
            for label, href, description in process_links.get(category.get("id"), [])
        ]
        processes.append(
            {
                "id": category.get("id"),
                "title": category.get("title"),
                "kind": category.get("kind"),
                "command": category.get("command"),
                "artifactLinks": links,
                "sampleFiles": category.get("files", [])[:80],
            }
        )
    return {
        "version": "test-artifacts-2026-05-24",
        "updatedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "publicBaseUrl": PUBLIC_BASE_URL,
        "summary": {
            "playwrightImages": len(images),
            "transactionFiles": len(tx_files),
            "transactionHashes": len(tx_rows),
        },
        "links": {
            "root": artifact_url(),
            "playwrightImages": artifact_url("playwright-images", "index.html"),
            "playwrightReport": artifact_url("playwright-report", "index.html"),
            "blockchainTransactions": artifact_url("blockchain-transactions", "index.html"),
            "transactionsJson": artifact_url("blockchain-transactions", "transactions.json"),
        },
        "processes": processes,
    }


def main() -> None:
    out = public_root()
    out.mkdir(parents=True, exist_ok=True)
    images = discover_images()
    tx_files, tx_rows = discover_transactions()
    copy_playwright_artifacts(out, images)
    copy_transaction_artifacts(out, tx_files, tx_rows)
    registry = build_registry(images, tx_files, tx_rows)
    write_process_pages(out, registry)
    write_root_index(out, registry)
    DOCS_REGISTRY.parent.mkdir(parents=True, exist_ok=True)
    FRONTEND_REGISTRY.parent.mkdir(parents=True, exist_ok=True)
    encoded = json.dumps(registry, indent=2) + "\n"
    DOCS_REGISTRY.write_text(encoded)
    FRONTEND_REGISTRY.write_text(encoded)
    print(
        f"published artifacts to {out}: {len(images)} images, {len(tx_files)} transaction files, {len(tx_rows)} tx hashes"
    )


if __name__ == "__main__":
    main()
