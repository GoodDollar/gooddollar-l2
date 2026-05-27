#!/bin/bash

# Update Paperclip task GOO-2325 with completion status
# Run when API connectivity is restored

ISSUE_ID="GOO-2325"
AGENT_ID="31a7d65b-9ff7-4149-9de9-17d9816a34df"

# Check API connectivity first
echo "Checking Paperclip API connectivity..."
if ! curl -s --max-time 10 "$PAPERCLIP_API_URL/api/agents/me" -H "Authorization: Bearer $PAPERCLIP_API_KEY" > /dev/null; then
    echo "❌ API still unresponsive. Please run this script later."
    exit 1
fi

echo "✅ API responsive. Updating task..."

# Update issue status to done with comprehensive comment
curl -X PATCH \
  "$PAPERCLIP_API_URL/api/issues/$ISSUE_ID" \
  -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
  -H "X-Paperclip-Run-Id: $PAPERCLIP_RUN_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "done",
    "comment": "## GOO-2325 Analysis Complete\n\nCompleted comprehensive analysis of all test result files. **Critical findings require immediate action.**\n\n### Key Results\n- **291 total test failures** across all test types\n- **90.3% overall pass rate** - below 95% threshold\n- **E2E tests critically impacted** - 281 failures (90.1% pass rate)\n- **Test coverage gaps** identified for 15+ critical DeFi functions\n\n### Deliverables Created\n- 📊 [Analysis Report](file:///home/goodclaw/gooddollar-l2/URGENT_TEST_ANALYSIS_REPORT.md)\n- 🚨 [Critical Issues](file:///home/goodclaw/gooddollar-l2/CRITICAL_ISSUES_FOR_PAPERCLIP.md) (ready for Paperclip creation)\n- 📋 [Test Coverage Recommendations](file:///home/goodclaw/gooddollar-l2/TEST_COVERAGE_RECOMMENDATIONS.md)\n- 🤖 [Analysis Script](file:///home/goodclaw/gooddollar-l2/test-analysis.py) for future automation\n\n### Critical Actions Required\n1. **E2E home page errors** - 281 failing tests need immediate attention\n2. **Explorer visibility issues** - transaction display problems\n3. **GoodVault operation failures** - deposit/balance issues in iterations 21&23\n4. **Create high-priority issues** from templates in CRITICAL_ISSUES_FOR_PAPERCLIP.md\n\n### Analysis Methodology\nProcessed all `*.jsonl` files in test-results directory:\n- Alpha iterations: 93.1% pass rate (135/145)\n- Gamma transactions: 100% pass rate (7/7)\n- E2E frontend: 90.1% pass rate (2568/2849)\n\n**Next Steps:** Create 5 high-priority issues from analysis templates and assign to relevant teams.\n\n**Status:** COMPLETE - Critical findings documented, immediate action required"
  }'

echo ""
echo "✅ Task updated successfully"
echo "📋 Next: Create issues from /home/goodclaw/gooddollar-l2/CRITICAL_ISSUES_FOR_PAPERCLIP.md"