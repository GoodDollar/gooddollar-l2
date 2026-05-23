# Hedge demo proofs

This directory is the on-disk audit trail for the lane 5 demo hedging
proof loop.

Each demo-trading cycle (and the first dry-run cycle of a session) writes
`run-<iso>.md` containing:

- mode, dryRun, breaker state, kill-switch state
- cap enforcer snapshot (daily notional, cycle/day order counts)
- the full set of `HedgeReceipt`s for the cycle
- exposure before / after the cycle, per symbol

`latest.json` is the pointer the hedge-engine's `/hedge/proof/latest`
HTTP route reads; it is written atomically (`*.tmp` then `rename`) so a
concurrent reader never sees a partial file.

Generated artifacts are gitignored (see `.gitignore`). This README and
the `.gitignore` itself are tracked so the directory survives `git clean`.
