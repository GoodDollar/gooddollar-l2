// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/swap/GoodSwapRouter.sol";

/**
 * @title RegisterSwapRouter
 * @notice Deploys GoodSwapRouter and registers the three live devnet liquidity pools.
 *
 *         Run after CreateInitialPools.s.sol has seeded the pools.
 *
 * Usage (devnet):
 *   PRIVATE_KEY=<key> forge script script/RegisterSwapRouter.s.sol \
 *     --rpc-url $DEVNET_RPC --broadcast --legacy
 */
contract RegisterSwapRouter is Script {
    // Live devnet pool addresses (from CreateInitialPools broadcast)
    address constant POOL_GD_WETH   = 0xA4899D35897033b927acFCf422bc745916139776;
    address constant POOL_GD_USDC   = 0xf953b3A269d80e3eB0F2947630Da976B896A8C5b;
    address constant POOL_WETH_USDC = 0xAA292E8611aDF267e563f334Ee42320aC96D0463;

    function run() external {
        uint256 deployerKey = vm.envOr(
            "PRIVATE_KEY",
            uint256(0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80)
        );
        address deployer = vm.addr(deployerKey);

        vm.startBroadcast(deployerKey);

        // Deploy router with deployer as owner
        GoodSwapRouter router = new GoodSwapRouter(deployer);

        // Register all three pools — reads tokenA/tokenB from each pool
        router.registerPool(POOL_GD_WETH);
        router.registerPool(POOL_GD_USDC);
        router.registerPool(POOL_WETH_USDC);

        vm.stopBroadcast();

        console.log("=== GoodSwapRouter Deployed ===");
        console.log("GoodSwapRouter:", address(router));
        console.log("");
        console.log("Pools registered:");
        console.log("  G$/WETH  :", POOL_GD_WETH);
        console.log("  G$/USDC  :", POOL_GD_USDC);
        console.log("  WETH/USDC:", POOL_WETH_USDC);
        console.log("");
        console.log("Update frontend/src/lib/devnet.ts GoodSwapRouter to:", address(router));
    }
}
