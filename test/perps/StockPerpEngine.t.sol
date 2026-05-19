// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../../src/perps/StockPerpEngine.sol";
import "../../src/perps/MarginVault.sol";
import "../../src/perps/FundingRate.sol";
import "../../src/GoodDollarToken.sol";

// ─── Mock Oracle (implements IPriceOraclePerp) ───

contract MockStockOracle {
    mapping(bytes32 => uint256) public prices;

    function setPrice(bytes32 key, uint256 price) external {
        prices[key] = price;
    }

    function getPriceByKey(bytes32 key) external view returns (uint256) {
        return prices[key];
    }
}

// ─── Mock Fee Splitter (implements IStockFeeSplitter) ───

contract MockStockFeeSplitter {
    address public gdToken;
    uint256 public totalReceived;

    constructor(address _gd) {
        gdToken = _gd;
    }

    function goodDollar() external view returns (address) {
        return gdToken;
    }

    function splitFee(uint256 totalFee, address to) external returns (uint256, uint256, uint256) {
        GoodDollarToken(gdToken).transferFrom(msg.sender, address(this), totalFee);
        totalReceived += totalFee;
        uint256 ubiShare = totalFee / 3;
        uint256 protocolShare = totalFee / 6;
        uint256 dAppShare = totalFee - ubiShare - protocolShare;
        GoodDollarToken(gdToken).transfer(to, dAppShare);
        return (ubiShare, protocolShare, dAppShare);
    }
}

