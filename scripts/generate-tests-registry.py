#!/usr/bin/env python3
"""Generate a browsable inventory of GoodDollar L2 test assets."""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "frontend" / "src" / "lib" / "tests" / "allTestsRegistry.json"
DOCS_OUT = ROOT / "docs" / "tests" / "allTestsRegistry.json"
ARTIFACT_REGISTRY = ROOT / "frontend" / "src" / "lib" / "tests" / "artifactRegistry.json"
PUBLIC_ARTIFACT_BASE_URL = "https://goodclaw.org/tests/artifacts"

EXCLUDE_PARTS = {
    ".git",
    ".next",
    ".next.e2e",
    ".next.runtime-dev",
    ".next.review",
    ".next.static-export",
    ".turbo",
    "artifacts",
    "broadcast",
    "cache",
    "coverage",
    "dist",
    "node_modules",
    "out",
    "playwright-report",
    "test-results",
}


def include_path(path: Path) -> bool:
    return not any(part in EXCLUDE_PARTS for part in path.parts)


def rel(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def matching_files(root: str, predicate) -> list[str]:
    base = ROOT / root
    if not base.exists():
        return []
    files = []
    for path in base.rglob("*"):
        if path.is_file() and include_path(path) and predicate(path):
            files.append(rel(path))
    return sorted(files)


def default_artifact_links(category_id: str) -> list[dict[str, str]]:
    base = PUBLIC_ARTIFACT_BASE_URL
    links = {
        "frontend-vitest": [
            ("Artifact hub", f"{base}/process/frontend-vitest.html", "source files and runner command"),
            ("All tests JSON", "https://goodclaw.org/tests/allTestsRegistry.json", "full inventory"),
        ],
        "playwright-e2e": [
            ("Artifact hub", f"{base}/process/playwright-e2e.html", "Playwright artifact links"),
            ("Playwright HTML report", f"{base}/playwright-report/index.html", "latest copied report"),
            ("All Playwright images", f"{base}/playwright-images/index.html", "screenshots and visual-review images"),
        ],
        "foundry-contracts": [
            ("Artifact hub", f"{base}/process/foundry-contracts.html", "contract test artifacts"),
            ("Blockchain transactions", f"{base}/blockchain-transactions/index.html", "transaction hashes and explorer links"),
            ("Broadcast JSON", f"{base}/blockchain-transactions/files.json", "raw Foundry broadcast files"),
        ],
        "backend-node": [
            ("Artifact hub", f"{base}/process/backend-node.html", "backend/service test paths"),
            ("All tests JSON", "https://goodclaw.org/tests/allTestsRegistry.json", "full inventory"),
        ],
        "sdk-node": [
            ("Artifact hub", f"{base}/process/sdk-node.html", "SDK test paths"),
            ("All tests JSON", "https://goodclaw.org/tests/allTestsRegistry.json", "full inventory"),
        ],
        "quality-checks": [
            ("Artifact hub", f"{base}/process/quality-checks.html", "quality/perf check artifacts"),
            ("Visual screenshots", f"{base}/playwright-images/index.html", "screenshots and visual-review images"),
        ],
    }
    return [
        {"label": label, "href": href, "description": description}
        for label, href, description in links.get(category_id, [])
    ]


def load_artifact_links() -> dict[str, list[dict[str, str]]]:
    if not ARTIFACT_REGISTRY.exists():
        return {}
    try:
        data = json.loads(ARTIFACT_REGISTRY.read_text())
    except Exception:
        return {}
    return {process["id"]: process.get("artifactLinks", []) for process in data.get("processes", [])}


def package_test_scripts() -> list[dict[str, str]]:
    scripts: list[dict[str, str]] = []
    for package_json in sorted(ROOT.glob("backend/*/package.json")) + [ROOT / "sdk" / "package.json"]:
        if not package_json.exists():
            continue
        data = json.loads(package_json.read_text())
        package_scripts = data.get("scripts", {})
        for name in sorted(package_scripts):
            if "test" in name or name in {"lint", "typecheck", "build"}:
                scripts.append(
                    {
                        "package": rel(package_json.parent),
                        "script": name,
                        "command": f"cd {rel(package_json.parent)} && npm run {name}",
                    }
                )
    return scripts


def build_registry() -> dict:
    frontend_unit = matching_files(
        "frontend/src",
        lambda path: "__tests__" in path.parts or ".test." in path.name or ".spec." in path.name,
    )
    playwright = matching_files("frontend/e2e", lambda path: path.name.endswith(".spec.ts") or path.name.endswith(".spec.tsx"))
    contracts = matching_files("test", lambda path: path.suffix == ".sol")
    backend = matching_files(
        "backend",
        lambda path: "__tests__" in path.parts or ".test." in path.name or ".spec." in path.name,
    )
    sdk = matching_files("sdk", lambda path: "__tests__" in path.parts or ".test." in path.name or ".spec." in path.name)
    checks = matching_files("frontend/scripts", lambda path: path.name.startswith("check-") and path.suffix == ".mjs")

    artifact_links = load_artifact_links()

    categories = [
        {
            "id": "frontend-vitest",
            "title": "Frontend Vitest + Testing Library",
            "kind": "unit/integration",
            "command": "cd frontend && npx vitest run",
            "files": frontend_unit,
        },
        {
            "id": "playwright-e2e",
            "title": "Playwright E2E",
            "kind": "browser/e2e",
            "command": "cd frontend && npm run test:e2e:all",
            "quickCommand": "cd frontend && npm run test:e2e",
            "config": "frontend/playwright.config.ts",
            "report": "frontend/playwright-report/index.html",
            "files": playwright,
        },
        {
            "id": "foundry-contracts",
            "title": "Foundry Solidity tests",
            "kind": "contracts",
            "command": "npm run test:contracts",
            "files": contracts,
        },
        {
            "id": "backend-node",
            "title": "Backend package tests",
            "kind": "services",
            "command": "npm run test:lane1",
            "files": backend,
        },
        {
            "id": "sdk-node",
            "title": "SDK tests",
            "kind": "sdk",
            "command": "cd sdk && npm test",
            "files": sdk,
        },
        {
            "id": "quality-checks",
            "title": "Frontend quality/perf checks",
            "kind": "checks",
            "command": "cd frontend && npm run check:perf",
            "files": checks,
        },
    ]
    for category in categories:
        category["artifactLinks"] = artifact_links.get(category["id"]) or default_artifact_links(category["id"])

    total_files = sum(len(category["files"]) for category in categories)
    return {
        "version": "all-tests-2026-05-24",
        "updatedAt": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "sourceRoot": "/home/goodclaw/gooddollar-l2",
        "summary": {
            "categories": len(categories),
            "files": total_files,
            "playwrightSpecs": len(playwright),
            "frontendVitestFiles": len(frontend_unit),
            "contractTests": len(contracts),
            "backendTestFiles": len(backend),
        },
        "commands": [
            {"label": "All frontend unit/integration", "command": "cd frontend && npx vitest run"},
            {"label": "Playwright smoke", "command": "cd frontend && npm run test:e2e"},
            {"label": "All Playwright", "command": "cd frontend && npm run test:e2e:all"},
            {"label": "Contracts", "command": "npm run test:contracts"},
            {"label": "eToro/lane-1 services", "command": "npm run test:lane1"},
            {"label": "Production build gate", "command": "cd frontend && npm run build:raw"},
        ],
        "packageScripts": package_test_scripts(),
        "categories": categories,
    }


def main() -> None:
    registry = build_registry()
    OUT.parent.mkdir(parents=True, exist_ok=True)
    DOCS_OUT.parent.mkdir(parents=True, exist_ok=True)
    encoded = json.dumps(registry, indent=2) + "\n"
    OUT.write_text(encoded)
    DOCS_OUT.write_text(encoded)
    print(f"wrote {registry['summary']['files']} test files across {registry['summary']['categories']} categories")


if __name__ == "__main__":
    main()
