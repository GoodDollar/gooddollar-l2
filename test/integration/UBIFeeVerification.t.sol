// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../../src/GoodDollarToken.sol";
import "../../src/UBIFeeSplitter.sol";

/**
 * @title UBIFeeVerification
 * @notice Verifies exact UBI fee routing percentages with 0.1% tolerance.
 *         Tests individual fee splits, edge cases, and cumulative accuracy.
 */
contract UBIFeeVerification is Test {
    GoodDollarToken internal gd;
    UBIFeeSplitter internal splitter;

    address internal admin    = address(0xAD);
    address internal treasury = address(0xBEEF);
    address internal identity = address(0x1D);
    address internal alice    = address(0xA11CE);
    address internal dApp     = address(0xDA99);

    uint256 constant INITIAL_SUPPLY = 100_000_000e18;

    function setUp() public {
        vm.startPrank(admin);
        gd = new GoodDollarToken(admin, identity, INITIAL_SUPPLY);
        splitter = new UBIFeeSplitter(address(gd), treasury, admin);
        vm.stopPrank();

        vm.prank(admin);
        gd.transfer(alice, 10_000_000e18);
    }

    // ========== Core split verification ==========

    function test_splitFee_exactPercentages() public {
        uint256 fee = 100_000e18;

        uint256 expectedUBI      = (fee * splitter.ubiBPS()) / 10000;
        uint256 expectedProtocol = (fee * splitter.protocolBPS()) / 10000;
        uint256 expectedDApp     = fee - expectedUBI - expectedProtocol;

        vm.startPrank(alice);
        gd.approve(address(splitter), fee);
        (uint256 ubiShare, uint256 protocolShare, uint256 dAppShare) =
            splitter.splitFee(fee, dApp);
        vm.stopPrank();

        assertEq(ubiShare, expectedUBI, "UBI share mismatch");
        assertEq(protocolShare, expectedProtocol, "Protocol share mismatch");
        assertEq(dAppShare, expectedDApp, "DApp share mismatch");
        assertEq(ubiShare + protocolShare + dAppShare, fee, "Shares must sum to total fee");
    }

    function test_splitFee_ubiBPS_is_2000() public view {
        assertEq(splitter.ubiBPS(), 2000, "UBI BPS should be 2000 (20%)");
    }

    function test_splitFee_protocolBPS_is_1667() public view {
        assertEq(splitter.protocolBPS(), 1667, "Protocol BPS should be 1667 (16.67%)");
    }

    function test_splitFee_ubiPercentage_within_tolerance() public {
        uint256 fee = 1_000_000e18;

        vm.startPrank(alice);
        gd.approve(address(splitter), fee);
        (uint256 ubiShare,,) = splitter.splitFee(fee, dApp);
        vm.stopPrank();

        uint256 expectedUBI = (fee * 2000) / 10000; // 20%
        assertApproxEqRel(ubiShare, expectedUBI, 0.001e18, "UBI within 0.1%");
    }

    function test_splitFee_protocolPercentage_within_tolerance() public {
        uint256 fee = 1_000_000e18;

        vm.startPrank(alice);
        gd.approve(address(splitter), fee);
        (, uint256 protocolShare,) = splitter.splitFee(fee, dApp);
        vm.stopPrank();

        uint256 expectedProtocol = (fee * 1667) / 10000; // 16.67%
        assertApproxEqRel(protocolShare, expectedProtocol, 0.001e18, "Protocol within 0.1%");
    }

    // ========== Edge cases ==========

    function test_splitFee_smallAmount() public {
        uint256 fee = 100; // 100 wei

        vm.startPrank(alice);
        gd.approve(address(splitter), fee);
        (uint256 ubiShare, uint256 protocolShare, uint256 dAppShare) =
            splitter.splitFee(fee, dApp);
        vm.stopPrank();

        assertEq(ubiShare, (fee * 2000) / 10000, "Small fee UBI");
        assertEq(protocolShare, (fee * 1667) / 10000, "Small fee protocol");
        assertEq(ubiShare + protocolShare + dAppShare, fee, "Shares sum to total");
    }

    function test_splitFee_oneToken() public {
        uint256 fee = 1e18;

        vm.startPrank(alice);
        gd.approve(address(splitter), fee);
        (uint256 ubiShare, uint256 protocolShare, uint256 dAppShare) =
            splitter.splitFee(fee, dApp);
        vm.stopPrank();

        assertEq(ubiShare + protocolShare + dAppShare, fee, "1 token must sum correctly");
    }

    function test_splitFee_largeAmount() public {
        uint256 fee = 5_000_000e18;

        vm.prank(admin);
        gd.transfer(alice, fee);

        vm.startPrank(alice);
        gd.approve(address(splitter), fee);
        (uint256 ubiShare, uint256 protocolShare, uint256 dAppShare) =
            splitter.splitFee(fee, dApp);
        vm.stopPrank();

        uint256 expectedUBI = (fee * 2000) / 10000;
        assertEq(ubiShare, expectedUBI, "Large amount UBI exact");
        assertEq(ubiShare + protocolShare + dAppShare, fee, "Large amount sum");
    }

    function test_splitFee_zeroReverts() public {
        vm.startPrank(alice);
        gd.approve(address(splitter), 1e18);
        vm.expectRevert("Zero fee");
        splitter.splitFee(0, dApp);
        vm.stopPrank();
    }

    // ========== Fuzz UBI share ==========

    function testFuzz_splitFee_ubiAlwaysCorrect(uint256 fee) public {
        fee = bound(fee, 1, 1_000_000e18);

        vm.prank(admin);
        gd.transfer(alice, fee);

        vm.startPrank(alice);
        gd.approve(address(splitter), fee);
        (uint256 ubiShare, uint256 protocolShare, uint256 dAppShare) =
            splitter.splitFee(fee, dApp);
        vm.stopPrank();

        uint256 expectedUBI = (fee * 2000) / 10000;
        assertEq(ubiShare, expectedUBI, "Fuzz: UBI share exact");
        assertEq(ubiShare + protocolShare + dAppShare, fee, "Fuzz: shares sum");
    }

    // ========== Stats tracking ==========

    function test_splitFee_totalFeesCollected() public {
        uint256 fee1 = 50_000e18;
        uint256 fee2 = 75_000e18;

        vm.startPrank(alice);
        gd.approve(address(splitter), fee1 + fee2);
        splitter.splitFee(fee1, dApp);
        splitter.splitFee(fee2, dApp);
        vm.stopPrank();

        assertEq(splitter.totalFeesCollected(), fee1 + fee2, "Total fees");
    }

    function test_splitFee_totalUBIFunded() public {
        uint256 fee1 = 50_000e18;
        uint256 fee2 = 75_000e18;

        vm.startPrank(alice);
        gd.approve(address(splitter), fee1 + fee2);
        splitter.splitFee(fee1, dApp);
        splitter.splitFee(fee2, dApp);
        vm.stopPrank();

        uint256 expectedTotal = ((fee1 * 2000) / 10000) + ((fee2 * 2000) / 10000);
        assertEq(splitter.totalUBIFunded(), expectedTotal, "Total UBI funded");
    }

    // ========== Admin controls ==========

    function test_setFeeSplit_updatesPercentages() public {
        vm.prank(admin);
        splitter.setFeeSplit(3300, 1700); // 33% UBI, 17% protocol

        uint256 fee = 100_000e18;

        vm.startPrank(alice);
        gd.approve(address(splitter), fee);
        (uint256 ubiShare,,) = splitter.splitFee(fee, dApp);
        vm.stopPrank();

        uint256 expectedUBI = (fee * 3300) / 10000;
        assertEq(ubiShare, expectedUBI, "Updated UBI share");
    }

    function test_setFeeSplit_exceeds100Reverts() public {
        vm.prank(admin);
        vm.expectRevert("Exceeds 100%");
        splitter.setFeeSplit(6000, 5000);
    }
}
