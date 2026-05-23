#!/usr/bin/env bash
# Unit harness for the HEALTH-CONTRACT classification awk
# (task 0007g/0029).
#
# Pre-fix the awk only matched the `## Documented exclusions`
# section and printed the literal string `"EXCLUDED"` regardless
# of which column the row was actually in. Promotion (contract
# line 69) moves `oracle-signer` / `hedge-engine` into REQUIRED;
# the parser was blind to REQUIRED and fired a phantom
# MISSING-FROM-CONTRACT BLOCKER on a green service.
#
# This harness drives the classifier directly against fixture
# contracts that exercise: REQUIRED-only, EXCLUDED-only, both,
# neither, and the live contract.

set -u

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
CLASSIFIER="$REPO_ROOT/scripts/testnet/lib/classify-health-contract.awk"
FIXTURE_DIR="$REPO_ROOT/scripts/testnet/fixtures/health-contract"

mkdir -p "$FIXTURE_DIR"

# Inline fixture writers — keep the test self-contained.
cat > "$FIXTURE_DIR/required-only.md" <<'EOF'
# Test fixture: oracle-signer in REQUIRED only

## Required services in `/api/status`

| service          | role              |
|------------------|-------------------|
| `swap-oracle`    | swap pricing      |
| `oracle-signer`  | testnet signer    |

## Documented exclusions (warn but pass)

| service             | reason                          | owner iter |
|---------------------|---------------------------------|------------|
| `activity-reporter` | flapping waiting restart        | 4          |
EOF

cat > "$FIXTURE_DIR/excluded-only.md" <<'EOF'
# Test fixture: oracle-signer in EXCLUDED only

## Required services in `/api/status`

| service       | role         |
|---------------|--------------|
| `swap-oracle` | swap pricing |

## Documented exclusions (warn but pass)

| service          | reason                | owner iter |
|------------------|-----------------------|------------|
| `oracle-signer`  | health-only mode      | lane7      |
EOF

cat > "$FIXTURE_DIR/neither.md" <<'EOF'
# Test fixture: oracle-signer absent from both

## Required services in `/api/status`

| service       | role         |
|---------------|--------------|
| `swap-oracle` | swap pricing |

## Documented exclusions (warn but pass)

| service          | reason            | owner iter |
|------------------|-------------------|------------|
| `harvest-keeper` | flapping restart  | 4          |
EOF

cat > "$FIXTURE_DIR/both.md" <<'EOF'
# Test fixture: oracle-signer in REQUIRED and EXCLUDED both

## Required services in `/api/status`

| service          | role           |
|------------------|----------------|
| `oracle-signer`  | testnet signer |

## Documented exclusions (warn but pass)

| service          | reason           | owner iter |
|------------------|------------------|------------|
| `oracle-signer`  | stale row        | lane7      |
EOF

cat > "$FIXTURE_DIR/public-surface-collision.md" <<'EOF'
# Test fixture: name collides with public-surface row

## Required public surfaces (gate fails if any breaks)

| Surface              | Required behavior |
|----------------------|-------------------|
| `https://example/api`| HTTP 200          |
| `oracle-signer`      | service-name collision (contract bug) |

## Documented exclusions (warn but pass)

| service       | reason           | owner iter |
|---------------|------------------|------------|
| `swap-oracle` | flapping         | 4          |
EOF

fail=0
case_n=0

assert_eq() {
  local label="$1" want="$2" got="$3"
  case_n=$(( case_n + 1 ))
  if [[ "$want" == "$got" ]]; then
    echo "PASS  [$case_n] $label  ('$got')"
  else
    echo "FAIL  [$case_n] $label  — want='$want' got='$got'"
    fail=1
  fi
}

classify() {
  awk -v s="$1" -f "$CLASSIFIER" "$2" 2>/dev/null
}

# Case 1: oracle-signer in REQUIRED only → REQUIRED.
assert_eq "REQUIRED-only → REQUIRED" \
  "REQUIRED" \
  "$(classify oracle-signer "$FIXTURE_DIR/required-only.md")"

# Case 2: oracle-signer in EXCLUDED only → EXCLUDED.
assert_eq "EXCLUDED-only → EXCLUDED" \
  "EXCLUDED" \
  "$(classify oracle-signer "$FIXTURE_DIR/excluded-only.md")"

# Case 3: absent from both → empty.
assert_eq "neither → empty" \
  "" \
  "$(classify oracle-signer "$FIXTURE_DIR/neither.md")"

# Case 4: in both sections → REQUIRED wins (first match; REQUIRED
# appears before EXCLUDED in canonical contract).
assert_eq "both → REQUIRED wins (first match precedence)" \
  "REQUIRED" \
  "$(classify oracle-signer "$FIXTURE_DIR/both.md")"

# Case 5: collision with a public-surface row → PUBLIC-SURFACE
# (contract bug surfaces as its own BLOCKER class).
assert_eq "public-surface collision → PUBLIC-SURFACE" \
  "PUBLIC-SURFACE" \
  "$(classify oracle-signer "$FIXTURE_DIR/public-surface-collision.md")"

# Case 6: live contract — oracle-signer is in EXCLUDED today.
# This is the regression baseline (task 0003 cherry-pick).
LIVE="$REPO_ROOT/docs/testnet/HEALTH-CONTRACT.md"
assert_eq "live contract: oracle-signer → EXCLUDED" \
  "EXCLUDED" \
  "$(classify oracle-signer "$LIVE")"

# Case 7: live contract — hedge-engine is in EXCLUDED today.
assert_eq "live contract: hedge-engine → EXCLUDED" \
  "EXCLUDED" \
  "$(classify hedge-engine "$LIVE")"

# Case 8: live contract — swap-oracle is in REQUIRED today.
# This is the NEW capability (pre-fix the awk hardcoded
# EXCLUDED and returned empty for any REQUIRED row).
assert_eq "live contract: swap-oracle → REQUIRED (the bug fix)" \
  "REQUIRED" \
  "$(classify swap-oracle "$LIVE")"

# Case 9: live contract — absent service.
assert_eq "live contract: nonexistent → empty" \
  "" \
  "$(classify does-not-exist "$LIVE")"

echo
if (( fail == 0 )); then
  echo "ALL $case_n CASES PASS"
  exit 0
else
  echo "ONE OR MORE OF $case_n CASES FAILED"
  exit 1
fi
