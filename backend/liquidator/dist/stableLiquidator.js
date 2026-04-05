"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.StableLiquidator = void 0;
const ethers_1 = require("ethers");
const config_1 = require("./config");
const abis_1 = require("./abis");
class StableLiquidator {
    provider;
    wallet;
    vaultManager;
    registry;
    /** Map of ilk → set of vault owners */
    vaultOwners = new Map();
    ilks = [];
    constructor() {
        this.provider = new ethers_1.ethers.JsonRpcProvider(config_1.CONFIG.rpcUrl);
        this.wallet = new ethers_1.ethers.Wallet(config_1.CONFIG.privateKey, this.provider);
        this.vaultManager = new ethers_1.ethers.Contract(config_1.CONFIG.vaultManager, abis_1.VaultManagerABI, this.wallet);
        this.registry = new ethers_1.ethers.Contract(config_1.CONFIG.collateralRegistry, abis_1.CollateralRegistryABI, this.provider);
    }
    /** Load all ilks (collateral types) from the registry. */
    async loadIlks() {
        try {
            const count = await this.registry.ilkCount();
            this.ilks = [];
            for (let i = 0; i < Number(count); i++) {
                const ilk = await this.registry.ilkList(i);
                const cfg = await this.registry.getConfig(ilk);
                this.ilks.push({
                    ilk,
                    token: cfg.token,
                    liquidationRatio: BigInt(cfg.liquidationRatio.toString()),
                    active: cfg.active,
                });
            }
            console.log(`[StableLiquidator] Loaded ${this.ilks.length} ilks: ${this.ilks.map((i) => ethers_1.ethers.decodeBytes32String(i.ilk)).join(', ')}`);
        }
        catch (err) {
            console.error('[StableLiquidator] Failed to load ilks:', err);
        }
    }
    /** Scan VaultOpened events to build the vault owner set. */
    async scanVaults() {
        try {
            const filter = this.vaultManager.filters.VaultOpened();
            const events = await this.vaultManager.queryFilter(filter, 0, 'latest');
            for (const event of events) {
                const parsed = this.vaultManager.interface.parseLog({
                    topics: event.topics,
                    data: event.data,
                });
                if (parsed?.args) {
                    const user = parsed.args.user;
                    const ilk = parsed.args.ilk;
                    if (!this.vaultOwners.has(ilk)) {
                        this.vaultOwners.set(ilk, new Set());
                    }
                    this.vaultOwners.get(ilk).add(user);
                }
            }
            const totalVaults = Array.from(this.vaultOwners.values()).reduce((sum, s) => sum + s.size, 0);
            console.log(`[StableLiquidator] Found ${totalVaults} vaults across ${this.vaultOwners.size} ilks`);
        }
        catch (err) {
            console.error('[StableLiquidator] Failed to scan vaults:', err);
        }
    }
    /** Check all known vaults and liquidate unhealthy ones. */
    async checkAndLiquidate() {
        let liquidationCount = 0;
        for (const ilkInfo of this.ilks) {
            if (!ilkInfo.active)
                continue;
            const owners = this.vaultOwners.get(ilkInfo.ilk);
            if (!owners || owners.size === 0)
                continue;
            for (const owner of owners) {
                try {
                    const vault = await this.vaultManager.vaults(owner, ilkInfo.ilk);
                    const collateral = BigInt(vault.collateral.toString());
                    const debt = BigInt(vault.debt.toString());
                    if (debt === 0n)
                        continue;
                    // Try to liquidate — the contract checks health internally
                    // This is simpler than replicating the health check off-chain
                    try {
                        const tx = await this.vaultManager.liquidate(ilkInfo.ilk, owner);
                        const receipt = await tx.wait();
                        console.log(`[StableLiquidator] ✅ Liquidated vault: owner=${owner}, ilk=${ethers_1.ethers.decodeBytes32String(ilkInfo.ilk)} — tx: ${receipt.hash}`);
                        liquidationCount++;
                    }
                    catch (liqErr) {
                        // "VM: vault is healthy" is expected for most vaults — skip silently
                        if (liqErr?.reason?.includes('vault is healthy'))
                            continue;
                        if (liqErr?.message?.includes('vault is healthy'))
                            continue;
                        // Other errors are real problems
                        console.error(`[StableLiquidator] Liquidation failed for ${owner} (${ethers_1.ethers.decodeBytes32String(ilkInfo.ilk)}):`, liqErr?.reason ?? liqErr?.message);
                    }
                }
                catch (err) {
                    console.error(`[StableLiquidator] Error reading vault ${owner}:`, err);
                }
            }
        }
        return liquidationCount;
    }
    /** Subscribe to new vault creations in real-time. */
    listenForNewVaults() {
        this.vaultManager.on('VaultOpened', (user, ilk) => {
            if (!this.vaultOwners.has(ilk)) {
                this.vaultOwners.set(ilk, new Set());
            }
            this.vaultOwners.get(ilk).add(user);
            console.log(`[StableLiquidator] New vault: ${user} in ${ethers_1.ethers.decodeBytes32String(ilk)}`);
        });
    }
}
exports.StableLiquidator = StableLiquidator;
//# sourceMappingURL=stableLiquidator.js.map