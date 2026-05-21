// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../../src/oracle/StockOracleV2.sol";
import "../../src/oracle/StockOracleV2Adapter.sol";

contract StockOracleV2AdapterTest is Test {
    StockOracleV2 public oracleV2;
    StockOracleV2Adapter public adapter;

    address public owner = address(0xAD);
    address public signer1 = address(0xBE);
    address public alice = address(0xCC);

    function setUp() public {
        address[] memory signersList = new address[](1);
        signersList[0] = signer1;

        vm.prank(owner);
        oracleV2 = new StockOracleV2(owner, signersList, 1);

        vm.startPrank(owner);
        oracleV2.registerSymbol("AAPL", 3600, 1000);
        oracleV2.registerSymbol("TSLA", 3600, 1000);
        vm.stopPrank();

        vm.prank(signer1);
        oracleV2.updatePrice("AAPL", 18_955_000_000, block.timestamp, StockOracleV2.SessionState.Open, 95);

        vm.prank(signer1);
        oracleV2.updatePrice("TSLA", 25_000_000_000, block.timestamp, StockOracleV2.SessionState.Open, 90);

        adapter = new StockOracleV2Adapter(address(oracleV2), owner);
    }

    // ── getPrice ──

    function test_getPrice_returnsUint256() public view {
        assertEq(adapter.getPrice("AAPL"), 18_955_000_000);
    }

    function test_getPrice_multipleSymbols() public view {
        assertEq(adapter.getPrice("AAPL"), 18_955_000_000);
        assertEq(adapter.getPrice("TSLA"), 25_000_000_000);
    }

    function test_getPrice_reverts_stalePrice() public {
        vm.warp(block.timestamp + 3601);
        vm.expectRevert();
        adapter.getPrice("AAPL");
    }

    function test_getPrice_reverts_unregisteredSymbol() public {
        vm.expectRevert();
        adapter.getPrice("MSFT");
    }

    // ── getPriceUnsafe ──

    function test_getPriceUnsafe_returnsEvenIfStale() public {
        vm.warp(block.timestamp + 3601);
        assertEq(adapter.getPriceUnsafe("AAPL"), 18_955_000_000);
    }

    function test_getPriceUnsafe_unregistered_returnsZero() public view {
        assertEq(adapter.getPriceUnsafe("MSFT"), 0);
    }

    // ── hasFeed ──

    function test_hasFeed_registered() public view {
        assertTrue(adapter.hasFeed("AAPL"));
        assertTrue(adapter.hasFeed("TSLA"));
    }

    function test_hasFeed_unregistered() public view {
        assertFalse(adapter.hasFeed("MSFT"));
    }

    function test_hasFeed_afterRemoval() public {
        vm.prank(owner);
        oracleV2.removeSymbol("AAPL");
        assertFalse(adapter.hasFeed("AAPL"));
    }

    // ── admin ──

    function test_setAdmin() public {
        vm.prank(owner);
        adapter.setAdmin(alice);
        assertEq(adapter.admin(), alice);
    }

    function test_setAdmin_revertsNonAdmin() public {
        vm.prank(alice);
        vm.expectRevert(StockOracleV2Adapter.NotAdmin.selector);
        adapter.setAdmin(alice);
    }

    function test_setAdmin_revertsZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert(StockOracleV2Adapter.ZeroAddress.selector);
        adapter.setAdmin(address(0));
    }

    // ── constructor ──

    function test_constructor_revertsZeroOracle() public {
        vm.expectRevert(StockOracleV2Adapter.ZeroAddress.selector);
        new StockOracleV2Adapter(address(0), owner);
    }

    function test_constructor_revertsZeroAdmin() public {
        vm.expectRevert(StockOracleV2Adapter.ZeroAddress.selector);
        new StockOracleV2Adapter(address(oracleV2), address(0));
    }

    // ── integration ──

    function test_priceChangePropagates() public {
        assertEq(adapter.getPrice("AAPL"), 18_955_000_000);

        vm.warp(block.timestamp + 10);
        vm.prank(signer1);
        oracleV2.updatePrice("AAPL", 19_000_000_000, block.timestamp, StockOracleV2.SessionState.Open, 98);

        assertEq(adapter.getPrice("AAPL"), 19_000_000_000);
    }

    function test_haltedMarket_reverts() public {
        vm.warp(block.timestamp + 10);
        vm.prank(signer1);
        oracleV2.updatePrice("AAPL", 18_955_000_000, block.timestamp, StockOracleV2.SessionState.Halted, 50);
        vm.expectRevert();
        adapter.getPrice("AAPL");
    }
}
