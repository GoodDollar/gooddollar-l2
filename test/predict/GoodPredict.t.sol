// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../../src/predict/ConditionalTokens.sol";
import "../../src/predict/MarketFactory.sol";
import "../../src/GoodDollarToken.sol";

// ============ Mock Fee Splitter for Predict ============

contract MockPredictFeeSplitter {
    GoodDollarToken public immutable token;
    uint256 public totalReceived;

    constructor(address _token) {
        token = GoodDollarToken(_token);
    }

    function splitFee(uint256 totalFee, address) external returns (uint256, uint256, uint256) {
        token.transferFrom(msg.sender, address(this), totalFee);
        totalReceived += totalFee;
        return (totalFee / 3, totalFee / 6, totalFee / 2);
    }
}

contract GoodPredictTest is Test {
    MarketFactory public factory;
    ConditionalTokens public tokens;
    GoodDollarToken public gd;

    address public admin = address(0xAD);
    address public alice = address(0xA1);
    address public bob = address(0xB0);
    address public resolver = address(0xBB);
    MockPredictFeeSplitter public feeSplitter;

    uint256 constant INITIAL_SUPPLY = 10_000_000e18;
    uint256 public endTime;
    uint256 public marketId;

    function setUp() public {
        gd = new GoodDollarToken(admin, admin, INITIAL_SUPPLY);
        feeSplitter = new MockPredictFeeSplitter(address(gd));
        factory = new MarketFactory(address(gd), address(feeSplitter), admin);
        tokens = factory.tokens();

        // Set a future end time
        endTime = block.timestamp + 7 days;

        // Create a market
        vm.prank(admin);
        marketId = factory.createMarket("Will ETH reach $5k by EOY?", endTime, resolver);

        // Fund alice and bob
        vm.prank(admin);
        gd.transfer(alice, 100_000e18);
        vm.prank(admin);
        gd.transfer(bob, 100_000e18);

        // Approve factory
        vm.prank(alice);
        gd.approve(address(factory), type(uint256).max);
        vm.prank(bob);
        gd.approve(address(factory), type(uint256).max);
    }

    // ============ ConditionalTokens ============

    function test_tokens_onlyFactoryCanMint() public {
        vm.prank(alice);
        vm.expectRevert(ConditionalTokens.NotFactory.selector);
        tokens.mint(alice, 0, 100e18);
    }

    function test_tokens_onlyFactoryCanBurn() public {
        vm.prank(alice);
        factory.buy(marketId, true, 100e18);

        uint256 yesId = tokens.yesTokenId(marketId);
        vm.prank(alice);
        vm.expectRevert(ConditionalTokens.NotFactory.selector);
        tokens.burn(alice, yesId, 100e18);
    }

    function test_tokens_transferBetweenUsers() public {
        vm.prank(alice);
        factory.buy(marketId, true, 100e18);

        uint256 yesId = tokens.yesTokenId(marketId);

        vm.prank(alice);
        tokens.safeTransferFrom(alice, bob, yesId, 50e18, "");

        assertEq(tokens.balanceOf(alice, yesId), 50e18);
        assertEq(tokens.balanceOf(bob, yesId), 50e18);
    }

    function test_tokens_approvalForAll() public {
        vm.prank(alice);
        tokens.setApprovalForAll(bob, true);
        assertTrue(tokens.isApprovedForAll(alice, bob));

        vm.prank(alice);
        factory.buy(marketId, true, 100e18);

        uint256 yesId = tokens.yesTokenId(marketId);
        vm.prank(bob);
        tokens.safeTransferFrom(alice, bob, yesId, 100e18, "");
        assertEq(tokens.balanceOf(bob, yesId), 100e18);
    }

    function test_tokens_batchTransfer() public {
        vm.prank(alice);
        factory.buy(marketId, true, 100e18);
        vm.prank(alice);
        factory.buy(marketId, false, 100e18);

        uint256[] memory ids = new uint256[](2);
        ids[0] = tokens.yesTokenId(marketId);
        ids[1] = tokens.noTokenId(marketId);

        uint256[] memory amounts = new uint256[](2);
        amounts[0] = 50e18;
        amounts[1] = 50e18;

        vm.prank(alice);
        tokens.safeBatchTransferFrom(alice, bob, ids, amounts, "");

        assertEq(tokens.balanceOf(bob, ids[0]), 50e18);
        assertEq(tokens.balanceOf(bob, ids[1]), 50e18);
    }

    // ============ MarketFactory: Creation ============

    function test_createMarket() public view {
        (string memory q, uint256 et, MarketFactory.MarketStatus status,,, ) = factory.getMarket(marketId);
        assertEq(q, "Will ETH reach $5k by EOY?");
        assertEq(et, endTime);
        assertEq(uint8(status), uint8(MarketFactory.MarketStatus.Open));
    }

    function test_createMarket_revertsExpiredEndTime() public {
        vm.prank(admin);
        vm.expectRevert(MarketFactory.MarketExpired.selector);
        factory.createMarket("Past question?", block.timestamp - 1, address(0));
    }

    function test_createMarket_onlyAdmin() public {
        vm.prank(alice);
        vm.expectRevert(MarketFactory.NotAdmin.selector);
        factory.createMarket("Question?", endTime + 1 days, address(0));
    }

    function test_createMarket_defaultResolver() public {
        vm.prank(admin);
        uint256 id = factory.createMarket("Test?", endTime + 1 days, address(0));
        // Resolver defaults to admin — can still resolve
        vm.warp(endTime + 2 days);
        factory.closeMarket(id);
        vm.prank(admin);
        factory.resolve(id, true); // admin resolves
        (, , MarketFactory.MarketStatus status,,,) = factory.getMarket(id);
        assertEq(uint8(status), uint8(MarketFactory.MarketStatus.ResolvedYES));
    }

    // ============ MarketFactory: marketCreators Allowlist ============

    function test_setMarketCreator_onlyAdmin() public {
        vm.prank(alice);
        vm.expectRevert(MarketFactory.NotAdmin.selector);
        factory.setMarketCreator(alice, true);
    }

    function test_setMarketCreator_zeroAddressReverts() public {
        vm.prank(admin);
        vm.expectRevert(MarketFactory.ZeroAddress.selector);
        factory.setMarketCreator(address(0), true);
    }

    function test_setMarketCreator_grantAllowsCreate() public {
        // alice cannot create
        vm.prank(alice);
        vm.expectRevert(MarketFactory.NotAdmin.selector);
        factory.createMarket("Pre-grant?", endTime + 1 days, address(0));

        // admin grants
        vm.prank(admin);
        factory.setMarketCreator(alice, true);
        assertTrue(factory.marketCreators(alice));

        // alice can now create
        vm.prank(alice);
        uint256 id = factory.createMarket("Post-grant?", endTime + 1 days, address(0));
        (, , MarketFactory.MarketStatus status,,,) = factory.getMarket(id);
        assertEq(uint8(status), uint8(MarketFactory.MarketStatus.Open));
    }

    function test_setMarketCreator_revokeBlocksCreate() public {
        vm.prank(admin);
        factory.setMarketCreator(alice, true);
        vm.prank(alice);
        factory.createMarket("First?", endTime + 1 days, address(0));

        // revoke
        vm.prank(admin);
        factory.setMarketCreator(alice, false);
        assertFalse(factory.marketCreators(alice));

        vm.prank(alice);
        vm.expectRevert(MarketFactory.NotAdmin.selector);
        factory.createMarket("Blocked?", endTime + 1 days, address(0));
    }

    function test_setMarketCreator_adminStillWorksWithoutSelfGrant() public {
        // Admin is always authorised, even without being explicitly added.
        assertFalse(factory.marketCreators(admin));
        vm.prank(admin);
        uint256 id = factory.createMarket("Admin?", endTime + 1 days, address(0));
        (, , MarketFactory.MarketStatus status,,,) = factory.getMarket(id);
        assertEq(uint8(status), uint8(MarketFactory.MarketStatus.Open));
    }

    function test_setMarketCreator_emitsEvent() public {
        vm.expectEmit(true, false, false, true);
        emit MarketFactory.MarketCreatorSet(alice, true);
        vm.prank(admin);
        factory.setMarketCreator(alice, true);
    }

    // ============ MarketFactory: Buying ============

    function test_buy_YES_tokens() public {
        vm.prank(alice);
        factory.buy(marketId, true, 100e18);

        uint256 yesId = tokens.yesTokenId(marketId);
        assertEq(tokens.balanceOf(alice, yesId), 100e18);

        (, , , uint256 totalYES,,) = factory.getMarket(marketId);
        assertEq(totalYES, 100e18);
    }

    function test_buy_NO_tokens() public {
        vm.prank(alice);
        factory.buy(marketId, false, 200e18);

        uint256 noId = tokens.noTokenId(marketId);
        assertEq(tokens.balanceOf(alice, noId), 200e18);
    }

    function test_buy_deductsGD() public {
        uint256 aliceBefore = gd.balanceOf(alice);
        vm.prank(alice);
        factory.buy(marketId, true, 500e18);
        assertEq(gd.balanceOf(alice), aliceBefore - 500e18);
    }

    function test_buy_revertsAfterEndTime() public {
        vm.warp(endTime + 1);
        vm.prank(alice);
        vm.expectRevert();
        factory.buy(marketId, true, 100e18);
    }

    function test_buy_revertsOnClosedMarket() public {
        vm.warp(endTime + 1);
        factory.closeMarket(marketId);

        vm.prank(alice);
        vm.expectRevert(bytes("MF: market is not open for trading"));
        factory.buy(marketId, true, 100e18);
    }

    function test_buy_zeroAmount_reverts() public {
        vm.prank(alice);
        vm.expectRevert(bytes("MF: amount must be greater than zero"));
        factory.buy(marketId, true, 0);
    }

    // ============ MarketFactory: Implied Probability ============
    //
    // FRONTEND INVARIANT (task 0075): the frontend in
    // `frontend/src/lib/useMarkets.ts` and the helper `bpsToYesPrice`
    // assume `impliedProbabilityYES` returns BPS (10_000 = 100%).
    // The Vitest suite
    // `frontend/src/lib/__tests__/useMarkets-bps.test.ts` mirrors the
    // 5000 / 7500 cases below and will silently drift if these contract
    // assertions are ever weakened. If you change the unit here, you
    // MUST update `BPS_DENOMINATOR` in `useMarkets.ts` in the same
    // commit, or every Predict market will render as "YES 0¢ / NO 100¢".

    function test_impliedProbability_noTradesIs50pct() public view {
        assertEq(factory.impliedProbabilityYES(marketId), 5000);
    }

    function test_impliedProbability_afterTrades() public {
        vm.prank(alice);
        factory.buy(marketId, true, 3000e18); // 3000 YES
        vm.prank(bob);
        factory.buy(marketId, false, 1000e18); // 1000 NO
        // 3000 / 4000 = 75%
        assertEq(factory.impliedProbabilityYES(marketId), 7500);
    }

    // ============ MarketFactory: Resolution ============

    function test_closeAndResolve_YES() public {
        vm.prank(alice);
        factory.buy(marketId, true, 300e18);
        vm.prank(bob);
        factory.buy(marketId, false, 100e18);

        vm.warp(endTime + 1);
        factory.closeMarket(marketId);

        vm.prank(resolver);
        factory.resolve(marketId, true);

        (, , MarketFactory.MarketStatus status,,,) = factory.getMarket(marketId);
        assertEq(uint8(status), uint8(MarketFactory.MarketStatus.ResolvedYES));
    }

    function test_closeMarket_revertsBeforeEndTime() public {
        vm.expectRevert(MarketFactory.MarketNotExpired.selector);
        factory.closeMarket(marketId);
    }

    function test_resolve_revertsNotClosed() public {
        vm.warp(endTime + 1);
        vm.prank(resolver);
        vm.expectRevert(MarketFactory.MarketNotClosed.selector);
        factory.resolve(marketId, true);
    }

    function test_resolve_revertsUnauthorized() public {
        vm.warp(endTime + 1);
        factory.closeMarket(marketId);

        vm.prank(alice); // not resolver or admin
        vm.expectRevert(MarketFactory.Unauthorized.selector);
        factory.resolve(marketId, true);
    }

    // ============ MarketFactory: Redemption ============

    function test_redeem_YES_wins() public {
        // Alice bets 300 YES, Bob bets 100 NO → total collateral 400 G$
        vm.prank(alice);
        factory.buy(marketId, true, 300e18);
        vm.prank(bob);
        factory.buy(marketId, false, 100e18);

        vm.warp(endTime + 1);
        factory.closeMarket(marketId);
        vm.prank(resolver);
        factory.resolve(marketId, true); // YES wins

        uint256 aliceBefore = gd.balanceOf(alice);
        vm.prank(alice);
        factory.redeem(marketId, 300e18);

        // Alice had 300/300 of YES supply → gets 400 G$ - 1% fee
        // fee = 400 * 1% = 4 G$; payout = 396 G$
        uint256 payout = 400e18 - (400e18 * 100) / 10000;
        assertEq(gd.balanceOf(alice), aliceBefore + payout);
    }

    function test_redeem_NO_wins() public {
        vm.prank(alice);
        factory.buy(marketId, true, 100e18);
        vm.prank(bob);
        factory.buy(marketId, false, 300e18);

        vm.warp(endTime + 1);
        factory.closeMarket(marketId);
        vm.prank(resolver);
        factory.resolve(marketId, false); // NO wins

        uint256 bobBefore = gd.balanceOf(bob);
        vm.prank(bob);
        factory.redeem(marketId, 300e18);

        // bob gets all collateral (400 G$) minus 1% fee
        uint256 payout = 400e18 - (400e18 * 100) / 10000;
        assertEq(gd.balanceOf(bob), bobBefore + payout);
    }

    function test_redeem_feeRoutedToSplitter() public {
        vm.prank(alice);
        factory.buy(marketId, true, 300e18);
        vm.prank(bob);
        factory.buy(marketId, false, 100e18);

        vm.warp(endTime + 1);
        factory.closeMarket(marketId);
        vm.prank(resolver);
        factory.resolve(marketId, true);

        uint256 splitterBefore = gd.balanceOf(address(feeSplitter));

        vm.prank(alice);
        factory.redeem(marketId, 300e18);

        assertGt(gd.balanceOf(address(feeSplitter)), splitterBefore);
    }

    function test_redeem_voided_market_returns1to1() public {
        vm.prank(alice);
        factory.buy(marketId, true, 200e18);
        vm.prank(bob);
        factory.buy(marketId, false, 100e18);

        vm.prank(admin);
        factory.voidMarket(marketId);

        // Alice redeems YES tokens — gets 1:1 back, no fee
        uint256 aliceBefore = gd.balanceOf(alice);
        vm.prank(alice);
        factory.redeem(marketId, 200e18);
        assertEq(gd.balanceOf(alice), aliceBefore + 200e18);
    }

    function test_redeem_revertsOnOpenMarket() public {
        vm.prank(alice);
        factory.buy(marketId, true, 100e18);

        vm.prank(alice);
        vm.expectRevert(MarketFactory.MarketNotResolved.selector);
        factory.redeem(marketId, 100e18);
    }

    function test_redeem_zeroAmount_reverts() public {
        vm.warp(endTime + 1);
        factory.closeMarket(marketId);
        vm.prank(resolver);
        factory.resolve(marketId, true);

        vm.prank(alice);
        vm.expectRevert(MarketFactory.ZeroAmount.selector);
        factory.redeem(marketId, 0);
    }

    // ============ Partial Redemption ============

    function test_redeem_partial_YES() public {
        vm.prank(alice);
        factory.buy(marketId, true, 300e18);
        vm.prank(bob);
        factory.buy(marketId, false, 100e18);

        vm.warp(endTime + 1);
        factory.closeMarket(marketId);
        vm.prank(resolver);
        factory.resolve(marketId, true);

        // Alice redeems half
        vm.prank(alice);
        factory.redeem(marketId, 150e18);

        uint256 yesId = tokens.yesTokenId(marketId);
        assertEq(tokens.balanceOf(alice, yesId), 150e18); // half left
    }

    // ============ Multiple Markets ============

    function test_multipleMarkets_independent() public {
        vm.prank(admin);
        uint256 m2 = factory.createMarket("Will SOL flip ETH?", endTime + 1 days, address(0));

        vm.prank(alice);
        factory.buy(marketId, true, 100e18);
        vm.prank(alice);
        factory.buy(m2, false, 200e18);

        assertEq(tokens.balanceOf(alice, tokens.yesTokenId(marketId)), 100e18);
        assertEq(tokens.balanceOf(alice, tokens.noTokenId(m2)), 200e18);
        assertEq(factory.marketCount(), 2);
    }
}
