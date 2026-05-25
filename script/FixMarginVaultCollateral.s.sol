// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/perps/MarginVault.sol";
import "../src/perps/PerpEngine.sol";
import "../src/perps/FundingRate.sol";
import "../src/perps/PerpPriceOracle.sol";

/**
 * @title FixMarginVaultCollateral
 * @notice Fix GOO-2153: Redeploy MarginVault+PerpEngine with correct GDT collateral.
 *
 * Problem: MarginVault was deployed with Anvil mock token 0x5FbDB... instead of
 * live GDT 0x07882ae1ecb7429a84f1d53048d35c4bb2056877. Since both MarginVault
 * and PerpEngine have immutable references, both must be redeployed.
 *
 * Solution:
 *   1. Deploy new MarginVault with correct GDT
 *   2. Deploy new PerpEngine with new MarginVault (reusing oracle/funding/feeSplitter)
 *   3. Update FundingRate to point to new PerpEngine
 *   4. Wire MarginVault ↔ PerpEngine
 *   5. Recreate 6 markets (BTC, ETH, SOL, BNB, MATIC, ARB)
 *
 * Environment:
 *   PRIVATE_KEY     — deployer private key
 *   GDT_ADDRESS     — live GDT address (defaults to devnet address)
 *   FUNDING_RATE    — existing FundingRate address (defaults to devnet address)
 *   ORACLE          — existing PerpPriceOracle address (defaults to devnet address)
 *   FEE_SPLITTER    — existing UBIFeeSplitter address (defaults to devnet address)
 */
contract FixMarginVaultCollateral is Script {

    // Current devnet addresses from op-stack/addresses.json
    address constant GDT_DEFAULT = 0x07882Ae1ecB7429a84f1D53048d35c4bB2056877;
    address constant FUNDING_RATE_DEFAULT = 0xC66AB83418C20A65C3f8e83B3d11c8C3a6097b6F;
    address constant ORACLE_DEFAULT = 0x8F4ec854Dd12F1fe79500a1f53D0cbB30f9b6134;
    address constant FEE_SPLITTER_DEFAULT = 0x1f10F3Ba7ACB61b2F50B9d6DdCf91a6f787C0E82;

    struct Market {
        string ticker;
        uint256 markPrice;   // 8-decimal USD (Chainlink format)
        uint256 indexPrice;  // 8-decimal USD
        uint256 maxLeverage;
    }

    function run() external {
        uint256 pk = vm.envOr(
            "PRIVATE_KEY",
            uint256(0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80)
        );
        address deployer = vm.addr(pk);

        address gdtAddress = vm.envOr("GDT_ADDRESS", GDT_DEFAULT);
        address fundingRateAddress = vm.envOr("FUNDING_RATE", FUNDING_RATE_DEFAULT);
        address oracleAddress = vm.envOr("ORACLE", ORACLE_DEFAULT);
        address feeSplitterAddress = vm.envOr("FEE_SPLITTER", FEE_SPLITTER_DEFAULT);

        console.log("=== Fix MarginVault Collateral (GOO-2153) ===");
        console.log("Deployer:       ", deployer);
        console.log("GDT Address:    ", gdtAddress);
        console.log("FundingRate:    ", fundingRateAddress);
        console.log("Oracle:         ", oracleAddress);
        console.log("FeeSplitter:    ", feeSplitterAddress);

        vm.startBroadcast(pk);

        // 1. Deploy new MarginVault with correct GDT collateral
        MarginVault newVault = new MarginVault(gdtAddress, deployer);
        console.log("1. New MarginVault deployed:", address(newVault));

        // 2. Deploy new PerpEngine with new MarginVault
        PerpEngine newEngine = new PerpEngine(
            address(newVault),
            fundingRateAddress,
            oracleAddress,
            feeSplitterAddress,
            deployer
        );
        console.log("2. New PerpEngine deployed: ", address(newEngine));

        // 3. Update FundingRate to point to new PerpEngine
        FundingRate funding = FundingRate(fundingRateAddress);
        funding.setPerpEngine(address(newEngine));
        console.log("3. FundingRate updated to new PerpEngine");

        // 4. Wire MarginVault to new PerpEngine
        newVault.setPerpEngine(address(newEngine));
        console.log("4. MarginVault connected to new PerpEngine");

        // 5. Recreate the 6 markets with current prices
        Market[6] memory markets = [
            Market("BTC", 6_500_000_000_000, 6_498_000_000_000, 50),
            Market("ETH",   320_000_000_000,   319_800_000_000, 50),
            Market("SOL",    18_000_000_000,    17_990_000_000, 25),
            Market("BNB",    60_000_000_000,    59_980_000_000, 25),
            Market("MATIC",      90_000_000,        89_500_000, 20),
            Market("ARB",       120_000_000,       119_800_000, 20)
        ];

        PerpPriceOracle oracle = PerpPriceOracle(oracleAddress);

        console.log("5. Recreating markets...");
        for (uint256 i = 0; i < markets.length; i++) {
            Market memory m = markets[i];
            bytes32 key = keccak256(abi.encodePacked(m.ticker));

            // Register market in oracle (if not already registered)
            try oracle.registerMarket(key) {
                console.log("   Registered", m.ticker, "in oracle");
            } catch {
                console.log("   Market", m.ticker, "already registered in oracle");
            }

            // Set prices in oracle
            oracle.setManualPrice(key, m.markPrice, m.indexPrice);

            // Create market in engine
            uint256 marketId = newEngine.createMarket(key, key, m.maxLeverage);
            console.log(string.concat("   Created ", m.ticker, " market id: ", vm.toString(marketId), " leverage: ", vm.toString(m.maxLeverage), "x"));
        }

        vm.stopBroadcast();

        console.log("\n=== Fix Complete ===");
        console.log("OLD MarginVault: 0xef31027350be2c7439c1b0be022d49421488b72c (BROKEN - Anvil mock)");
        console.log("NEW MarginVault:", address(newVault), "(FIXED - Live GDT)");
        console.log("OLD PerpEngine:  0x12bcb546bc60ff39f1adfc7ce4605d5bd6a6a876 (BROKEN - wrong vault)");
        console.log("NEW PerpEngine: ", address(newEngine), "(FIXED - new vault)");
        console.log("GDT Collateral: ", gdtAddress);
        console.log("Markets:         6 (BTC ETH SOL BNB MATIC ARB) recreated");
        console.log("\nNEXT STEPS:");
        console.log("1. Run scripts/refresh-addresses.py to update addresses.json");
        console.log("2. Test with scripts/paperclip-continuous-testers.mjs --once --tester beta");
    }
}