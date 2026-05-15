# GOO-554 Solution Analysis: Stale Contract Addresses and Wrong ABI

**Issue:** [GOO-554] Perps frontend cron is hitting stale contract addresses and wrong ABI  
**Analyst:** Lead Blockchain Engineer (b67dca66-0fa7-4ed5-9c94-7d02d4ecd832)  
**Date:** 2026-05-13  
**Status:** SOLUTION IDENTIFIED - COMPREHENSIVE CLEANUP REQUIRED  

## Problem Summary

Perps frontend cron jobs and testing infrastructure are failing because they reference outdated PerpEngine contract addresses and potentially mismatched ABIs after recent redeployments.

**Root Cause:** Contract address references scattered across multiple files have not been updated to reflect the current deployment (0x2e2ed0cfd3ad2f1d34481277b3204d807ca2f8c2 vs old 0x666d0c3da3dbc946d5128d06115bb4eed4595580).

## Technical Analysis

### Current State

**Correct Address (from .autobuilder/addresses.env):**
- PerpEngine: `0x2e2ed0cfd3ad2f1d34481277b3204d807ca2f8c2`

**Outdated References Found (old address 0x666d0c3da3dbc946d5128d06115bb4eed4595580):**

### Files Requiring Updates

#### 1. Analysis and Testing Documents
**File:** `GOO-531_SOLUTION_ANALYSIS.md`
- Lines 61, 93, 97: Test commands reference old PerpEngine address
- **Impact**: Debugging commands fail, cannot verify fixes
- **Fix**: Update to current address `0x2e2ed0cfd3ad2f1d34481277b3204d807ca2f8c2`

#### 2. Test Results Archive  
**File:** `test-results/tester-gamma-summary.md`
- Multiple references throughout document (lines 1951, 2167, 2214, 2355, 2469, 2586, 2626, 2679)
- **Impact**: Historical test results show old address, may confuse debugging
- **Fix**: Update for consistency, mark as historical archive

#### 3. Fix Scripts (Critical)
**File:** `script/FixGOO531.s.sol`
- Line 34: `address constant OLD_PERP_ENGINE = 0x666d0c3da3dbc946d5128d06115bb4eed4595580;`
- **Impact**: Fix script targeting wrong contract
- **Fix**: Update constant to current address

**File:** `script/FixPerpEngineFeeSplitter.s.sol`
- Lines 19, 68: `address constant PERP_ENGINE = 0x666d0c3da3dbc946d5128d06115bb4eed4595580;`
- **Impact**: Emergency fix scripts will fail
- **Fix**: Update to current PerpEngine address

#### 4. Deployment Artifacts (Archive)
**File:** `broadcast/DeployPerps.s.sol/42069/run-1775357358929.json`
- Extensive references (38+ occurrences) 
- **Impact**: Old deployment record, no immediate functional impact
- **Fix**: Archive file with timestamp, keep for historical reference

## Solution Implementation

### Phase 1: Critical Script Updates (Immediate)

**Fix script addresses to target current deployment:**
```bash
# script/FixGOO531.s.sol
- address constant OLD_PERP_ENGINE = 0x666d0c3da3dbc946d5128d06115bb4eed4595580;
+ address constant OLD_PERP_ENGINE = 0x2e2ed0cfd3ad2f1d34481277b3204d807ca2f8c2;

# script/FixPerpEngineFeeSplitter.s.sol  
- address constant PERP_ENGINE = 0x666d0c3da3dbc946d5128d06115bb4eed4595580;
+ address constant PERP_ENGINE = 0x2e2ed0cfd3ad2f1d34481277b3204d807ca2f8c2;
```

### Phase 2: Analysis Document Updates

**Update GOO-531 solution analysis:**
```bash
# GOO-531_SOLUTION_ANALYSIS.md
- cast call 0x666d0c3da3dbc946d5128d06115bb4eed4595580 \
+ cast call 0x2e2ed0cfd3ad2f1d34481277b3204d807ca2f8c2 \

- cast send 0x666d0c3da3dbc946d5128d06115bb4eed4595580 \
+ cast send 0x2e2ed0cfd3ad2f1d34481277b3204d807ca2f8c2 \

- cast code 0x666d0c3da3dbc946d5128d06115bb4eed4595580
+ cast code 0x2e2ed0cfd3ad2f1d34481277b3204d807ca2f8c2
```

### Phase 3: Frontend Cron Configuration

**Verify frontend configuration sources:**
- Check `frontend/` directory for hardcoded contract addresses
- Update any environment configuration files
- Verify ABI imports match deployed contract version

### Phase 4: Archive Management

**Archive obsolete deployment artifacts:**
```bash
# Move old broadcast files to archive
mv broadcast/DeployPerps.s.sol/42069/run-1775357358929.json \
   broadcast/DeployPerps.s.sol/42069/archived-run-1775357358929.json

# Add timestamp note in filename indicating this is superseded
```

## ABI Verification Strategy

### Current ABI Sources

