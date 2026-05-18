// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";

import "../../src/GoodDollarToken.sol";
import "../../src/hooks/UBIFeeHook.sol";
// Named import — LiFiBridgeAggregator.sol also declares an `IERC20` interface
// which collides with forge-std's `IERC20` pulled in via GoodDollarToken.sol.
// Importing only the contract symbol avoids the duplicate-identifier error.
import {LiFiBridgeAggregator} from "../../src/swap/LiFiBridgeAggregator.sol";
import "../../src/perps/PerpUBIFeeSplitter.sol";

/// @notice Minimal ERC-20 used only for the Li.Fi route. Mirrors the helper
///         in `test/swap/LiFiBridgeAggregator.t.sol` — kept inline so the
///         integration proof file is self-contained.
contract MockERC20 {
    string public name;
    string public symbol;
    uint8 public decimals = 18;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    constructor(string memory _name, string memory _symbol) {
        name = _name;
        symbol = _symbol;
    }

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }
}

/**
 * @title UBIFeeIntegrationProofSwapPerps
 * @notice Iteration 23 integration proof for the five UBI fee routes flagged
 *         as `proof needed (iter 23)` in `docs/UBI-FEE-ACCOUNTING.md`:
 *
 *           1. Swap V4         — UBIFeeHook.afterSwap
 *           2. Swap Li.Fi      — LiFiBridgeAggregator.initiateSwap
 *           3. Perps trading   — PerpUBIFeeSplitter.splitFee
 *           4. Perps funding   — PerpUBIFeeSplitter.splitFundingFee
 *           5. Perps liquidation — PerpUBIFeeSplitter.splitLiquidationFee
 *
 *         Each route test asserts both the event emission AND the post-call
 *         UBI sink delta (the canonical `GoodDollarToken.ubiPool` counter for
 *         routes 1, 3-5; the ERC-20 balance of the `ubiFeeSplitter` EOA for
 *         route 2). A sixth cumulative-totals test exercises all five routes
 *         in sequence and asserts the aggregate sink deltas match the sum of
 *         the per-route expected shares — the "balance deltas" half of the
 *         50-iteration plan's named-proof contract.
 */
