// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/stocks/CollateralVault.sol";
import "../src/stocks/SyntheticAssetFactory.sol";
import "../src/stocks/PriceOracle.sol";

/**
 * @title DeployCorrectCollateralVault
 * @notice Fix GOO-2720: Deploy new CollateralVault with correct GoodDollar token address
 *
 * Issue: Current vault at 0x2f54d1563963fc04770e85af819c89dc807f6a06 points to
 * goodDollar token 0x36C02dA8a0983159322a80FFE9F24b1acfF8B570 which has no code.
 *
 * Correct GoodDollar token from addresses.json: 0xec1bb74f5799811c0c1bff94ef76fb40abccbe4a
 *
 * Environment Variables:
 *   PRIVATE_KEY     - Deployer private key (defaults to Anvil key)
 *
 * Usage:
 *   forge script script/DeployCorrectCollateralVault.s.sol --rpc-url https://rpc.goodclaw.org --broadcast
 */
contract DeployCorrectCollateralVault is Script {

    // Correct addresses from addresses.json (2026-05-28 01:22:19)
    address constant CORRECT_GD_TOKEN = 0xeC1BB74f5799811c0c1Bff94Ef76Fb40abccbE4a;
    address constant STOCKS_PRICE_ORACLE = 0x1E3b98102e19D3a164d239BdD190913C2F02E756;
    address constant STOCKS_UBI_SPLITTER = 0x5081a39b8A5f0E35a8D959395a630b68B74Dd30f;
    address constant SYNTHETIC_ASSET_FACTORY = 0x158d291D8b47F056751cfF47d1eEcd19FDF9B6f8;

    // Current broken vault (for reference)
    address constant BROKEN_VAULT = 0x2F54D1563963fC04770E85AF819c89Dc807f6a06;

    // Stock tickers to register (from original deployment)
    string[] private stockTickers = [
        "AAPL", "TSLA", "NVDA", "MSFT", "AMZN",
        "GOOGL", "META", "JPM", "V", "DIS", "NFLX", "AMD"
    ];

    function run() external {
        uint256 deployerKey = vm.envOr(
            "PRIVATE_KEY",
            uint256(0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80)
        );
        address deployer = vm.addr(deployerKey);

        console.log("=== Deploying Corrected CollateralVault for GOO-2720 ===");
        console.log("Deployer:              ", deployer);
        console.log("Correct GD Token:      ", CORRECT_GD_TOKEN);
        console.log("Price Oracle:          ", STOCKS_PRICE_ORACLE);
        console.log("StocksUBIFeeSplitter:  ", STOCKS_UBI_SPLITTER);
        console.log("Broken vault (old):    ", BROKEN_VAULT);

        // Verify the correct GD token has code
        uint256 gdTokenCodeSize;
        assembly { gdTokenCodeSize := extcodesize(CORRECT_GD_TOKEN) }
        require(gdTokenCodeSize > 0, "GD token has no code!");
        console.log("GD Token code size:    ", gdTokenCodeSize, "bytes");

        vm.startBroadcast(deployerKey);

        // Deploy new CollateralVault with correct GoodDollar token
        CollateralVault newVault = new CollateralVault(
            CORRECT_GD_TOKEN,
            STOCKS_PRICE_ORACLE,
            STOCKS_UBI_SPLITTER,
            deployer
        );

        console.log("\n=== New CollateralVault Deployed ===");
        console.log("New CollateralVault:   ", address(newVault));

        // Register all synthetic assets on the new vault
        SyntheticAssetFactory factory = SyntheticAssetFactory(SYNTHETIC_ASSET_FACTORY);

        console.log("\n=== Registering Synthetic Assets ===");
        for (uint256 i = 0; i < stockTickers.length; i++) {
            string memory ticker = stockTickers[i];
            address assetAddress = factory.getAsset(ticker);

            if (assetAddress != address(0)) {
                newVault.registerAsset(ticker, assetAddress);
                console.log("Registered", ticker, "at", assetAddress);
            } else {
                console.log("Warning: No asset found for", ticker);
            }
        }

        vm.stopBroadcast();

        // Verification
        console.log("\n=== Deployment Verification ===");
        console.log("goodDollar():          ", address(newVault.goodDollar()));
        console.log("oracle():              ", address(newVault.oracle()));
        console.log("feeSplitter():         ", newVault.feeSplitter());
        console.log("admin():               ", newVault.admin());

        // Verify goodDollar token has code at the address returned by vault
        address vaultGdToken = address(newVault.goodDollar());
        uint256 vaultGdTokenCodeSize;
        assembly { vaultGdTokenCodeSize := extcodesize(vaultGdToken) }
        console.log("Vault's GD token code: ", vaultGdTokenCodeSize, "bytes");

        require(vaultGdToken == CORRECT_GD_TOKEN, "Vault has wrong GD token!");
        require(vaultGdTokenCodeSize > 0, "Vault's GD token has no code!");

        console.log("\n=== SUCCESS: Vault fixed! ===");
        console.log("\nNext steps:");
        console.log("1. Update addresses.json CollateralVault entry");
        console.log("2. Test deposit/withdrawal operations");
        console.log("3. Update frontend configuration");
        console.log("4. Archive the broken vault entry");
    }
}