/**
 * GoodStable Liquidator
 *
 * Monitors VaultManager for undercollateralized CDP vaults and executes
 * liquidations when a vault's collateral ratio falls below the liquidation ratio.
 *
 * Strategy:
 *   1. Read all collateral types (ilks) from CollateralRegistry
 *   2. Scan VaultOpened events to find all vault owners per ilk
 *   3. For each vault, compute health: collateralValue / debt >= liquidationRatio
 *   4. If unhealthy → call VaultManager.liquidate(ilk, owner)
 *   5. Collateral goes to StabilityPool or liquidator depending on SP deposits
 */
export type IlkInfo = {
    ilk: bytes32;
    token: string;
    liquidationRatio: bigint;
    active: boolean;
};
type bytes32 = string;
export declare class StableLiquidator {
    private provider;
    private wallet;
    private vaultManager;
    private registry;
    /** Map of ilk → set of vault owners */
    private vaultOwners;
    private ilks;
    constructor();
    /** Load all ilks (collateral types) from the registry. */
    loadIlks(): Promise<void>;
    /** Scan VaultOpened events to build the vault owner set. */
    scanVaults(): Promise<void>;
    /** Check all known vaults and liquidate unhealthy ones. */
    checkAndLiquidate(): Promise<number>;
    /** Subscribe to new vault creations in real-time. */
    listenForNewVaults(): void;
}
export {};
//# sourceMappingURL=stableLiquidator.d.ts.map