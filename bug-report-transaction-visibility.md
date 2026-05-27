# BUG REPORT: Transaction Visibility Issues

**Priority**: HIGH  
**Status**: Active  
**Affected Component**: Transaction Indexing/UI  
**Test Files**: `/home/goodclaw/gooddollar-l2/test-results/e2e-results.jsonl`

## Issue Description

Transaction visibility tests failing with 1.6% pass rate (61 out of 63 tests failing). Transactions not appearing in activity pages.

## Error Details

```
Check: "transactions_visible"
Result: false (61/63 failures)
Page: explorer/address
Impact: Users cannot see their transaction history
```

## Root Cause Analysis

1. Transaction indexing service may be down/misconfigured
2. Database synchronization issues
3. UI rendering problems for transaction lists
4. Possible RPC connectivity issues

## Evidence

- **File**: `e2e-results.jsonl`
- **Pattern**: Consistent failures in transaction visibility checks
- **Success Rate**: 1.6% (2/63 passes)
- **Affected Pages**: explorer/address, activity pages

## Recommended Fix

1. Verify transaction indexing service status
2. Check database synchronization between RPC and indexer
3. Test UI transaction list rendering
4. Add transaction indexing health checks
5. Implement retry logic for transaction queries

## Business Impact

- Poor user experience - users cannot track their transactions
- Loss of transparency in DeFi operations  
- Potential support burden from confused users
- Compliance issues if transaction history unavailable