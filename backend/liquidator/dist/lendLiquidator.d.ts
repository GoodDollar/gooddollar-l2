/**
 * GoodLend Liquidator
 *
 * Monitors GoodLendPool for undercollateralized borrowers and executes
 * liquidations when health factor < 1.0 (< 1e27 in RAY).
 *
 * Strategy:
 *   1. Scan Supply/Borrow events to build a set of active borrowers
 *   2. Check each borrower's health factor via getUserAccountData()
 *   3. If HF < 1.0 → pick the best collateral/debt pair and liquidate
 *   4. Profit = liquidation bonus (typically 5%) minus gas costs
 */
export declare class LendLiquidator {
    private provider;
    private wallet;
    private pool;
    private oracle;
    private borrowers;
    private assets;
    constructor();
    /** Scan past Borrow events to find all borrowers. */
    scanBorrowers(): Promise<void>;
    /** Check all known borrowers and liquidate if possible. */
    checkAndLiquidate(): Promise<number>;
    /** Find the most profitable collateral/debt pair to liquidate. */
    private findBestLiquidation;
    /** Subscribe to new Borrow events in real-time. */
    listenForNewBorrowers(): void;
}
//# sourceMappingURL=lendLiquidator.d.ts.map