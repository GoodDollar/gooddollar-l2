/**
 * GoodDollar L2 Liquidation Bot
 *
 * Runs two liquidation engines in parallel:
 *   1. LendLiquidator — monitors GoodLendPool borrowers
 *   2. StableLiquidator — monitors GoodStable CDP vaults
 *
 * Both scan for undercollateralized positions and execute liquidations
 * on every polling cycle. 33% of all protocol fees (including liquidation
 * penalties) flow to the UBI pool.
 *
 * Usage:
 *   PRIVATE_KEY=<key> RPC_URL=http://localhost:8545 npm start
 */
export {};
//# sourceMappingURL=index.d.ts.map