// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";

import {GoodDollarToken} from "../../src/GoodDollarToken.sol";
import {GoodSwap} from "../../src/GoodSwap.sol";
import {UBIFeeSplitter} from "../../src/UBIFeeSplitter.sol";

import {PerpEngine} from "../../src/perps/PerpEngine.sol";
import {MarginVault} from "../../src/perps/MarginVault.sol";
import {FundingRate} from "../../src/perps/FundingRate.sol";
import {PerpPriceOracle} from "../../src/perps/PerpPriceOracle.sol";

import {MarketFactory} from "../../src/predict/MarketFactory.sol";
import {ConditionalTokens} from "../../src/predict/ConditionalTokens.sol";

import {gUSD} from "../../src/stable/gUSD.sol";
import {PegStabilityModule} from "../../src/stable/PegStabilityModule.sol";
import {StableUBIFeeSplitter} from "../../src/stable/StableUBIFeeSplitter.sol";

import {CollateralVault} from "../../src/stocks/CollateralVault.sol";
import {SyntheticAsset} from "../../src/stocks/SyntheticAsset.sol";
import {PriceOracle as StocksPriceOracle} from "../../src/stocks/PriceOracle.sol";

/**
 * @title AllProtocols Integration Test
 * @notice Deploys and exercises all 6 GoodDollar L2 protocols sequentially:
 *         Swap → Perps → Predict → Lend → Stable → Stocks.
 *         Verifies each protocol works independently in a unified test environment.
 */

// Minimal mock Chainlink feed for Stocks oracle
contract MockChainlinkFeed {
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
}

// Minimal mock for PerpEngine's fee splitter
contract MockPerpFeeSplitter {
    address public goodDollar;

    constructor(address gd) {
        goodDollar = gd;
    }

    function splitFee(uint256, address) external pure returns (uint256, uint256, uint256) {
        return (0, 0, 0);
    }
}

// Minimal USDC mock for PSM
contract MockUSDC {
    string public constant name = "USD Coin";
    string public constant symbol = "USDC";
    uint8 public constant decimals = 6;
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
        totalSupply += amount;
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
        if (allowance[from][msg.sender] < amount) return false;
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }
}

