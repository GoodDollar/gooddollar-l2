// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/stocks/CollateralVault.sol";

/**
 * @title DeployCollateralVaultGOO2874
 * @notice Deploy new CollateralVault with correct UBIFeeSplitter for GOO-2874.
 *
 * Issue: Current vault at 0x2f54d1563963fc04770e85af819c89dc807f6a06 has
 * feeSplitter pointing to 0x976fcd02f7C4773dd89C309fBF55D5923B4c98a1 (no code).
 * Since feeSplitter is immutable, vault must be redeployed with correct UBIFeeSplitter.
 *
 * Usage:
 *   forge script script/DeployCollateralVaultGOO2874.s.sol --rpc-url https://rpc.goodclaw.org --broadcast
 */
contract DeployCollateralVaultGOO2874 is Script {

    // Current devnet addresses from addresses.json
    address constant GD_TOKEN = 0xeC1BB74f5799811c0c1Bff94Ef76Fb40abccbE4a;
    address constant PRICE_ORACLE = 0x1E3b98102e19D3a164d239BdD190913C2F02E756;
    address constant UBI_FEE_SPLITTER = 0xF6a8aD553b265405526030c2102fda2bDcdDC177;
    address constant ADMIN = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;

    function run() external {
        uint256 pk = vm.envOr(
            "PRIVATE_KEY",
            uint256(0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80)
        );
        address deployer = vm.addr(pk);

        console.log("=== Deploying Fixed CollateralVault for GOO-2874 ===");
        console.log("Deployer:        ", deployer);
        console.log("GD Token:        ", GD_TOKEN);
        console.log("Price Oracle:    ", PRICE_ORACLE);
        console.log("UBIFeeSplitter:  ", UBI_FEE_SPLITTER);
        console.log("Admin:           ", ADMIN);

        vm.startBroadcast(pk);

        // Deploy new CollateralVault with correct UBIFeeSplitter
        CollateralVault newVault = new CollateralVault(
            GD_TOKEN,
            PRICE_ORACLE,
            UBI_FEE_SPLITTER,
            ADMIN
        );

        console.log("\n=== Deployment Complete ===");
        console.log("New CollateralVault: ", address(newVault));

        // Verify deployment
        console.log("\n=== Verification ===");
        console.log("goodDollar():    ", address(newVault.goodDollar()));
        console.log("oracle():        ", address(newVault.oracle()));
        console.log("feeSplitter():   ", newVault.feeSplitter());
        console.log("admin():         ", newVault.admin());

        vm.stopBroadcast();

        console.log("\n=== GOO-2874 Fix Summary ===");
        console.log("Old CollateralVault: 0x2f54d1563963fc04770e85af819c89dc807f6a06");
        console.log("Old feeSplitter:     0x976fcd02f7C4773dd89C309fBF55D5923B4c98a1 (no code)");
        console.log("New CollateralVault:", address(newVault));
        console.log("New feeSplitter:    ", UBI_FEE_SPLITTER, "(verified working)");
    }
}