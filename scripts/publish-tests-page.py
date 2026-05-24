#!/usr/bin/env python3
"""Publish the versioned all-tests registry to the static goodclaw.org/tests portal."""
from __future__ import annotations

import html
import json
import os
import shutil
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
E2E_REGISTRY_PATH = ROOT / "frontend" / "src" / "lib" / "tests" / "e2eRegistry.json"
ALL_REGISTRY_PATH = ROOT / "frontend" / "src" / "lib" / "tests" / "allTestsRegistry.json"
VERSIONED_DIR = ROOT / "docs" / "tests"
DEFAULT_PUBLIC_DIR = Path("/home/goodclaw/goodclaw-landing/tests")
GREEN = "#13C636"


def ensure_all_tests_registry() -> None:
    subprocess.run([str(ROOT / "scripts" / "generate-tests-registry.py")], cwd=ROOT, check=True)


def esc(value: object) -> str:
    return html.escape(str(value))


def render(e2e: dict, all_tests: dict) -> str:
    apps = e2e["apps"]
    categories = all_tests["categories"]
    commands = "\n".join(render_command(item) for item in all_tests["commands"])
    category_cards = "\n".join(render_category(category) for category in categories)
    route_cards = "\n".join(render_route_card(app) for app in apps)
    summary = all_tests["summary"]
    return f"""<!doctype html>
<html lang=\"en\">
<head>
  <meta charset=\"utf-8\" />
  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />
  <title>GoodDollar L2 All Tests</title>
  <style>
    :root {{ color-scheme: dark; --green:{GREEN}; --bg:#071311; --card:#101d1b; --muted:#9ca3af; --border:#263633; }}
    * {{ box-sizing: border-box; }}
    body {{ margin:0; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif; background: radial-gradient(circle at top, rgba(19,198,54,.14), transparent 34rem), var(--bg); color:#fff; }}
    main {{ width:min(1280px, calc(100% - 32px)); margin:0 auto; padding:48px 0; }}
    .hero {{ border:1px solid rgba(19,198,54,.24); background:rgba(19,198,54,.07); border-radius:28px; padding:28px; display:flex; justify-content:space-between; gap:24px; flex-wrap:wrap; box-shadow:0 24px 80px rgba(19,198,54,.1); }}
    .eyebrow {{ color:var(--green); font-size:12px; font-weight:800; letter-spacing:.25em; text-transform:uppercase; }}
    h1 {{ margin:.5rem 0; font-size:clamp(32px,5vw,56px); line-height:1; }}
    h2 {{ margin:0; font-size:28px; }}
    p {{ color:#d1d5db; line-height:1.55; }}
    code, .mono {{ font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }}
    .stats {{ display:grid; grid-template-columns:repeat(2,minmax(120px,1fr)); gap:12px; min-width:min(360px,100%); }}
    .stat, .card, details, .command {{ background:rgba(16,29,27,.82); border:1px solid var(--border); border-radius:20px; padding:18px; }}
    .stat .value {{ margin-top:4px; font-size:28px; font-weight:800; }}
    .small {{ color:var(--muted); font-size:13px; }}
    .grid {{ display:grid; grid-template-columns: repeat(auto-fit, minmax(300px,1fr)); gap:16px; margin-top:18px; }}
    .commands {{ display:grid; grid-template-columns: repeat(auto-fit, minmax(320px,1fr)); gap:12px; margin-top:16px; }}
    .command code {{ color:var(--green); word-break:break-all; }}
    section {{ margin-top:32px; }}
    summary {{ cursor:pointer; list-style:none; }}
    summary::-webkit-details-marker {{ display:none; }}
    .file-list {{ max-height:360px; overflow:auto; margin-top:14px; padding:12px; border:1px solid rgba(255,255,255,.07); border-radius:14px; background:rgba(0,0,0,.22); }}
    ul {{ padding-left:0; list-style:none; margin:0; }}
    li {{ color:#d1d5db; margin:6px 0; font-size:12px; word-break:break-all; }}
    .route {{ color:var(--green); text-decoration:none; font-size:12px; word-break:break-all; }}
    .badge {{ display:inline-flex; border-radius:999px; padding:5px 8px; font-size:10px; font-weight:800; letter-spacing:.08em; text-transform:uppercase; background:rgba(255,255,255,.08); color:#d1d5db; }}
    .badge.critical {{ background:rgba(19,198,54,.12); color:var(--green); }}
    .card h3 {{ margin:0; font-size:18px; }}
    .checks li {{ display:flex; gap:8px; font-size:14px; }}
    .checks li span:first-child {{ color:var(--green); }}
  </style>
</head>
<body>
  <main>
    <section class=\"hero\">
      <div>
        <div class=\"eyebrow\">GoodDollar L2 QA</div>
        <h1>All tests, one page</h1>
        <p>Full source-controlled test inventory: Vitest, Playwright browser E2E, Foundry contracts, backend services, SDK tests, and quality/performance checks.</p>
        <p class=\"small mono\">Source: frontend/src/lib/tests/allTestsRegistry.json · {esc(all_tests['updatedAt'])}</p>
      </div>
      <div class=\"stats\">
        <div class=\"stat\"><div class=\"small\">Total files</div><div class=\"value mono\">{summary['files']}</div></div>
        <div class=\"stat\"><div class=\"small\">Playwright</div><div class=\"value mono\">{summary['playwrightSpecs']}</div></div>
        <div class=\"stat\"><div class=\"small\">Vitest</div><div class=\"value mono\">{summary['frontendVitestFiles']}</div></div>
        <div class=\"stat\"><div class=\"small\">Contracts</div><div class=\"value mono\">{summary['contractTests']}</div></div>
      </div>
    </section>

    <section>
      <div class=\"eyebrow\">Commands</div>
      <h2>Main test commands</h2>
      <div class=\"commands\">{commands}</div>
    </section>

    <section>
      <div class=\"eyebrow\">Inventory</div>
      <h2>Test suites by runner</h2>
      <div class=\"grid\">{category_cards}</div>
    </section>

    <section>
      <div class=\"eyebrow\">Playwright route coverage</div>
      <h2>{len(apps)} app routes · {sum(1 for app in apps if app.get('critical'))} critical</h2>
      <div class=\"grid\">{route_cards}</div>
    </section>
  </main>
</body>
</html>
"""