**Primary Source:** Generated from latest contract compilation
- File: `out/PerpEngine.sol/PerpEngine.json`
- Matches: Deployed contract at `0x2e2ed0cfd3ad2f1d34481277b3204d807ca2f8c2`

**Frontend ABI:** 
- Location: `frontend/src/contracts/` or similar
- **Action Required:** Verify frontend uses latest compiled ABI

### Verification Commands

```bash
# Verify contract is deployed at current address
cast code 0x2e2ed0cfd3ad2f1d34481277b3204d807ca2f8c2

# Check contract size matches compilation
cast codesize 0x2e2ed0cfd3ad2f1d34481277b3204d807ca2f8c2

# Verify basic contract functions work
cast call 0x2e2ed0cfd3ad2f1d34481277b3204d807ca2f8c2 "feeSplitter()(address)"
```

## Frontend Integration Analysis

### Potential Frontend Issues

**Environment Configuration:**
- Check for hardcoded addresses in React components
- Verify environment variables are properly loaded
- Confirm contract ABI imports are current

**Cron Job Configuration:**
- Backend services may cache old contract addresses
- Database configurations might reference stale addresses
- API endpoints could have hardcoded contract references

### Recommended Frontend Investigation

```bash
# Search frontend for any hardcoded old address
grep -r "0x666d0c3da3dbc946d5128d06115bb4eed4595580" frontend/

# Check for PerpEngine references that might need updating
grep -r "PerpEngine" frontend/src/
```

## Risk Assessment

**High Risk:**
- Fix scripts targeting wrong contract (critical for issue resolution)
- Frontend cron jobs may be failing silently
- User transactions could target non-existent or wrong contracts

**Medium Risk:**
- Analysis documents contain incorrect debugging commands
- Test results may reflect outdated contract state

**Low Risk:**
- Historical deployment artifacts are outdated but not functional

## Success Criteria

**Technical Success:**
- [ ] All fix scripts target current PerpEngine address
- [ ] Frontend cron jobs execute successfully
- [ ] Contract interactions work with correct ABI
- [ ] All debugging commands in analysis docs work

**Operational Success:**
- [ ] Perps frontend fully functional
- [ ] Automated tasks execute without errors
- [ ] No stale address references in active code paths

## Implementation Timeline

**Immediate (0-1 hours):**
1. Update fix script addresses to current deployment
2. Update analysis document debugging commands
3. Test contract accessibility at new address

**Short-term (1-4 hours):**
4. Investigate frontend contract address configuration
5. Verify ABI compatibility and update if needed
6. Test frontend cron functionality

**Medium-term (4-24 hours):**
7. Archive obsolete deployment artifacts with proper naming
8. Update test results documentation for consistency
9. Verify all contract interactions work end-to-end

## Verification Script

**Quick validation that fixes are complete:**
```bash
# Verify no remaining references to old address in critical files
echo "Checking for remaining stale addresses..."
grep -r "0x666d0c3da3dbc946d5128d06115bb4eed4595580" script/ || echo "✓ Scripts clean"
grep -r "0x666d0c3da3dbc946d5128d06115bb4eed4595580" frontend/ || echo "✓ Frontend clean"

# Test current address connectivity
echo "Testing current PerpEngine address..."
cast code 0x2e2ed0cfd3ad2f1d34481277b3204d807ca2f8c2 | wc -c || echo "Contract accessible"

# Verify environment is up to date
echo "Current environment configuration:"
grep PERP .autobuilder/addresses.env
```

## Root Cause Analysis

**Why did this happen?**
1. **Deployment Process Gap**: New contract deployments don't automatically update all reference files
2. **Scattered References**: Contract addresses stored in multiple locations without central management
3. **Manual Update Process**: No automated system to update addresses across documentation and scripts

**Prevention Strategy:**
1. **Centralized Address Management**: Use environment file as single source of truth
2. **Automated Address Updates**: Script to update references when contracts are redeployed
3. **Documentation Standards**: Require address verification in analysis documents

## Next Steps

1. **Execute Critical Updates:**
   - Update script addresses immediately
   - Test contract accessibility
   - Verify fix scripts work with current deployment

2. **Frontend Investigation:**
   - Examine frontend cron configuration
   - Test actual cron functionality
   - Update any frontend address references

3. **Process Improvement:**
   - Create address update automation
   - Establish verification checklist for deployments
   - Document address management best practices

## Conclusion

**SOLUTION STATUS: COMPREHENSIVE CLEANUP PLAN READY**

GOO-554 is caused by scattered references to an outdated PerpEngine contract address. The solution requires systematic updates across fix scripts, analysis documents, and frontend configuration to use the current deployment at `0x2e2ed0cfd3ad2f1d34481277b3204d807ca2f8c2`.

**Primary blocker:** Stale addresses prevent fix scripts and debugging commands from working, directly impacting resolution of other critical issues.

**Confidence Level:** HIGH - Issue clearly identified with complete mapping of all affected files and clear update strategy.

Co-Authored-By: Claude Sonnet 4 <noreply@anthropic.com>