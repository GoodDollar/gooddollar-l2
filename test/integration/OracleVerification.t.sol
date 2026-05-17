// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";

import {SwapPriceOracle} from "../../src/oracle/SwapPriceOracle.sol";
import {PerpPriceOracle} from "../../src/perps/PerpPriceOracle.sol";
import {PriceOracle as StocksPriceOracle} from "../../src/stocks/PriceOracle.sol";

// Minimal Chainlink feed mock for Stocks oracle
contract MockFeed {
    int256 private _price;
    uint8 private _decimals;
    uint256 private _updatedAt;

    constructor(int256 price_, uint8 decimals_) {
        _price = price_;
        _decimals = decimals_;
        _updatedAt = block.timestamp;
    }

    function latestRoundData()
        external
        view
        returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)
    {
        return (1, _price, block.timestamp, _updatedAt, 1);
    }

    function decimals() external view returns (uint8) {
        return _decimals;
    }

    function setPrice(int256 p) external {
        _price = p;
        _updatedAt = block.timestamp;
    }

    function setTimestamp(uint256 t) external {
        _updatedAt = t;
    }
}

/**
 * @title OracleVerification
 * @notice Verifies price freshness, staleness rejection, and consistency
 *         across all 3 oracle systems: SwapPriceOracle, PerpPriceOracle,
 *         and Stocks PriceOracle.
 */