def render_command(item: dict) -> str:
    return f"<div class=\"command\"><div class=\"small\">{esc(item['label'])}</div><code>{esc(item['command'])}</code></div>"


def render_category(category: dict) -> str:
    files = "".join(f"<li>{esc(path)}</li>" for path in category["files"])
    meta = []
    if category.get("config"):
        meta.append(f"Config: <span class=\"mono\">{esc(category['config'])}</span>")
    if category.get("report"):
        meta.append(f"Report: <span class=\"mono\">{esc(category['report'])}</span>")
    meta_html = f"<p class=\"small\">{' · '.join(meta)}</p>" if meta else ""
    quick = f"<p class=\"small mono\">Quick: {esc(category['quickCommand'])}</p>" if category.get("quickCommand") else ""
    return f"""
      <details>
        <summary>
          <div class=\"small\">{esc(category['kind'])}</div>
          <h3>{esc(category['title'])}</h3>
          <p class=\"mono\" style=\"color:var(--green);word-break:break-all\">{esc(category['command'])}</p>
          {quick}
          <span class=\"badge critical\">{len(category['files'])} files</span>
        </summary>
        {meta_html}
        <div class=\"file-list\"><ul>{files}</ul></div>
      </details>"""


def render_route_card(app: dict) -> str:
    assertions = "".join(f"<li><span>✓</span><span>{esc(item)}</span></li>" for item in app["assertions"])
    badge_class = "badge critical" if app.get("critical") else "badge"
    badge_text = "critical" if app.get("critical") else app["kind"]
    return f"""
      <article class=\"card\">
        <div style=\"display:flex;justify-content:space-between;gap:12px;align-items:flex-start\">
          <div>
            <h3>{esc(app['name'])}</h3>
            <a class=\"route\" href=\"https://goodswap.goodclaw.org{esc(app['route'])}\">{esc(app['route'])}</a>
          </div>
          <span class=\"{badge_class}\">{esc(badge_text)}</span>
        </div>
        <ul class=\"checks\">{assertions}</ul>
        <p class=\"small\">Owner: {esc(app['owner'])}</p>
      </article>"""


def main() -> None:
    ensure_all_tests_registry()
    e2e = json.loads(E2E_REGISTRY_PATH.read_text())
    all_tests = json.loads(ALL_REGISTRY_PATH.read_text())
    html_doc = "\n".join(line.rstrip() for line in render(e2e, all_tests).splitlines()) + "\n"
    VERSIONED_DIR.mkdir(parents=True, exist_ok=True)
    (VERSIONED_DIR / "index.html").write_text(html_doc)
    (VERSIONED_DIR / "e2eRegistry.json").write_text(json.dumps(e2e, indent=2) + "\n")
    (VERSIONED_DIR / "allTestsRegistry.json").write_text(json.dumps(all_tests, indent=2) + "\n")

    public_dir = Path(os.environ.get("GOODCLAW_TESTS_PUBLIC_DIR", DEFAULT_PUBLIC_DIR))
    if public_dir.is_absolute():
        public_dir.mkdir(parents=True, exist_ok=True)
        shutil.copy2(VERSIONED_DIR / "index.html", public_dir / "index.html")
        shutil.copy2(VERSIONED_DIR / "e2eRegistry.json", public_dir / "e2eRegistry.json")
        shutil.copy2(VERSIONED_DIR / "allTestsRegistry.json", public_dir / "allTestsRegistry.json")
        print(f"published {all_tests['summary']['files']} test files to {public_dir}")
    else:
        print(f"skipped public copy for non-absolute GOODCLAW_TESTS_PUBLIC_DIR={public_dir}")


if __name__ == "__main__":
    main()
