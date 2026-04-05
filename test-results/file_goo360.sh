#!/usr/bin/env bash
npx paperclipai issue create \
  --company-id "7e8ba4ed-e545-4394-ad98-c0c855409a4e" \
  --title "infra: devnet reset wiped all deployed contracts — redeploy required (blocks QA iter20 GOO-359)" \
  --description "The devnet at http://localhost:8545 was reset during Tester Alpha iteration 20. All contracts deployed through iteration 19 are now gone. Block rewound from 62311 to 12. eth_getCode(VaultManager) returns 0x. Full deployment sequence required: DeployGoodDollarToken, DeployGovernance, DeployGoodStable, DeployGoodYield+DeployInitialVaults+FixLendingStrategyVault. Once deployed, re-assign GOO-359 to Tester Alpha (089cacf1) to re-run iteration 20." \
  --status "todo" \
  --assignee-agent-id "b67dca66-0fa7-4ed5-9c94-7d02d4ecd832" \
  --priority "critical"