contract OracleVerification is Test {
    SwapPriceOracle public swapOracle;
    PerpPriceOracle public perpOracle;
    StocksPriceOracle public stocksOracle;

    MockFeed public aaplFeed;
    MockFeed public tslafeed;

    address public admin = address(this);
    address public keeper = address(0xCEE);

    bytes32 public constant BTC_KEY = keccak256("BTC-USD");
    bytes32 public constant ETH_KEY = keccak256("ETH-USD");

    address public tokenA = address(0xA);
    address public tokenB = address(0xB);

    function setUp() public {
        // -------- Swap Oracle --------
        swapOracle = new SwapPriceOracle(admin);
        swapOracle.setKeeper(keeper, true);

        // Register two tokens (address, symbol, decimals, maxAge)
        swapOracle.registerToken(tokenA, "TOKA", 18, 3600);
        swapOracle.registerToken(tokenB, "TOKB", 18, 3600);

        // Set initial prices
        vm.prank(keeper);
        swapOracle.updatePrice(tokenA, 2000e18);
        vm.prank(keeper);
        swapOracle.updatePrice(tokenB, 1500e18);

        // -------- Perp Oracle --------
        perpOracle = new PerpPriceOracle(admin);
        perpOracle.setKeeper(keeper, true);
        perpOracle.setMaxStaleness(3600);
        perpOracle.setMaxDeviation(500); // 5%
        perpOracle.registerMarket(BTC_KEY);
        perpOracle.registerMarket(ETH_KEY);

        // Set initial perp prices
        vm.prank(keeper);
        perpOracle.updatePrice(BTC_KEY, 50_000e8, 50_000e8, 3);
        vm.prank(keeper);
        perpOracle.updatePrice(ETH_KEY, 3_000e8, 3_000e8, 3);

        // -------- Stocks Oracle --------
        stocksOracle = new StocksPriceOracle(admin);
        aaplFeed = new MockFeed(150e8, 8);
        tslafeed = new MockFeed(250e8, 8);
        stocksOracle.registerFeed("AAPL", address(aaplFeed));
        stocksOracle.registerFeed("TSLA", address(tslafeed));
    }

    // ============================================================
    //               SWAP ORACLE VERIFICATION
    // ============================================================

    function test_swapOracle_freshPrices() public view {
        uint256 priceA = swapOracle.getPrice(tokenA);
        uint256 priceB = swapOracle.getPrice(tokenB);
        assertEq(priceA, 2000e18, "tokenA price should be 2000");
        assertEq(priceB, 1500e18, "tokenB price should be 1500");
    }

    function test_swapOracle_stalePriceReverts() public {
        vm.warp(block.timestamp + 3601); // Past max staleness
        vm.expectRevert();
        swapOracle.getPrice(tokenA);
    }

    function test_swapOracle_unregisteredTokenReverts() public {
        vm.expectRevert();
        swapOracle.getPrice(address(0xDEAD));
    }

    function test_swapOracle_updateRefreshesTimestamp() public {
        vm.warp(block.timestamp + 1800); // half of staleness

        vm.prank(keeper);
        swapOracle.updatePrice(tokenA, 2100e18);

        // Should not revert — price is fresh
        uint256 price = swapOracle.getPrice(tokenA);
        assertEq(price, 2100e18);

        // getPriceUnsafe returns timestamp
        (uint256 unsafePrice, uint256 ts) = swapOracle.getPriceUnsafe(tokenA);
        assertEq(unsafePrice, 2100e18);
        assertEq(ts, block.timestamp);
    }

    function test_swapOracle_zeroPriceReverts() public {
        vm.prank(keeper);
        vm.expectRevert(SwapPriceOracle.ZeroPrice.selector);
        swapOracle.updatePrice(tokenA, 0);
    }

    // ============================================================
    //               PERP ORACLE VERIFICATION
    // ============================================================

    function test_perpOracle_freshPrices() public view {
        (uint256 markPrice, uint256 indexPrice,,,) = perpOracle.prices(BTC_KEY);
        assertEq(markPrice, 50_000e8, "BTC mark price");
        assertEq(indexPrice, 50_000e8, "BTC index price");
    }

    function test_perpOracle_stalePriceRevert() public {
        vm.warp(block.timestamp + 3601);

        vm.expectRevert();
        perpOracle.getMarkPrice(BTC_KEY);
    }

    function test_perpOracle_deviationGuard() public {
        // Mark price deviates >5% from index → should revert
        vm.prank(keeper);
        vm.expectRevert();
        perpOracle.updatePrice(BTC_KEY, 60_000e8, 50_000e8, 3);
    }

    function test_perpOracle_validUpdate() public {
        // Small deviation within 5%
        vm.prank(keeper);
        perpOracle.updatePrice(BTC_KEY, 51_000e8, 50_500e8, 3);

        (uint256 markPrice, uint256 indexPrice,,,) = perpOracle.prices(BTC_KEY);
        assertEq(markPrice, 51_000e8);
        assertEq(indexPrice, 50_500e8);
    }

    function test_perpOracle_adminManualPrice() public {
        perpOracle.setManualPrice(ETH_KEY, 3_500e8, 3_500e8);

        (uint256 markPrice, uint256 indexPrice,,,) = perpOracle.prices(ETH_KEY);
        assertEq(markPrice, 3_500e8);
        assertEq(indexPrice, 3_500e8);
    }

    // ============================================================
    //               STOCKS ORACLE VERIFICATION
    // ============================================================

    function test_stocksOracle_freshPrices() public view {
        uint256 aaplPrice = stocksOracle.getPrice("AAPL");
        uint256 tslaPrice = stocksOracle.getPrice("TSLA");
        assertEq(aaplPrice, 150e8, "AAPL price");
        assertEq(tslaPrice, 250e8, "TSLA price");
    }

    function test_stocksOracle_stalePriceReverts() public {
        vm.warp(block.timestamp + 3601);

        vm.expectRevert();
        stocksOracle.getPrice("AAPL");
    }

    function test_stocksOracle_negativePriceReverts() public {
        aaplFeed.setPrice(-1);

        vm.expectRevert();
        stocksOracle.getPrice("AAPL");
    }

    function test_stocksOracle_zeroPriceReverts() public {
        aaplFeed.setPrice(0);

        vm.expectRevert();
        stocksOracle.getPrice("AAPL");
    }

    function test_stocksOracle_priceUpdateReflected() public {
        aaplFeed.setPrice(160e8);
        uint256 newPrice = stocksOracle.getPrice("AAPL");
        assertEq(newPrice, 160e8, "price should reflect feed update");
    }

    function test_stocksOracle_manualOverride() public {
        stocksOracle.setManualPrice("AAPL", 200e8, true);
        uint256 price = stocksOracle.getPrice("AAPL");
        assertEq(price, 200e8, "manual price override");

        // Disable manual override → reverts to feed
        stocksOracle.setManualPrice("AAPL", 0, false);
        uint256 feedPrice = stocksOracle.getPrice("AAPL");
        assertEq(feedPrice, 150e8, "back to feed price");
    }

    // ============================================================
    //           CROSS-ORACLE CONSISTENCY
    // ============================================================

    function test_crossOracle_allOraclesReturnNonZero() public view {
        uint256 swapPrice = swapOracle.getPrice(tokenA);
        (uint256 perpMark,,,,) = perpOracle.prices(BTC_KEY);
        uint256 stockPrice = stocksOracle.getPrice("AAPL");

        assertGt(swapPrice, 0, "swap oracle non-zero");
        assertGt(perpMark, 0, "perp oracle non-zero");
        assertGt(stockPrice, 0, "stocks oracle non-zero");
    }

    function test_crossOracle_simultaneousStaleness() public {
        vm.warp(block.timestamp + 3601);

        vm.expectRevert();
        swapOracle.getPrice(tokenA);

        vm.expectRevert();
        stocksOracle.getPrice("AAPL");
    }
}
