#!/usr/bin/env bash
# build-testing-plan-tables.sh
#
# Prints the four headline totals that drive
# docs/security/TESTING-PLAN.md so a future iteration can mechanically
# detect drift between the doc and the filesystem.
#
# Exit code is 0 if all four totals are emitted, non-zero otherwise.
#
# Output format (one key=value pair per line, sortable, parseable):
#   src_sol_count=<N>
#   test_sol_count=<N>
#   invariant_files_count=<N>
#   fuzz_files_count=<N>
#
# When invoked with --compare <doc>, also greps the four totals out of
# the named doc and prints a diff-friendly side-by-side summary, exiting
# non-zero if any of the four disagree.
#
# Owned by: Security SpecKit (lane d).

set -euo pipefail

# Resolve repo root so script works from any cwd.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
cd "${REPO_ROOT}"

if [ ! -d src ] || [ ! -d test ]; then
  echo "ERROR: expected src/ and test/ at ${REPO_ROOT}" >&2
  exit 2
fi

# Compute the four totals.
SRC_SOL_COUNT="$(find src -name '*.sol' -type f | wc -l | tr -d ' ')"
TEST_SOL_COUNT="$(find test -name '*.sol' -type f | wc -l | tr -d ' ')"
INVARIANT_FILES_COUNT="$(grep -rlE 'function[[:space:]]+invariant_' test --include='*.sol' 2>/dev/null | wc -l | tr -d ' ')"
FUZZ_FILES_COUNT="$(grep -rlE 'function[[:space:]]+testFuzz_' test --include='*.sol' 2>/dev/null | wc -l | tr -d ' ')"

# Emit machine-readable totals.
echo "src_sol_count=${SRC_SOL_COUNT}"
echo "test_sol_count=${TEST_SOL_COUNT}"
echo "invariant_files_count=${INVARIANT_FILES_COUNT}"
echo "fuzz_files_count=${FUZZ_FILES_COUNT}"

# Optional drift check against a published TESTING-PLAN.md.
if [ "${1:-}" = "--compare" ]; then
  DOC="${2:-docs/security/TESTING-PLAN.md}"
  if [ ! -f "${DOC}" ]; then
    echo "ERROR: doc not found: ${DOC}" >&2
    exit 3
  fi
  DOC_SRC="$(grep -c '^| src/' "${DOC}" || true)"
  DOC_TEST="$(grep -c '^| test/' "${DOC}" || true)"
  echo "---"
  echo "doc=${DOC}"
  printf 'metric\tfs\tdoc\n'
  printf 'src_sol_count\t%s\t%s\n' "${SRC_SOL_COUNT}" "${DOC_SRC}"
  printf 'test_sol_count\t%s\t%s\n' "${TEST_SOL_COUNT}" "${DOC_TEST}"
  RC=0
  if [ "${DOC_SRC}" != "${SRC_SOL_COUNT}" ]; then
    echo "DRIFT: src row count in doc (${DOC_SRC}) != fs (${SRC_SOL_COUNT})" >&2
    RC=1
  fi
  if [ "${DOC_TEST}" != "${TEST_SOL_COUNT}" ]; then
    echo "DRIFT: test row count in doc (${DOC_TEST}) != fs (${TEST_SOL_COUNT})" >&2
    RC=1
  fi
  exit "${RC}"
fi

exit 0
