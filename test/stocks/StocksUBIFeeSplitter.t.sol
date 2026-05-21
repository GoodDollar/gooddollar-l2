// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../../src/stocks/StocksUBIFeeSplitter.sol";
import "../../src/GoodDollarToken.sol";

/// @title StocksUBIFeeSplitter — Defensive Hardening Tests
/// @notice Covers zero-address validation in the constructor and `setTreasury`,
///         plus event emission for `setTreasury` (TreasuryUpdated) and
///         `setFeeSplit` (FeeBpsUpdated). Mirrors the patterns established in
///         `test/UBIFeeSplitter.t.sol` for the matching defensive fixes on
///         `UBIFeeSplitter` (see task 0029).
contract StocksUBIFeeSplitterTest is Test {
    StocksUBIFeeSplitter splitter;
    GoodDollarToken goodDollar;

    address admin = makeAddr("admin");
    address oracle = makeAddr("oracle");
    address treasury = makeAddr("treasury");
    address newTreasury = makeAddr("newTreasury");
    address attacker = makeAddr("attacker");

    // Mirror events declared on StocksUBIFeeSplitter so vm.expectEmit can match.
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
    event FeeBpsUpdated(
        uint256 oldUbiBPS,
        uint256 oldProtocolBPS,
        uint256 newUbiBPS,
        uint256 newProtocolBPS
    );

    function setUp() public {
        // Real GoodDollarToken deployed by `admin`, then splitter with valid args.
        vm.startPrank(admin);
        goodDollar = new GoodDollarToken(admin, oracle, 0);
        splitter = new StocksUBIFeeSplitter(address(goodDollar), treasury, admin);
        vm.stopPrank();
    }

    // ─── Constructor zero-address checks ──────────────────────────────────────

    function test_Constructor_RevertsOnZeroTreasury() public {
        vm.expectRevert(bytes("zero address"));
        new StocksUBIFeeSplitter(address(goodDollar), address(0), admin);
    }

    function test_Constructor_RevertsOnZeroAdmin() public {
        vm.expectRevert(bytes("zero address"));
        new StocksUBIFeeSplitter(address(goodDollar), treasury, address(0));
    }

    function test_Constructor_SucceedsWithValidAddresses() public {
        StocksUBIFeeSplitter s = new StocksUBIFeeSplitter(
            address(goodDollar),
            treasury,
            admin
        );
        assertEq(s.protocolTreasury(), treasury);
        assertEq(s.admin(), admin);
    }

    // ─── setTreasury ──────────────────────────────────────────────────────────

    function test_SetTreasury_RevertsOnZeroAddress() public {
        vm.prank(admin);
        vm.expectRevert(bytes("zero address"));
        splitter.setTreasury(address(0));
    }

    function test_SetTreasury_EmitsTreasuryUpdated() public {
        vm.prank(admin);
        vm.expectEmit(true, true, false, true);
        emit TreasuryUpdated(treasury, newTreasury);
        splitter.setTreasury(newTreasury);
        assertEq(splitter.protocolTreasury(), newTreasury);
    }

    function test_SetTreasury_RevertsForNonAdmin() public {
        vm.prank(attacker);
        vm.expectRevert();
        splitter.setTreasury(newTreasury);
    }

    // ─── setFeeSplit ──────────────────────────────────────────────────────────

    function test_SetFeeSplit_EmitsFeeBpsUpdated() public {
        uint256 oldUbi = splitter.ubiBPS();
        uint256 oldProtocol = splitter.protocolBPS();
        vm.prank(admin);
        vm.expectEmit(false, false, false, true);
        emit FeeBpsUpdated(oldUbi, oldProtocol, 6000, 3000);
        splitter.setFeeSplit(6000, 3000);
    }

    function test_SetFeeSplit_RevertsOnExcessSum() public {
        vm.prank(admin);
        vm.expectRevert(bytes("Exceeds 100%"));
        splitter.setFeeSplit(7000, 4000);
    }

    function test_SetFeeSplit_RevertsForNonAdmin() public {
        vm.prank(attacker);
        vm.expectRevert();
        splitter.setFeeSplit(6000, 3000);
    }

    function test_SetFeeSplit_StorageUpdated() public {
        vm.prank(admin);
        splitter.setFeeSplit(6000, 3000);
        assertEq(splitter.ubiBPS(), 6000);
        assertEq(splitter.protocolBPS(), 3000);
    }
}
