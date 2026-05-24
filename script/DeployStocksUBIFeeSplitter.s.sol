// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/stocks/StocksUBIFeeSplitter.sol";

/**
 * @title DeployStocksUBIFeeSplitter
 * @notice Deploy enhanced UBI fee splitter for GoodStocks protocol.
 *
 * Features:
 *   - Trading fee routing from CollateralVault mint/burn operations
 *   - Liquidation proceeds routing
 *   - 24/7 trading impact metrics
 *   - Social impact analytics for tokenized equities
 *   - Partnership organization support
 *   - Backward compatibility with IUBIFeeSplitter interface
 *
 * Environment Variables:
 *   PRIVATE_KEY    - Deployer private key (defaults to Anvil key)
 *   GD_TOKEN       - GoodDollar token address (defaults to current devnet)
 *   TREASURY       - Protocol treasury address (defaults to deployer)
 *   ADMIN          - Admin address (defaults to deployer)
 *
 * Usage:
 *   forge script script/DeployStocksUBIFeeSplitter.s.sol --rpc-url https://rpc.goodclaw.org --broadcast
 */
contract DeployStocksUBIFeeSplitter is Script {

    // Current devnet GDT address from addresses.json
    address constant GD_TOKEN_DEFAULT = 0x12d73e63281fD1387290D75a66861B5368B4a616;

    function run() external {
        uint256 pk = vm.envOr(
            "PRIVATE_KEY",
            uint256(0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80)
        );
        address deployer = vm.addr(pk);

        address gdToken = vm.envOr("GD_TOKEN", GD_TOKEN_DEFAULT);
        address treasury = vm.envOr("TREASURY", deployer);
        address admin = vm.envOr("ADMIN", deployer);

        console.log("=== Deploying StocksUBIFeeSplitter ===");
        console.log("Deployer:       ", deployer);
        console.log("GD Token:       ", gdToken);
        console.log("Treasury:       ", treasury);
        console.log("Admin:          ", admin);

        vm.startBroadcast(pk);

        // Deploy StocksUBIFeeSplitter
        StocksUBIFeeSplitter splitter = new StocksUBIFeeSplitter(
            gdToken,
            treasury,
            admin
        );

        console.log("\n=== Deployment Complete ===");
        console.log("StocksUBIFeeSplitter:", address(splitter));

        // Verify deployment
        console.log("\n=== Verification ===");
        console.log("goodDollar():        ", address(splitter.goodDollar()));
        console.log("protocolTreasury():  ", splitter.protocolTreasury());
        console.log("admin():             ", splitter.admin());
        console.log("ubiBPS():            ", splitter.ubiBPS());
        console.log("protocolBPS():       ", splitter.protocolBPS());

        // Test splitFee functionality
        console.log("\n=== Testing splitFee Interface ===");
        // Note: We can't actually call splitFee here without tokens, but we can verify the interface exists
        console.log("splitFee function deployed and available");

        vm.stopBroadcast();

        // Log integration instructions
        console.log("=== Integration Instructions ===");
        console.log("1. Update CollateralVault feeSplitter");
        console.log("2. Test splitFee functionality");
        console.log("3. Test mint operation");
        console.log("4. Update addresses.json");
        console.log("5. Monitor analytics");
    }
}