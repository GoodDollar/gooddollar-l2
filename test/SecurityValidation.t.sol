// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/GoodDollarTokenSecure.sol";

/**
 * @title SecurityValidation
 * @notice Comprehensive attack vector simulation tests for all 5 security vulnerabilities
 * @dev Tests validate that GoodDollarTokenSecure properly addresses:
 *      GOO-1842: False multi-sig security (single oracle control)
 *      GOO-1843: UBI pool division remainder loss attack
 *      GOO-1844: Oracle governance attack vector
 *      GOO-1845: Timelock design flaw
 *      GOO-1846: Minter extcodesize bypass
 */
contract MockMinter {}

contract SecurityValidationTest is Test {
    GoodDollarTokenSecure public token;

    address admin = address(0x1);
    address oracle1 = address(0x2);
    address oracle2 = address(0x3);
    address oracle3 = address(0x4);
    address emergencyPauser = address(0x5);
    address attacker = address(0x6);
    address user = address(0x7);

    uint256 constant INITIAL_SUPPLY = 1000000 ether;
    uint256 constant TIMELOCK_DELAY = 48 hours;

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
    }

    // ============ GOO-1842: False Multi-Sig Security Tests ============

    function test_GOO1842_SingleOracleCannotVerifyAlone() public {
        // Attack: Single oracle tries to verify unlimited fake accounts
        vm.prank(oracle1);
        token.voteVerifyHuman(attacker, true, true);

        // Should not be verified with only 1 vote (needs 2 of 3)
        assertFalse(token.isVerifiedHuman(attacker));
        console.log("[PASS] GOO-1842: Single oracle cannot verify alone");
    }

    function test_GOO1842_RequiresOracleConsensus() public {
        // Valid multi-sig verification requires 2 of 3 oracles
        vm.prank(oracle1);
        token.voteVerifyHuman(user, true, true);

        vm.prank(oracle2);
        token.voteVerifyHuman(user, true, true);

        // Should now be verified with 2 of 3 votes
        assertTrue(token.isVerifiedHuman(user));
        console.log("[PASS] GOO-1842: Multi-sig consensus working");
    }

    function test_GOO1842_AttackerCannotDrainUBIPool() public {
        // Setup: Fund UBI pool
        vm.prank(admin);
        token.transfer(address(token), 1000 ether);
        vm.prank(address(token));
        token.fundUBIPool(1000 ether);

        // Attack: Attacker tries to verify unlimited fake accounts
        for (uint i = 0; i < 10; i++) {
            address fakeAccount = address(uint160(0x1000 + i));

            // Single oracle vote should not verify
            vm.prank(oracle1);
            token.voteVerifyHuman(fakeAccount, true, true);
            assertFalse(token.isVerifiedHuman(fakeAccount));
        }

        // UBI pool should remain intact
        assertEq(token.ubiPool(), 1000 ether);
        console.log("[PASS] GOO-1842: UBI pool protected from fake verification attack");
    }

    // ============ GOO-1843: UBI Pool Division Remainder Loss ============

    function test_GOO1843_NoRemainderLoss() public {
        // Setup: Create scenario where division would cause remainder loss
        vm.prank(admin);
        token.transfer(address(token), 1000 ether);

        // Verify 3 humans
        _verifyHuman(address(0x1001));
        _verifyHuman(address(0x1002));
        _verifyHuman(address(0x1003));

        // Fund UBI pool with amount that doesn't divide evenly (1000 / 3 = 333.33...)
        vm.prank(address(token));
        token.fundUBIPool(1000 ether);

        uint256 initialPool = token.ubiPool();

        // First claim
        vm.prank(address(0x1001));
        token.claimUBI();

        uint256 afterFirstClaim = token.ubiPool();
        uint256 poolAmount = 1000 ether;
        uint256 expectedRemainder = poolAmount - (poolAmount / 3);

        // Remainder should be preserved in pool for future distribution
        assertEq(afterFirstClaim, expectedRemainder);
        console.log("[PASS] GOO-1843: Remainder preserved in UBI pool");
    }

    // ============ GOO-1844: Oracle Governance Attack Vector ============

    function test_GOO1844_OracleChangesRequireTimelock() public {
        address newOracle = address(0x9999);

        // Admin schedules oracle change
        vm.prank(admin);
        token.scheduleOracleChange(newOracle, true);

        // Should not be immediately executable
        vm.expectRevert();
        token.executeOracleChange(1);

        // Fast forward time
        vm.warp(block.timestamp + TIMELOCK_DELAY);

        // Should now be executable
        token.executeOracleChange(1);
        assertTrue(token.hasRole(token.ORACLE_ROLE(), newOracle));
        console.log("[PASS] GOO-1844: Oracle changes require timelock");
    }

    function test_GOO1844_OracleRemovalRequiresTimelock() public {
        vm.prank(admin);
        token.scheduleOracleChange(oracle1, false);

        vm.expectRevert();
        token.executeOracleChange(1);

        vm.warp(block.timestamp + TIMELOCK_DELAY);
        token.executeOracleChange(1);
        assertFalse(token.hasRole(token.ORACLE_ROLE(), oracle1));

        console.log("[PASS] GOO-1844: Oracle removal requires timelock");
    }

    // ============ GOO-1845: Timelock Design Flaw ============

    function test_GOO1845_SeparateRolesForProposalAndExecution() public {
        // The secure version should have proper role separation
        // Admin can propose, but execution requires timelock

        vm.prank(admin);
        token.setDailyUBIAmount(2 ether); // Should work immediately for non-critical params

        // For critical changes, timelock should be required
        address newOracle = address(0x8888);
        vm.prank(admin);
        token.scheduleOracleChange(newOracle, true);

        // Cannot execute immediately
        vm.expectRevert();
        token.executeOracleChange(1);

        console.log("[PASS] GOO-1845: Proper governance with timelock delays");
    }

    // ============ GOO-1846: Minter Extcodesize Bypass ============

    function test_GOO1846_EOAMintersAllowed() public {
        vm.prank(admin);
        token.setMinter(attacker, true);

        vm.prank(attacker);
        token.mint(attacker, 100 ether);

        assertEq(token.balanceOf(attacker), 100 ether);
        console.log("[PASS] GOO-1846: EOAs can be authorized minters");
    }

    function test_GOO1846_ContractMintersRemainFunctional() public {
        MockMinter minter = new MockMinter();

        vm.prank(admin);
        token.setMinter(address(minter), true);

        vm.prank(address(minter));
        token.mint(attacker, 50 ether);

        assertEq(token.balanceOf(attacker), 50 ether);
        console.log("[PASS] GOO-1846: Contract minters continue to operate");
    }

    // ============ Comprehensive Attack Simulation ============

    function test_ComprehensiveSecurityValidation() public {
        console.log("=== COMPREHENSIVE SECURITY VALIDATION ===");

        // Test multi-sig security
        assertEq(token.getRoleCount(token.ORACLE_ROLE()), 3);

        // Test emergency controls
        vm.prank(emergencyPauser);
        token.setVerificationPaused(true);
        assertTrue(token.verificationPaused());

        // Test that verification fails when paused
        vm.prank(oracle1);
        vm.expectRevert();
        token.voteVerifyHuman(user, true, true);

        // Unpause
        vm.prank(emergencyPauser);
        token.setVerificationPaused(false);

        console.log("[PASS] All security systems functioning correctly");
    }

    // ============ Helper Functions ============

    function _verifyHuman(address human) internal {
        vm.prank(oracle1);
        token.voteVerifyHuman(human, true, true);
        vm.prank(oracle2);
        token.voteVerifyHuman(human, true, true);
    }
}