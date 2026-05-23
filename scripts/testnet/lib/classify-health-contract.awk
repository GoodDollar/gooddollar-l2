# Classify a service name against HEALTH-CONTRACT.md sections.
#
# Walks every `## ` heading in the contract and labels the
# following rows with one of three known section types:
#
#   ## Documented exclusions       → EXCLUDED
#   ## Required services           → REQUIRED
#   ## Required public surfaces    → PUBLIC-SURFACE
#
# Emits the discovered section name on stdout for the first row
# whose name column matches `s`, then exits. Empty stdout means
# the service was not found in any classifiable section.
#
# Precedence: REQUIRED appears before EXCLUDED in the contract;
# first match wins (per the lane-7 promotion gate semantics — once
# a service moves into REQUIRED, the smoke STOPS treating it as
# EXCLUDED, even if a stale exclusion row was left behind).
#
# Invoke with: awk -v s="<svc>" -f classify-health-contract.awk HEALTH-CONTRACT.md

/^## / {
  if (index($0, "Documented exclusions") > 0)         section = "EXCLUDED"
  else if (index($0, "Required services") > 0)        section = "REQUIRED"
  else if (index($0, "Required public surfaces") > 0) section = "PUBLIC-SURFACE"
  else                                                 section = ""
  next
}

section != "" && /^\| *`[a-zA-Z0-9_-]+` *\|/ {
  n = split($0, parts, "|")
  gsub(/[ `]/, "", parts[2])
  if (parts[2] == s) { print section; exit }
}
