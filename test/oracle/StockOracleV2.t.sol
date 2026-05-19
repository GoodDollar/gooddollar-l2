// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../../src/oracle/StockOracleV2.sol";

contract StockOracleV2Test is Test {
    StockOracleV2 public oracle;

    address public owner = address(0xABCD);
    address public signer1 = address(0x1111);
    address public signer2 = address(0x2222);
    address public signer3 = address(0x3333);
    address public nonSigner = address(0x9999);

    uint256 constant AAPL_PRICE = 18_955_000_000;  // $189.55
    uint256 constant TSLA_PRICE = 17_800_000_000;   // $178.00
    uint256 constant NOW_TS = 1_700_000_000;

    function setUp() public {
        address[] memory initialSigners = new address[](3);
        initialSigners[0] = signer1;
        initialSigners[1] = signer2;
        initialSigners[2] = signer3;

        vm.warp(NOW_TS);
        oracle = new StockOracleV2(owner, initialSigners, 1);

        vm.startPrank(owner);
        oracle.registerSymbol("AAPL", 30, 1000);
        oracle.registerSymbol("TSLA", 30, 1000);
        oracle.registerSymbol("NVDA", 60, 500);
        vm.stopPrank();
    }

    // ============ Constructor ============

    function test_constructorSetsOwner() public view {
        assertEq(oracle.owner(), owner);
    }

    function test_constructorSetsSigners() public view {
        assertTrue(oracle.signers(signer1));
        assertTrue(oracle.signers(signer2));
        assertTrue(oracle.signers(signer3));
        assertEq(oracle.signerCount(), 3);
    }

    function test_constructorSetsQuorum() public view {
        assertEq(oracle.quorum(), 1);
    }

    function test_constructorRevertsZeroOwner() public {
        address[] memory s = new address[](1);
        s[0] = signer1;
        vm.expectRevert(StockOracleV2.ZeroAddress.selector);
        new StockOracleV2(address(0), s, 1);
    }

    function test_constructorRevertsInvalidQuorum() public {
        address[] memory s = new address[](2);
        s[0] = signer1;
        s[1] = signer2;
        vm.expectRevert(abi.encodeWithSelector(
            StockOracleV2.InvalidQuorum.selector, 3, 2
        ));
        new StockOracleV2(owner, s, 3);
    }

    function test_constructorRevertsZeroQuorum() public {
        address[] memory s = new address[](1);
        s[0] = signer1;
        vm.expectRevert(abi.encodeWithSelector(
            StockOracleV2.InvalidQuorum.selector, 0, 1
        ));
        new StockOracleV2(owner, s, 0);
    }

    function test_constructorRevertsDuplicateSigner() public {
        address[] memory s = new address[](2);
        s[0] = signer1;
        s[1] = signer1;
        vm.expectRevert(abi.encodeWithSelector(
            StockOracleV2.SignerAlreadyExists.selector, signer1
        ));
        new StockOracleV2(owner, s, 1);
    }

    // ============ Symbol Registration ============

    function test_registerSymbol() public view {
        (uint256 staleness, uint256 deviation, bool active) = oracle.symbolConfigs(
            keccak256(abi.encodePacked("AAPL"))
        );
        assertEq(staleness, 30);
        assertEq(deviation, 1000);
        assertTrue(active);
        assertEq(oracle.registeredSymbolCount(), 3);
    }

    function test_removeSymbol() public {
        vm.prank(owner);
        oracle.removeSymbol("NVDA");
        (, , bool active) = oracle.symbolConfigs(keccak256(abi.encodePacked("NVDA")));
        assertFalse(active);
        assertEq(oracle.registeredSymbolCount(), 2);
    }

    function test_registerSymbolRevertsNonOwner() public {
        vm.prank(nonSigner);
        vm.expectRevert(StockOracleV2.NotOwner.selector);
        oracle.registerSymbol("SPY", 30, 1000);
    }

    // ============ Signer Management ============

    function test_addSigner() public {
        address newSigner = address(0x4444);
        vm.prank(owner);
        oracle.addSigner(newSigner);
        assertTrue(oracle.signers(newSigner));
        assertEq(oracle.signerCount(), 4);
    }

    function test_removeSigner() public {
        vm.prank(owner);
        oracle.removeSigner(signer3);
        assertFalse(oracle.signers(signer3));
        assertEq(oracle.signerCount(), 2);
    }

    function test_removeSignerClampsQuorum() public {
        vm.startPrank(owner);
        oracle.setQuorum(3);
        oracle.removeSigner(signer3);
        assertEq(oracle.quorum(), 2);
        vm.stopPrank();
    }

    function test_addSignerRevertsZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert(StockOracleV2.ZeroAddress.selector);
        oracle.addSigner(address(0));
    }

    function test_addSignerRevertsDuplicate() public {
        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(
            StockOracleV2.SignerAlreadyExists.selector, signer1
        ));
        oracle.addSigner(signer1);
    }

    function test_setQuorum() public {
        vm.prank(owner);
        oracle.setQuorum(2);
        assertEq(oracle.quorum(), 2);
    }

    function test_setQuorumRevertsInvalid() public {
        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(
            StockOracleV2.InvalidQuorum.selector, 5, 3
        ));
        oracle.setQuorum(5);
    }

    // ============ Price Updates ============

    function test_updatePrice() public {
        vm.prank(signer1);
        oracle.updatePrice("AAPL", AAPL_PRICE, NOW_TS, StockOracleV2.SessionState.Open, 95);

        StockOracleV2.PriceData memory pd = oracle.getPriceData("AAPL");
        assertEq(pd.price8, AAPL_PRICE);
        assertEq(pd.timestamp, NOW_TS);
        assertEq(uint8(pd.session), uint8(StockOracleV2.SessionState.Open));
        assertEq(pd.confidence, 95);
        assertEq(pd.signerCount, 1);
    }

    function test_updatePriceRevertsNonSigner() public {
        vm.prank(nonSigner);
        vm.expectRevert(StockOracleV2.NotSigner.selector);
        oracle.updatePrice("AAPL", AAPL_PRICE, NOW_TS, StockOracleV2.SessionState.Open, 95);
    }

    function test_updatePriceRevertsZeroPrice() public {
        vm.prank(signer1);
        vm.expectRevert(StockOracleV2.ZeroPrice.selector);
        oracle.updatePrice("AAPL", 0, NOW_TS, StockOracleV2.SessionState.Open, 95);
    }

    function test_updatePriceRevertsUnregisteredSymbol() public {
        vm.prank(signer1);
        bytes32 h = keccak256(abi.encodePacked("SPY"));
        vm.expectRevert(abi.encodeWithSelector(StockOracleV2.SymbolNotRegistered.selector, h));
        oracle.updatePrice("SPY", 40_000_000_000, NOW_TS, StockOracleV2.SessionState.Open, 95);
    }

    function test_updatePriceRevertsTimestampRegression() public {
        vm.startPrank(signer1);
        oracle.updatePrice("AAPL", AAPL_PRICE, NOW_TS, StockOracleV2.SessionState.Open, 95);

        vm.expectRevert(abi.encodeWithSelector(
            StockOracleV2.TimestampRegression.selector, NOW_TS - 1, NOW_TS
        ));
        oracle.updatePrice("AAPL", AAPL_PRICE + 100_000_000, NOW_TS - 1, StockOracleV2.SessionState.Open, 95);
        vm.stopPrank();
    }

    function test_updatePriceRevertsDeviationTooHigh() public {
        vm.startPrank(signer1);
        oracle.updatePrice("AAPL", AAPL_PRICE, NOW_TS, StockOracleV2.SessionState.Open, 95);

        uint256 doublePrice = AAPL_PRICE * 2;
        vm.expectRevert(abi.encodeWithSelector(
            StockOracleV2.DeviationTooHigh.selector,
            keccak256(abi.encodePacked("AAPL")),
            AAPL_PRICE,
            doublePrice,
            10000
        ));
        oracle.updatePrice("AAPL", doublePrice, NOW_TS + 1, StockOracleV2.SessionState.Open, 95);
        vm.stopPrank();
    }

    function test_updatePriceAllowsNormalDeviation() public {
        vm.startPrank(signer1);
        oracle.updatePrice("AAPL", AAPL_PRICE, NOW_TS, StockOracleV2.SessionState.Open, 95);

        uint256 smallMove = AAPL_PRICE + (AAPL_PRICE * 500 / 10_000); // 5% increase
        oracle.updatePrice("AAPL", smallMove, NOW_TS + 1, StockOracleV2.SessionState.Open, 95);

        StockOracleV2.PriceData memory pd = oracle.getPriceData("AAPL");
        assertEq(pd.price8, smallMove);
        vm.stopPrank();
    }

    function test_updatePriceRequiresQuorumWhenHigher() public {
        vm.prank(owner);
        oracle.setQuorum(2);

        vm.prank(signer1);
        vm.expectRevert(abi.encodeWithSelector(
            StockOracleV2.InsufficientQuorum.selector, 1, 2
        ));
        oracle.updatePrice("AAPL", AAPL_PRICE, NOW_TS, StockOracleV2.SessionState.Open, 95);
    }

    // ============ Batch Updates ============

    function test_batchUpdatePrices() public {
        string[] memory symbols = new string[](2);
        symbols[0] = "AAPL";
        symbols[1] = "TSLA";

        uint256[] memory p8 = new uint256[](2);
        p8[0] = AAPL_PRICE;
        p8[1] = TSLA_PRICE;

        uint256[] memory ts = new uint256[](2);
        ts[0] = NOW_TS;
        ts[1] = NOW_TS;

        StockOracleV2.SessionState[] memory sess = new StockOracleV2.SessionState[](2);
        sess[0] = StockOracleV2.SessionState.Open;
        sess[1] = StockOracleV2.SessionState.Open;

        uint8[] memory conf = new uint8[](2);
        conf[0] = 90;
        conf[1] = 88;

        vm.prank(signer1);
        oracle.batchUpdatePrices(symbols, p8, ts, sess, conf);

        assertEq(oracle.getPriceData("AAPL").price8, AAPL_PRICE);
        assertEq(oracle.getPriceData("TSLA").price8, TSLA_PRICE);
    }

    function test_batchUpdatePricesRevertsLengthMismatch() public {
        string[] memory symbols = new string[](2);
        symbols[0] = "AAPL";
        symbols[1] = "TSLA";

        uint256[] memory p8 = new uint256[](1);
        p8[0] = AAPL_PRICE;

        uint256[] memory ts = new uint256[](2);
        ts[0] = NOW_TS;
        ts[1] = NOW_TS;

        StockOracleV2.SessionState[] memory sess = new StockOracleV2.SessionState[](2);
        sess[0] = StockOracleV2.SessionState.Open;
        sess[1] = StockOracleV2.SessionState.Open;

        uint8[] memory conf = new uint8[](2);
        conf[0] = 90;
        conf[1] = 88;

        vm.prank(signer1);
        vm.expectRevert(StockOracleV2.ArrayLengthMismatch.selector);
        oracle.batchUpdatePrices(symbols, p8, ts, sess, conf);
    }

    // ============ Price Reads ============

    function test_getPrice() public {
        vm.prank(signer1);
        oracle.updatePrice("AAPL", AAPL_PRICE, NOW_TS, StockOracleV2.SessionState.Open, 95);

        uint256 p = oracle.getPrice("AAPL");
        assertEq(p, AAPL_PRICE);
    }

    function test_getPriceRevertsStaleness() public {
        vm.prank(signer1);
        oracle.updatePrice("AAPL", AAPL_PRICE, NOW_TS, StockOracleV2.SessionState.Open, 95);

        vm.warp(NOW_TS + 31);

        bytes32 h = keccak256(abi.encodePacked("AAPL"));
        vm.expectRevert(abi.encodeWithSelector(
            StockOracleV2.StalePriceError.selector, h, 31, 30
        ));
        oracle.getPrice("AAPL");
    }

    function test_getPriceRevertsHalted() public {
        vm.prank(signer1);
        oracle.updatePrice("AAPL", AAPL_PRICE, NOW_TS, StockOracleV2.SessionState.Halted, 50);

        bytes32 h = keccak256(abi.encodePacked("AAPL"));
        vm.expectRevert(abi.encodeWithSelector(StockOracleV2.MarketHalted.selector, h));
        oracle.getPrice("AAPL");
    }

    function test_getPriceUnsafeReturnsStaleData() public {
        vm.prank(signer1);
        oracle.updatePrice("AAPL", AAPL_PRICE, NOW_TS, StockOracleV2.SessionState.Open, 95);

        vm.warp(NOW_TS + 1000);

        (uint256 price8, uint256 ts, StockOracleV2.SessionState session, uint8 confidence) =
            oracle.getPriceUnsafe("AAPL");
        assertEq(price8, AAPL_PRICE);
        assertEq(ts, NOW_TS);
        assertEq(uint8(session), uint8(StockOracleV2.SessionState.Open));
        assertEq(confidence, 95);
    }

    // ============ Admin Override ============

    function test_adminSetPrice() public {
        vm.prank(owner);
        oracle.adminSetPrice("AAPL", AAPL_PRICE, StockOracleV2.SessionState.Closed);

        StockOracleV2.PriceData memory pd = oracle.getPriceData("AAPL");
        assertEq(pd.price8, AAPL_PRICE);
        assertEq(pd.confidence, 100);
        assertEq(pd.signerCount, 0);
    }

    function test_adminSetPriceRevertsNonOwner() public {
        vm.prank(signer1);
        vm.expectRevert(StockOracleV2.NotOwner.selector);
        oracle.adminSetPrice("AAPL", AAPL_PRICE, StockOracleV2.SessionState.Open);
    }

    function test_adminSetPriceRevertsZero() public {
        vm.prank(owner);
        vm.expectRevert(StockOracleV2.ZeroPrice.selector);
        oracle.adminSetPrice("AAPL", 0, StockOracleV2.SessionState.Open);
    }

    // ============ Transfer Ownership ============

    function test_transferOwnership() public {
        address newOwner = address(0xBBBB);
        vm.prank(owner);
        oracle.transferOwnership(newOwner);
        assertEq(oracle.owner(), newOwner);
    }

    function test_transferOwnershipRevertsZero() public {
        vm.prank(owner);
        vm.expectRevert(StockOracleV2.ZeroAddress.selector);
        oracle.transferOwnership(address(0));
    }

    // ============ getAllSymbolHashes ============

    function test_getAllSymbolHashes() public view {
        bytes32[] memory hashes = oracle.getAllSymbolHashes();
        assertEq(hashes.length, 3);
    }

    // ============ Session States ============

    function test_preMarketSession() public {
        vm.prank(signer1);
        oracle.updatePrice("AAPL", AAPL_PRICE, NOW_TS, StockOracleV2.SessionState.PreMarket, 70);

        uint256 p = oracle.getPrice("AAPL");
        assertEq(p, AAPL_PRICE);
    }

    function test_closedSessionStillReadable() public {
        vm.prank(signer1);
        oracle.updatePrice("AAPL", AAPL_PRICE, NOW_TS, StockOracleV2.SessionState.Closed, 60);

        uint256 p = oracle.getPrice("AAPL");
        assertEq(p, AAPL_PRICE);
    }
}
