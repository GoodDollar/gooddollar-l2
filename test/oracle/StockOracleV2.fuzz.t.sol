// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../../src/oracle/StockOracleV2.sol";

/**
 * @title StockOracleV2FuzzTest
 * @notice Fuzz tests for StockOracleV2 covering updatePrice, batchUpdatePrices,
 *         deviation guard, staleness guard, and adminSetPrice.
 */
contract StockOracleV2FuzzTest is Test {
    StockOracleV2 public oracle;

    address public owner = address(0xABCD);
    address public signer1 = address(0x1111);
    address public nonSigner = address(0x9999);

    uint256 constant NOW_TS = 1_700_000_000;
    uint256 constant MAX_DEV_BPS = 1000; // 10%

    function setUp() public {
        address[] memory signers = new address[](1);
        signers[0] = signer1;

        vm.warp(NOW_TS);
        oracle = new StockOracleV2(owner, signers, 1);

        vm.startPrank(owner);
        oracle.registerSymbol("AAPL", 30, MAX_DEV_BPS);
        oracle.registerSymbol("TSLA", 60, 500);
        vm.stopPrank();
    }

    // ============ updatePrice fuzz ============

    function testFuzz_updatePrice_storesValid(uint128 _price, uint8 _conf) public {
        uint256 price = uint256(_price);
        vm.assume(price > 0);
        uint8 conf = _conf > 100 ? 100 : _conf;

        uint256 ts = NOW_TS + 1;
        vm.warp(ts);

        vm.prank(signer1);
        oracle.updatePrice("AAPL", price, ts, StockOracleV2.SessionState.Open, conf);

        StockOracleV2.PriceData memory pd = oracle.getPriceData("AAPL");
        assertEq(pd.price8, price, "price stored");
        assertEq(pd.timestamp, ts, "timestamp stored");
        assertEq(pd.confidence, conf, "confidence stored");
        assertEq(pd.signerCount, 1, "signer count");
    }

    function testFuzz_updatePrice_rejectsZero(uint256 _ts) public {
        uint256 ts = bound(_ts, NOW_TS + 1, NOW_TS + 1_000_000);
        vm.warp(ts);
        vm.prank(signer1);
        vm.expectRevert(StockOracleV2.ZeroPrice.selector);
        oracle.updatePrice("AAPL", 0, ts, StockOracleV2.SessionState.Open, 80);
    }

    function testFuzz_updatePrice_rejectsNonSigner(uint128 _price) public {
        uint256 price = uint256(_price);
        vm.assume(price > 0);
        vm.warp(NOW_TS + 1);
        vm.prank(nonSigner);
        vm.expectRevert(StockOracleV2.NotSigner.selector);
        oracle.updatePrice("AAPL", price, NOW_TS + 1, StockOracleV2.SessionState.Open, 80);
    }

    // ============ Deviation guard fuzz ============

    function testFuzz_deviationGuard_withinBounds(uint128 _seed) public {
        uint256 basePrice = 18_955_000_000; // $189.55
        vm.warp(NOW_TS + 1);
        vm.prank(signer1);
        oracle.updatePrice("AAPL", basePrice, NOW_TS + 1, StockOracleV2.SessionState.Open, 90);

        uint256 maxDev = (basePrice * MAX_DEV_BPS) / 10_000;
        uint256 newPrice = bound(uint256(_seed), basePrice > maxDev ? basePrice - maxDev : 1, basePrice + maxDev);

        vm.warp(NOW_TS + 2);
        vm.prank(signer1);
        oracle.updatePrice("AAPL", newPrice, NOW_TS + 2, StockOracleV2.SessionState.Open, 85);

        assertEq(oracle.getPriceData("AAPL").price8, newPrice, "price updated within deviation");
    }

    function testFuzz_deviationGuard_rejectsExcessive(uint128 _seed) public {
        uint256 basePrice = 18_955_000_000;
        vm.warp(NOW_TS + 1);
        vm.prank(signer1);
        oracle.updatePrice("AAPL", basePrice, NOW_TS + 1, StockOracleV2.SessionState.Open, 90);

        // Deviation formula: ((newPrice - basePrice) * 10000) / basePrice > 1000
        // So newPrice must be > basePrice * 11000 / 10000 = basePrice * 1.1
        // Use a price that's at least 11.01% above base to guarantee revert
        uint256 minExcessive = (basePrice * 11_001) / 10_000 + 1;
        uint256 newPrice = bound(uint256(_seed), minExcessive, type(uint128).max);

        vm.warp(NOW_TS + 2);
        vm.prank(signer1);
        vm.expectRevert(); // DeviationTooHigh
        oracle.updatePrice("AAPL", newPrice, NOW_TS + 2, StockOracleV2.SessionState.Open, 85);
    }

    // ============ Staleness guard fuzz ============

    function testFuzz_stalenessGuard_reverts(uint128 _extraSeconds) public {
        uint256 extraSeconds = bound(uint256(_extraSeconds), 31, 100_000);

        vm.warp(NOW_TS + 1);
        vm.prank(signer1);
        oracle.updatePrice("AAPL", 18_955_000_000, NOW_TS + 1, StockOracleV2.SessionState.Open, 90);

        vm.warp(NOW_TS + 1 + extraSeconds);
        vm.expectRevert(); // StalePriceError
        oracle.getPrice("AAPL");
    }

    function testFuzz_stalenessGuard_passes(uint128 _age) public {
        uint256 age = bound(uint256(_age), 0, 30);

        vm.warp(NOW_TS + 1);
        vm.prank(signer1);
        oracle.updatePrice("AAPL", 18_955_000_000, NOW_TS + 1, StockOracleV2.SessionState.Open, 90);

        vm.warp(NOW_TS + 1 + age);
        uint256 p = oracle.getPrice("AAPL");
        assertEq(p, 18_955_000_000, "price returned within staleness window");
    }

    // ============ batchUpdatePrices fuzz ============

    function testFuzz_batchUpdate_twoSymbols(uint128 _p1, uint128 _p2) public {
        uint256 p1 = bound(uint256(_p1), 1, type(uint128).max);
        uint256 p2 = bound(uint256(_p2), 1, type(uint128).max);

        string[] memory syms = new string[](2);
        syms[0] = "AAPL";
        syms[1] = "TSLA";

        uint256[] memory ps = new uint256[](2);
        ps[0] = p1;
        ps[1] = p2;

        uint256[] memory ts = new uint256[](2);
        ts[0] = NOW_TS + 1;
        ts[1] = NOW_TS + 1;

        StockOracleV2.SessionState[] memory ss = new StockOracleV2.SessionState[](2);
        ss[0] = StockOracleV2.SessionState.Open;
        ss[1] = StockOracleV2.SessionState.Open;

        uint8[] memory confs = new uint8[](2);
        confs[0] = 90;
        confs[1] = 85;

        vm.warp(NOW_TS + 1);
        vm.prank(signer1);
        oracle.batchUpdatePrices(syms, ps, ts, ss, confs);

        assertEq(oracle.getPriceData("AAPL").price8, p1, "AAPL batch price");
        assertEq(oracle.getPriceData("TSLA").price8, p2, "TSLA batch price");
    }

    // ============ adminSetPrice fuzz ============

    function testFuzz_adminSetPrice_overridesDeviation(uint128 _price) public {
        uint256 price = uint256(_price);
        vm.assume(price > 0);

        vm.warp(NOW_TS + 1);
        vm.prank(signer1);
        oracle.updatePrice("AAPL", 18_955_000_000, NOW_TS + 1, StockOracleV2.SessionState.Open, 90);

        vm.warp(NOW_TS + 2);
        vm.prank(owner);
        oracle.adminSetPrice("AAPL", price, StockOracleV2.SessionState.Open);

        assertEq(oracle.getPriceData("AAPL").price8, price, "admin override ignores deviation");
        assertEq(oracle.getPriceData("AAPL").confidence, 100, "admin sets confidence 100");
    }

    // ============ Timestamp regression fuzz ============

    function testFuzz_timestampRegression_reverts(uint128 _ts1, uint128 _ts2) public {
        uint256 ts1 = bound(uint256(_ts1), NOW_TS + 1, NOW_TS + 1_000_000);
        uint256 ts2 = bound(uint256(_ts2), 1, ts1);

        vm.warp(ts1);
        vm.prank(signer1);
        oracle.updatePrice("AAPL", 18_955_000_000, ts1, StockOracleV2.SessionState.Open, 90);

        vm.warp(ts1 + 1);
        vm.prank(signer1);
        vm.expectRevert(); // TimestampRegression
        oracle.updatePrice("AAPL", 18_955_000_000, ts2, StockOracleV2.SessionState.Open, 90);
    }
}
