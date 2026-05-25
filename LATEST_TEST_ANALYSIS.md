# Latest Test Analysis - May 25, 2026

## Executive Summary

**Status: 🔴 REGRESSION - Infrastructure Issues Detected**

Analysis of paperclip-continuous-testers.jsonl (May 24 14:18 - May 25 06:03):
- **204 test executions** over 15.75 hours
- **Pass Rate: 78.0%** (159 pass, 45 fail) 
- **⚠️ Regression: -10.6%** from previous 88.6% baseline

## Critical Infrastructure Issue: DEVNET_DRIFT

**Impact: 82% of all failures** (37/45 failed tests)

### Affected Contracts
1. **MarketFactory** - `0x86a2ee8faf9a840f7a2c64ca3d51209f9a02081d`
2. **GoodDollarToken** - `0x12d73e63281fd1387290d75a66861b5368b4a616`

**Error Pattern:**
```
DEVNET_DRIFT: [Contract] has no bytecode on RPC (len=0). 
Re-run scripts/refresh-addresses.py after redeploy.
```

### Immediate Action Required
```bash
cd /home/goodclaw/gooddollar-l2
scripts/refresh-addresses.py
```

## Other Failure Categories (8 failures, 18% of failures)

### Contract Interaction Issues
- `balanceOf` function reverts
- Token approval failures  
- Gas estimation errors ("Out of gas: gas required exceeds allowance: 0")

### Error Examples
```javascript
"The contract function \"balanceOf\" reverted"
"Execution reverted with reason: Out of gas"
```

## Success Analysis

**159 successful operations** showing:
- Setup predictions working correctly
- Market creator assignments successful
- Tester address provisioning functional

## Recommendations

### Immediate (Today)
1. **🚨 P0: Run address refresh script** - fixes 82% of failures
2. **🔍 Debug gas estimation** - review transaction parameters
3. **📊 Re-run analysis** after infrastructure fix

### Short-term (Week 1)
1. Monitor post-fix pass rate recovery
2. Investigate remaining 8 non-DEVNET_DRIFT failures
3. Add infrastructure monitoring to prevent future drift

## Expected Outcome
- **Target pass rate post-fix: 95%+** (removing 37 DEVNET_DRIFT failures)
- **Remaining issues: 8/204 = 4% failure rate** - manageable level
- **Infrastructure stability** restored

---
**Analysis completed:** May 25, 2026 06:05  
**Next analysis due:** After infrastructure fix + 24h monitoring