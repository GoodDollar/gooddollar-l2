# Lane-7 Internal Smoke — `.env` CRLF Hardening Proof (task 0007g/0012)

_Captured 2026-05-23. Source script:
`scripts/testnet/internal-smoke.sh`. Driver:
`.autobuilder/initiatives/0007g-testnet-setup/proof/run-env-crlf.sh`._

The `.env` parser at the safety-fence block now strips a trailing
`\r` from each `key=val` pair before the equality / allowlist
checks fire. Previously a `.env` with Windows CRLF endings yielded
`val="false\r"` (6 bytes) — the `[[ "$rte" == "false" ]]` test
returned false, the smoke fired a contradictory
`REAL_TRADING_ENABLED is false\r — must be unset or false` BLOCKER,
and the printed `\r` scrambled the operator's terminal during what
already feels like a 3 AM safety alarm.

A one-shot advisory WARN now flags the file when CRLF is detected
so the operator knows to permanently `dos2unix .env` it.

## What changed in `internal-smoke.sh`

```bash
elif [[ -f "$LANE7_ENV_FILE" ]]; then
  if grep -q $'\r' "$LANE7_ENV_FILE" 2>/dev/null; then
    WARNINGS+=("$LANE7_ENV_FILE has CRLF line endings — run \`dos2unix\` or \`sed -i 's/\\r\$//'\`")
  fi
  while IFS='=' read -r key val; do
    key="${key%$'\r'}"; val="${val%$'\r'}"
    [[ -z "$key" || "$key" =~ ^# ]] && continue
    [[ "$key" == "REAL_TRADING_ENABLED" || "$key" == "ETORO_MODE" ]] || continue
    val="${val%\"}"; val="${val#\"}"; val="${val%\'}"; val="${val#\'}"
    ENV_PRESENCE[$key]="$val"
  done < "$LANE7_ENV_FILE"
fi
```

The CR strip lives **before** the existing quote-strip pass so a
clean `false` reaches both blocks identically. `INTERNAL-TESTNET-RUNBOOK.md`
was extended with a one-line operator note pointing at `dos2unix`.

## Fixture hex-dumps

```
=== crlf-safe.env ===
R E A L _ T R A D I N G _ E N A B L E D = f a l s e \r \n
E T O R O _ M O D E = d e m o - r e a d o n l y \r \n

=== lf-safe.env ===
R E A L _ T R A D I N G _ E N A B L E D = f a l s e \n
E T O R O _ M O D E = d e m o - r e a d o n l y \n

=== crlf-unsafe.env ===
R E A L _ T R A D I N G _ E N A B L E D = t r u e \r \n
E T O R O _ M O D E = d e m o - r e a d o n l y \r \n
```

## Driver output

```
=== Case A: CRLF + RTE=false ===
exit: 0
PASS  fence intact line
PASS  no spurious RTE BLOCKER
PASS  ETORO_MODE allowlisted
PASS  CRLF advisory WARN
PASS  no CR bytes in report

=== Case B: LF baseline ===
exit: 0
PASS  fence intact line
PASS  no spurious BLOCKER
PASS  no CRLF advisory WARN on LF file
PASS  no CR bytes in report

=== Case C: CRLF + RTE=true (real BLOCKER) ===
exit: 1
PASS  RTE=true BLOCKER fires
PASS  no leaked CR in fence line
PASS  CRLF advisory WARN
PASS  no CR bytes in report

ALL CASES PASS
```

## Captured reports

### Case A — CRLF `.env` with `REAL_TRADING_ENABLED=false`

```
**Verdict:** `GREEN-with-warnings`
**Exit code:** `0`
...
- WARN: <env> has CRLF line endings — run `dos2unix` or `sed -i 's/\r$//'`
...
✅ `REAL_TRADING_ENABLED` = `false` (fence intact)
✅ `ETORO_MODE` = `demo-readonly` (within lane-7 allowlist)
```

Hex of the fence line (first 16 bytes after the leading newline):
`✅ ` (3 bytes UTF-8) `R E A L _ T R A D I N G _ E N` — no `\r` (0x0d).

### Case B — LF baseline (no CRLF WARN)

Byte-for-byte identical safety-fence output as Case A; the only
difference vs the iter06 baseline is the absence of the CRLF
advisory WARN (correct — the file has LF endings).

### Case C — CRLF `.env` with `REAL_TRADING_ENABLED=true`

```
**Verdict:** `RED`
**Exit code:** `1`
- BLOCKER: REAL_TRADING_ENABLED is true — must be unset or false on the lane-7 host
- WARN: <env> has CRLF line endings — run `dos2unix` or `sed -i 's/\r$//'`
...
❌ `REAL_TRADING_ENABLED` = `true` — lane-7 forbids real trading
```

The printed value is the clean `true` (5 bytes), not `true\r` —
the CR strip ran before the equality check.

## No-regression check

- `proof/run-future-dated.sh` — all four cases still pass.
- `proof/run-rpc-timeout.sh` — three cases still pass.
- `proof/run-input-validation.sh` — preflight regressions clean.
- `proof/run-malformed-url.sh` — preflight regressions clean.

## Pointers

- Smoke script: [`scripts/testnet/internal-smoke.sh`](../../../scripts/testnet/internal-smoke.sh)
- Driver: [`proof/run-env-crlf.sh`](./proof/run-env-crlf.sh)
- Fixtures: [`proof/env-fixtures/`](./proof/env-fixtures/)
- Runbook update: [`docs/testnet/INTERNAL-TESTNET-RUNBOOK.md`](../../docs/testnet/INTERNAL-TESTNET-RUNBOOK.md)
- PRD: [`tasks/0012-smoke-env-crlf-spurious-real-trading-blocker.md`](./tasks/0012-smoke-env-crlf-spurious-real-trading-blocker.md)
