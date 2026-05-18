// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";

import "../../src/GoodDollarToken.sol";
import "../../src/predict/PredictUBIFeeSplitter.sol";
// Stable and Stocks splitters both declare an `IUBIFeeSplitter` interface
// in their own files. Importing only the contract symbols sidesteps the
// duplicate-identifier collision at compile time.
import {StableUBIFeeSplitter} from "../../src/stable/StableUBIFeeSplitter.sol";
import {StocksUBIFeeSplitter} from "../../src/stocks/StocksUBIFeeSplitter.sol";
import {GoodLendToken} from "../../src/lending/GoodLendToken.sol";

/// @notice Minimal ERC-20 used only for the gUSD stand-in. Mirrors the
///         helper from iter 23's `UBIFeeIntegrationProofSwapPerps.t.sol`
///         — kept inline so the proof file is self-contained.
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
        uint256 a = allowance[from][msg.sender];
        if (a != type(uint256).max) {
            allowance[from][msg.sender] = a - amount;
        }
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }
}

/**
 * @title UBIFeeIntegrationProofPredictLendStableStocks
 * @notice Iteration 24 integration proof for the nine UBI fee routes
 *         flagged as `proof needed (iter 24)` in
 *         `docs/UBI-FEE-ACCOUNTING.md`:
 *
 *           6.  Predict — market redemption  (`PredictUBIFeeSplitter.splitFee`)
 *           7.  Predict — resolver bond      (`PredictUBIFeeSplitter.splitFee`)
 *           8.  Lend    — reserve factor    (`GoodLendToken.mintToTreasury`)
 *           9.  Stable  — stability fee     (`StableUBIFeeSplitter.splitStabilityFee`)
 *           10. Stable  — minting fee       (`StableUBIFeeSplitter.splitMintingFee`)
 *           11. Stable  — liquidation pen.  (`StableUBIFeeSplitter.splitLiquidationPenalty`)
 *           12. Stable  — governance fee    (`StableUBIFeeSplitter.splitGovernanceFee`)
 *           13. Stocks  — trading fee       (`StocksUBIFeeSplitter.splitMintFee` / `splitBurnFee`)
 *           14. Stocks  — liquidation rem.  (`StocksUBIFeeSplitter.splitLiquidationProceeds`)
 *
 *         Each route test asserts both the event emission AND the
 *         post-call UBI sink delta. Sinks are:
 *
 *           - Routes 6, 7, 13, 14 → `GoodDollarToken.ubiPool` counter
 *           - Route 8             → `gToken.balanceOf(treasury)`
 *           - Routes 9, 10, 11    → `gUSD.balanceOf(stableUbiRecipient)`
 *           - Route 12            → `gdollar.balanceOf(stableUbiRecipient)`
 *
 *         A tenth cumulative-totals test exercises all nine routes in
 *         sequence and asserts the aggregate sink deltas match the sum
 *         of the per-route expected shares — the "balance deltas" half
 *         of the 50-iteration plan's named-proof contract.
 *
 *         Sister file: `test/integration/UBIFeeIntegrationProofSwapPerps.t.sol`
 *         (iter 23, routes 1 – 5).
 */
