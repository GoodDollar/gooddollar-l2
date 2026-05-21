# Manifest

## SpecKit Artifact Set

- `CONSTITUTION.md` — operating rules and hard gates.
- `spec.md` — functional/non-functional specification.
- `plan.md` — 100-iteration roadmap.
- `tasks.md` — ETORO-001 through ETORO-100 task table.
- `RISK_REGISTER.md` — active risks and stop gates.
- `GATES.md` — per-iteration, milestone, live, and final gates.
- `diagrams/architecture.mmd` — Mermaid architecture diagram source.
- `diagrams/roadmap.mmd` — Mermaid 100-iteration roadmap source.
- `diagrams/architecture.svg` — visual architecture diagram for GitHub.
- `diagrams/roadmap.svg` — visual plan/roadmap diagram for GitHub.

## Current Implementation Linkage

The first adapter slice exists under:

- `backend/stocks-keeper/src/etoro/`
- `docs/ETORO_GOODCHAIN_ADAPTER.md`

Verified locally before this package:

```bash
cd backend/stocks-keeper
npm test -- --runInBand src/etoro
npm run build
```

## Open Blocker

Exact live eToro sandbox endpoint/auth flow must be confirmed before live smoke testing.
