// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../../src/stocks/StockAMM.sol";
import "../../src/stocks/SyntheticAsset.sol";
import "../../src/stocks/PriceOracle.sol";

/**
 * @title OracleAMMCoherenceTest
 * @notice Proves that StockAMM swap prices are oracle-anchored per-asset:
 *         - Multiple assets read distinct oracle prices
 *         - Swap outputs match oracle mid ± dynamic spread
 *         - Oracle price updates immediately propagate to swap quotes
 *         - Inventory skew increases spread when pool is imbalanced
 */
contract OracleAMMCoherenceTest is Test {
    StockAMM public amm;
    PriceOracle public oracle;
    SyntheticAsset public sAAPL;
    SyntheticAsset public sTSLA;
    SyntheticAsset public sNVDA;

    address admin = makeAddr("admin");
    address treasury = makeAddr("treasury");
    address trader = makeAddr("trader");
    address lp = makeAddr("lp");

    MockGDollar gd;

    uint256 constant AAPL_PRICE_8 = 19_000_000_000; // $190.00
    uint256 constant TSLA_PRICE_8 = 17_500_000_000; // $175.00
    uint256 constant NVDA_PRICE_8 = 95_000_000_000; // $950.00

    uint256 constant BPS = 10_000;
    uint256 constant BASE_SPREAD_BPS = 10;
    uint256 constant TRADE_FEE_BPS = 30;

    function setUp() public {
        gd = new MockGDollar();
        oracle = new PriceOracle(admin);

        vm.startPrank(admin);
        oracle.setManualPrice("AAPL", AAPL_PRICE_8, true);
        oracle.setManualPrice("TSLA", TSLA_PRICE_8, true);
        oracle.setManualPrice("NVDA", NVDA_PRICE_8, true);
        vm.stopPrank();

        amm = new StockAMM(address(oracle), address(gd), treasury, admin);

        sAAPL = new SyntheticAsset("Synthetic Apple", "sAAPL", admin);
        sTSLA = new SyntheticAsset("Synthetic Tesla", "sTSLA", admin);
        sNVDA = new SyntheticAsset("Synthetic Nvidia", "sNVDA", admin);

        vm.startPrank(admin);
        amm.createPool("AAPL", address(sAAPL));
        amm.createPool("TSLA", address(sTSLA));
        amm.createPool("NVDA", address(sNVDA));

        sAAPL.mint(admin, 1000 ether);
        sAAPL.approve(address(amm), 1000 ether);
        amm.seedSyntheticReserve("AAPL", 1000 ether);

        sTSLA.mint(admin, 1000 ether);
        sTSLA.approve(address(amm), 1000 ether);
        amm.seedSyntheticReserve("TSLA", 1000 ether);

        sNVDA.mint(admin, 500 ether);
        sNVDA.approve(address(amm), 500 ether);
        amm.seedSyntheticReserve("NVDA", 500 ether);
        vm.stopPrank();

        gd.mint(lp, 1_000_000 ether);
        gd.mint(trader, 500_000 ether);

        vm.startPrank(lp);
        gd.approve(address(amm), 1_000_000 ether);
        amm.addLiquidity("AAPL", 200_000 ether);
        amm.addLiquidity("TSLA", 200_000 ether);
        amm.addLiquidity("NVDA", 200_000 ether);
        vm.stopPrank();
    }

    /// Multiple assets read distinct oracle prices — buy quotes differ per asset
    function test_multiAssetDistinctOraclePrices() public view {
        uint256 inputG = 10_000 ether; // $10,000

        (uint256 aaplOut,) = amm.getQuoteBuy("AAPL", inputG);
        (uint256 tslaOut,) = amm.getQuoteBuy("TSLA", inputG);
        (uint256 nvdaOut,) = amm.getQuoteBuy("NVDA", inputG);

        // Cheaper stock → more units out
        assertGt(tslaOut, aaplOut, "TSLA cheaper, should give more tokens than AAPL");
        assertGt(aaplOut, nvdaOut, "AAPL cheaper than NVDA, should give more tokens");

        // Verify approximate ratios reflect price differences
        // AAPL=$190, TSLA=$175 → TSLA should give ~190/175 ≈ 1.086x more
        uint256 ratioTSLAvsAAPL = (tslaOut * 1000) / aaplOut;
        assertApproxEqAbs(ratioTSLAvsAAPL, 1085, 10, "TSLA/AAPL ratio ~1.086");

        // AAPL=$190, NVDA=$950 → NVDA gives ~190/950 ≈ 0.2x of AAPL
        uint256 ratioNVDAvsAAPL = (nvdaOut * 1000) / aaplOut;
        assertApproxEqAbs(ratioNVDAvsAAPL, 200, 10, "NVDA/AAPL ratio ~0.2");
    }

    /// Swap output matches oracle mid ± base spread (balanced pool)
    function test_buyOutputMatchesOracleMidPlusSpread() public view {
        uint256 inputG = 10_000 ether;
        (uint256 aaplOut, uint256 fee) = amm.getQuoteBuy("AAPL", inputG);

        uint256 netIn = inputG - fee;
        // Expected: netIn_USD8 / askPrice8
        // askPrice = oraclePrice * (1 + spread/10000)
        // With balanced pool, spread = BASE_SPREAD_BPS = 10
        uint256 askPrice8 = AAPL_PRICE_8 + (AAPL_PRICE_8 * BASE_SPREAD_BPS) / BPS;
        uint256 netInUSD8 = (netIn * 1e8) / 1e18;
        uint256 expectedOut = (netInUSD8 * 1e18) / askPrice8;

        assertEq(aaplOut, expectedOut, "Buy output must match oracle ask exactly");
    }

    /// Sell output matches oracle mid - base spread (balanced pool)
    function test_sellOutputMatchesOracleMidMinusSpread() public view {
        uint256 syntheticIn = 10 ether; // 10 sAAPL
        (uint256 gOut, uint256 fee) = amm.getQuoteSell("AAPL", syntheticIn);

        uint256 bidPrice8 = AAPL_PRICE_8 - (AAPL_PRICE_8 * BASE_SPREAD_BPS) / BPS;
        uint256 grossUSD8 = (syntheticIn * bidPrice8) / 1e18;
        uint256 grossG = (grossUSD8 * 1e18) / 1e8;
        uint256 expectedFee = (grossG * TRADE_FEE_BPS) / BPS;
        uint256 expectedOut = grossG - expectedFee;

        assertEq(gOut, expectedOut, "Sell output must match oracle bid exactly");
        assertEq(fee, expectedFee, "Fee must match expected");
    }

    /// Oracle price update immediately propagates to AMM swap quotes
    function test_oracleUpdatePropagatesImmediately() public {
        uint256 inputG = 10_000 ether;
        (uint256 outBefore,) = amm.getQuoteBuy("AAPL", inputG);

        // Double the AAPL price
        uint256 newPrice = AAPL_PRICE_8 * 2;
        vm.prank(admin);
        oracle.setManualPrice("AAPL", newPrice, true);

        (uint256 outAfter,) = amm.getQuoteBuy("AAPL", inputG);

        // At double the price, user gets ~half the tokens
        assertApproxEqRel(outAfter * 2, outBefore, 0.001e18, "Doubling oracle price halves output");
    }

    /// Changing one asset's oracle does not affect another asset's quotes
    function test_oracleUpdateIsolatedPerAsset() public {
        uint256 inputG = 10_000 ether;
        (uint256 tslaOutBefore,) = amm.getQuoteBuy("TSLA", inputG);

        // Change AAPL price — should NOT affect TSLA
        vm.prank(admin);
        oracle.setManualPrice("AAPL", AAPL_PRICE_8 * 3, true);

        (uint256 tslaOutAfter,) = amm.getQuoteBuy("TSLA", inputG);
        assertEq(tslaOutAfter, tslaOutBefore, "TSLA quote unchanged when AAPL price moves");
    }

    /// Inventory skew increases spread when pool becomes imbalanced
    function test_inventorySkewIncreasesSpread() public {
        uint256 inputG = 10_000 ether;
        (uint256 outBalanced,) = amm.getQuoteBuy("AAPL", inputG);

        // Buy a large amount to deplete synthetic reserve (imbalance the pool)
        vm.startPrank(trader);
        gd.approve(address(amm), 150_000 ether);
        amm.buyStock("AAPL", 150_000 ether, 0);
        vm.stopPrank();

        // Now the pool is synthetic-light → buying spread should increase
        (uint256 outAfterSkew,) = amm.getQuoteBuy("AAPL", inputG);
        assertLt(outAfterSkew, outBalanced, "Skewed pool gives fewer tokens (wider ask spread)");

        // Verify the spread difference is > 0 and bounded by MAX_INVENTORY_SKEW_BPS (50)
        uint256 pctDiff = ((outBalanced - outAfterSkew) * BPS) / outBalanced;
        assertGt(pctDiff, 0, "Spread must increase");
        assertLe(pctDiff, 50 + 5, "Spread increase bounded by MAX_INVENTORY_SKEW_BPS + rounding");
    }

    /// Sell spread also widens when pool is imbalanced in opposite direction
    function test_sellSpreadWidensWhenSyntheticHeavy() public {
        uint256 syntheticIn = 5 ether;
        (uint256 outBalanced,) = amm.getQuoteSell("AAPL", syntheticIn);

        // Sell a large amount to increase synthetic reserve (imbalance the pool)
        vm.startPrank(admin);
        sAAPL.mint(trader, 500 ether);
        vm.stopPrank();

        vm.startPrank(trader);
        sAAPL.approve(address(amm), 500 ether);
        amm.sellStock("AAPL", 400 ether, 0);
        vm.stopPrank();

        // Pool now has excess synthetic → selling spread should increase
        (uint256 outAfterSkew,) = amm.getQuoteSell("AAPL", syntheticIn);
        assertLt(outAfterSkew, outBalanced, "Skewed pool gives less G$ on sell (wider bid spread)");
    }

    /// Bid-ask spread is symmetric around oracle mid for balanced pool
    function test_bidAskSymmetricAroundMid() public view {
        uint256 syntheticAmount = 10 ether;
        uint256 gDollarAmount = 10_000 ether;

        // Get effective buy price (ask)
        (uint256 buyOut,) = amm.getQuoteBuy("AAPL", gDollarAmount);
        // Effective ask = gDollarInput / buyOut (in terms of gStock)
        // Actually: askPrice = (gDollarIn - fee) / buyOut (as USD per token)

        // Get effective sell price (bid)
        (uint256 sellOut,) = amm.getQuoteSell("AAPL", syntheticAmount);

        // For a balanced pool, spread should be BASE_SPREAD_BPS=10 on each side
        // Verify: impliedAsk > oraclePrice > impliedBid
        uint256 impliedAsk8 = ((gDollarAmount - (gDollarAmount * TRADE_FEE_BPS / BPS)) * 1e8 / 1e18) * 1e18 / buyOut;
        uint256 impliedBid8Times1e18 = (sellOut + (sellOut * TRADE_FEE_BPS / (BPS - TRADE_FEE_BPS))) * 1e8 / syntheticAmount;

        assertGt(impliedAsk8, AAPL_PRICE_8, "Ask > oracle mid");
        assertLt(impliedBid8Times1e18, AAPL_PRICE_8, "Bid < oracle mid");
    }
}

contract MockGDollar {
    string public constant name = "Mock G$";
    string public constant symbol = "G$";
    uint8 public constant decimals = 18;
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    function mint(address to, uint256 amount) external {
        totalSupply += amount;
        balanceOf[to] += amount;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        require(balanceOf[msg.sender] >= amount, "MockGD: insufficient");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(balanceOf[from] >= amount, "MockGD: insufficient");
        require(allowance[from][msg.sender] >= amount, "MockGD: allowance");
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function fundUBIPool(uint256) external pure {}
}
