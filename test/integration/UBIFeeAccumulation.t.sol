// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../../src/GoodDollarToken.sol";
import "../../src/UBIFeeSplitter.sol";

/**
 * @title UBIFeeAccumulation
 * @notice Verifies that cumulative UBI fee routing remains accurate over many
 *         transactions — no rounding drift accumulates beyond 1 wei per tx.
 */
contract UBIFeeAccumulation is Test {
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
        gd.transfer(alice, 50_000_000e18);
    }

    function test_10swaps_cumulativeUBI_matchesSum() public {
        uint256[10] memory fees = [
            uint256(1_000e18),
            5_000e18,
            50_000e18,
            100_000e18,
            250_000e18,
            500_000e18,
            750_000e18,
            1_000_000e18,
            10_000e18,
            333_333e18
        ];

        uint256 ubiBPS = splitter.ubiBPS();
        uint256 totalApprove;
        for (uint256 i; i < 10; i++) totalApprove += fees[i];

        vm.startPrank(alice);
        gd.approve(address(splitter), totalApprove);

        uint256 expectedCumulativeUBI;
        uint256 actualCumulativeUBI;

        for (uint256 i; i < 10; i++) {
            (uint256 ubiShare,,) = splitter.splitFee(fees[i], dApp);
            actualCumulativeUBI += ubiShare;
            expectedCumulativeUBI += (fees[i] * ubiBPS) / 10000;
        }
        vm.stopPrank();

        assertEq(actualCumulativeUBI, expectedCumulativeUBI, "Cumulative UBI exact");
        assertEq(splitter.totalUBIFunded(), actualCumulativeUBI, "totalUBIFunded tracks");
    }

    function test_roundingDrift_maxOneWeiPerTx() public {
        uint256 ubiBPS = splitter.ubiBPS();
        uint256 protocolBPS = splitter.protocolBPS();

        uint256[5] memory oddFees = [
            uint256(1),      // 1 wei
            3,               // 3 wei
            7,               // 7 wei
            11,              // 11 wei
            9999             // ~1e-14 tokens
        ];

        uint256 totalApprove;
        for (uint256 i; i < 5; i++) totalApprove += oddFees[i];

        vm.startPrank(alice);
        gd.approve(address(splitter), totalApprove);

        for (uint256 i; i < 5; i++) {
            (uint256 ubiShare, uint256 protocolShare, uint256 dAppShare) =
                splitter.splitFee(oddFees[i], dApp);

            uint256 idealUBI = (oddFees[i] * ubiBPS) / 10000;
            uint256 idealProtocol = (oddFees[i] * protocolBPS) / 10000;

            // Integer division means actual == ideal (floor division)
            assertEq(ubiShare, idealUBI, "UBI floor exact");
            assertEq(protocolShare, idealProtocol, "Protocol floor exact");

            // dApp absorbs any remainder from floor rounding
            assertEq(
                ubiShare + protocolShare + dAppShare,
                oddFees[i],
                "Shares sum to total"
            );
        }
        vm.stopPrank();
    }

    function testFuzz_accumulation_noExcessiveDrift(uint8 txCount, uint128 baseFee) public {
        uint256 n = bound(uint256(txCount), 1, 20);
        uint256 base = bound(uint256(baseFee), 1, 1_000_000e18);

        uint256 ubiBPS = splitter.ubiBPS();

        uint256 totalNeeded = base * n;
        vm.prank(admin);
        gd.transfer(alice, totalNeeded);

        vm.startPrank(alice);
        gd.approve(address(splitter), totalNeeded);

        uint256 cumulativeActual;
        uint256 cumulativeExpected;

        for (uint256 i; i < n; i++) {
            (uint256 ubiShare,,) = splitter.splitFee(base, dApp);
            cumulativeActual += ubiShare;
            cumulativeExpected += (base * ubiBPS) / 10000;
        }
        vm.stopPrank();

        assertEq(cumulativeActual, cumulativeExpected, "Fuzz: no drift");
    }

    function test_treasuryReceivesProtocolShare() public {
        uint256 fee = 1_000_000e18;
        uint256 treasuryBefore = gd.balanceOf(treasury);

        vm.startPrank(alice);
        gd.approve(address(splitter), fee);
        (, uint256 protocolShare,) = splitter.splitFee(fee, dApp);
        vm.stopPrank();

        uint256 treasuryAfter = gd.balanceOf(treasury);
        assertEq(treasuryAfter - treasuryBefore, protocolShare, "Treasury received exact share");
    }

    function test_dAppReceivesDAppShare() public {
        uint256 fee = 1_000_000e18;
        uint256 dAppBefore = gd.balanceOf(dApp);

        vm.startPrank(alice);
        gd.approve(address(splitter), fee);
        (,, uint256 dAppShare) = splitter.splitFee(fee, dApp);
        vm.stopPrank();

        uint256 dAppAfter = gd.balanceOf(dApp);
        assertEq(dAppAfter - dAppBefore, dAppShare, "dApp received exact share");
    }

    function test_ubiPoolReceivesUBIShare() public {
        uint256 fee = 1_000_000e18;
        uint256 ubiPoolBefore = gd.ubiPool();

        vm.startPrank(alice);
        gd.approve(address(splitter), fee);
        (uint256 ubiShare,,) = splitter.splitFee(fee, dApp);
        vm.stopPrank();

        uint256 ubiPoolAfter = gd.ubiPool();
        assertEq(ubiPoolAfter - ubiPoolBefore, ubiShare, "UBI pool received exact share");
    }
}
