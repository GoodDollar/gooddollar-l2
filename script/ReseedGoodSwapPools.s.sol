// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "forge-std/interfaces/IERC20.sol";
import "./CreateInitialPools.s.sol"; // brings `GoodPool` into scope
import {GoodSwapRouter} from "../src/swap/GoodSwapRouter.sol";

/**
 * @title ReseedGoodSwapPools
 * @notice Deploys a fresh GoodSwapRouter, three GoodPools (GDT/WETH,
 *         GDT/USDC, WETH/USDC), wires each pool's UBI fee beneficiary
 *         to the live UBIFeeSplitter, seeds modest liquidity sized to
 *         fit the Anvil-deployer's actual balances, and registers each
 *         pool with the new router.
 *
 *         Required env:
 *           - PRIVATE_KEY    (Anvil account 0 — pool/router owner & seeder)
 *           - GDT            (current GoodDollar token address)
 *           - WETH           (devnet WETH9)
 *           - USDC           (devnet USDC mock)
 *           - FEE_SPLITTER   (live UBIFeeSplitter; receives 33.33% of swap fees)
 *
 *         Idempotency: this script always deploys new pools. Re-running it
 *         creates additional pools (only the LATEST registered pool wins for
 *         a given pair in the router registry). Drive it once per devnet.
 */
contract ReseedGoodSwapPools is Script {
    // ── Seed liquidity sized to fit deployer balances on the May 2026 devnet
    //    (deployer has 999_000_000 GDT, 950 WETH, 900_000 USDC).
    uint256 constant SEED_GDT_FOR_WETH_POOL  = 500_000e18; // 500k GDT
    uint256 constant SEED_WETH_FOR_GDT_POOL  =     500e18; // 500 WETH
    uint256 constant SEED_GDT_FOR_USDC_POOL  = 500_000e18; // 500k GDT
    uint256 constant SEED_USDC_FOR_GDT_POOL  =  500_000e6; // 500k USDC (6 decimals)
    uint256 constant SEED_WETH_FOR_USDC_POOL =     100e18; // 100 WETH
    uint256 constant SEED_USDC_FOR_WETH_POOL =  300_000e6; // 300k USDC

    function run() external {
        address gdt          = vm.envAddress("GDT");
        address weth         = vm.envAddress("WETH");
        address usdc         = vm.envAddress("USDC");
        address feeSplitter  = vm.envAddress("FEE_SPLITTER");
        uint256 pk           = vm.envUint("PRIVATE_KEY");
        address deployer     = vm.addr(pk);

        require(gdt          != address(0), "missing GDT env");
        require(weth         != address(0), "missing WETH env");
        require(usdc         != address(0), "missing USDC env");
        require(feeSplitter  != address(0), "missing FEE_SPLITTER env");

        console.log("Deployer:", deployer);
        console.log("GDT:", gdt);
        console.log("WETH:", weth);
        console.log("USDC:", usdc);
        console.log("FEE_SPLITTER:", feeSplitter);

        vm.startBroadcast(pk);

        // 1. Deploy a fresh router owned by deployer.
        GoodSwapRouter router = new GoodSwapRouter(deployer);

        // 2. Deploy three pools (constructor sorts tokens by address).
        GoodPool gdtWethPool  = new GoodPool(gdt,  weth, deployer);
        GoodPool gdtUsdcPool  = new GoodPool(gdt,  usdc, deployer);
        GoodPool wethUsdcPool = new GoodPool(weth, usdc, deployer);

        // 3. Set fee beneficiary so 33.33% of swap fees flow to UBI.
        gdtWethPool.setFeeBeneficiary(feeSplitter);
        gdtUsdcPool.setFeeBeneficiary(feeSplitter);
        wethUsdcPool.setFeeBeneficiary(feeSplitter);

        // 4. Seed liquidity. `addLiquidity(amountA, amountB)` follows the
        //    pool's canonical ordering, so we read tokenA() to map our
        //    (tokenX, tokenY) inputs onto (A, B).
        _approveAndAdd(gdtWethPool,  gdt,  weth, SEED_GDT_FOR_WETH_POOL,  SEED_WETH_FOR_GDT_POOL);
        _approveAndAdd(gdtUsdcPool,  gdt,  usdc, SEED_GDT_FOR_USDC_POOL,  SEED_USDC_FOR_GDT_POOL);
        _approveAndAdd(wethUsdcPool, weth, usdc, SEED_WETH_FOR_USDC_POOL, SEED_USDC_FOR_WETH_POOL);

        // 5. Register each pool with the new router.
        router.registerPool(address(gdtWethPool));
        router.registerPool(address(gdtUsdcPool));
        router.registerPool(address(wethUsdcPool));

        vm.stopBroadcast();

        // 6. Surface results so the deploy log doubles as a config artifact.
        console.log("=== ReseedGoodSwapPools - RESULTS ===");
        console.log("GoodSwapRouter:", address(router));
        console.log("Pool GDT/WETH:", address(gdtWethPool));
        console.log("Pool GDT/USDC:", address(gdtUsdcPool));
        console.log("Pool WETH/USDC:", address(wethUsdcPool));
    }

    function _approveAndAdd(
        GoodPool pool,
        address tokenX,
        address tokenY,
        uint256 amountX,
        uint256 amountY
    ) internal {
        IERC20(tokenX).approve(address(pool), amountX);
        IERC20(tokenY).approve(address(pool), amountY);
        if (tokenX == pool.tokenA()) {
            pool.addLiquidity(amountX, amountY);
        } else {
            pool.addLiquidity(amountY, amountX);
        }
    }
}
