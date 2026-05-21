// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../../src/perps/StockPerpEngine.sol";
import "../../src/perps/MarginVault.sol";
import "../../src/perps/FundingRate.sol";
import "../../src/GoodDollarToken.sol";

contract MockStockOracleFuzz {
    mapping(bytes32 => uint256) public prices;

    function setPrice(bytes32 key, uint256 price) external {
        prices[key] = price;
    }

    function getPriceByKey(bytes32 key) external view returns (uint256) {
        return prices[key];
    }
}

contract MockStockFeeSplitterFuzz {
    address public gdToken;

    constructor(address _gd) {
        gdToken = _gd;
    }

    function goodDollar() external view returns (address) {
        return gdToken;
    }

    function splitFee(uint256 totalFee, address to) external returns (uint256, uint256, uint256) {
        GoodDollarToken(gdToken).transferFrom(msg.sender, address(this), totalFee);
        uint256 ubiShare = totalFee / 3;
        uint256 protocolShare = totalFee / 6;
        uint256 dAppShare = totalFee - ubiShare - protocolShare;
        GoodDollarToken(gdToken).transfer(to, dAppShare);
        return (ubiShare, protocolShare, dAppShare);
    }
}

contract StockPerpEngineFuzzTest is Test {
    GoodDollarToken public gd;
    MarginVault public vault;
    FundingRate public fundingRate;
    StockPerpEngine public engine;
    MockStockOracleFuzz public oracle;
    MockStockFeeSplitterFuzz public feeSplitter;

    address public admin = address(0xAD);
    address public alice = address(0xA1);

    uint256 constant SUPPLY = 100_000_000e18;
    uint256 constant AAPL_PRICE = 19000_00000000; // $190.00 (8 decimals)

    bytes32 public markKey;
    bytes32 public indexKey;
    uint256 public marketId;

    uint256 constant MAX_LEVERAGE = 10;
    uint256 constant MAX_OI = 1_000_000e18;
    uint256 constant MAINT_MARGIN_BPS = 500; // 5%
    uint256 constant BPS = 10_000;
    uint256 constant TRADE_FEE_BPS = 10;

    function setUp() public {
        gd = new GoodDollarToken(admin, admin, SUPPLY);
        oracle = new MockStockOracleFuzz();
        feeSplitter = new MockStockFeeSplitterFuzz(address(gd));

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

        markKey = keccak256(abi.encodePacked("AAPL_MARK"));
        indexKey = keccak256(abi.encodePacked("AAPL_INDEX"));
        oracle.setPrice(markKey, AAPL_PRICE);
        oracle.setPrice(indexKey, AAPL_PRICE);

        vm.prank(admin);
        marketId = engine.createMarket(
            "AAPL", markKey, indexKey,
            MAX_LEVERAGE, MAX_OI, MAINT_MARGIN_BPS, 50
        );

        vm.prank(admin);
        gd.transfer(alice, 50_000_000e18);
    }

    function _depositMargin(address user, uint256 amount) internal {
        vm.startPrank(user);
        gd.approve(address(vault), amount);
        vault.deposit(amount);
        vm.stopPrank();
    }

    // ─── Fuzz: openPosition with bounded inputs ───

    function testFuzz_openPosition(uint256 _margin, uint256 _leverageMul, bool _isLong) public {
        _margin = bound(_margin, 1e18, 100_000e18);
        _leverageMul = bound(_leverageMul, 1, MAX_LEVERAGE);
        uint256 size = _margin * _leverageMul;

        _depositMargin(alice, _margin + (size * TRADE_FEE_BPS) / BPS + 1e18);

        vm.prank(alice);
        engine.openPosition(marketId, size, _isLong, _margin);

        (bool isOpen, bool isLong, uint256 posSize,,uint256 posMargin,,) =
            engine.positions(alice, marketId);

        assertTrue(isOpen, "position should be open");
        assertEq(isLong, _isLong, "direction mismatch");
        assertEq(posSize, size, "size mismatch");
        assertEq(posMargin, _margin, "margin mismatch");

        (,,, uint256 oiLong, uint256 oiShort,) = engine.markets(marketId);
        if (_isLong) {
            assertEq(oiLong, size, "OI long mismatch");
        } else {
            assertEq(oiShort, size, "OI short mismatch");
        }
    }

    // ─── Fuzz: closePosition at fuzzed oracle price ───

    function testFuzz_closePosition(uint256 _exitPriceSeed) public {
        uint256 margin = 100_000e18;
        uint256 size = 500_000e18; // 5x leverage
        uint256 fee = (size * TRADE_FEE_BPS) / BPS;

        _depositMargin(alice, margin + fee + 1e18);

        vm.prank(alice);
        engine.openPosition(marketId, size, true, margin);

        uint256 exitPrice = bound(_exitPriceSeed, AAPL_PRICE / 2, AAPL_PRICE * 3);
        oracle.setPrice(markKey, exitPrice);
        oracle.setPrice(indexKey, exitPrice);

        uint256 vaultBefore = vault.balances(alice);

        vm.prank(alice);
        engine.closePosition(marketId);

        (bool isOpen,,,,,,) = engine.positions(alice, marketId);
        assertFalse(isOpen, "position should be closed");

        (,,, uint256 oiLong,,) = engine.markets(marketId);
        assertEq(oiLong, 0, "OI should be zero after close");

        uint256 vaultAfter = vault.balances(alice);
        int256 priceDelta = int256(exitPrice) - int256(AAPL_PRICE);
        int256 expectedPnL = (int256(size) * priceDelta) / int256(AAPL_PRICE);

        if (expectedPnL >= 0) {
            assertGe(vaultAfter, vaultBefore, "profitable close should increase balance");
        }
    }

    // ─── Fuzz: addMargin increases position margin ───

    function testFuzz_addMargin(uint256 _addAmount) public {
        uint256 margin = 50_000e18;
        uint256 size = 200_000e18;
        uint256 fee = (size * TRADE_FEE_BPS) / BPS;

        _addAmount = bound(_addAmount, 1e18, 500_000e18);

        _depositMargin(alice, margin + fee + _addAmount + 1e18);

        vm.prank(alice);
        engine.openPosition(marketId, size, true, margin);

        uint256 vaultBefore = vault.balances(alice);

        vm.prank(alice);
        engine.addMargin(marketId, _addAmount);

        (,,,,uint256 posMargin,,) = engine.positions(alice, marketId);
        assertEq(posMargin, margin + _addAmount, "margin should increase");

        uint256 vaultAfter = vault.balances(alice);
        assertEq(vaultBefore - vaultAfter, _addAmount, "vault balance should decrease by added amount");
    }

    // ─── Fuzz: removeMargin stays above maintenance ───

    function testFuzz_removeMargin(uint256 _removeAmount) public {
        uint256 margin = 100_000e18;
        uint256 size = 200_000e18; // 2x leverage, very healthy
        uint256 fee = (size * TRADE_FEE_BPS) / BPS;

        _depositMargin(alice, margin + fee + 1e18);

        vm.prank(alice);
        engine.openPosition(marketId, size, true, margin);

        uint256 maxRemovable = margin - (size * MAINT_MARGIN_BPS / BPS) - 1e18;
        _removeAmount = bound(_removeAmount, 1e18, maxRemovable);

        vm.prank(alice);
        engine.removeMargin(marketId, _removeAmount);

        (,,,,uint256 posMargin,,) = engine.positions(alice, marketId);
        assertEq(posMargin, margin - _removeAmount, "margin should decrease");
        assertTrue(posMargin > 0, "margin should remain positive");
    }

    // ─── Fuzz: liquidation triggers at correct threshold ───

    function testFuzz_liquidateThreshold(uint256 _priceDrop) public {
        uint256 margin = 50_000e18;
        uint256 size = 500_000e18; // 10x leverage
        uint256 fee = (size * TRADE_FEE_BPS) / BPS;

        _depositMargin(alice, margin + fee + 1e18);

        vm.prank(alice);
        engine.openPosition(marketId, size, true, margin);

        _priceDrop = bound(_priceDrop, 1, AAPL_PRICE * 95 / 100);
        uint256 newPrice = AAPL_PRICE - _priceDrop;
        if (newPrice == 0) newPrice = 1;
        oracle.setPrice(markKey, newPrice);
        oracle.setPrice(indexKey, newPrice);

        int256 priceDelta = int256(newPrice) - int256(AAPL_PRICE);
        int256 pnl = (int256(size) * priceDelta) / int256(AAPL_PRICE);
        int256 remainingMargin = int256(margin) + pnl;

        uint256 expectedRatio = remainingMargin > 0
            ? (uint256(remainingMargin) * BPS) / size
            : 0;

        address liquidator = address(0xBEEF);

        if (expectedRatio < MAINT_MARGIN_BPS) {
            vm.prank(liquidator);
            engine.liquidate(alice, marketId);

            (bool isOpen,, uint256 posSize,,,,) = engine.positions(alice, marketId);
            if (remainingMargin <= 0) {
                assertFalse(isOpen, "deeply underwater position should be fully closed");
            } else {
                assertTrue(posSize < size, "partial liquidation should reduce size");
            }
        } else {
            vm.prank(liquidator);
            vm.expectRevert();
            engine.liquidate(alice, marketId);
        }
    }

    // ─── Fuzz: partial liquidation reduces size to restore health ───

    function testFuzz_partialLiquidation(uint256 _priceSeed) public {
        uint256 margin = 60_000e18;
        uint256 size = 500_000e18;
        uint256 fee = (size * TRADE_FEE_BPS) / BPS;

        _depositMargin(alice, margin + fee + 1e18);

        vm.prank(alice);
        engine.openPosition(marketId, size, true, margin);

        // Target a price drop that puts margin ratio between 0 and maintenance (partial liq zone)
        // maintenance = 5% = 500 bps
        // At 10x leverage, a ~5% drop wipes out margin
        // For partial: drop ~3-4.5% so remaining margin is positive but below threshold
        uint256 dropBps = bound(_priceSeed, 300, 480);
        uint256 newPrice = AAPL_PRICE * (BPS - dropBps) / BPS;
        if (newPrice == 0) newPrice = 1;
        oracle.setPrice(markKey, newPrice);
        oracle.setPrice(indexKey, newPrice);

        int256 priceDelta = int256(newPrice) - int256(AAPL_PRICE);
        int256 pnl = (int256(size) * priceDelta) / int256(AAPL_PRICE);
        int256 remainingMargin = int256(margin) + pnl;

        if (remainingMargin <= 0) return;

        uint256 mRatio = (uint256(remainingMargin) * BPS) / size;
        if (mRatio >= MAINT_MARGIN_BPS) return;

        address liquidator = address(0xBEEF);
        vm.prank(liquidator);
        engine.liquidate(alice, marketId);

        (bool isOpen,, uint256 postSize,,,,) = engine.positions(alice, marketId);
        if (isOpen) {
            assertTrue(postSize < size, "partial liquidation must reduce size");
            assertTrue(postSize > 0, "partial liquidation should leave some size");
        }
    }

    // ─── Fuzz: openPosition reverts on excessive leverage ───

    function testFuzz_openPosition_revertsTooHighLeverage(uint256 _size, uint256 _margin) public {
        _margin = bound(_margin, 1e18, 10_000e18);
        _size = bound(_size, _margin * (MAX_LEVERAGE + 1), _margin * 100);

        _depositMargin(alice, _margin + (_size * TRADE_FEE_BPS) / BPS + 1e18);

        vm.prank(alice);
        vm.expectRevert();
        engine.openPosition(marketId, _size, true, _margin);
    }
}
