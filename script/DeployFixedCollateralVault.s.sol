// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/stocks/CollateralVault.sol";
import "../src/stocks/SyntheticAssetFactory.sol";

/**
 * @title DeployFixedCollateralVault
 * @notice Deploy new CollateralVault with correct StocksUBIFeeSplitter for GOO-2058.
 *
 * Issue: Current vault at 0xa333B5651c2F0a991A9741E458f5D02980d11760 has
 * broken feeSplitter 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512.
 * Since feeSplitter is immutable, vault must be redeployed.
 *
 * Environment Variables:
 *   PRIVATE_KEY           - Deployer private key (defaults to Anvil key)
 *   STOCKS_UBI_SPLITTER   - StocksUBIFeeSplitter address (required)
 *   GD_TOKEN              - GoodDollar token address (defaults to current devnet)
 *   PRICE_ORACLE          - StocksPriceOracle address (defaults to current devnet)
 *   ADMIN                 - Admin address (defaults to deployer)
 *
 * Usage:
 *   STOCKS_UBI_SPLITTER=0x7C969786F2477851cf2B1b05b4A9D369f3C37140 \
 *   forge script script/DeployFixedCollateralVault.s.sol --rpc-url https://rpc.goodclaw.org --broadcast
 */
contract DeployFixedCollateralVault is Script {

    // Current devnet addresses from addresses.json
    address constant GD_TOKEN_DEFAULT = 0x12d73e63281fD1387290D75a66861B5368B4a616;
    address constant PRICE_ORACLE_DEFAULT = 0x969aA7de33FdFdaB7c11adE6a0288EC79F12fb19; // StocksPriceOracle
    address constant FACTORY_DEFAULT = 0x9301981F27950e6546033EADD046C86754263f2D; // SyntheticAssetFactory

    function run() external {
        uint256 pk = vm.envOr(
            "PRIVATE_KEY",
            uint256(0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80)
        );
        address deployer = vm.addr(pk);

        address stocksUBISplitter = vm.envAddress("STOCKS_UBI_SPLITTER");
        address gdToken = vm.envOr("GD_TOKEN", GD_TOKEN_DEFAULT);
        address priceOracle = vm.envOr("PRICE_ORACLE", PRICE_ORACLE_DEFAULT);
        address admin = vm.envOr("ADMIN", deployer);

        console.log("=== Deploying Fixed CollateralVault ===");
        console.log("Deployer:             ", deployer);
        console.log("GD Token:             ", gdToken);
        console.log("Price Oracle:         ", priceOracle);
        console.log("StocksUBIFeeSplitter: ", stocksUBISplitter);
        console.log("Admin:                ", admin);

        vm.startBroadcast(pk);

        // Deploy new CollateralVault with correct feeSplitter
        CollateralVault newVault = new CollateralVault(
            gdToken,
            priceOracle,
            stocksUBISplitter,
            admin
        );

        console.log("\n=== Deployment Complete ===");
        console.log("New CollateralVault:  ", address(newVault));

        // Verify deployment
        console.log("\n=== Verification ===");
        console.log("goodDollar():         ", address(newVault.goodDollar()));
        console.log("oracle():             ", address(newVault.oracle()));
        console.log("feeSplitter():        ", newVault.feeSplitter());
        console.log("admin():              ", newVault.admin());

        vm.stopBroadcast();

        // Log integration instructions
        console.log("\n=== Integration Instructions ===");
        console.log("1. Register synthetic assets on new vault");
        console.log("2. Update op-stack/addresses.json");
        console.log("3. Test mint operation");
        console.log("4. Update frontend with new vault address");
    }
}