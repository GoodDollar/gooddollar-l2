// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../../src/perps/StockPerpEngine.sol";
import "../../src/perps/MarginVault.sol";
import "../../src/GoodDollarToken.sol";

contract MockOracleForHandler {
    mapping(bytes32 => uint256) public prices;

    function setPrice(bytes32 key, uint256 price) external {
        prices[key] = price;
    }

    function getPriceByKey(bytes32 key) external view returns (uint256) {
        return prices[key];
    }
}

contract PerpHandler is Test {
    StockPerpEngine public engine;
    MarginVault public vault;
    GoodDollarToken public gd;
    MockOracleForHandler public oracle;

    uint256 public marketId;
    bytes32 public markKey;
    bytes32 public indexKey;

    address[] public traders;
    uint256 constant BPS = 10_000;
    uint256 constant TRADE_FEE_BPS = 10;
    uint256 constant BASE_PRICE = 19000_00000000;

    // Ghost state for invariant assertions
    uint256 public totalDeposited;
    uint256 public totalMarginLocked;
    uint256 public totalFeesCharged;
    uint256 public openCount;
    uint256 public closeCount;
    uint256 public addMarginCount;
    uint256 public currentPrice;

    constructor(
        StockPerpEngine _engine,
        MarginVault _vault,
        GoodDollarToken _gd,
        MockOracleForHandler _oracle,
        uint256 _marketId,
        bytes32 _markKey,
        bytes32 _indexKey,
        address[] memory _traders
    ) {
        engine = _engine;
        vault = _vault;
        gd = _gd;
        oracle = _oracle;
        marketId = _marketId;
        markKey = _markKey;
        indexKey = _indexKey;
        traders = _traders;
        currentPrice = BASE_PRICE;
    }

    function openLong(uint256 _traderIdx, uint256 _marginSeed, uint256 _leverageSeed) external {
        address trader = traders[bound(_traderIdx, 0, traders.length - 1)];
        uint256 margin = bound(_marginSeed, 1_000e18, 50_000e18);
        uint256 leverage = bound(_leverageSeed, 1, 10);
        uint256 size = margin * leverage;
        uint256 fee = (size * TRADE_FEE_BPS) / BPS;
        uint256 needed = margin + fee + 1e18;

        if (gd.balanceOf(trader) < needed) return;

        (bool isOpen,,,,,,) = engine.positions(trader, marketId);
        if (isOpen) return;

        vm.startPrank(trader);
        gd.approve(address(vault), needed);
        vault.deposit(needed);
        engine.openPosition(marketId, size, true, margin);
        vm.stopPrank();

        totalDeposited += needed;
        totalMarginLocked += margin;
        totalFeesCharged += fee;
        openCount++;
    }

    function openShort(uint256 _traderIdx, uint256 _marginSeed, uint256 _leverageSeed) external {
        address trader = traders[bound(_traderIdx, 0, traders.length - 1)];
        uint256 margin = bound(_marginSeed, 1_000e18, 50_000e18);
        uint256 leverage = bound(_leverageSeed, 1, 10);
        uint256 size = margin * leverage;
        uint256 fee = (size * TRADE_FEE_BPS) / BPS;
        uint256 needed = margin + fee + 1e18;

        if (gd.balanceOf(trader) < needed) return;

        (bool isOpen,,,,,,) = engine.positions(trader, marketId);
        if (isOpen) return;

        vm.startPrank(trader);
        gd.approve(address(vault), needed);
        vault.deposit(needed);
        engine.openPosition(marketId, size, false, margin);
        vm.stopPrank();

        totalDeposited += needed;
        totalMarginLocked += margin;
        totalFeesCharged += fee;
        openCount++;
    }

    function closePosition(uint256 _traderIdx) external {
        address trader = traders[bound(_traderIdx, 0, traders.length - 1)];

        (bool isOpen,,,,,,) = engine.positions(trader, marketId);
        if (!isOpen) return;

        vm.prank(trader);
        engine.closePosition(marketId);
        closeCount++;
    }

    function addMarginToPosition(uint256 _traderIdx, uint256 _amountSeed) external {
        address trader = traders[bound(_traderIdx, 0, traders.length - 1)];
        uint256 amount = bound(_amountSeed, 100e18, 10_000e18);

        (bool isOpen,,,,,,) = engine.positions(trader, marketId);
        if (!isOpen) return;

        if (vault.balances(trader) < amount) {
            if (gd.balanceOf(trader) < amount) return;
            vm.startPrank(trader);
            gd.approve(address(vault), amount);
            vault.deposit(amount);
            vm.stopPrank();
            totalDeposited += amount;
        }

        vm.prank(trader);
        engine.addMargin(marketId, amount);
        addMarginCount++;
    }

    function adjustPrice(uint256 _priceSeed) external {
        uint256 newPrice = bound(_priceSeed, BASE_PRICE * 70 / 100, BASE_PRICE * 130 / 100);
        oracle.setPrice(markKey, newPrice);
        oracle.setPrice(indexKey, newPrice);
        currentPrice = newPrice;
    }

    function warpForward(uint256 _seconds) external {
        uint256 dt = bound(_seconds, 1, 24 hours);
        vm.warp(block.timestamp + dt);
    }

    function traderCount() external view returns (uint256) {
        return traders.length;
    }
}
