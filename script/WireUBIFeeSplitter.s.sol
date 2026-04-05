// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";

interface IGoodPool {
    function setFeeBeneficiary(address beneficiary) external;
    function feeBeneficiary() external view returns (address);
}

interface IUBIClaimV2 {
    function setFeeSplitter(address _feeSplitter) external;
    function feeSplitter() external view returns (address);
}

interface IUBIFeeSplitter {
    function setGoodDollar(address _goodDollar) external;
    function goodDollar() external view returns (address);
}

/**
 * @notice Wire new UBIFeeSplitter to all GoodPool instances and UBIClaimV2.
 *         Also updates the splitter's internal GoodDollar token pointer so that
 *         claimableBalance() and releaseToUBI() always read the live GDT.
 *
 * Run after RedeployUBIAndLiFi.s.sol to complete the migration.
 * Re-run after any GoodDollarToken redeploy — pass GOOD_DOLLAR_TOKEN to update.
 *
 * GOO-243: deployed UBIFeeSplitter at 0xe7f172... was outdated (missing
 * claimableBalance/releaseToUBI). New splitter deployed by RedeployUBIAndLiFi:
 *   UBIFeeSplitter: 0xC0BF43A4Ca27e0976195E6661b099742f10507e5
 *
 * GOO-402: splitter's goodDollar() pointer was stale — claimableBalance()=0 and
 * releaseToUBI() reverted because the splitter was reading balance of the old GDT.
 * Fix: call setGoodDollar() here so re-running this script is sufficient after any
 * GDT redeploy.
 *
 * Usage:
 *   forge script script/WireUBIFeeSplitter.s.sol \
 *     --rpc-url http://localhost:8545 --broadcast
 *
 *   # With updated GDT address after a redeploy:
 *   GOOD_DOLLAR_TOKEN=0xNewGDTAddress \
 *   forge script script/WireUBIFeeSplitter.s.sol \
 *     --rpc-url http://localhost:8545 --broadcast
 */
contract WireUBIFeeSplitter is Script {
    // New UBIFeeSplitter (from RedeployUBIAndLiFi run 2026-04-04)
    address constant NEW_FEE_SPLITTER = 0xC0BF43A4Ca27e0976195E6661b099742f10507e5;

    // GoodPool instances (from CreateInitialPools deployment)
    address constant POOL_GD_WETH    = 0xA4899D35897033b927acFCf422bc745916139776;
    address constant POOL_GD_USDC    = 0xf953b3A269d80e3eB0F2947630Da976B896A8C5b;
    address constant POOL_WETH_USDC  = 0xAA292E8611aDF267e563f334Ee42320aC96D0463;

    // UBIClaimV2 (from RedeployGoodDollarToken run 2026-04-04)
    address constant UBI_CLAIM_V2    = 0x73C68f1f41e4890D06Ba3e71b9E9DfA555f1fb46;

    // Current canonical GDT — override via GOOD_DOLLAR_TOKEN env var after a redeploy
    address constant GDT_DEFAULT     = 0x36C02dA8a0983159322a80FFE9F24b1acfF8B570;

    function run() external {
        uint256 key = vm.envOr(
            "PRIVATE_KEY",
            uint256(0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80)
        );
        address gdToken = vm.envOr("GOOD_DOLLAR_TOKEN", GDT_DEFAULT);

        vm.startBroadcast(key);

        // 0. Update the splitter's internal GoodDollar pointer (GOO-402).
        //    Idempotent: safe to re-run even if already correct.
        IUBIFeeSplitter(NEW_FEE_SPLITTER).setGoodDollar(gdToken);
        console.log("UBIFeeSplitter.goodDollar updated to:", IUBIFeeSplitter(NEW_FEE_SPLITTER).goodDollar());

        // 1. Update feeBeneficiary on all three GoodPool instances
        IGoodPool(POOL_GD_WETH).setFeeBeneficiary(NEW_FEE_SPLITTER);
        console.log("SwapPoolGdWeth feeBeneficiary:", IGoodPool(POOL_GD_WETH).feeBeneficiary());

        IGoodPool(POOL_GD_USDC).setFeeBeneficiary(NEW_FEE_SPLITTER);
        console.log("SwapPoolGdUsdc feeBeneficiary:", IGoodPool(POOL_GD_USDC).feeBeneficiary());

        IGoodPool(POOL_WETH_USDC).setFeeBeneficiary(NEW_FEE_SPLITTER);
        console.log("SwapPoolWethUsdc feeBeneficiary:", IGoodPool(POOL_WETH_USDC).feeBeneficiary());

        // 2. Update UBIClaimV2's feeSplitter pointer
        IUBIClaimV2(UBI_CLAIM_V2).setFeeSplitter(NEW_FEE_SPLITTER);
        console.log("UBIClaimV2 feeSplitter:", IUBIClaimV2(UBI_CLAIM_V2).feeSplitter());

        vm.stopBroadcast();

        console.log("--- Wiring complete ---");
        console.log("New UBIFeeSplitter:", NEW_FEE_SPLITTER);
        console.log("GoodDollar token:  ", gdToken);
        console.log("Wired to: SwapPoolGdWeth, SwapPoolGdUsdc, SwapPoolWethUsdc, UBIClaimV2");
    }
}
