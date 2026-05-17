// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/UBIFeeSplitter.sol";
import "../src/GoodDollarToken.sol";
import "./handlers/UBIFeeSplitterHandler.sol";

contract UBIFeeSplitterInvariantTest is Test {
    GoodDollarToken public gd;
    UBIFeeSplitter public splitter;
    UBIFeeSplitterHandler public handler;

    address public admin = address(0xAD);
    address public treasury = address(0xCC);
    address public dAppWallet = address(0xDA);

    uint256 constant SUPPLY = 1_000_000_000e18;
    uint256 constant HANDLER_BALANCE = 500_000_000e18;

    function setUp() public {
        gd = new GoodDollarToken(admin, admin, SUPPLY);
        splitter = new UBIFeeSplitter(address(gd), treasury, admin);

        handler = new UBIFeeSplitterHandler(splitter, gd, dAppWallet);

        vm.prank(admin);
        gd.transfer(address(handler), HANDLER_BALANCE);

        targetContract(address(handler));
    }

    // ============ Invariant: fee routing sums to total ============

    function invariant_feeRoutingSumsToTotal() public view {
        if (handler.callCount() == 0) return;

        uint256 sumShares = handler.totalUBIReceived()
            + handler.totalProtocolReceived()
            + handler.totalDAppReceived();

        assertApproxEqAbs(
            sumShares,
            handler.totalFeesSent(),
            handler.callCount(), // at most 1 wei rounding per call
            "sum of shares must equal total fees (within rounding)"
        );
    }

    // ============ Invariant: BPS never exceed 10000 ============

    function invariant_bpsNeverExceed10000() public view {
        uint256 total = splitter.ubiBPS() + splitter.protocolBPS();
        assertLe(total, 10000, "ubiBPS + protocolBPS must be <= 10000");
    }

    // ============ Invariant: UBI share is ~20% ============

    function invariant_ubiShareApprox20Percent() public view {
        if (handler.totalFeesSent() == 0) return;

        uint256 expectedUBI = (handler.totalFeesSent() * splitter.ubiBPS()) / 10000;
        assertApproxEqAbs(
            handler.totalUBIReceived(),
            expectedUBI,
            handler.callCount(),
            "UBI received must match ubiBPS percentage (within rounding)"
        );
    }

    // ============ Invariant: protocol share is ~16.67% ============

    function invariant_protocolShareApproxCorrect() public view {
        if (handler.totalFeesSent() == 0) return;

        uint256 expectedProtocol = (handler.totalFeesSent() * splitter.protocolBPS()) / 10000;
        assertApproxEqAbs(
            handler.totalProtocolReceived(),
            expectedProtocol,
            handler.callCount(),
            "protocol received must match protocolBPS percentage (within rounding)"
        );
    }

    // ============ Invariant: no tokens stuck in splitter ============

    function invariant_noTokensStuck() public view {
        uint256 splitterBalance = gd.balanceOf(address(splitter));
        assertLe(
            splitterBalance,
            handler.callCount(),
            "splitter should not accumulate tokens beyond rounding dust"
        );
    }

    // ============ Unit fuzz: splitFee arithmetic ============

    function testFuzz_splitFee_exactArithmetic(uint128 _amount) public {
        uint256 amount = uint256(_amount);
        vm.assume(amount > 0 && amount <= HANDLER_BALANCE / 2);

        vm.prank(admin);
        gd.transfer(address(this), amount);
        gd.approve(address(splitter), amount);

        (uint256 ubi, uint256 protocol, uint256 dApp) = splitter.splitFee(amount, dAppWallet);

        uint256 expectedUBI = (amount * 2000) / 10000;
        uint256 expectedProtocol = (amount * 1667) / 10000;
        uint256 expectedDApp = amount - expectedUBI - expectedProtocol;

        assertEq(ubi, expectedUBI, "ubi mismatch");
        assertEq(protocol, expectedProtocol, "protocol mismatch");
        assertEq(dApp, expectedDApp, "dApp mismatch");
        assertEq(ubi + protocol + dApp, amount, "shares must sum to amount");
    }

    // ============ Access control: only admin changes BPS ============

    function testFuzz_onlyAdmin_canSetFeeSplit(address _caller) public {
        vm.assume(_caller != admin);

        vm.expectRevert("Not admin");
        vm.prank(_caller);
        splitter.setFeeSplit(3000, 2000);
    }

    function test_admin_canSetFeeSplit() public {
        vm.prank(admin);
        splitter.setFeeSplit(3000, 2000);

        assertEq(splitter.ubiBPS(), 3000);
        assertEq(splitter.protocolBPS(), 2000);
    }

    function test_setFeeSplit_reverts_exceeds100() public {
        vm.expectRevert("Exceeds 100%");
        vm.prank(admin);
        splitter.setFeeSplit(6000, 5000);
    }
}
