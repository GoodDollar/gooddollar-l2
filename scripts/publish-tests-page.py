#!/usr/bin/env python3
"""Publish the versioned E2E registry to the static goodclaw.org/tests portal."""
from __future__ import annotations

import html
import json
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REGISTRY_PATH = ROOT / "frontend" / "src" / "lib" / "tests" / "e2eRegistry.json"
VERSIONED_DIR = ROOT / "docs" / "tests"
DEFAULT_PUBLIC_DIR = Path("/home/goodclaw/goodclaw-landing/tests")


def render(registry: dict) -> str:
    apps = registry["apps"]
    critical = sum(1 for app in apps if app.get("critical"))
    cards = "\n".join(render_card(app) for app in apps)
    command = html.escape(registry["playwright"]["command"])
    version = html.escape(registry["version"])
    updated = html.escape(registry["updatedAt"])
    return f"""<!doctype html>
<html lang=\"en\">
<head>
  <meta charset=\"utf-8\" />
  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />
  <title>GoodDollar L2 E2E Tests</title>
  <style>
    :root {{ color-scheme: dark; --green:#00B0A0; --bg:#071311; --card:#101d1b; --muted:#9ca3af; --border:#263633; }}
    * {{ box-sizing: border-box; }}
    body {{ margin:0; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif; background: radial-gradient(circle at top, rgba(0,176,160,.16), transparent 34rem), var(--bg); color:#fff; }}
    main {{ width:min(1180px, calc(100% - 32px)); margin:0 auto; padding:48px 0; }}
    .hero {{ border:1px solid rgba(0,176,160,.24); background:rgba(0,176,160,.07); border-radius:28px; padding:28px; display:flex; justify-content:space-between; gap:24px; flex-wrap:wrap; }}
    .eyebrow {{ color:var(--green); font-size:12px; font-weight:800; letter-spacing:.25em; text-transform:uppercase; }}
    h1 {{ margin:.5rem 0; font-size:clamp(32px,5vw,56px); line-height:1; }}
    p {{ color:#d1d5db; line-height:1.55; }}
    code, .mono {{ font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }}
    .stats {{ background:rgba(16,29,27,.8); border:1px solid var(--border); border-radius:20px; padding:18px; min-width:240px; }}
    .grid {{ display:grid; grid-template-columns: repeat(auto-fit, minmax(280px,1fr)); gap:16px; margin-top:24px; }}
    .card {{ background:rgba(16,29,27,.82); border:1px solid var(--border); border-radius:20px; padding:18px; }}
    .card h3 {{ margin:0; font-size:18px; }}
    .route {{ color:var(--green); text-decoration:none; font-size:12px; word-break:break-all; }}
    .badge {{ display:inline-flex; border-radius:999px; padding:5px 8px; font-size:10px; font-weight:800; letter-spacing:.08em; text-transform:uppercase; background:rgba(255,255,255,.08); color:#d1d5db; }}
    .badge.critical {{ background:rgba(0,176,160,.12); color:var(--green); }}
    ul {{ padding-left:0; list-style:none; margin:14px 0 0; }}
    li {{ color:#d1d5db; margin:8px 0; display:flex; gap:8px; font-size:14px; }}
    li span:first-child {{ color:var(--green); }}
    .command {{ white-space:pre-wrap; background:#020706; color:var(--green); padding:14px; border-radius:14px; border:1px solid var(--border); overflow:auto; }}
    .section-title {{ margin:32px 0 8px; }}
    .small {{ color:var(--muted); font-size:13px; }}
  </style>
</head>
<body>
  <main>
    <section class=\"hero\">
      <div>
        <div class=\"eyebrow\">GoodDollar L2 QA</div>
        <h1>E2E Test Registry</h1>
        <p>Versioned, browsable Playwright automation for every GoodDollar L2 app route. Source of truth: <span class=\"mono\">frontend/src/lib/tests/e2eRegistry.json</span>.</p>
      </div>
      <div class=\"stats\">
        <div class=\"small\">Version</div>
        <div class=\"mono\">{version}</div>
        <br />
        <div class=\"small\">Updated</div>
        <div class=\"mono\">{updated}</div>
        <br />
        <div class=\"small\">Coverage</div>
        <div class=\"mono\">{len(apps)} routes · {critical} critical</div>
      </div>
    </section>

    <h2 class=\"section-title\">Sequential Playwright command</h2>
    <div class=\"command\">{command}</div>

    <h2 class=\"section-title\">App coverage</h2>
    <div class=\"grid\">{cards}</div>
  </main>
</body>
</html>
"""


def render_card(app: dict) -> str:
    assertions = "".join(f"<li><span>✓</span><span>{html.escape(item)}</span></li>" for item in app["assertions"])
    badge_class = "badge critical" if app.get("critical") else "badge"
    badge_text = "critical" if app.get("critical") else app["kind"]
    return f"""
      <article class=\"card\">
        <div style=\"display:flex;justify-content:space-between;gap:12px;align-items:flex-start\">
          <div>
            <h3>{html.escape(app['name'])}</h3>
            <a class=\"route\" href=\"https://goodswap.goodclaw.org{html.escape(app['route'])}\">{html.escape(app['route'])}</a>
          </div>
          <span class=\"{badge_class}\">{html.escape(badge_text)}</span>
        </div>
        <ul>{assertions}</ul>
        <p class=\"small\">Owner: {html.escape(app['owner'])}</p>
      </article>"""


def main() -> None:
    registry = json.loads(REGISTRY_PATH.read_text())
    html_doc = render(registry)
    VERSIONED_DIR.mkdir(parents=True, exist_ok=True)
    (VERSIONED_DIR / "index.html").write_text(html_doc)
    (VERSIONED_DIR / "e2eRegistry.json").write_text(json.dumps(registry, indent=2) + "\n")

    public_dir = Path(__import__("os").environ.get("GOODCLAW_TESTS_PUBLIC_DIR", DEFAULT_PUBLIC_DIR))
    if public_dir.is_absolute():
        public_dir.mkdir(parents=True, exist_ok=True)
        shutil.copy2(VERSIONED_DIR / "index.html", public_dir / "index.html")
        shutil.copy2(VERSIONED_DIR / "e2eRegistry.json", public_dir / "e2eRegistry.json")
        print(f"published {len(registry['apps'])} tests to {public_dir}")
    else:
        print(f"skipped public copy for non-absolute GOODCLAW_TESTS_PUBLIC_DIR={public_dir}")


if __name__ == "__main__":
    main()
