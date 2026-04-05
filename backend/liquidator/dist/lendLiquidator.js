"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.LendLiquidator = void 0;
const ethers_1 = require("ethers");
const config_1 = require("./config");
const abis_1 = require("./abis");
const RAY = BigInt('1000000000000000000000000000'); // 1e27
class LendLiquidator {
    provider;
    wallet;
    pool;
    oracle;
    borrowers = new Set();
    assets;
    constructor() {
        this.provider = new ethers_1.ethers.JsonRpcProvider(config_1.CONFIG.rpcUrl);
        this.wallet = new ethers_1.ethers.Wallet(config_1.CONFIG.privateKey, this.provider);
        this.pool = new ethers_1.ethers.Contract(config_1.CONFIG.goodLendPool, abis_1.GoodLendPoolABI, this.wallet);
        this.oracle = new ethers_1.ethers.Contract(config_1.CONFIG.goodLendOracle, abis_1.SimplePriceOracleABI, this.provider);
        this.assets = config_1.CONFIG.lendAssets;
    }
    /** Scan past Borrow events to find all borrowers. */
    async scanBorrowers() {
        try {
            const filter = this.pool.filters.Borrow();
            const events = await this.pool.queryFilter(filter, 0, 'latest');
            for (const event of events) {
                const parsed = this.pool.interface.parseLog({
                    topics: event.topics,
                    data: event.data,
                });
                if (parsed?.args?.user) {
                    this.borrowers.add(parsed.args.user);
                }
            }
            console.log(`[LendLiquidator] Found ${this.borrowers.size} borrowers`);
        }
        catch (err) {
            console.error('[LendLiquidator] Failed to scan borrowers:', err);
        }
    }
    /** Check all known borrowers and liquidate if possible. */
    async checkAndLiquidate() {
        let liquidationCount = 0;
        for (const user of this.borrowers) {
            try {
                const [healthFactor, totalCollateral, totalDebt] = await this.pool.getUserAccountData(user);
                const hf = BigInt(healthFactor.toString());
                if (hf >= RAY || totalDebt === 0n)
                    continue;
                console.log(`[LendLiquidator] ⚠️  User ${user} is liquidatable! HF=${ethers_1.ethers.formatUnits(hf, 27)}, debt=${totalDebt}`);
                // Find the best collateral/debt pair
                const result = await this.findBestLiquidation(user);
                if (!result) {
                    console.log(`[LendLiquidator] No profitable liquidation found for ${user}`);
                    continue;
                }
                const { collateralAsset, debtAsset, debtToCover } = result;
                // Approve debt token spending
                const debtToken = new ethers_1.ethers.Contract(debtAsset, abis_1.ERC20ABI, this.wallet);
                const currentAllowance = await debtToken.allowance(this.wallet.address, config_1.CONFIG.goodLendPool);
                if (BigInt(currentAllowance.toString()) < BigInt(debtToCover.toString())) {
                    const approveTx = await debtToken.approve(config_1.CONFIG.goodLendPool, ethers_1.ethers.MaxUint256);
                    await approveTx.wait();
                    console.log(`[LendLiquidator] Approved ${debtAsset} for pool`);
                }
                // Execute liquidation
                const tx = await this.pool.liquidate(collateralAsset, debtAsset, user, debtToCover);
                const receipt = await tx.wait();
                console.log(`[LendLiquidator] ✅ Liquidated ${user} — tx: ${receipt.hash}, gas: ${receipt.gasUsed}`);
                liquidationCount++;
            }
            catch (err) {
                console.error(`[LendLiquidator] Error checking user ${user}:`, err);
            }
        }
        return liquidationCount;
    }
    /** Find the most profitable collateral/debt pair to liquidate. */
    async findBestLiquidation(user) {
        let bestCollateral = '';
        let bestDebt = '';
        let bestDebtAmount = 0n;
        for (const debtAsset of this.assets) {
            const debtReserve = await this.pool.reserves(debtAsset);
            if (!debtReserve.isActive)
                continue;
            const debtTokenContract = new ethers_1.ethers.Contract(debtReserve.debtToken, abis_1.ERC20ABI, this.provider);
            const userDebt = await debtTokenContract.balanceOf(user);
            if (userDebt === 0n)
                continue;
            // Check if liquidator has enough debt tokens to cover
            const liquidatorBalance = await new ethers_1.ethers.Contract(debtAsset, abis_1.ERC20ABI, this.provider).balanceOf(this.wallet.address);
            // Cover up to 50% of debt (close factor) or liquidator balance
            const maxCover = userDebt / 2n;
            const debtToCover = liquidatorBalance < maxCover ? liquidatorBalance : maxCover;
            if (debtToCover === 0n)
                continue;
            for (const collateralAsset of this.assets) {
                if (collateralAsset === debtAsset)
                    continue;
                const collateralReserve = await this.pool.reserves(collateralAsset);
                if (!collateralReserve.isActive)
                    continue;
                const gTokenContract = new ethers_1.ethers.Contract(collateralReserve.gToken, abis_1.ERC20ABI, this.provider);
                const userCollateral = await gTokenContract.balanceOf(user);
                if (userCollateral === 0n)
                    continue;
                // This pair is viable — pick the one with most debt
                if (debtToCover > bestDebtAmount) {
                    bestCollateral = collateralAsset;
                    bestDebt = debtAsset;
                    bestDebtAmount = debtToCover;
                }
            }
        }
        if (!bestCollateral || !bestDebt || bestDebtAmount === 0n)
            return null;
        return {
            collateralAsset: bestCollateral,
            debtAsset: bestDebt,
            debtToCover: bestDebtAmount,
        };
    }
    /** Subscribe to new Borrow events in real-time. */
    listenForNewBorrowers() {
        this.pool.on('Borrow', (_asset, user) => {
            if (!this.borrowers.has(user)) {
                this.borrowers.add(user);
                console.log(`[LendLiquidator] New borrower detected: ${user}`);
            }
        });
    }
}
exports.LendLiquidator = LendLiquidator;
//# sourceMappingURL=lendLiquidator.js.map