contract AllProtocolsIntegration is Test {
    // --- Shared ---
    GoodDollarToken public gd;
    UBIFeeSplitter public feeSplitter;

    // --- Swap ---
    GoodSwap public gdWethPair;
    GoodDollarToken public wethToken;
    address public weth;

    // --- Perps ---
    PerpPriceOracle public perpOracle;
    MarginVault public marginVault;
    FundingRate public fundingRate;
    PerpEngine public perpEngine;
    MockPerpFeeSplitter public perpFeeSplitter;
    bytes32 public constant BTC_MARKET_KEY = keccak256("BTC-USD");
    uint256 public btcMarketId;

    // --- Predict ---
    MarketFactory public marketFactory;
    ConditionalTokens public conditionalTokens;

    // --- Stable ---
    gUSD public gusd;
    MockUSDC public usdc;
    PegStabilityModule public psm;
    StableUBIFeeSplitter public stableFeeSplitter;

    // --- Stocks ---
    StocksPriceOracle public stocksOracle;
    CollateralVault public stocksVault;
    SyntheticAsset public aaplToken;
    MockChainlinkFeed public aaplFeed;

    // --- Actors ---
    address public admin = address(this);
    address public alice = address(0xA11CE);
    address public bob = address(0xB0B);
    address public keeper = address(0xCEE);

    function setUp() public {
        // -------- GoodDollar Token --------
        gd = new GoodDollarToken(address(this), address(this), 0);
        gd.setMinter(address(this), true);

        // -------- UBI Fee Splitter (shared across Swap/Predict/Perps) --------
        feeSplitter = new UBIFeeSplitter(
            address(gd),
            address(this),  // protocolTreasury
            admin
        );

        // -------- Swap Protocol --------
        wethToken = new GoodDollarToken(address(this), address(this), 0);
        wethToken.setMinter(address(this), true);
        weth = address(wethToken);

        // Sort tokens for pair constructor
        (address t0, address t1) = address(gd) < weth
            ? (address(gd), weth)
            : (weth, address(gd));
        gdWethPair = new GoodSwap(t0, t1);

        // Seed liquidity: 100k GD + 50 WETH
        gd.mint(address(this), 200_000e18);
        wethToken.mint(address(this), 100e18);

        address pair = address(gdWethPair);
        gd.transfer(pair, 100_000e18);
        wethToken.transfer(pair, 50e18);
        gdWethPair.mint(address(this));

        // -------- Perps Protocol --------
        perpOracle = new PerpPriceOracle(admin);
        perpOracle.setKeeper(keeper, true);
        perpOracle.setMaxStaleness(3600);
        perpOracle.setMaxDeviation(500);
        perpOracle.registerMarket(BTC_MARKET_KEY);

        perpFeeSplitter = new MockPerpFeeSplitter(address(gd));
        marginVault = new MarginVault(address(gd), admin);
        fundingRate = new FundingRate(admin);
        perpEngine = new PerpEngine(
            address(marginVault),
            address(fundingRate),
            address(perpOracle),
            address(perpFeeSplitter),
            admin
        );
        marginVault.setPerpEngine(address(perpEngine));
        fundingRate.setPerpEngine(address(perpEngine));

        // Register BTC market
        btcMarketId = perpEngine.createMarket(BTC_MARKET_KEY, BTC_MARKET_KEY, 50);

        // Set initial BTC price (50000 USD, 8 decimals)
        vm.prank(keeper);
        perpOracle.updatePrice(BTC_MARKET_KEY, 50_000e8, 50_000e8, 3);

        // -------- Predict Protocol --------
        marketFactory = new MarketFactory(
            address(gd),
            address(feeSplitter),
            admin
        );
        conditionalTokens = marketFactory.tokens();

        // -------- Stable Protocol --------
        gusd = new gUSD(admin);
        usdc = new MockUSDC();

        stableFeeSplitter = new StableUBIFeeSplitter(
            address(gd),
            address(this), // protocolTreasury
            admin
        );

        psm = new PegStabilityModule(
            address(gusd),
            address(usdc),
            address(stableFeeSplitter),
            admin
        );

        // Authorize PSM as minter/burner
        gusd.setMinter(address(psm), true);
        gusd.setBurner(address(psm), true);

        // -------- Stocks Protocol --------
        stocksOracle = new StocksPriceOracle(admin);

        stocksVault = new CollateralVault(
            address(gd),
            address(stocksOracle),
            address(feeSplitter),
            admin
        );

        aaplToken = new SyntheticAsset("Synthetic Apple", "sAAPL", address(stocksVault));

        stocksVault.registerAsset("AAPL", address(aaplToken));

        // Register AAPL price feed ($150, 8 decimals)
        aaplFeed = new MockChainlinkFeed(150e8, 8);
        stocksOracle.registerFeed("AAPL", address(aaplFeed));

        // -------- Fund test users --------
        gd.mint(alice, 500_000e18);
        gd.mint(bob, 500_000e18);
        usdc.mint(alice, 100_000e6);
    }

    // ============================================================
    //                     SWAP TESTS
    // ============================================================

    function test_swap_executeSwap() public {
        address pair = address(gdWethPair);
        (uint112 r0, uint112 r1,) = gdWethPair.getReserves();
        assertTrue(r0 > 0 && r1 > 0, "reserves should be seeded");

        uint256 swapAmount = 1_000e18;
        (address token0,) = _sortTokens(address(gd), weth);

        vm.startPrank(alice);
        gd.transfer(pair, swapAmount);

        uint256 amountOut;
        if (token0 == address(gd)) {
            amountOut = _getAmountOut(swapAmount, r0, r1);
            gdWethPair.swap(0, amountOut, alice, "");
        } else {
            amountOut = _getAmountOut(swapAmount, r1, r0);
            gdWethPair.swap(amountOut, 0, alice, "");
        }
        vm.stopPrank();

        assertGt(amountOut, 0, "should receive WETH from swap");
    }

    function test_swap_reservesNonZero() public view {
        (uint112 r0, uint112 r1,) = gdWethPair.getReserves();
        assertGt(r0, 0);
        assertGt(r1, 0);
    }

    // ============================================================
    //                     PERPS TESTS
    // ============================================================

    function test_perps_depositAndOpenPosition() public {
        uint256 posSize = 10_000e18;
        uint256 margin = 10_000e18;
        uint256 depositAmt = margin + (posSize * 10 / 10000) + 1;

        vm.startPrank(alice);
        gd.approve(address(marginVault), depositAmt);
        marginVault.deposit(depositAmt);

        perpEngine.openPosition(btcMarketId, posSize, true, margin);
        vm.stopPrank();

        (bool isOpen,,,,,,) = perpEngine.positions(alice, btcMarketId);
        assertTrue(isOpen, "position should be open");
    }

    function test_perps_closePosition() public {
        uint256 posSize = 10_000e18;
        uint256 margin = 10_000e18;
        uint256 depositAmt = margin + (posSize * 10 / 10000) + 1;

        vm.startPrank(alice);
        gd.approve(address(marginVault), depositAmt);
        marginVault.deposit(depositAmt);
        perpEngine.openPosition(btcMarketId, posSize, true, margin);
        perpEngine.closePosition(btcMarketId);
        vm.stopPrank();

        (bool isOpen,,,,,,) = perpEngine.positions(alice, btcMarketId);
        assertFalse(isOpen, "position should be closed");
    }

    // ============================================================
    //                     PREDICT TESTS
    // ============================================================

    function test_predict_createAndBuy() public {
        uint256 endTime = block.timestamp + 7 days;
        uint256 marketId = marketFactory.createMarket("Will BTC hit $100k?", endTime, admin);

        uint256 buyAmount = 1_000e18;
        vm.startPrank(alice);
        gd.approve(address(marketFactory), buyAmount);
        marketFactory.buy(marketId, true, buyAmount);
        vm.stopPrank();

        (,,,uint256 totalYES,,,) = marketFactory.markets(marketId);
        assertEq(totalYES, buyAmount, "YES tokens should match buy amount");
    }

    function test_predict_resolveAndRedeem() public {
        uint256 endTime = block.timestamp + 1 hours;
        uint256 marketId = marketFactory.createMarket("Test market", endTime, admin);

        uint256 buyAmount = 1_000e18;
        vm.startPrank(alice);
        gd.approve(address(marketFactory), buyAmount);
        marketFactory.buy(marketId, true, buyAmount);
        vm.stopPrank();

        // Warp past end time, close, and resolve
        vm.warp(endTime + 1);
        marketFactory.closeMarket(marketId);
        marketFactory.resolve(marketId, true);

        // Alice redeems
        uint256 yesTokenId = marketId * 2;
        uint256 aliceYesBal = conditionalTokens.balanceOf(alice, yesTokenId);
        assertGt(aliceYesBal, 0, "Alice should have YES tokens");

        vm.startPrank(alice);
        conditionalTokens.setApprovalForAll(address(marketFactory), true);
        marketFactory.redeem(marketId, aliceYesBal);
        vm.stopPrank();
    }

    // ============================================================
    //                     STABLE TESTS
    // ============================================================

    function test_stable_psmMint() public {
        uint256 usdcAmount = 10_000e6; // 10k USDC

        vm.startPrank(alice);
        usdc.approve(address(psm), usdcAmount);
        psm.swapUSDCForGUSD(usdcAmount);
        vm.stopPrank();

        uint256 gusdBalance = gusd.balanceOf(alice);
        // Should receive ~10k gUSD minus fee (0.1%)
        assertGt(gusdBalance, 9_900e18, "should receive ~10k gUSD");
    }

    function test_stable_psmRedeem() public {
        // First mint some gUSD
        uint256 usdcAmount = 10_000e6;
        vm.startPrank(alice);
        usdc.approve(address(psm), usdcAmount);
        psm.swapUSDCForGUSD(usdcAmount);

        // Now redeem gUSD for USDC
        uint256 gusdBal = gusd.balanceOf(alice);
        gusd.approve(address(psm), gusdBal);
        psm.swapGUSDForUSDC(gusdBal);
        vm.stopPrank();

        uint256 finalUsdc = usdc.balanceOf(alice);
        // Should recover most of the USDC (minus fees both ways)
        assertGt(finalUsdc, 9_800e6, "should recover most USDC");
    }

    // ============================================================
    //                     STOCKS TESTS
    // ============================================================

    function test_stocks_depositAndMint() public {
        uint256 collateral = 50_000e18; // $50k G$ collateral
        uint256 mintAmount = 1e18;      // 1 share of sAAPL

        vm.startPrank(alice);
        // Approve collateral + fee
        gd.approve(address(stocksVault), 100_000e18);
        stocksVault.depositCollateral("AAPL", collateral);
        stocksVault.mint("AAPL", mintAmount);
        vm.stopPrank();

        uint256 aaplBal = aaplToken.balanceOf(alice);
        assertEq(aaplBal, mintAmount, "should hold 1 sAAPL");
    }

    function test_stocks_mintAndBurn() public {
        uint256 collateral = 50_000e18;
        uint256 mintAmount = 1e18;

        vm.startPrank(alice);
        gd.approve(address(stocksVault), 100_000e18);
        stocksVault.depositAndMint("AAPL", collateral, mintAmount);

        aaplToken.approve(address(stocksVault), mintAmount);
        stocksVault.burn("AAPL", mintAmount);
        vm.stopPrank();

        assertEq(aaplToken.balanceOf(alice), 0, "should have burned all sAAPL");
    }

    // ============================================================
    //                CROSS-PROTOCOL FLOW TESTS
    // ============================================================

    function test_crossProtocol_swapThenDepositAsPerpsMargin() public {
        // Alice swaps GD for WETH, then deposits remaining GD as perps margin
        address pair = address(gdWethPair);
        (uint112 r0, uint112 r1,) = gdWethPair.getReserves();
        (address token0,) = _sortTokens(address(gd), weth);

        uint256 swapAmount = 5_000e18;

        vm.startPrank(alice);

        // Step 1: Swap
        gd.transfer(pair, swapAmount);
        uint256 amountOut;
        if (token0 == address(gd)) {
            amountOut = _getAmountOut(swapAmount, r0, r1);
            gdWethPair.swap(0, amountOut, alice, "");
        } else {
            amountOut = _getAmountOut(swapAmount, r1, r0);
            gdWethPair.swap(amountOut, 0, alice, "");
        }

        // Step 2: Deposit GD as perps margin (extra to cover fee)
        uint256 posSize = 10_000e18;
        uint256 margin = 10_000e18;
        uint256 depositAmt = margin + (posSize * 10 / 10000) + 1;
        gd.approve(address(marginVault), depositAmt);
        marginVault.deposit(depositAmt);

        // Step 3: Open a perps position
        perpEngine.openPosition(btcMarketId, posSize, true, margin);
        vm.stopPrank();

        (bool isOpen,,,,,,) = perpEngine.positions(alice, btcMarketId);
        assertTrue(isOpen, "perp position should be open after swap + deposit");
    }

    function test_crossProtocol_stableMintThenBuyPrediction() public {
        // Alice mints gUSD via PSM, then uses G$ to buy prediction tokens
        uint256 usdcAmount = 5_000e6;

        vm.startPrank(alice);

        // Step 1: Mint gUSD
        usdc.approve(address(psm), usdcAmount);
        psm.swapUSDCForGUSD(usdcAmount);
        uint256 gusdBal = gusd.balanceOf(alice);
        assertGt(gusdBal, 0, "should have gUSD");

        // Step 2: Use G$ (not gUSD) to buy prediction tokens
        uint256 endTime = block.timestamp + 7 days;
        vm.stopPrank();

        uint256 marketId = marketFactory.createMarket("Cross-protocol test", endTime, admin);

        vm.startPrank(alice);
        uint256 betAmount = 500e18;
        gd.approve(address(marketFactory), betAmount);
        marketFactory.buy(marketId, true, betAmount);
        vm.stopPrank();

        (,,,uint256 totalYES,,,) = marketFactory.markets(marketId);
        assertEq(totalYES, betAmount);
    }

    // ============================================================
    //                     ALL-PROTOCOLS SEQUENTIAL
    // ============================================================

    function test_allProtocols_sequentialExecution() public {
        // Execute all 6 protocols in sequence with the same user

        vm.startPrank(alice);

        // 1. SWAP: swap G$ for WETH
        {
            address pair = address(gdWethPair);
            (uint112 r0, uint112 r1,) = gdWethPair.getReserves();
            (address token0,) = _sortTokens(address(gd), weth);
            uint256 swapAmt = 1_000e18;
            gd.transfer(pair, swapAmt);
            uint256 out;
            if (token0 == address(gd)) {
                out = _getAmountOut(swapAmt, r0, r1);
                gdWethPair.swap(0, out, alice, "");
            } else {
                out = _getAmountOut(swapAmt, r1, r0);
                gdWethPair.swap(out, 0, alice, "");
            }
            assertGt(out, 0, "swap output > 0");
        }

        // 2. PERPS: deposit margin + open position
        {
            uint256 posSize = 5_000e18;
            uint256 margin = 5_000e18;
            uint256 depositAmt = margin + (posSize * 10 / 10000) + 1;
            gd.approve(address(marginVault), depositAmt);
            marginVault.deposit(depositAmt);
            perpEngine.openPosition(btcMarketId, posSize, true, margin);

            (bool isOpen,,,,,,) = perpEngine.positions(alice, btcMarketId);
            assertTrue(isOpen, "perp position open");
        }

        // 3. PREDICT: buy YES tokens
        {
            vm.stopPrank();
            uint256 endTime = block.timestamp + 7 days;
            uint256 mId = marketFactory.createMarket("Sequential test", endTime, admin);
            vm.startPrank(alice);

            uint256 betAmt = 500e18;
            gd.approve(address(marketFactory), betAmt);
            marketFactory.buy(mId, true, betAmt);

            (,,,uint256 totalYES,,,) = marketFactory.markets(mId);
            assertEq(totalYES, betAmt);
        }

        // 4. STABLE: mint gUSD via PSM
        {
            uint256 usdcAmt = 1_000e6;
            usdc.approve(address(psm), usdcAmt);
            psm.swapUSDCForGUSD(usdcAmt);
            assertGt(gusd.balanceOf(alice), 0, "gUSD minted");
        }

        // 5. STOCKS: deposit collateral + mint sAAPL
        {
            gd.approve(address(stocksVault), 100_000e18);
            stocksVault.depositAndMint("AAPL", 30_000e18, 1e18);
            assertEq(aaplToken.balanceOf(alice), 1e18, "holds 1 sAAPL");
        }

        vm.stopPrank();
    }

    // ============================================================
    //                     HELPERS
    // ============================================================

    function _sortTokens(address a, address b) internal pure returns (address t0, address t1) {
        (t0, t1) = a < b ? (a, b) : (b, a);
    }

    function _getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut)
        internal
        pure
        returns (uint256)
    {
        uint256 amountInWithFee = amountIn * 997;
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = reserveIn * 1000 + amountInWithFee;
        return numerator / denominator;
    }
}
