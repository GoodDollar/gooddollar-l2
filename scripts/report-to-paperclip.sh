#!/bin/bash
# Report a test failure as a Paperclip issue
# Usage: ./report-to-paperclip.sh "title" "description" "priority"
COMPANY="7e8ba4ed-e545-4394-ad98-c0c855409a4e"
API="http://127.0.0.1:3102"

TITLE="$1"
DESC="$2"
PRIORITY="${3:-medium}"

# Check if similar issue already exists (avoid duplicates)
EXISTING=$(curl -s "$API/api/companies/$COMPANY/issues?status=todo&limit=50" 2>/dev/null | python3 -c "
import json,sys
issues = json.load(sys.stdin)
title = '$TITLE'
for i in issues:
    if title[:40] in i.get('title',''):
        print(i.get('identifier',''))
        break
" 2>/dev/null)

if [ -n "$EXISTING" ]; then
    echo "Duplicate: $EXISTING already exists"
    exit 0
fi

# Create new issue
RESULT=$(curl -s -X POST "$API/api/companies/$COMPANY/issues" \
    -H "Content-Type: application/json" \
    -d "{\"title\":\"$TITLE\",\"description\":\"$DESC\",\"status\":\"todo\",\"priority\":\"$PRIORITY\"}" 2>/dev/null)

ID=$(echo "$RESULT" | python3 -c "import json,sys; print(json.load(sys.stdin).get('identifier','FAILED'))" 2>/dev/null)
echo "Created: $ID"