contract StockPerpEngineTest is Test {
    GoodDollarToken public gd;
    MarginVault public vault;
    FundingRate public fundingRate;
    StockPerpEngine public engine;
    MockStockOracle public oracle;
    MockStockFeeSplitter public feeSplitter;

    address public admin = address(0xAD);
    address public alice = address(0xA1);
    address public bob = address(0xB0);

    uint256 constant SUPPLY = 100_000_000e18;
    uint256 constant AAPL_PRICE = 19000_00000000; // $190.00 (8 decimals)
    uint256 constant TSLA_PRICE = 25000_00000000; // $250.00

    bytes32 public aaplMarkKey;
    bytes32 public aaplIndexKey;
    uint256 public aaplMarketId;

    function setUp() public {
        gd = new GoodDollarToken(admin, admin, SUPPLY);
        oracle = new MockStockOracle();
        feeSplitter = new MockStockFeeSplitter(address(gd));

        vault = new MarginVault(address(gd), admin);
        fundingRate = new FundingRate(admin);
        engine = new StockPerpEngine(
            address(vault),
            address(fundingRate),
            address(oracle),
            address(feeSplitter),
            admin
        );

        vm.prank(admin);
        vault.setPerpEngine(address(engine));
        vm.prank(admin);
        fundingRate.setPerpEngine(address(engine));

        aaplMarkKey = keccak256(abi.encodePacked("AAPL_MARK"));
        aaplIndexKey = keccak256(abi.encodePacked("AAPL_INDEX"));
        oracle.setPrice(aaplMarkKey, AAPL_PRICE);
        oracle.setPrice(aaplIndexKey, AAPL_PRICE);

        vm.prank(admin);
        aaplMarketId = engine.createMarket(
            "AAPL", aaplMarkKey, aaplIndexKey,
            10, // maxLeverage 10x
            1_000_000e18, // maxOI
            500, // maintenanceMarginBps 5%
            50 // fundingRateCapBps
        );

        vm.prank(admin);
        gd.transfer(alice, 10_000_000e18);
        vm.prank(admin);
        gd.transfer(bob, 10_000_000e18);

        _depositMargin(alice, 1_000_000e18);
        _depositMargin(bob, 1_000_000e18);
    }

    function _depositMargin(address user, uint256 amount) internal {
        vm.startPrank(user);
        gd.approve(address(vault), amount);
        vault.deposit(amount);
        vm.stopPrank();
    }

    // ═══════════════════════════════════════════
    // Market creation
    // ═══════════════════════════════════════════

    function test_createMarket() public view {
        assertEq(engine.marketCount(), 1);
        StockPerpEngine.StockConfig memory cfg = engine.getConfig(0);
        assertEq(cfg.maxLeverage, 10);
        assertEq(cfg.maxOpenInterest, 1_000_000e18);
        assertEq(cfg.maintenanceMarginBps, 500);
        assertEq(cfg.fundingRateCapBps, 50);
        assertTrue(cfg.active);
    }

    function test_createMarket_onlyAdmin() public {
        vm.prank(alice);
        vm.expectRevert(StockPerpEngine.NotAdmin.selector);
        engine.createMarket("TSLA", bytes32(0), bytes32(0), 5, 100e18, 500, 50);
    }

    function test_updateConfig() public {
        vm.prank(admin);
        engine.updateConfig(0, 20, 2_000_000e18, 300, 100);
        StockPerpEngine.StockConfig memory cfg = engine.getConfig(0);
        assertEq(cfg.maxLeverage, 20);
        assertEq(cfg.maxOpenInterest, 2_000_000e18);
        assertEq(cfg.maintenanceMarginBps, 300);
    }

    // ═══════════════════════════════════════════
    // Open position
    // ═══════════════════════════════════════════

    function test_openPosition_long() public {
        uint256 margin = 10_000e18;
        uint256 size = 50_000e18; // 5x leverage

        vm.prank(alice);
        engine.openPosition(aaplMarketId, size, true, margin);

        (bool isOpen, bool isLong, uint256 posSize, uint256 entryPrice, uint256 posMargin,,) =
            engine.positions(alice, aaplMarketId);
        assertTrue(isOpen);
        assertTrue(isLong);
        assertEq(posSize, size);
        assertEq(entryPrice, AAPL_PRICE);
        assertEq(posMargin, margin);
    }

    function test_openPosition_short() public {
        vm.prank(alice);
        engine.openPosition(aaplMarketId, 50_000e18, false, 10_000e18);

        (bool isOpen, bool isLong,,,,,) = engine.positions(alice, aaplMarketId);
        assertTrue(isOpen);
        assertFalse(isLong);
    }

    function test_openPosition_deductsMarginAndFee() public {
        uint256 balBefore = vault.balances(alice);
        uint256 margin = 10_000e18;
        uint256 size = 50_000e18;
        uint256 fee = (size * 10) / 10_000; // 0.1%

        vm.prank(alice);
        engine.openPosition(aaplMarketId, size, true, margin);

        assertEq(vault.balances(alice), balBefore - margin - fee);
    }

    function test_openPosition_feeSentToSplitter() public {
        uint256 size = 50_000e18;
        uint256 fee = (size * 10) / 10_000;

        vm.prank(alice);
        engine.openPosition(aaplMarketId, size, true, 10_000e18);

        assertEq(feeSplitter.totalReceived(), fee);
    }

    function test_openPosition_updatesOI() public {
        vm.prank(alice);
        engine.openPosition(aaplMarketId, 50_000e18, true, 10_000e18);

        (,,, uint256 oiLong, uint256 oiShort,) = engine.markets(aaplMarketId);
        assertEq(oiLong, 50_000e18);
        assertEq(oiShort, 0);
    }

    function test_openPosition_revert_leverageTooHigh() public {
        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(StockPerpEngine.LeverageTooHigh.selector, 11, 10)
        );
        engine.openPosition(aaplMarketId, 110_000e18, true, 10_000e18);
    }

    function test_openPosition_revert_maxOIExceeded() public {
        _depositMargin(alice, 5_000_000e18);
        vm.prank(alice);
        vm.expectRevert();
        engine.openPosition(aaplMarketId, 1_000_001e18, true, 500_000e18);
    }

    function test_openPosition_revert_alreadyOpen() public {
        vm.prank(alice);
        engine.openPosition(aaplMarketId, 10_000e18, true, 5_000e18);

        vm.prank(alice);
        vm.expectRevert(StockPerpEngine.PositionAlreadyOpen.selector);
        engine.openPosition(aaplMarketId, 10_000e18, true, 5_000e18);
    }

    function test_openPosition_revert_insufficientMargin() public {
        vm.prank(alice);
        vm.expectRevert();
        engine.openPosition(aaplMarketId, 100_000e18, true, 5_000_000e18);
    }

    function test_openPosition_revert_marketNotActive() public {
        vm.prank(admin);
        engine.setMarketActive(aaplMarketId, false);

        vm.prank(alice);
        vm.expectRevert(StockPerpEngine.MarketNotActive.selector);
        engine.openPosition(aaplMarketId, 10_000e18, true, 5_000e18);
    }

    function test_openPosition_revert_whenPaused() public {
        vm.prank(admin);
        engine.setPaused(true);

        vm.prank(alice);
        vm.expectRevert(StockPerpEngine.IsPaused.selector);
        engine.openPosition(aaplMarketId, 10_000e18, true, 5_000e18);
    }

    function test_openPosition_revert_zeroAmount() public {
        vm.prank(alice);
        vm.expectRevert(StockPerpEngine.ZeroAmount.selector);
        engine.openPosition(aaplMarketId, 0, true, 0);
    }

    // ═══════════════════════════════════════════
    // Close position
    // ═══════════════════════════════════════════

    function test_closePosition_breakeven() public {
        uint256 margin = 10_000e18;
        vm.prank(alice);
        engine.openPosition(aaplMarketId, 50_000e18, true, margin);

        uint256 balBeforeClose = vault.balances(alice);
        vm.prank(alice);
        engine.closePosition(aaplMarketId);

        (bool isOpen,,,,,,) = engine.positions(alice, aaplMarketId);
        assertFalse(isOpen);
        assertEq(vault.balances(alice), balBeforeClose + margin);
    }

    function test_closePosition_longProfit() public {
        vm.prank(alice);
        engine.openPosition(aaplMarketId, 50_000e18, true, 10_000e18);

        // Price goes up 10%
        oracle.setPrice(aaplMarkKey, AAPL_PRICE * 110 / 100);
        oracle.setPrice(aaplIndexKey, AAPL_PRICE * 110 / 100);

        uint256 balBefore = vault.balances(alice);
        vm.prank(alice);
        engine.closePosition(aaplMarketId);

        // PnL = size * (exitPrice - entryPrice) / entryPrice = 50000 * 0.10 = 5000
        uint256 expectedPnL = 5_000e18;
        assertEq(vault.balances(alice), balBefore + 10_000e18 + expectedPnL);
    }

    function test_closePosition_longLoss() public {
        vm.prank(alice);
        engine.openPosition(aaplMarketId, 50_000e18, true, 10_000e18);

        // Price drops 5%
        oracle.setPrice(aaplMarkKey, AAPL_PRICE * 95 / 100);
        oracle.setPrice(aaplIndexKey, AAPL_PRICE * 95 / 100);

        uint256 balBefore = vault.balances(alice);
        vm.prank(alice);
        engine.closePosition(aaplMarketId);

        // PnL = 50000 * (-0.05) = -2500
        uint256 expectedLoss = 2_500e18;
        assertEq(vault.balances(alice), balBefore + 10_000e18 - expectedLoss);
    }

    function test_closePosition_shortProfit() public {
        vm.prank(alice);
        engine.openPosition(aaplMarketId, 50_000e18, false, 10_000e18);

        // Price drops 10% → short profits
        oracle.setPrice(aaplMarkKey, AAPL_PRICE * 90 / 100);
        oracle.setPrice(aaplIndexKey, AAPL_PRICE * 90 / 100);

        uint256 balBefore = vault.balances(alice);
        vm.prank(alice);
        engine.closePosition(aaplMarketId);

        uint256 expectedPnL = 5_000e18;
        assertEq(vault.balances(alice), balBefore + 10_000e18 + expectedPnL);
    }

    function test_closePosition_reducesOI() public {
        vm.prank(alice);
        engine.openPosition(aaplMarketId, 50_000e18, true, 10_000e18);
        vm.prank(alice);
        engine.closePosition(aaplMarketId);

        (,,, uint256 oiLong,,) = engine.markets(aaplMarketId);
        assertEq(oiLong, 0);
    }

    function test_closePosition_revert_noPosition() public {
        vm.prank(alice);
        vm.expectRevert(StockPerpEngine.NoOpenPosition.selector);
        engine.closePosition(aaplMarketId);
    }

    // ═══════════════════════════════════════════
    // Liquidation
    // ═══════════════════════════════════════════

    function test_liquidate_fullClose_deeplyUnderwater() public {
        vm.prank(alice);
        engine.openPosition(aaplMarketId, 100_000e18, true, 10_000e18);

        // Price drops 15% → margin ratio goes negative
        oracle.setPrice(aaplMarkKey, AAPL_PRICE * 85 / 100);
        oracle.setPrice(aaplIndexKey, AAPL_PRICE * 85 / 100);

        vm.prank(bob);
        engine.liquidate(alice, aaplMarketId);

        (bool isOpen,,,,,,) = engine.positions(alice, aaplMarketId);
        assertFalse(isOpen);
    }

    function test_liquidate_partialClose() public {
        // 10x leverage: margin = 10k, size = 100k → maint margin = 5%
        vm.prank(alice);
        engine.openPosition(aaplMarketId, 100_000e18, true, 10_000e18);

        // Price drops 6% → margin ratio ~4% (below 5% maint)
        oracle.setPrice(aaplMarkKey, AAPL_PRICE * 94 / 100);
        oracle.setPrice(aaplIndexKey, AAPL_PRICE * 94 / 100);

        vm.prank(bob);
        engine.liquidate(alice, aaplMarketId);

        (bool isOpen,, uint256 remainingSize,,,,) = engine.positions(alice, aaplMarketId);
        assertTrue(isOpen);
        assertTrue(remainingSize > 0);
        assertTrue(remainingSize < 100_000e18);
    }

    function test_liquidate_revert_healthy() public {
        vm.prank(alice);
        engine.openPosition(aaplMarketId, 50_000e18, true, 10_000e18);

        vm.prank(bob);
        vm.expectRevert();
        engine.liquidate(alice, aaplMarketId);
    }

    function test_liquidate_penaltyRouted() public {
        vm.prank(alice);
        engine.openPosition(aaplMarketId, 100_000e18, true, 10_000e18);

        uint256 splitterBefore = feeSplitter.totalReceived();

        // Drop 6% so partially liquidatable
        oracle.setPrice(aaplMarkKey, AAPL_PRICE * 94 / 100);
        oracle.setPrice(aaplIndexKey, AAPL_PRICE * 94 / 100);

        vm.prank(bob);
        engine.liquidate(alice, aaplMarketId);

        assertTrue(feeSplitter.totalReceived() > splitterBefore);
    }

    // ═══════════════════════════════════════════
    // Views
    // ═══════════════════════════════════════════

    function test_unrealizedPnL() public {
        vm.prank(alice);
        engine.openPosition(aaplMarketId, 50_000e18, true, 10_000e18);

        // Up 10%
        oracle.setPrice(aaplMarkKey, AAPL_PRICE * 110 / 100);
        int256 pnl = engine.unrealizedPnL(alice, aaplMarketId);
        assertEq(pnl, int256(5_000e18));
    }

    function test_marginRatio_healthy() public {
        vm.prank(alice);
        engine.openPosition(aaplMarketId, 50_000e18, true, 10_000e18);

        uint256 ratio = engine.marginRatio(alice, aaplMarketId);
        assertEq(ratio, 2000); // 10k/50k * 10000 = 2000 bps = 20%
    }

    function test_marginRatio_noPosition() public view {
        uint256 ratio = engine.marginRatio(alice, aaplMarketId);
        assertEq(ratio, type(uint256).max);
    }

    // ═══════════════════════════════════════════
    // Admin
    // ═══════════════════════════════════════════

    function test_setAdmin() public {
        vm.prank(admin);
        engine.setAdmin(alice);
        assertEq(engine.admin(), alice);
    }

    function test_setAdmin_revert_notAdmin() public {
        vm.prank(alice);
        vm.expectRevert(StockPerpEngine.NotAdmin.selector);
        engine.setAdmin(alice);
    }

    function test_setAdmin_revert_zero() public {
        vm.prank(admin);
        vm.expectRevert(StockPerpEngine.ZeroAddress.selector);
        engine.setAdmin(address(0));
    }

    function test_setPaused() public {
        vm.prank(admin);
        engine.setPaused(true);
        assertTrue(engine.paused());

        vm.prank(admin);
        engine.setPaused(false);
        assertFalse(engine.paused());
    }

    function test_setMarketActive() public {
        vm.prank(admin);
        engine.setMarketActive(aaplMarketId, false);
        StockPerpEngine.StockConfig memory cfg = engine.getConfig(aaplMarketId);
        assertFalse(cfg.active);
    }

    // ═══════════════════════════════════════════
    // Constructor validation
    // ═══════════════════════════════════════════

    function test_constructor_revert_zeroVault() public {
        vm.expectRevert(StockPerpEngine.ZeroAddress.selector);
        new StockPerpEngine(address(0), address(fundingRate), address(oracle), address(feeSplitter), admin);
    }

    function test_constructor_revert_zeroFunding() public {
        vm.expectRevert(StockPerpEngine.ZeroAddress.selector);
        new StockPerpEngine(address(vault), address(0), address(oracle), address(feeSplitter), admin);
    }

    function test_constructor_revert_zeroOracle() public {
        vm.expectRevert(StockPerpEngine.ZeroAddress.selector);
        new StockPerpEngine(address(vault), address(fundingRate), address(0), address(feeSplitter), admin);
    }

    function test_constructor_revert_zeroSplitter() public {
        vm.expectRevert(StockPerpEngine.ZeroAddress.selector);
        new StockPerpEngine(address(vault), address(fundingRate), address(oracle), address(0), admin);
    }

    function test_constructor_revert_zeroAdmin() public {
        vm.expectRevert(StockPerpEngine.ZeroAddress.selector);
        new StockPerpEngine(address(vault), address(fundingRate), address(oracle), address(feeSplitter), address(0));
    }

    // ═══════════════════════════════════════════
    // Multiple markets
    // ═══════════════════════════════════════════

    function test_multipleMarkets() public {
        bytes32 tslaMarkKey = keccak256(abi.encodePacked("TSLA_MARK"));
        bytes32 tslaIndexKey = keccak256(abi.encodePacked("TSLA_INDEX"));
        oracle.setPrice(tslaMarkKey, TSLA_PRICE);
        oracle.setPrice(tslaIndexKey, TSLA_PRICE);

        vm.prank(admin);
        uint256 tslaId = engine.createMarket("TSLA", tslaMarkKey, tslaIndexKey, 5, 500_000e18, 1000, 100);

        assertEq(engine.marketCount(), 2);
        assertEq(tslaId, 1);

        vm.prank(alice);
        engine.openPosition(aaplMarketId, 20_000e18, true, 5_000e18);

        vm.prank(alice);
        engine.openPosition(tslaId, 10_000e18, false, 5_000e18);

        (bool aaplOpen,,,,,,) = engine.positions(alice, aaplMarketId);
        (bool tslaOpen,,,,,,) = engine.positions(alice, tslaId);
        assertTrue(aaplOpen);
        assertTrue(tslaOpen);
    }

    // ═══════════════════════════════════════════
    // Zero oracle price guards
    // ═══════════════════════════════════════════

    function test_openPosition_revert_zeroMarkPrice() public {
        oracle.setPrice(aaplMarkKey, 0);

        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(StockPerpEngine.OraclePriceZero.selector, aaplMarkKey)
        );
        engine.openPosition(aaplMarketId, 50_000e18, true, 10_000e18);
    }

    function test_openPosition_revert_zeroIndexPrice() public {
        oracle.setPrice(aaplIndexKey, 0);

        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(StockPerpEngine.OraclePriceZero.selector, aaplIndexKey)
        );
        engine.openPosition(aaplMarketId, 50_000e18, true, 10_000e18);
    }

    function test_closePosition_revert_zeroExitPrice() public {
        vm.prank(alice);
        engine.openPosition(aaplMarketId, 50_000e18, true, 10_000e18);

        oracle.setPrice(aaplMarkKey, 0);

        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(StockPerpEngine.OraclePriceZero.selector, aaplMarkKey)
        );
        engine.closePosition(aaplMarketId);
    }

    function test_liquidate_revert_zeroExitPrice() public {
        vm.prank(alice);
        engine.openPosition(aaplMarketId, 100_000e18, true, 10_000e18);

        oracle.setPrice(aaplMarkKey, 0);

        vm.prank(bob);
        vm.expectRevert(
            abi.encodeWithSelector(StockPerpEngine.OraclePriceZero.selector, aaplMarkKey)
        );
        engine.liquidate(alice, aaplMarketId);
    }
}
