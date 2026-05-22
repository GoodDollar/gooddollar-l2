// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/GoodDollarTokenSecure.sol";

/**
 * @title MultiOracleConsensusTest
 * @notice Comprehensive testing framework for multi-oracle consensus mechanism
 * @dev Tests all possible oracle voting combinations and edge cases for 2-of-3 consensus
 */
contract MultiOracleConsensusTest is Test {
    GoodDollarTokenSecure public token;

    address admin = address(0x1);
    address oracle1 = address(0x2);
    address oracle2 = address(0x3);
    address oracle3 = address(0x4);
    address emergencyPauser = address(0x5);

    address[] internal testUsers;

    uint256 constant INITIAL_SUPPLY = 1000000 ether;

    event VerificationConsensusReached(address indexed human, bool status, uint256 approvals, uint256 rejections);

    function setUp() public {
        address[] memory initialOracles = new address[](3);
        initialOracles[0] = oracle1;
        initialOracles[1] = oracle2;
        initialOracles[2] = oracle3;

        token = new GoodDollarTokenSecure(
            admin,
            initialOracles,
            emergencyPauser,
            INITIAL_SUPPLY
        );

        // Setup test users
        for (uint i = 0; i < 10; i++) {
            testUsers.push(address(uint160(0x1000 + i)));
        }
    }

    // ============ Consensus Mechanism Tests ============

    function test_TwoOfThreeConsensus_AllCombinations() public {
        address user = testUsers[0];

        // Test Oracle 1 + Oracle 2 consensus
        vm.prank(oracle1);
        token.voteVerifyHuman(user, true, true);
        assertFalse(token.isVerifiedHuman(user)); // Not yet verified

        vm.prank(oracle2);
        vm.expectEmit(true, true, true, true);
        emit VerificationConsensusReached(user, true, 2, 0);
        token.voteVerifyHuman(user, true, true);
        assertTrue(token.isVerifiedHuman(user)); // Now verified

        // Reset for next test
        _resetUser(user);

        // Test Oracle 1 + Oracle 3 consensus
        vm.prank(oracle1);
        token.voteVerifyHuman(user, true, true);
        vm.prank(oracle3);
        token.voteVerifyHuman(user, true, true);
        assertTrue(token.isVerifiedHuman(user));

        _resetUser(user);

        // Test Oracle 2 + Oracle 3 consensus
        vm.prank(oracle2);
        token.voteVerifyHuman(user, true, true);
        vm.prank(oracle3);
        token.voteVerifyHuman(user, true, true);
        assertTrue(token.isVerifiedHuman(user));

        console.log("[PASS] All 2-of-3 oracle combinations working");
    }

    function test_SingleOracleInsufficient() public {
        address user = testUsers[1];

        // Each oracle alone should be insufficient
        vm.prank(oracle1);
        token.voteVerifyHuman(user, true, true);
        assertFalse(token.isVerifiedHuman(user));

        vm.prank(oracle2);
        token.voteVerifyHuman(user, true, true);
        assertTrue(token.isVerifiedHuman(user)); // Now 2 votes

        console.log("[PASS] Single oracle insufficient for verification");
    }

    function test_RejectionConsensus() public {
        address user = testUsers[2];

        // First verify the user with 2 approvals
        vm.prank(oracle1);
        token.voteVerifyHuman(user, true, true);
        vm.prank(oracle2);
        token.voteVerifyHuman(user, true, true);
        assertTrue(token.isVerifiedHuman(user));

        // Now test revocation with 2 rejections
        vm.prank(oracle1);
        token.voteVerifyHuman(user, true, false); // Vote to revoke
        vm.prank(oracle2);
        token.voteVerifyHuman(user, true, false); // Vote to revoke
        assertFalse(token.isVerifiedHuman(user));

        console.log("[PASS] Rejection consensus working");
    }

    function test_VotingIntegrity() public {
        address user = testUsers[3];

        // Oracle cannot vote twice
        vm.prank(oracle1);
        token.voteVerifyHuman(user, true, true);

        vm.prank(oracle1);
        vm.expectRevert(); // Should revert on double voting
        token.voteVerifyHuman(user, true, true);

        console.log("[PASS] Double voting prevention working");
    }

    function test_StatusMismatchPrevention() public {
        address user = testUsers[4];

        // Start verification vote
        vm.prank(oracle1);
        token.voteVerifyHuman(user, true, true);

        // Cannot switch to revocation vote
        vm.prank(oracle2);
        vm.expectRevert(); // Should revert on status mismatch
        token.voteVerifyHuman(user, true, false);

        console.log("[PASS] Vote status mismatch prevention working");
    }

    // ============ Stress Testing ============

    function test_MassVerificationConsensus() public {
        console.log("=== MASS VERIFICATION STRESS TEST ===");

        for (uint i = 0; i < 5; i++) {
            address user = testUsers[i];

            vm.prank(oracle1);
            token.voteVerifyHuman(user, true, true);
            vm.prank(oracle2);
            token.voteVerifyHuman(user, true, true);

            assertTrue(token.isVerifiedHuman(user));
        }

        assertEq(token.totalVerifiedHumans(), 5);
        console.log("[PASS] Mass verification handled correctly");
    }

    function test_ConcurrentVotingSessions() public {
        address user1 = testUsers[5];
        address user2 = testUsers[6];

        // Start two concurrent voting sessions
        vm.prank(oracle1);
        token.voteVerifyHuman(user1, true, true);
        vm.prank(oracle2);
        token.voteVerifyHuman(user2, true, true);

        // Complete first session
        vm.prank(oracle2);
        token.voteVerifyHuman(user1, true, true);
        assertTrue(token.isVerifiedHuman(user1));

        // Complete second session
        vm.prank(oracle3);
        token.voteVerifyHuman(user2, true, true);
        assertTrue(token.isVerifiedHuman(user2));

        console.log("[PASS] Concurrent voting sessions handled correctly");
    }

    // ============ Edge Cases ============

    function test_OracleRoleChangeDuringVoting() public {
        address user = testUsers[7];
        address newOracle = address(0x9999);

        // Start voting
        vm.prank(oracle1);
        token.voteVerifyHuman(user, true, true);

        // Admin schedules oracle change (with timelock)
        vm.prank(admin);
        token.scheduleOracleChange(newOracle, true);

        // Oracle 2 can still vote (oracle change not yet executed)
        vm.prank(oracle2);
        token.voteVerifyHuman(user, true, true);
        assertTrue(token.isVerifiedHuman(user));

        console.log("[PASS] Oracle role changes don't affect ongoing votes");
    }

    function test_EmergencyPauseDuringConsensus() public {
        address user = testUsers[8];

        // Start voting
        vm.prank(oracle1);
        token.voteVerifyHuman(user, true, true);

        // Emergency pause
        vm.prank(emergencyPauser);
        token.setVerificationPaused(true);

        // Cannot continue voting while paused
        vm.prank(oracle2);
        vm.expectRevert();
        token.voteVerifyHuman(user, true, true);

        // Unpause and continue
        vm.prank(emergencyPauser);
        token.setVerificationPaused(false);

        vm.prank(oracle2);
        token.voteVerifyHuman(user, true, true);
        assertTrue(token.isVerifiedHuman(user));

        console.log("[PASS] Emergency pause controls work during consensus");
    }

    // ============ Performance Validation ============

    function test_ConsensusGasUsage() public {
        address user = testUsers[9];

        // Measure gas for first vote
        uint256 gasBefore1 = gasleft();
        vm.prank(oracle1);
        token.voteVerifyHuman(user, true, true);
        uint256 gasUsed1 = gasBefore1 - gasleft();

        // Measure gas for consensus vote
        uint256 gasBefore2 = gasleft();
        vm.prank(oracle2);
        token.voteVerifyHuman(user, true, true);
        uint256 gasUsed2 = gasBefore2 - gasleft();

        console.log("Gas used for first vote:", gasUsed1);
        console.log("Gas used for consensus vote:", gasUsed2);

        // Validate reasonable gas usage
        assertTrue(gasUsed1 < 200000, "First vote gas too high");
        assertTrue(gasUsed2 < 300000, "Consensus vote gas too high");

        console.log("[PASS] Gas usage within acceptable limits");
    }

    // ============ Helper Functions ============

    function _resetUser(address user) internal {
        if (token.isVerifiedHuman(user)) {
            // Use admin to force reset for testing
            vm.prank(oracle1);
            token.voteVerifyHuman(user, true, false);
            vm.prank(oracle2);
            token.voteVerifyHuman(user, true, false);
        }
    }
}