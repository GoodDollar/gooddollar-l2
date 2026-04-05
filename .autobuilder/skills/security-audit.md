# Security Audit Skill

## Tools Available
- **Slither** (`slither .`): Static analysis, finds reentrancy, unchecked transfers, access control issues
- **Mythril** (`myth analyze`): Symbolic execution, finds integer overflows, tx origin, delegatecall
- **Foundry Fuzz** (`forge test --fuzz-runs 10000`): Property-based testing
- **Foundry Coverage** (`forge coverage --ir-minimum`): Line/branch/function coverage
- **Cast** (`cast call/send`): On-chain contract interaction testing

## Daily Security Routine

### 1. Run Slither on new commits
```bash
export PATH=/home/goodclaw/.foundry/bin:$PATH
cd /home/goodclaw/gooddollar-l2
slither . --foundry-out-directory out --exclude-dependencies --json /tmp/slither-latest.json 2>&1
python3 -c "
import json
with open('/tmp/slither-latest.json') as f:
    data = json.load(f)
results = data.get('results',{}).get('detectors',[])
for s in ['High','Medium','Low']:
    count = len([r for r in results if r.get('impact') == s])
    print(f'{s}: {count}')
"
```

### 2. Check for new HIGH findings
```bash
python3 -c "
import json
with open('/tmp/slither-latest.json') as f:
    data = json.load(f)
highs = [r for r in data['results']['detectors'] if r['impact'] == 'High']
for h in highs:
    print(f\"[{h['check']}] {h['description'][:200]}\")
"
```

### 3. Run full test suite
```bash
forge test 2>&1 | tail -3
forge coverage --ir-minimum --report summary 2>&1 | tail -5
```

### 4. Test on-chain contracts
```bash
RPC=http://localhost:8545
KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# Test each core contract
cast call <UBIFeeSplitter> "ubiShare()(uint256)" --rpc-url $RPC
cast call <GoodDollarToken> "totalSupply()(uint256)" --rpc-url $RPC
cast call <ValidatorStaking> "totalStaked()(uint256)" --rpc-url $RPC
```

### 5. Write findings to MemClaw
```bash
export MEMCLAW_API_KEY=mc_CeTq_4XU0zzktKpAclK7U7NptghKEjEP
memclaw write "Security audit [date]: [findings summary]" --type outcome
```

## Known Vulnerability Patterns to Check
1. **Reentrancy**: .call{value} without nonReentrant
2. **Unchecked transfers**: .transfer()/.transferFrom() without require
3. **Flash loan attacks**: Price manipulation during same-tx
4. **Oracle manipulation**: Stale prices, single-source oracles
5. **Access control**: Missing onlyOwner/onlyAdmin
6. **Front-running**: Sandwich attacks on swaps
7. **Integer overflow**: unchecked{} blocks
8. **Denial of Service**: Unbounded loops, gas griefing
9. **Centralization risks**: Single admin keys
10. **Bridge vulnerabilities**: Cross-chain replay, message validation

## Auto-Research: Improving Skills
Every heartbeat, search for new security tools and techniques:
```bash
memclaw search "smart contract security tools 2026" --limit 5
memclaw search "recent DeFi exploits" --limit 5
```

Learn from recent exploits and add new detection patterns.
