// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/perps/PerpPriceOracle.sol";
import "../src/perps/FundingRate.sol";
import "../src/perps/MarginVault.sol";
import "../src/perps/PerpEngine.sol";

/**
 * @title RedeployPerpsFix
 * @notice Fix for GOO-2153: Redeploy GoodPerps with correct GDT collateral address.
 *
 * This is a corrected version of DeployPerps.s.sol that uses the live GDT address
 * instead of the Anvil mock token address.
 *
 * Environment:
 *   PRIVATE_KEY  — deployer private key
 *   GDT_TOKEN    — live GDT address (must be set to avoid using mock)
 *   FEE_SPLITTER — UBIFeeSplitter address (defaults to current devnet address)
 */
contract RedeployPerpsFix is Script {

    // DO NOT use the Anvil mock - this caused GOO-2153!
    // address constant GDT_TOKEN_DEFAULT = 0x5FbDB2315678afecb367f032d93F642f64180aa3;

    // Use freshly deployed live GDT
    address constant GDT_TOKEN_DEFAULT = 0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9;
    address constant FEE_SPLITTER_DEFAULT = 0x1f10F3Ba7ACB61b2F50B9d6DdCf91a6f787C0E82;

    struct Market {
        string  ticker;
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

        address gdToken     = vm.envOr("GD_TOKEN",     GDT_TOKEN_DEFAULT);
        address feeSplitter = vm.envOr("FEE_SPLITTER", FEE_SPLITTER_DEFAULT);

        // Verify we're not using the broken mock address
        require(gdToken != 0x5FbDB2315678afecb367f032d93F642f64180aa3, "GOO-2153: Refusing to use Anvil mock GDT");

        console.log("=== GoodPerps Deployment (GOO-2153 Fix) ===");
        console.log("Deployer:", deployer);
        console.log("GDT Token:", gdToken);
        console.log("Fee Splitter:", feeSplitter);

        vm.startBroadcast(pk);

        // 1. Deploy PerpPriceOracle
        PerpPriceOracle oracle = new PerpPriceOracle(deployer);
        console.log("PerpPriceOracle:", address(oracle));

        // 2. Deploy FundingRate
        FundingRate funding = new FundingRate(deployer);
        console.log("FundingRate:    ", address(funding));

        // 3. Deploy MarginVault with CORRECT GDT address
        MarginVault vault = new MarginVault(gdToken, deployer);
        console.log("MarginVault:    ", address(vault));

        // 4. Deploy PerpEngine
        PerpEngine engine = new PerpEngine(
            address(vault),
            address(funding),
            address(oracle),
            feeSplitter,
            deployer
        );
        console.log("PerpEngine:     ", address(engine));

        // 5. Wire FundingRate → PerpEngine
        funding.setPerpEngine(address(engine));
        console.log("FundingRate wired to engine");

        // 6. Wire MarginVault → PerpEngine
        vault.setPerpEngine(address(engine));
        console.log("MarginVault wired to engine");

        // 7. Seed markets
        Market[6] memory markets = [
            Market("BTC",  6_500_000_000_000,  6_498_000_000_000, 50),
            Market("ETH",    320_000_000_000,    319_800_000_000, 50),
            Market("SOL",     18_000_000_000,     17_990_000_000, 25),
            Market("BNB",     60_000_000_000,     59_980_000_000, 25),
            Market("MATIC",       90_000_000,        89_500_000, 20),
            Market("ARB",        120_000_000,       119_800_000, 20)
        ];

        console.log("Seeding markets...");
        for (uint256 i = 0; i < markets.length; i++) {
            Market memory m = markets[i];
            bytes32 key = keccak256(abi.encodePacked(m.ticker));

            oracle.registerMarket(key);
            oracle.setManualPrice(key, m.markPrice, m.indexPrice);
            uint256 marketId = engine.createMarket(key, key, m.maxLeverage);
            console.log(string.concat(m.ticker, " market id=", vm.toString(marketId), " leverage=", vm.toString(m.maxLeverage), "x"));
        }

        vm.stopBroadcast();

        console.log("\n=== GoodPerps Deployment Complete ===");
        console.log("Chain:          42069 (devnet)");
        console.log("PerpPriceOracle:", address(oracle));
        console.log("FundingRate:    ", address(funding));
        console.log("MarginVault:    ", address(vault));
        console.log("PerpEngine:     ", address(engine));
        console.log("GD collateral:  ", gdToken);
        console.log("FeeSplitter:    ", feeSplitter);
        console.log("Markets:        6 (BTC ETH SOL BNB MATIC ARB)");
        console.log("");
        console.log("FIXED: MarginVault now uses live GDT instead of Anvil mock!");
        console.log("NEXT STEPS:");
        console.log("1. Run scripts/refresh-addresses.py to update addresses.json");
        console.log("2. Test with scripts/paperclip-continuous-testers.mjs --once --tester beta");
    }
}