contract UBIFeeIntegrationProofPredictLendStableStocks is Test {
    // ─── System under test ──────────────────────────────────────────────
    GoodDollarToken internal gdollar;
    PredictUBIFeeSplitter internal predictSplitter;
    StableUBIFeeSplitter internal stableSplitter;
    StocksUBIFeeSplitter internal stocksSplitter;
    GoodLendToken internal gLend;
    MockERC20 internal gUSD;
    MockERC20 internal lendUnderlying;

    // ─── Actors ─────────────────────────────────────────────────────────
    address internal admin = makeAddr("admin");
    address internal identityOracle = makeAddr("identityOracle");
    address internal treasury = makeAddr("treasury");
    address internal stableUbiRecipient = makeAddr("stableUbiRecipient");
    address internal lendUbiRecipient = makeAddr("lendUbiRecipient"); // treasury arg for mintToTreasury (= UBIFeeSplitter per truth-source doc)

    // Predict callers
    address internal marketFactory = makeAddr("marketFactory");
    address internal optimisticResolver = makeAddr("optimisticResolver");

    // Stable callers
    address internal vaultManager = makeAddr("vaultManager");
    address internal psm = makeAddr("psm");
    address internal liquidator = makeAddr("liquidator");
    address internal governance = makeAddr("governance");

    // Stocks callers
    address internal collateralVault = makeAddr("collateralVault");

    // Users / subjects
    address internal trader = makeAddr("trader");
    address internal mintingUser = makeAddr("mintingUser");
    address internal liquidatedUser = makeAddr("liquidatedUser");
    address internal proposer = makeAddr("proposer");

    // ─── Constants ──────────────────────────────────────────────────────
    // Splitter constants match each contract's declared defaults (asserted
    // in setUp below for safety against future drift).
    uint256 internal constant UBI_BPS = 2000;          // 20% to UBI
    uint256 internal constant PROTOCOL_BPS = 1667;     // 16.67% to treasury
    uint256 internal constant BPS_DENOM = 10_000;
    uint256 internal constant RAY = 1e27;              // matches GoodLendToken.RAY

    uint256 internal constant FUND_AMOUNT = 1_000_000e18;

    // Per-route fee inputs (chosen so 20% always divides cleanly).
    uint256 internal constant PREDICT_REDEMPTION_FEE = 100e18;
    uint256 internal constant PREDICT_BOND_FEE = 50e18;
    uint256 internal constant LEND_TREASURY_AMOUNT = 250e18;
    uint256 internal constant STABLE_STABILITY_FEE = 80e18;
    uint256 internal constant STABLE_MINTING_FEE = 60e18;
    uint256 internal constant STABLE_LIQUIDATION_PENALTY = 120e18;
    uint256 internal constant STABLE_GOVERNANCE_FEE = 40e18;
    uint256 internal constant STOCKS_TRADING_FEE = 30e18;
    uint256 internal constant STOCKS_LIQUIDATION_PROCEEDS = 200e18;

    bytes32 internal constant ETH_ILK = keccak256("ETH-A");
    bytes32 internal constant LIQ_ILK = keccak256("WBTC-A");

    // ─── Setup ──────────────────────────────────────────────────────────
    function setUp() public {
        // 1) GoodDollarToken with zero initial supply. Same pattern as
        //    iter 23: the test contract itself becomes a minter so we
        //    can fund any actor on demand.
        vm.startPrank(admin);
        gdollar = new GoodDollarToken(admin, identityOracle, 0);
        // Splitters must be deployed before being authorized as minters
        // so the `extcodesize > 0` guard in `setMinter` passes.
        predictSplitter = new PredictUBIFeeSplitter(address(gdollar), treasury, admin);
        stableSplitter = new StableUBIFeeSplitter(address(gdollar), treasury, admin);
        stocksSplitter = new StocksUBIFeeSplitter(address(gdollar), treasury, admin);
        gdollar.setMinter(address(this), true);
        // Use a distinct sink for Stable's non-G$ tokens so the
        // balance-delta proof is unambiguous (default == treasury would
        // conflate UBI and protocol shares for routes 9 – 12).
        stableSplitter.setUBIRecipient(stableUbiRecipient);
        vm.stopPrank();

        // 2) gUSD stand-in for stability / minting / liquidation routes.
        gUSD = new MockERC20("gUSD", "gUSD");

        // 3) GoodLendToken (gToken) for route 8. We pass `_pool =
        //    address(this)` so the test contract can drive
        //    `mintToTreasury` directly (the `onlyPool` modifier is the
        //    only access guard). The constructor calls
        //    `underlying.approve(pool, max)`, so we need an underlying
        //    that supports `approve` — our MockERC20 does.
        lendUnderlying = new MockERC20("LendUnderlying", "LU");
        gLend = new GoodLendToken(
            address(this),
            address(lendUnderlying),
            "GoodLend G$",
            "gG$"
        );

        // 4) Defensive sanity: declared splitter shares match the
        //    constants this file calculates expected sinks from. If a
        //    future PR changes the default BPS the test must fail loud,
        //    not silently miscompute expected shares.
        assertEq(predictSplitter.ubiBPS(), UBI_BPS, "predictSplitter.ubiBPS drift");
        assertEq(predictSplitter.protocolBPS(), PROTOCOL_BPS, "predictSplitter.protocolBPS drift");
        assertEq(stableSplitter.ubiBPS(), UBI_BPS, "stableSplitter.ubiBPS drift");
        assertEq(stableSplitter.protocolBPS(), PROTOCOL_BPS, "stableSplitter.protocolBPS drift");
        assertEq(stocksSplitter.ubiBPS(), UBI_BPS, "stocksSplitter.ubiBPS drift");
        assertEq(stocksSplitter.protocolBPS(), PROTOCOL_BPS, "stocksSplitter.protocolBPS drift");
        assertEq(stableSplitter.ubiRecipient(), stableUbiRecipient, "stableSplitter.ubiRecipient drift");

        // 5) Fund splitter callers with G$ + max approval.
        //    Predict: marketFactory (redemption), optimisticResolver (bond)
        //    Stable:  governance (route 12 uses G$ as the IERC20 token)
        //    Stocks:  collateralVault
        _fundAndApproveGDollar(marketFactory, address(predictSplitter));
        _fundAndApproveGDollar(optimisticResolver, address(predictSplitter));
        _fundAndApproveGDollar(governance, address(stableSplitter));
        _fundAndApproveGDollar(collateralVault, address(stocksSplitter));

        // 6) Fund gUSD callers + approvals.
        _fundAndApproveGUSD(vaultManager, address(stableSplitter));
        _fundAndApproveGUSD(psm, address(stableSplitter));
        _fundAndApproveGUSD(liquidator, address(stableSplitter));
    }

    // ─── Helpers ────────────────────────────────────────────────────────
    function _fundAndApproveGDollar(address actor, address spender) internal {
        gdollar.mint(actor, FUND_AMOUNT);
        vm.prank(actor);
        gdollar.approve(spender, type(uint256).max);
    }

    function _fundAndApproveGUSD(address actor, address spender) internal {
        gUSD.mint(actor, FUND_AMOUNT);
        vm.prank(actor);
        gUSD.approve(spender, type(uint256).max);
    }

    function _shares(uint256 totalFee)
        internal
        pure
        returns (uint256 ubiShare, uint256 protocolShare, uint256 dAppShare)
    {
        ubiShare = (totalFee * UBI_BPS) / BPS_DENOM;
        protocolShare = (totalFee * PROTOCOL_BPS) / BPS_DENOM;
        dAppShare = totalFee - ubiShare - protocolShare;
    }

    // ════════════════════════════════════════════════════════════════════
    // Route 6 — Predict market redemption (`PredictUBIFeeSplitter.splitFee`)
    // Caller: MarketFactory pattern (EOA stand-in)
    // Sink:   GoodDollarToken.ubiPool counter
    // Event:  FeeSplit(source, "redemption", totalFee, ubi, protocol, dApp)
    // ════════════════════════════════════════════════════════════════════
    function test_route6_predictMarketRedemption_emitsFeeSplitAndIncrementsUbiPool() public {
        (uint256 expectedUbi, uint256 expectedProtocol, uint256 expectedDApp) =
            _shares(PREDICT_REDEMPTION_FEE);

        uint256 ubiPoolBefore = gdollar.ubiPool();
        uint256 treasuryBefore = gdollar.balanceOf(treasury);
        uint256 callerBefore = gdollar.balanceOf(marketFactory);
        uint256 redemptionAccBefore = predictSplitter.totalRedemptionFees();
        uint256 ubiFromRedemptionAccBefore = predictSplitter.totalUBIFromRedemption();

        // Event proof — `source` (msg.sender) and `feeType` ("redemption")
        // are both indexed topics in PredictUBIFeeSplitter.FeeSplit.
        vm.expectEmit(true, true, false, true, address(predictSplitter));
        emit PredictUBIFeeSplitter.FeeSplit(
            marketFactory, "redemption", PREDICT_REDEMPTION_FEE, expectedUbi, expectedProtocol, expectedDApp
        );

        vm.prank(marketFactory);
        (uint256 ubiShare, uint256 protocolShare, uint256 dAppShare) =
            predictSplitter.splitFee(PREDICT_REDEMPTION_FEE, marketFactory);

        // Return-value proof
        assertEq(ubiShare, expectedUbi, "route6: ubiShare mismatch");
        assertEq(protocolShare, expectedProtocol, "route6: protocolShare mismatch");
        assertEq(dAppShare, expectedDApp, "route6: dAppShare mismatch");

        // Balance-delta proof — sink is GoodDollarToken.ubiPool counter
        assertEq(
            gdollar.ubiPool(),
            ubiPoolBefore + expectedUbi,
            "route6: GoodDollarToken.ubiPool counter must increase by ubiShare"
        );
        assertEq(
            gdollar.balanceOf(treasury),
            treasuryBefore + expectedProtocol,
            "route6: treasury must receive protocolShare"
        );
        // dApp share returns to marketFactory (the same EOA), so net
        // outflow equals (ubiShare + protocolShare).
        assertEq(
            gdollar.balanceOf(marketFactory),
            callerBefore - expectedUbi - expectedProtocol,
            "route6: marketFactory net outflow must equal ubiShare + protocolShare"
        );
        assertEq(
            predictSplitter.totalRedemptionFees(),
            redemptionAccBefore + PREDICT_REDEMPTION_FEE,
            "route6: totalRedemptionFees accumulator must match"
        );
        assertEq(
            predictSplitter.totalUBIFromRedemption(),
            ubiFromRedemptionAccBefore + expectedUbi,
            "route6: totalUBIFromRedemption accumulator must match"
        );
    }

    // ════════════════════════════════════════════════════════════════════
    // Route 7 — Predict resolver bond (`PredictUBIFeeSplitter.splitFee`)
    // Caller: OptimisticResolver pattern (EOA stand-in)
    // Sink:   GoodDollarToken.ubiPool counter
    // Event:  FeeSplit(source, "redemption", totalFee, ubi, protocol, dApp)
    //         (the splitter's `splitFee` always emits "redemption" — see
    //         src/predict/PredictUBIFeeSplitter.sol L114)
    // ════════════════════════════════════════════════════════════════════
    function test_route7_predictResolverBond_emitsFeeSplitAndIncrementsUbiPool() public {
        (uint256 expectedUbi, uint256 expectedProtocol, uint256 expectedDApp) =
            _shares(PREDICT_BOND_FEE);

        uint256 ubiPoolBefore = gdollar.ubiPool();
        uint256 callerBefore = gdollar.balanceOf(optimisticResolver);

        vm.expectEmit(true, true, false, true, address(predictSplitter));
        emit PredictUBIFeeSplitter.FeeSplit(
            optimisticResolver, "redemption", PREDICT_BOND_FEE, expectedUbi, expectedProtocol, expectedDApp
        );

        vm.prank(optimisticResolver);
        (uint256 ubiShare,,) = predictSplitter.splitFee(PREDICT_BOND_FEE, optimisticResolver);

        assertEq(ubiShare, expectedUbi, "route7: ubiShare mismatch");

        assertEq(
            gdollar.ubiPool(),
            ubiPoolBefore + expectedUbi,
            "route7: GoodDollarToken.ubiPool counter must increase by ubiShare"
        );
        assertEq(
            gdollar.balanceOf(optimisticResolver),
            callerBefore - expectedUbi - expectedProtocol,
            "route7: resolver net outflow must equal ubiShare + protocolShare"
        );
    }

    // ════════════════════════════════════════════════════════════════════
    // Route 8 — Lend reserve factor (`GoodLendToken.mintToTreasury`)
    // Caller: pool (test contract acts as the pool via `_pool = address(this)`)
    // Sink:   gToken.balanceOf(lendUbiRecipient)  [== UBIFeeSplitter per doc]
    // Events: Mint(to, amount, scaledAmount, index)
    //         Transfer(address(0), to, amount)
    // ════════════════════════════════════════════════════════════════════
    function test_route8_lendMintToTreasury_emitsMintAndIncrementsTreasuryBalance() public {
        // With index = RAY, scaledAmount == amount and gToken balanceOf
        // returns exactly `amount` (since balanceOf = scaled * index / RAY
        // and _currentIndex falls back to RAY when the staticcall to the
        // mock pool's getLiquidityIndex returns nothing).
        uint256 expectedScaled = (LEND_TREASURY_AMOUNT * RAY) / RAY;

        uint256 scaledBalBefore = gLend.scaledBalanceOf(lendUbiRecipient);
        uint256 balBefore = gLend.balanceOf(lendUbiRecipient);
        uint256 totalScaledBefore = gLend.scaledTotalSupply();

        // Event proof — Mint is the gToken's UBI-accrual event; Transfer
        // is the ERC-20-compatibility mirror. Mint indexes only `to`.
        vm.expectEmit(true, false, false, true, address(gLend));
        emit GoodLendToken.Mint(lendUbiRecipient, LEND_TREASURY_AMOUNT, expectedScaled, RAY);

        vm.expectEmit(true, true, false, true, address(gLend));
        emit GoodLendToken.Transfer(address(0), lendUbiRecipient, LEND_TREASURY_AMOUNT);

        // Test contract IS the pool — call mintToTreasury directly.
        gLend.mintToTreasury(lendUbiRecipient, LEND_TREASURY_AMOUNT, RAY);

        // Balance-delta proof — sink is gToken.balanceOf(treasury).
        assertEq(
            gLend.scaledBalanceOf(lendUbiRecipient),
            scaledBalBefore + expectedScaled,
            "route8: scaledBalanceOf(treasury) must increase by scaledAmount"
        );
        assertEq(
            gLend.balanceOf(lendUbiRecipient),
            balBefore + LEND_TREASURY_AMOUNT,
            "route8: gToken balanceOf(treasury) must increase by amount"
        );
        assertEq(
            gLend.scaledTotalSupply(),
            totalScaledBefore + expectedScaled,
            "route8: scaled total supply must increase by scaledAmount"
        );
    }

    // ════════════════════════════════════════════════════════════════════
    // Route 9 — Stable stability fee (`StableUBIFeeSplitter.splitStabilityFee`)
    // Caller: VaultManager pattern (EOA stand-in)
    // Sink:   gUSD.balanceOf(stableUbiRecipient)
    // Events: FeeSplit(source, "token", ..., gUSD) + StabilityFeeSplit(ilk, fee, ubi)
    // ════════════════════════════════════════════════════════════════════
    function test_route9_stableStabilityFee_emitsBothEventsAndIncrementsUbiRecipientGUSD() public {
        (uint256 expectedUbi, uint256 expectedProtocol, uint256 expectedDApp) =
            _shares(STABLE_STABILITY_FEE);

        uint256 ubiRecipientGUSDBefore = gUSD.balanceOf(stableUbiRecipient);
        uint256 treasuryGUSDBefore = gUSD.balanceOf(treasury);
        uint256 vaultMgrGUSDBefore = gUSD.balanceOf(vaultManager);
        uint256 stabilityAccBefore = stableSplitter.totalStabilityFees();
        uint256 ubiFromStabilityAccBefore = stableSplitter.totalUBIFromStability();

        // splitStabilityFee internally calls splitFeeToken, so TWO events
        // fire in order: FeeSplit first, then StabilityFeeSplit.
        vm.expectEmit(true, true, false, true, address(stableSplitter));
        emit StableUBIFeeSplitter.FeeSplit(
            vaultManager, "token", STABLE_STABILITY_FEE, expectedUbi, expectedProtocol, expectedDApp, address(gUSD)
        );
        vm.expectEmit(true, false, false, true, address(stableSplitter));
        emit StableUBIFeeSplitter.StabilityFeeSplit(ETH_ILK, STABLE_STABILITY_FEE, expectedUbi);

        vm.prank(vaultManager);
        (uint256 ubiShare,,) =
            stableSplitter.splitStabilityFee(STABLE_STABILITY_FEE, vaultManager, address(gUSD), ETH_ILK);

        assertEq(ubiShare, expectedUbi, "route9: ubiShare mismatch");

        // Balance-delta proof — sink is gUSD.balanceOf(stableUbiRecipient).
        assertEq(
            gUSD.balanceOf(stableUbiRecipient),
            ubiRecipientGUSDBefore + expectedUbi,
            "route9: stableUbiRecipient gUSD balance must increase by ubiShare"
        );
        assertEq(
            gUSD.balanceOf(treasury),
            treasuryGUSDBefore + expectedProtocol,
            "route9: treasury gUSD balance must increase by protocolShare"
        );
        // dApp share returns to vaultManager — net outflow == ubi + protocol.
        assertEq(
            gUSD.balanceOf(vaultManager),
            vaultMgrGUSDBefore - expectedUbi - expectedProtocol,
            "route9: vaultManager net gUSD outflow must equal ubiShare + protocolShare"
        );
        assertEq(
            stableSplitter.totalStabilityFees(),
            stabilityAccBefore + STABLE_STABILITY_FEE,
            "route9: totalStabilityFees accumulator must match"
        );
        assertEq(
            stableSplitter.totalUBIFromStability(),
            ubiFromStabilityAccBefore + expectedUbi,
            "route9: totalUBIFromStability accumulator must match"
        );
        assertEq(
            stableSplitter.stabilityFeesByIlk(ETH_ILK),
            STABLE_STABILITY_FEE,
            "route9: per-ilk stability fee accumulator must match"
        );
    }

    // ════════════════════════════════════════════════════════════════════
    // Route 10 — Stable minting fee (`StableUBIFeeSplitter.splitMintingFee`)
    // Caller: PSM pattern (EOA stand-in)
    // Sink:   gUSD.balanceOf(stableUbiRecipient)
    // Events: FeeSplit(source, "token", ..., gUSD) + MintingFeeSplit(user, dir, fee, ubi)
    // ════════════════════════════════════════════════════════════════════
    function test_route10_stableMintingFee_emitsBothEventsAndIncrementsUbiRecipientGUSD() public {
        (uint256 expectedUbi, uint256 expectedProtocol, uint256 expectedDApp) =
            _shares(STABLE_MINTING_FEE);

        uint256 ubiRecipientGUSDBefore = gUSD.balanceOf(stableUbiRecipient);
        uint256 mintingAccBefore = stableSplitter.totalMintingFees();
        uint256 ubiFromMintingAccBefore = stableSplitter.totalUBIFromMinting();
        string memory direction = "USDC_TO_GUSD";

        vm.expectEmit(true, true, false, true, address(stableSplitter));
        emit StableUBIFeeSplitter.FeeSplit(
            psm, "token", STABLE_MINTING_FEE, expectedUbi, expectedProtocol, expectedDApp, address(gUSD)
        );
        vm.expectEmit(true, true, false, true, address(stableSplitter));
        emit StableUBIFeeSplitter.MintingFeeSplit(mintingUser, direction, STABLE_MINTING_FEE, expectedUbi);

        vm.prank(psm);
        (uint256 ubiShare,,) = stableSplitter.splitMintingFee(
            STABLE_MINTING_FEE, psm, address(gUSD), mintingUser, direction
        );

        assertEq(ubiShare, expectedUbi, "route10: ubiShare mismatch");

        assertEq(
            gUSD.balanceOf(stableUbiRecipient),
            ubiRecipientGUSDBefore + expectedUbi,
            "route10: stableUbiRecipient gUSD balance must increase by ubiShare"
        );
        assertEq(
            stableSplitter.totalMintingFees(),
            mintingAccBefore + STABLE_MINTING_FEE,
            "route10: totalMintingFees accumulator must match"
        );
        assertEq(
            stableSplitter.totalUBIFromMinting(),
            ubiFromMintingAccBefore + expectedUbi,
            "route10: totalUBIFromMinting accumulator must match"
        );
        assertEq(
            stableSplitter.mintingFeesByUser(mintingUser),
            STABLE_MINTING_FEE,
            "route10: per-user minting fee accumulator must match"
        );
    }

    // ════════════════════════════════════════════════════════════════════
    // Route 11 — Stable liquidation penalty (`StableUBIFeeSplitter.splitLiquidationPenalty`)
    // Caller: liquidator pattern (EOA stand-in)
    // Sink:   gUSD.balanceOf(stableUbiRecipient)
    // Events: FeeSplit(source, "token", ..., gUSD) + LiquidationPenaltySplit(ilk, user, penalty, ubi)
    // ════════════════════════════════════════════════════════════════════
    function test_route11_stableLiquidationPenalty_emitsBothEventsAndIncrementsUbiRecipientGUSD() public {
        (uint256 expectedUbi, uint256 expectedProtocol, uint256 expectedDApp) =
            _shares(STABLE_LIQUIDATION_PENALTY);

        uint256 ubiRecipientGUSDBefore = gUSD.balanceOf(stableUbiRecipient);
        uint256 liqAccBefore = stableSplitter.totalLiquidationFees();
        uint256 ubiFromLiqAccBefore = stableSplitter.totalUBIFromLiquidations();

        vm.expectEmit(true, true, false, true, address(stableSplitter));
        emit StableUBIFeeSplitter.FeeSplit(
            liquidator, "token", STABLE_LIQUIDATION_PENALTY, expectedUbi, expectedProtocol, expectedDApp, address(gUSD)
        );
        vm.expectEmit(true, true, false, true, address(stableSplitter));
        emit StableUBIFeeSplitter.LiquidationPenaltySplit(
            LIQ_ILK, liquidatedUser, STABLE_LIQUIDATION_PENALTY, expectedUbi
        );

        vm.prank(liquidator);
        (uint256 ubiShare,,) = stableSplitter.splitLiquidationPenalty(
            STABLE_LIQUIDATION_PENALTY, liquidator, address(gUSD), LIQ_ILK, liquidatedUser
        );

        assertEq(ubiShare, expectedUbi, "route11: ubiShare mismatch");

        assertEq(
            gUSD.balanceOf(stableUbiRecipient),
            ubiRecipientGUSDBefore + expectedUbi,
            "route11: stableUbiRecipient gUSD balance must increase by ubiShare"
        );
        assertEq(
            stableSplitter.totalLiquidationFees(),
            liqAccBefore + STABLE_LIQUIDATION_PENALTY,
            "route11: totalLiquidationFees accumulator must match"
        );
        assertEq(
            stableSplitter.totalUBIFromLiquidations(),
            ubiFromLiqAccBefore + expectedUbi,
            "route11: totalUBIFromLiquidations accumulator must match"
        );
    }

    // ════════════════════════════════════════════════════════════════════
    // Route 12 — Stable governance fee (`StableUBIFeeSplitter.splitGovernanceFee`)
    // Caller: governance pattern (EOA stand-in)
    // Sink:   gdollar.balanceOf(stableUbiRecipient)  [G$ is the IERC20]
    // Events: FeeSplit(source, "token", ..., G$) + GovernanceFeeSplit(proposer, fee, ubi)
    // ════════════════════════════════════════════════════════════════════
    function test_route12_stableGovernanceFee_emitsBothEventsAndIncrementsUbiRecipientGDollar() public {
        (uint256 expectedUbi, uint256 expectedProtocol, uint256 expectedDApp) =
            _shares(STABLE_GOVERNANCE_FEE);

        // Route 12 uses G$ as the IERC20 token (per truth-source doc:
        // "ubiRecipient ERC-20 balance — G$ is just one of the
        // supported tokens"). This exercises the splitter's
        // splitFeeToken path with a real ERC-20 (G$), so the sink is
        // gdollar.balanceOf(stableUbiRecipient), NOT the ubiPool
        // counter (that counter is only bumped by fundUBIPool which is
        // the splitFee G$-overload's behavior, not splitFeeToken's).
        uint256 ubiRecipientGDBefore = gdollar.balanceOf(stableUbiRecipient);
        uint256 ubiPoolBefore = gdollar.ubiPool();
        uint256 treasuryGDBefore = gdollar.balanceOf(treasury);
        uint256 governanceGDBefore = gdollar.balanceOf(governance);
        uint256 govAccBefore = stableSplitter.totalGovernanceFees();
        uint256 ubiFromGovAccBefore = stableSplitter.totalUBIFromGovernance();

        vm.expectEmit(true, true, false, true, address(stableSplitter));
        emit StableUBIFeeSplitter.FeeSplit(
            governance, "token", STABLE_GOVERNANCE_FEE, expectedUbi, expectedProtocol, expectedDApp, address(gdollar)
        );
        vm.expectEmit(true, false, false, true, address(stableSplitter));
        emit StableUBIFeeSplitter.GovernanceFeeSplit(proposer, STABLE_GOVERNANCE_FEE, expectedUbi);

        vm.prank(governance);
        (uint256 ubiShare,,) = stableSplitter.splitGovernanceFee(
            STABLE_GOVERNANCE_FEE, governance, address(gdollar), proposer
        );

        assertEq(ubiShare, expectedUbi, "route12: ubiShare mismatch");

        // Sink delta — G$ balance of the ubiRecipient (NOT the ubiPool
        // counter, see comment above).
        assertEq(
            gdollar.balanceOf(stableUbiRecipient),
            ubiRecipientGDBefore + expectedUbi,
            "route12: stableUbiRecipient G$ balance must increase by ubiShare"
        );
        assertEq(
            gdollar.ubiPool(),
            ubiPoolBefore,
            "route12: ubiPool counter MUST NOT change - splitFeeToken does not call fundUBIPool"
        );
        assertEq(
            gdollar.balanceOf(treasury),
            treasuryGDBefore + expectedProtocol,
            "route12: treasury G$ balance must increase by protocolShare"
        );
        assertEq(
            gdollar.balanceOf(governance),
            governanceGDBefore - expectedUbi - expectedProtocol,
            "route12: governance net G$ outflow must equal ubiShare + protocolShare"
        );
        assertEq(
            stableSplitter.totalGovernanceFees(),
            govAccBefore + STABLE_GOVERNANCE_FEE,
            "route12: totalGovernanceFees accumulator must match"
        );
        assertEq(
            stableSplitter.totalUBIFromGovernance(),
            ubiFromGovAccBefore + expectedUbi,
            "route12: totalUBIFromGovernance accumulator must match"
        );
    }

    // ════════════════════════════════════════════════════════════════════
    // Route 13 — Stocks trading fee (`StocksUBIFeeSplitter.splitMintFee`)
    // Caller: CollateralVault pattern (EOA stand-in)
    // Sink:   GoodDollarToken.ubiPool counter
    // Events: FeeSplit(source, "trading", ...) + TradingFeeSplit(trader, asset, amount, ubi)
    // ════════════════════════════════════════════════════════════════════
    function test_route13_stocksTradingFee_emitsBothEventsAndIncrementsUbiPool() public {
        (uint256 expectedUbi, uint256 expectedProtocol, uint256 expectedDApp) =
            _shares(STOCKS_TRADING_FEE);

        uint256 ubiPoolBefore = gdollar.ubiPool();
        uint256 callerBefore = gdollar.balanceOf(collateralVault);
        uint256 treasuryBefore = gdollar.balanceOf(treasury);
        uint256 mintAccBefore = stocksSplitter.totalMintFees();
        uint256 ubiFromTradingBefore = stocksSplitter.totalUBIFromTrading();
        string memory asset = "AAPL";
        uint256 positionSize = 100e18;

        vm.expectEmit(true, true, false, true, address(stocksSplitter));
        emit StocksUBIFeeSplitter.FeeSplit(
            collateralVault, "trading", STOCKS_TRADING_FEE, expectedUbi, expectedProtocol, expectedDApp
        );
        vm.expectEmit(true, true, false, true, address(stocksSplitter));
        emit StocksUBIFeeSplitter.TradingFeeSplit(trader, asset, positionSize, expectedUbi);

        vm.prank(collateralVault);
        (uint256 ubiShare,,) = stocksSplitter.splitMintFee(
            STOCKS_TRADING_FEE, collateralVault, trader, asset, positionSize
        );

        assertEq(ubiShare, expectedUbi, "route13: ubiShare mismatch");

        assertEq(
            gdollar.ubiPool(),
            ubiPoolBefore + expectedUbi,
            "route13: GoodDollarToken.ubiPool counter must increase by ubiShare"
        );
        assertEq(
            gdollar.balanceOf(treasury),
            treasuryBefore + expectedProtocol,
            "route13: treasury must receive protocolShare"
        );
        assertEq(
            gdollar.balanceOf(collateralVault),
            callerBefore - expectedUbi - expectedProtocol,
            "route13: collateralVault net outflow must equal ubiShare + protocolShare"
        );
        assertEq(
            stocksSplitter.totalMintFees(),
            mintAccBefore + STOCKS_TRADING_FEE,
            "route13: totalMintFees accumulator must match"
        );
        assertEq(
            stocksSplitter.totalUBIFromTrading(),
            ubiFromTradingBefore + expectedUbi,
            "route13: totalUBIFromTrading accumulator must match"
        );
    }

    // ════════════════════════════════════════════════════════════════════
    // Route 14 — Stocks liquidation proceeds (`StocksUBIFeeSplitter.splitLiquidationProceeds`)
    // Caller: CollateralVault pattern (EOA stand-in)
    // Sink:   GoodDollarToken.ubiPool counter
    // Events: FeeSplit(source, "trading", ...) + LiquidationUBI(liquidatedUser, collateral, ubi)
    // ════════════════════════════════════════════════════════════════════
    function test_route14_stocksLiquidationProceeds_emitsBothEventsAndIncrementsUbiPool() public {
        (uint256 expectedUbi, uint256 expectedProtocol, uint256 expectedDApp) =
            _shares(STOCKS_LIQUIDATION_PROCEEDS);

        uint256 ubiPoolBefore = gdollar.ubiPool();
        uint256 callerBefore = gdollar.balanceOf(collateralVault);
        uint256 liqProceedsAccBefore = stocksSplitter.totalLiquidationProceeds();
        uint256 ubiFromLiqBefore = stocksSplitter.totalUBIFromLiquidations();

        vm.expectEmit(true, true, false, true, address(stocksSplitter));
        emit StocksUBIFeeSplitter.FeeSplit(
            collateralVault, "trading", STOCKS_LIQUIDATION_PROCEEDS, expectedUbi, expectedProtocol, expectedDApp
        );
        vm.expectEmit(true, false, false, true, address(stocksSplitter));
        emit StocksUBIFeeSplitter.LiquidationUBI(liquidatedUser, STOCKS_LIQUIDATION_PROCEEDS, expectedUbi);

        vm.prank(collateralVault);
        (uint256 ubiShare,,) = stocksSplitter.splitLiquidationProceeds(
            STOCKS_LIQUIDATION_PROCEEDS, collateralVault, liquidatedUser
        );

        assertEq(ubiShare, expectedUbi, "route14: ubiShare mismatch");

        assertEq(
            gdollar.ubiPool(),
            ubiPoolBefore + expectedUbi,
            "route14: GoodDollarToken.ubiPool counter must increase by ubiShare"
        );
        assertEq(
            gdollar.balanceOf(collateralVault),
            callerBefore - expectedUbi - expectedProtocol,
            "route14: collateralVault net outflow must equal ubiShare + protocolShare"
        );
        assertEq(
            stocksSplitter.totalLiquidationProceeds(),
            liqProceedsAccBefore + STOCKS_LIQUIDATION_PROCEEDS,
            "route14: totalLiquidationProceeds accumulator must match"
        );
        assertEq(
            stocksSplitter.totalUBIFromLiquidations(),
            ubiFromLiqBefore + expectedUbi,
            "route14: totalUBIFromLiquidations accumulator must match"
        );
    }

    // ════════════════════════════════════════════════════════════════════
    // Cumulative totals — exercise all nine routes in sequence and assert
    // the aggregate sink deltas match the sum of per-route expected shares.
    //
    // Aggregate sinks:
    //   - GoodDollarToken.ubiPool      ← routes 6, 7, 13, 14
    //   - gLend.balanceOf(treasury)    ← route 8
    //   - gUSD.balanceOf(ubiRecipient) ← routes 9, 10, 11
    //   - gdollar.balanceOf(ubiRecipient) ← route 12
    //
    // This is the "balance deltas" half of the named proof — the per-
    // route tests above prove each route in isolation; this test proves
    // that running them together composes correctly with no leakage.
    // ════════════════════════════════════════════════════════════════════
    function test_cumulative_allNineRoutes_aggregateDeltasMatch() public {
        // Pre-compute every per-route UBI share.
        (uint256 expUbi6,,)  = _shares(PREDICT_REDEMPTION_FEE);
        (uint256 expUbi7,,)  = _shares(PREDICT_BOND_FEE);
        // Route 8 has no protocol/dApp split — the full amount becomes
        // gToken balance at the treasury address.
        (uint256 expUbi9,,)  = _shares(STABLE_STABILITY_FEE);
        (uint256 expUbi10,,) = _shares(STABLE_MINTING_FEE);
        (uint256 expUbi11,,) = _shares(STABLE_LIQUIDATION_PENALTY);
        (uint256 expUbi12,,) = _shares(STABLE_GOVERNANCE_FEE);
        (uint256 expUbi13,,) = _shares(STOCKS_TRADING_FEE);
        (uint256 expUbi14,,) = _shares(STOCKS_LIQUIDATION_PROCEEDS);

        uint256 expectedUbiPoolDelta = expUbi6 + expUbi7 + expUbi13 + expUbi14;
        uint256 expectedGUSDDelta = expUbi9 + expUbi10 + expUbi11;
        uint256 expectedGDollarRecipientDelta = expUbi12;
        uint256 expectedGTokenTreasuryDelta = LEND_TREASURY_AMOUNT;

        uint256 ubiPoolBefore = gdollar.ubiPool();
        uint256 gUSDRecipientBefore = gUSD.balanceOf(stableUbiRecipient);
        uint256 gDollarRecipientBefore = gdollar.balanceOf(stableUbiRecipient);
        uint256 gTokenTreasuryBefore = gLend.balanceOf(lendUbiRecipient);

        // Route 6
        vm.prank(marketFactory);
        predictSplitter.splitFee(PREDICT_REDEMPTION_FEE, marketFactory);

        // Route 7
        vm.prank(optimisticResolver);
        predictSplitter.splitFee(PREDICT_BOND_FEE, optimisticResolver);

        // Route 8 (test contract acts as the pool)
        gLend.mintToTreasury(lendUbiRecipient, LEND_TREASURY_AMOUNT, RAY);

        // Route 9
        vm.prank(vaultManager);
        stableSplitter.splitStabilityFee(STABLE_STABILITY_FEE, vaultManager, address(gUSD), ETH_ILK);

        // Route 10
        vm.prank(psm);
        stableSplitter.splitMintingFee(STABLE_MINTING_FEE, psm, address(gUSD), mintingUser, "USDC_TO_GUSD");

        // Route 11
        vm.prank(liquidator);
        stableSplitter.splitLiquidationPenalty(
            STABLE_LIQUIDATION_PENALTY, liquidator, address(gUSD), LIQ_ILK, liquidatedUser
        );

        // Route 12 (G$ as the IERC20 token; sink is balance, not ubiPool)
        vm.prank(governance);
        stableSplitter.splitGovernanceFee(STABLE_GOVERNANCE_FEE, governance, address(gdollar), proposer);

        // Route 13
        vm.prank(collateralVault);
        stocksSplitter.splitMintFee(STOCKS_TRADING_FEE, collateralVault, trader, "AAPL", 100e18);

        // Route 14
        vm.prank(collateralVault);
        stocksSplitter.splitLiquidationProceeds(
            STOCKS_LIQUIDATION_PROCEEDS, collateralVault, liquidatedUser
        );

        // ─── Aggregate assertions ───────────────────────────────────────
        assertEq(
            gdollar.ubiPool() - ubiPoolBefore,
            expectedUbiPoolDelta,
            "cumulative: ubiPool delta must equal sum of routes 6+7+13+14 UBI shares"
        );
        assertEq(
            gUSD.balanceOf(stableUbiRecipient) - gUSDRecipientBefore,
            expectedGUSDDelta,
            "cumulative: stableUbiRecipient gUSD delta must equal sum of routes 9+10+11 UBI shares"
        );
        assertEq(
            gdollar.balanceOf(stableUbiRecipient) - gDollarRecipientBefore,
            expectedGDollarRecipientDelta,
            "cumulative: stableUbiRecipient G$ delta must equal route 12 UBI share"
        );
        assertEq(
            gLend.balanceOf(lendUbiRecipient) - gTokenTreasuryBefore,
            expectedGTokenTreasuryDelta,
            "cumulative: gLend treasury delta must equal route 8 mintToTreasury amount"
        );

        // Sanity: per-splitter accumulators add up to per-route expected shares.
        assertEq(
            predictSplitter.totalUBIFromRedemption(),
            expUbi6 + expUbi7,
            "cumulative: predict splitter UBI accumulator must equal routes 6+7"
        );
        assertEq(
            stableSplitter.totalUBIFromStability()
                + stableSplitter.totalUBIFromMinting()
                + stableSplitter.totalUBIFromLiquidations()
                + stableSplitter.totalUBIFromGovernance(),
            expUbi9 + expUbi10 + expUbi11 + expUbi12,
            "cumulative: stable splitter UBI accumulators must equal routes 9+10+11+12"
        );
        assertEq(
            stocksSplitter.totalUBIFromTrading() + stocksSplitter.totalUBIFromLiquidations(),
            expUbi13 + expUbi14,
            "cumulative: stocks splitter UBI accumulators must equal routes 13+14"
        );
    }

    // ════════════════════════════════════════════════════════════════════
    // IPool stub — the GoodLendToken's `_currentIndex()` does a staticcall
    // to `getLiquidityIndex(address)` on its `pool` and falls back to RAY
    // on failure. We could leave it unimplemented (the fallback already
    // returns RAY), but defining it explicitly documents the design and
    // future-proofs against the gToken adding return-data length checks.
    // ════════════════════════════════════════════════════════════════════
    function getLiquidityIndex(address) external pure returns (uint256) {
        return RAY;
    }
}