contract UBIFeeIntegrationProofSwapPerps is Test {
    // ─── System under test ──────────────────────────────────────────────
    GoodDollarToken internal gdollar;
    UBIFeeHook internal hook;
    LiFiBridgeAggregator internal lifi;
    PerpUBIFeeSplitter internal perpSplitter;
    MockERC20 internal usdc;

    // ─── Actors ─────────────────────────────────────────────────────────
    address internal admin = makeAddr("admin");
    address internal identityOracle = makeAddr("identityOracle");
    address internal treasury = makeAddr("treasury");
    address internal poolManager = makeAddr("poolManager");
    address internal perpEngine = makeAddr("perpEngine");
    address internal lifiSplitter = makeAddr("lifiSplitter"); // EOA acting as Li.Fi UBI sink
    address internal user = makeAddr("user");
    address internal trader = makeAddr("trader");
    address internal liquidator = makeAddr("liquidator");
    address internal liquidatedTrader = makeAddr("liquidatedTrader");
    address internal token1Addr = makeAddr("token1");

    // ─── Constants ──────────────────────────────────────────────────────
    uint256 internal constant HOOK_UBI_BPS = 2000;            // V4 hook UBI share = 20%
    uint256 internal constant PERP_UBI_BPS = 2000;            // Perp splitter UBI share = 20%
    uint256 internal constant LIFI_UBI_BPS_DEFAULT = 10;      // Li.Fi default 0.1% (set in ctor)
    uint256 internal constant LIFI_BPS_DENOMINATOR = 10_000;

    uint256 internal constant HOOK_OUTPUT_AMOUNT = 1_000e18;  // G$ output from a synthetic V4 swap
    uint256 internal constant LIFI_SWAP_AMOUNT = 1_000e18;    // USDC amount routed through Li.Fi
    uint256 internal constant PERP_TRADE_FEE = 10e18;         // 10 G$ trading fee
    uint256 internal constant PERP_FUNDING_FEE = 5e18;        // 5 G$ funding fee
    uint256 internal constant PERP_LIQ_FEE = 50e18;           // 50 G$ liquidation bonus

    // ─── Setup ──────────────────────────────────────────────────────────
    // Note: events for vm.expectEmit are referenced via qualified syntax
    // (e.g. `UBIFeeHook.UBIFeeCollected`) so the event selector (topic0)
    // exactly matches the contract's emitted event. This avoids the
    // identifier collision between UBIFeeHook.UBIFeeCollected and
    // LiFiBridgeAggregator.UBIFeeCollected without redeclaring locals.
    function setUp() public {
        // 1) Deploy GoodDollarToken with zero initial supply.
        //    Mirrors the proven pattern from test/PerpUBIFeeSplitter.t.sol:
        //    the test contract itself becomes a minter so the integration
        //    file can fund any actor on demand without colliding with
        //    fee-routing assertions.
        vm.startPrank(admin);
        gdollar = new GoodDollarToken(admin, identityOracle, 0);
        // Deploy contracts that need the token address first so we can
        // authorize them as minters before they spend.
        hook = new UBIFeeHook(poolManager, address(gdollar), HOOK_UBI_BPS, admin);
        perpSplitter = new PerpUBIFeeSplitter(address(gdollar), treasury, admin);
        gdollar.setMinter(address(this), true);
        vm.stopPrank();

        // 2) Li.Fi bridge aggregator — splitter target is a plain EOA.
        vm.prank(admin);
        lifi = new LiFiBridgeAggregator(admin, lifiSplitter);
        vm.startPrank(admin);
        usdc = new MockERC20("USDC", "USDC");
        lifi.setWhitelistedToken(address(usdc), true);
        vm.stopPrank();

        // 3) Fund all actors.
        // Hook needs G$ to `_transfer` into the GoodDollarToken contract via
        // `fundUBIPool` (which moves from msg.sender = hook).
        gdollar.mint(address(hook), 100_000e18);
        // perpEngine needs G$ + allowance to the splitter (which transferFroms
        // from msg.sender = perpEngine, then calls fundUBIPool moving from
        // splitter into the token contract).
        gdollar.mint(perpEngine, 100_000e18);
        vm.prank(perpEngine);
        gdollar.approve(address(perpSplitter), type(uint256).max);

        // Li.Fi user needs USDC + allowance to the aggregator.
        usdc.mint(user, 10_000e18);
        vm.prank(user);
        usdc.approve(address(lifi), type(uint256).max);
    }

    // ─── Helpers ────────────────────────────────────────────────────────
    function _makePoolKey(address c0, address c1) internal view returns (PoolKey memory) {
        return PoolKey({
            currency0: c0,
            currency1: c1,
            fee: 3000,
            tickSpacing: 60,
            hooks: address(hook)
        });
    }

    function _hookSwapParams() internal pure returns (SwapParams memory) {
        return SwapParams({
            zeroForOne: false, // output is currency0 = G$
            amountSpecified: 100e18,
            sqrtPriceLimitX96: 0
        });
    }

    function _hookDeltaWithGDollarOutput() internal pure returns (BalanceDelta memory) {
        return BalanceDelta({
            amount0: int128(int256(HOOK_OUTPUT_AMOUNT)), // 1000 G$ output (currency0 = G$)
            amount1: -int128(int256(100e18))
        });
    }

    // ════════════════════════════════════════════════════════════════════
    // Route 1 — Swap V4 (`UBIFeeHook.afterSwap`)
    // Sink: GoodDollarToken.ubiPool
    // Event: UBIFeeCollected(token, feeAmount, ubiShare, pool)
    // ════════════════════════════════════════════════════════════════════
    function test_route1_swapV4Hook_emitsEventAndIncrementsUbiPool() public {
        PoolKey memory key = _makePoolKey(address(gdollar), token1Addr);
        SwapParams memory params = _hookSwapParams();
        BalanceDelta memory delta = _hookDeltaWithGDollarOutput();

        uint256 expectedUbi = hook.calculateUBIFee(HOOK_OUTPUT_AMOUNT);
        assertEq(
            expectedUbi,
            (HOOK_OUTPUT_AMOUNT * HOOK_UBI_BPS) / 10_000,
            "route1: expected UBI share mismatch with declared 20% BPS"
        );

        uint256 ubiPoolBefore = gdollar.ubiPool();
        uint256 tokenContractBalBefore = gdollar.balanceOf(address(gdollar));

        // Event proof
        vm.expectEmit(true, true, false, true, address(hook));
        emit UBIFeeHook.UBIFeeCollected(address(gdollar), HOOK_OUTPUT_AMOUNT, expectedUbi, address(gdollar));

        vm.prank(poolManager);
        hook.afterSwap(user, key, params, delta, "");

        // Balance-delta proof
        assertEq(
            gdollar.ubiPool(),
            ubiPoolBefore + expectedUbi,
            "route1: GoodDollarToken.ubiPool counter must increase by ubiShare"
        );
        assertEq(
            gdollar.balanceOf(address(gdollar)),
            tokenContractBalBefore + expectedUbi,
            "route1: GoodDollarToken contract must custody ubiShare in G$"
        );
        assertEq(
            hook.totalUBIFees(address(gdollar)),
            expectedUbi,
            "route1: hook totalUBIFees accumulator must match"
        );
    }

    // ════════════════════════════════════════════════════════════════════
    // Route 2 — Swap Li.Fi (`LiFiBridgeAggregator.initiateSwap`)
    // Sink: ERC-20 balance of `ubiFeeSplitter` EOA
    // Event: UBIFeeCollected(swapId, token, amount)
    // ════════════════════════════════════════════════════════════════════
    function test_route2_swapLiFi_emitsEventAndTransfersFeeToSplitter() public {
        uint256 expectedFee = (LIFI_SWAP_AMOUNT * LIFI_UBI_BPS_DEFAULT) / LIFI_BPS_DENOMINATOR;
        uint256 splitterBalBefore = usdc.balanceOf(lifiSplitter);
        uint256 swapIdBefore = lifi.swapCount();

        // Event proof — swapId is the first to be emitted (== swapCount()).
        vm.expectEmit(true, false, false, true, address(lifi));
        emit LiFiBridgeAggregator.UBIFeeCollected(swapIdBefore, address(usdc), expectedFee);

        vm.prank(user);
        uint256 swapId = lifi.initiateSwap(
            address(usdc),
            LIFI_SWAP_AMOUNT,
            1, // Ethereum mainnet (default-supported chain)
            address(0xBEEF), // dest token
            user, // dest receiver
            (LIFI_SWAP_AMOUNT * 95) / 100, // 5% slippage tolerance
            block.timestamp + 3600
        );

        assertEq(swapId, swapIdBefore, "route2: swapId must match pre-call swapCount()");

        // Balance-delta proof — the splitter EOA must hold the fee in the
        // source token. The Li.Fi route does NOT auto-convert to G$, so the
        // ubiPool counter is untouched here (this is by design, documented
        // in docs/UBI-FEE-ACCOUNTING.md).
        assertEq(
            usdc.balanceOf(lifiSplitter),
            splitterBalBefore + expectedFee,
            "route2: ubiFeeSplitter EOA must receive fee in srcToken"
        );
        assertEq(
            usdc.balanceOf(address(lifi)),
            LIFI_SWAP_AMOUNT - expectedFee,
            "route2: aggregator escrows netAmount after fee skim"
        );
    }

    // ════════════════════════════════════════════════════════════════════
    // Route 3 — Perps trading (`PerpUBIFeeSplitter.splitFee`)
    // Sink: GoodDollarToken.ubiPool
    // Event: FeeSplit(source, "trading", totalFee, ubiShare, protocolShare, dAppShare)
    // ════════════════════════════════════════════════════════════════════
    function test_route3_perpTrading_emitsFeeSplitAndIncrementsUbiPool() public {
        uint256 expectedUbi = (PERP_TRADE_FEE * PERP_UBI_BPS) / 10_000;
        uint256 expectedProtocol = (PERP_TRADE_FEE * perpSplitter.protocolBPS()) / 10_000;
        uint256 expectedDApp = PERP_TRADE_FEE - expectedUbi - expectedProtocol;

        uint256 ubiPoolBefore = gdollar.ubiPool();
        uint256 treasuryBefore = gdollar.balanceOf(treasury);
        uint256 perpEngineBefore = gdollar.balanceOf(perpEngine);

        vm.expectEmit(true, true, false, true, address(perpSplitter));
        emit PerpUBIFeeSplitter.FeeSplit(perpEngine, "trading", PERP_TRADE_FEE, expectedUbi, expectedProtocol, expectedDApp);

        vm.prank(perpEngine);
        (uint256 ubiShare, uint256 protocolShare, uint256 dAppShare) =
            perpSplitter.splitFee(PERP_TRADE_FEE, perpEngine);

        // Return-value proof
        assertEq(ubiShare, expectedUbi, "route3: ubiShare mismatch");
        assertEq(protocolShare, expectedProtocol, "route3: protocolShare mismatch");
        assertEq(dAppShare, expectedDApp, "route3: dAppShare mismatch");

        // Balance-delta proof
        assertEq(
            gdollar.ubiPool(),
            ubiPoolBefore + expectedUbi,
            "route3: GoodDollarToken.ubiPool counter must increase by ubiShare"
        );
        assertEq(
            gdollar.balanceOf(treasury),
            treasuryBefore + expectedProtocol,
            "route3: treasury must receive protocolShare"
        );
        // dApp share is returned to perpEngine — i.e. perpEngine pays totalFee
        // but receives dAppShare back, so net outflow is (ubiShare + protocolShare).
        assertEq(
            gdollar.balanceOf(perpEngine),
            perpEngineBefore - expectedUbi - expectedProtocol,
            "route3: perpEngine net outflow must equal ubiShare + protocolShare"
        );
    }

    // ════════════════════════════════════════════════════════════════════
    // Route 4 — Perps funding (`PerpUBIFeeSplitter.splitFundingFee`)
    // Sink: GoodDollarToken.ubiPool
    // Event: FundingFeeSplit(marketId, fundingAmount, ubiShare)
    // ════════════════════════════════════════════════════════════════════
    function test_route4_perpFunding_emitsFundingFeeSplitAndIncrementsUbiPool() public {
        uint256 marketId = 42;
        uint256 expectedUbi = (PERP_FUNDING_FEE * PERP_UBI_BPS) / 10_000;

        uint256 ubiPoolBefore = gdollar.ubiPool();
        uint256 totalFundingFeesBefore = perpSplitter.totalFundingFees();
        uint256 totalUBIFromFundingBefore = perpSplitter.totalUBIFromFunding();

        vm.expectEmit(true, false, false, true, address(perpSplitter));
        emit PerpUBIFeeSplitter.FundingFeeSplit(marketId, PERP_FUNDING_FEE, expectedUbi);

        vm.prank(perpEngine);
        (uint256 ubiShare,,) = perpSplitter.splitFundingFee(PERP_FUNDING_FEE, perpEngine, marketId);

        assertEq(ubiShare, expectedUbi, "route4: ubiShare mismatch");

        // Balance-delta proof
        assertEq(
            gdollar.ubiPool(),
            ubiPoolBefore + expectedUbi,
            "route4: GoodDollarToken.ubiPool counter must increase by ubiShare"
        );
        assertEq(
            perpSplitter.totalFundingFees(),
            totalFundingFeesBefore + PERP_FUNDING_FEE,
            "route4: totalFundingFees accumulator must match"
        );
        assertEq(
            perpSplitter.totalUBIFromFunding(),
            totalUBIFromFundingBefore + expectedUbi,
            "route4: totalUBIFromFunding accumulator must match"
        );
    }

    // ════════════════════════════════════════════════════════════════════
    // Route 5 — Perps liquidation (`PerpUBIFeeSplitter.splitLiquidationFee`)
    // Sink: GoodDollarToken.ubiPool
    // Event: LiquidationUBI(liquidator, liquidatedTrader, liquidationBonus, ubiShare)
    // ════════════════════════════════════════════════════════════════════
    function test_route5_perpLiquidation_emitsLiquidationUBIAndIncrementsUbiPool() public {
        uint256 expectedUbi = (PERP_LIQ_FEE * PERP_UBI_BPS) / 10_000;

        uint256 ubiPoolBefore = gdollar.ubiPool();
        uint256 totalLiqBefore = perpSplitter.totalLiquidationFees();
        uint256 totalUBIFromLiqBefore = perpSplitter.totalUBIFromLiquidations();
        uint256 liquidatorContribBefore = perpSplitter.liquidatorContributions(liquidator);

        vm.expectEmit(true, true, false, true, address(perpSplitter));
        emit PerpUBIFeeSplitter.LiquidationUBI(liquidator, liquidatedTrader, PERP_LIQ_FEE, expectedUbi);

        vm.prank(perpEngine);
        (uint256 ubiShare,,) = perpSplitter.splitLiquidationFee(
            PERP_LIQ_FEE,
            perpEngine,
            liquidator,
            liquidatedTrader
        );

        assertEq(ubiShare, expectedUbi, "route5: ubiShare mismatch");

        // Balance-delta proof
        assertEq(
            gdollar.ubiPool(),
            ubiPoolBefore + expectedUbi,
            "route5: GoodDollarToken.ubiPool counter must increase by ubiShare"
        );
        assertEq(
            perpSplitter.totalLiquidationFees(),
            totalLiqBefore + PERP_LIQ_FEE,
            "route5: totalLiquidationFees accumulator must match"
        );
        assertEq(
            perpSplitter.totalUBIFromLiquidations(),
            totalUBIFromLiqBefore + expectedUbi,
            "route5: totalUBIFromLiquidations accumulator must match"
        );
        assertEq(
            perpSplitter.liquidatorContributions(liquidator),
            liquidatorContribBefore + expectedUbi,
            "route5: liquidatorContributions accumulator must match"
        );
    }

    // ════════════════════════════════════════════════════════════════════
    // Cumulative totals — exercise routes 1, 3, 4, 5 in sequence and assert
    // the aggregate `ubiPool` delta equals the sum of the per-route expected
    // shares, PLUS the Li.Fi splitter EOA holds its expected USDC fee.
    // This is the "balance deltas" half of the named proof.
    // ════════════════════════════════════════════════════════════════════
    function test_cumulative_allFiveRoutes_aggregateDeltasMatch() public {
        uint256 expectedHookUbi = hook.calculateUBIFee(HOOK_OUTPUT_AMOUNT);
        uint256 expectedTradeUbi = (PERP_TRADE_FEE * PERP_UBI_BPS) / 10_000;
        uint256 expectedFundingUbi = (PERP_FUNDING_FEE * PERP_UBI_BPS) / 10_000;
        uint256 expectedLiqUbi = (PERP_LIQ_FEE * PERP_UBI_BPS) / 10_000;
        uint256 expectedLiFiFee = (LIFI_SWAP_AMOUNT * LIFI_UBI_BPS_DEFAULT) / LIFI_BPS_DENOMINATOR;

        uint256 ubiPoolBefore = gdollar.ubiPool();
        uint256 splitterBalBefore = usdc.balanceOf(lifiSplitter);

        // Route 1: V4 hook
        {
            PoolKey memory key = _makePoolKey(address(gdollar), token1Addr);
            SwapParams memory params = _hookSwapParams();
            BalanceDelta memory delta = _hookDeltaWithGDollarOutput();
            vm.prank(poolManager);
            hook.afterSwap(user, key, params, delta, "");
        }

        // Route 2: Li.Fi
        vm.prank(user);
        lifi.initiateSwap(
            address(usdc),
            LIFI_SWAP_AMOUNT,
            1,
            address(0xBEEF),
            user,
            (LIFI_SWAP_AMOUNT * 95) / 100,
            block.timestamp + 3600
        );

            // Route 3: Perps trading — use the trading-specific entrypoint
            // (`splitTradingFee`) so `totalUBIFromTrading` is updated. The
            // plain `splitFee` path is verified in test_route3_* above for the
            // event/UBI-pool assertions; this cumulative test exercises the
            // production code path that wires up the per-source accumulators.
            vm.prank(perpEngine);
            perpSplitter.splitTradingFee(PERP_TRADE_FEE, perpEngine, trader, 1, 100e18);

        // Route 4: Perps funding
        vm.prank(perpEngine);
        perpSplitter.splitFundingFee(PERP_FUNDING_FEE, perpEngine, 1);

        // Route 5: Perps liquidation
        vm.prank(perpEngine);
        perpSplitter.splitLiquidationFee(PERP_LIQ_FEE, perpEngine, liquidator, liquidatedTrader);

        // Aggregate G$ ubiPool delta = hook + trade + funding + liquidation
        uint256 expectedUbiPoolDelta = expectedHookUbi + expectedTradeUbi + expectedFundingUbi + expectedLiqUbi;
        assertEq(
            gdollar.ubiPool() - ubiPoolBefore,
            expectedUbiPoolDelta,
            "cumulative: aggregate ubiPool delta must equal sum of per-route UBI shares (routes 1,3,4,5)"
        );

        // Li.Fi splitter holds its USDC fee separately (not in G$).
        assertEq(
            usdc.balanceOf(lifiSplitter) - splitterBalBefore,
            expectedLiFiFee,
            "cumulative: Li.Fi splitter EOA must hold expectedLiFiFee in USDC"
        );

        // Sanity: per-source accumulators inside the Perp splitter add up.
        assertEq(
            perpSplitter.totalUBIFromTrading()
                + perpSplitter.totalUBIFromFunding()
                + perpSplitter.totalUBIFromLiquidations(),
            expectedTradeUbi + expectedFundingUbi + expectedLiqUbi,
            "cumulative: perp splitter UBI accumulators must equal route 3+4+5 expected shares"
        );

        // Sanity: hook accumulator equals route 1 expected share.
        assertEq(
            hook.totalUBIFees(address(gdollar)),
            expectedHookUbi,
            "cumulative: hook UBI accumulator must equal route 1 expected share"
        );
    }
}
