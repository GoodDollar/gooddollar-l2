// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/GoodDollarToken.sol";
import "../src/GoodDollarTokenSecure.sol";

/**
 * @title StateMigrationTest
 * @notice Tests for migrating verified human state from vulnerable to secure contract
 * @dev Validates safe migration of all verified humans without losing verification status
 */
contract StateMigrationTest is Test {
    GoodDollarToken public vulnerableToken;
    GoodDollarTokenSecure public secureToken;

    address admin = address(0x1);
    address oracle1 = address(0x2);
    address oracle2 = address(0x3);
    address oracle3 = address(0x4);
    address emergencyPauser = address(0x5);

    address[] public verifiedHumans;

    uint256 constant INITIAL_SUPPLY = 1000000 ether;

    function setUp() public {
        // Deploy vulnerable contract (original)
        vulnerableToken = new GoodDollarToken(
            admin,
            oracle1, // Single oracle in vulnerable version
            INITIAL_SUPPLY
        );

        // Deploy secure contract
        address[] memory initialOracles = new address[](3);
        initialOracles[0] = oracle1;
        initialOracles[1] = oracle2;
        initialOracles[2] = oracle3;

        secureToken = new GoodDollarTokenSecure(
            admin,
            initialOracles,
            emergencyPauser,
            INITIAL_SUPPLY
        );

        // Setup verified humans in vulnerable contract
        _setupVerifiedHumans();
    }

    // ============ Migration Strategy Tests ============

    function test_VerifiedHumansMigration() public {
        console.log("=== VERIFIED HUMANS MIGRATION TEST ===");

        // Verify initial state in vulnerable contract
        assertEq(vulnerableToken.totalVerifiedHumans(), verifiedHumans.length);
        for (uint i = 0; i < verifiedHumans.length; i++) {
            assertTrue(vulnerableToken.isVerifiedHuman(verifiedHumans[i]));
        }

        // Execute migration using multi-sig consensus in secure contract
        for (uint i = 0; i < verifiedHumans.length; i++) {
            address human = verifiedHumans[i];

            // Oracle 1 votes to verify (based on vulnerable contract state)
            vm.prank(oracle1);
            secureToken.voteVerifyHuman(human, true, true);

            // Oracle 2 votes to verify (consensus needed)
            vm.prank(oracle2);
            secureToken.voteVerifyHuman(human, true, true);

            // Verify migration successful
            assertTrue(secureToken.isVerifiedHuman(human));
        }

        // Validate final state
        assertEq(secureToken.totalVerifiedHumans(), verifiedHumans.length);
        console.log("[PASS] All verified humans migrated successfully");
    }

    function test_BatchMigrationScript() public {
        // Simulate batch migration script for efficiency
        console.log("=== BATCH MIGRATION SCRIPT TEST ===");

        uint256 batchSize = 3;
        uint256 totalBatches = (verifiedHumans.length + batchSize - 1) / batchSize;

        for (uint batch = 0; batch < totalBatches; batch++) {
            uint256 start = batch * batchSize;
            uint256 end = start + batchSize;
            if (end > verifiedHumans.length) end = verifiedHumans.length;

            // Process batch
            for (uint i = start; i < end; i++) {
                address human = verifiedHumans[i];

                vm.prank(oracle1);
                secureToken.voteVerifyHuman(human, true, true);
                vm.prank(oracle2);
                secureToken.voteVerifyHuman(human, true, true);
            }

            console.log("Batch number:", batch + 1);
            console.log("Humans processed:", end - start);
        }

        assertEq(secureToken.totalVerifiedHumans(), verifiedHumans.length);
        console.log("[PASS] Batch migration completed successfully");
    }

    function test_MigrationIntegrity() public {
        console.log("=== MIGRATION INTEGRITY TEST ===");

        // Store original verification states
        bool[] memory originalStates = new bool[](verifiedHumans.length);
        for (uint i = 0; i < verifiedHumans.length; i++) {
            originalStates[i] = vulnerableToken.isVerifiedHuman(verifiedHumans[i]);
        }

        // Execute migration
        _executeMigration();

        // Verify integrity - no loss or addition of verifications
        for (uint i = 0; i < verifiedHumans.length; i++) {
            assertEq(
                secureToken.isVerifiedHuman(verifiedHumans[i]),
                originalStates[i],
                "Migration integrity check failed"
            );
        }

        console.log("[PASS] Migration integrity maintained");
    }

    // ============ UBI Pool Migration ============

    function test_UBIPoolMigration() public {
        console.log("=== UBI POOL MIGRATION TEST ===");

        // Setup UBI pool in vulnerable contract
        uint256 poolAmount = 5000 ether;
        vm.prank(admin);
        vulnerableToken.transfer(address(vulnerableToken), poolAmount);
        vm.prank(address(vulnerableToken));
        vulnerableToken.fundUBIPool(poolAmount);

        uint256 originalPool = vulnerableToken.ubiPool();

        // Admin withdraws from vulnerable contract for migration
        vm.prank(admin);
        vulnerableToken.transfer(admin, poolAmount);

        // Transfer to secure contract
        vm.prank(admin);
        secureToken.transfer(address(secureToken), poolAmount);
        vm.prank(address(secureToken));
        secureToken.fundUBIPool(poolAmount);

        assertEq(secureToken.ubiPool(), originalPool);
        console.log("[PASS] UBI pool migrated successfully");
    }

    // ============ Claim State Migration ============

    function test_ClaimStateMigration() public {
        console.log("=== CLAIM STATE MIGRATION TEST ===");

        // Setup verified humans and claims in vulnerable contract
        address testUser = verifiedHumans[0];

        // User claims UBI in vulnerable contract
        vm.prank(testUser);
        vulnerableToken.claimUBI();

        uint256 originalClaimTime = vulnerableToken.lastClaimTime(testUser);
        assertTrue(originalClaimTime > 0);

        // In secure contract, last claim time would need to be set during migration
        // This would require admin function or special migration contract
        console.log("Original claim time:", originalClaimTime);
        console.log("WARN: Claim state migration requires admin migration function");
    }

    // ============ Gas Cost Analysis ============

    function test_MigrationGasCosts() public {
        console.log("=== MIGRATION GAS COST ANALYSIS ===");

        uint256 totalGasUsed = 0;

        for (uint i = 0; i < 3; i++) { // Test with subset for gas measurement
            address human = verifiedHumans[i];

            uint256 gasBefore1 = gasleft();
            vm.prank(oracle1);
            secureToken.voteVerifyHuman(human, true, true);
            uint256 gasUsed1 = gasBefore1 - gasleft();

            uint256 gasBefore2 = gasleft();
            vm.prank(oracle2);
            secureToken.voteVerifyHuman(human, true, true);
            uint256 gasUsed2 = gasBefore2 - gasleft();

            uint256 totalForUser = gasUsed1 + gasUsed2;
            totalGasUsed += totalForUser;

            console.log("User index:", i);
            console.log("Gas for user:", totalForUser);
        }

        uint256 avgGasPerUser = totalGasUsed / 3;
        console.log("Average gas per user migration:", avgGasPerUser);

        // Estimate total cost for all users
        uint256 estimatedTotal = avgGasPerUser * verifiedHumans.length;
        console.log("Verified humans count:", verifiedHumans.length);
        console.log("Estimated total gas:", estimatedTotal);

        console.log("[PASS] Gas cost analysis completed");
    }

    // ============ Migration Verification ============

    function test_PostMigrationValidation() public {
        console.log("=== POST-MIGRATION VALIDATION ===");

        // Execute migration
        _executeMigration();

        // Verify all systems work post-migration
        address newUser = address(0x9999);

        // Test new verifications work
        vm.prank(oracle1);
        secureToken.voteVerifyHuman(newUser, true, true);
        vm.prank(oracle2);
        secureToken.voteVerifyHuman(newUser, true, true);
        assertTrue(secureToken.isVerifiedHuman(newUser));

        // Test UBI claims work for migrated users
        address migratedUser = verifiedHumans[0];
        vm.prank(migratedUser);
        secureToken.claimUBI();
        assertTrue(secureToken.balanceOf(migratedUser) > 0);

        // Test emergency controls work
        vm.prank(emergencyPauser);
        secureToken.setVerificationPaused(true);
        assertTrue(secureToken.verificationPaused());

        console.log("[PASS] All systems functional post-migration");
    }

    // ============ Helper Functions ============

    function _setupVerifiedHumans() internal {
        // Create and verify humans in vulnerable contract
        for (uint i = 0; i < 5; i++) {
            address human = address(uint160(0x2000 + i));
            verifiedHumans.push(human);

            // Verify in vulnerable contract (single oracle)
            vm.prank(oracle1);
            vulnerableToken.verifyHuman(human, true);
        }

        console.log("Setup verified humans:", verifiedHumans.length);
    }

    function _executeMigration() internal {
        for (uint i = 0; i < verifiedHumans.length; i++) {
            address human = verifiedHumans[i];

            vm.prank(oracle1);
            secureToken.voteVerifyHuman(human, true, true);
            vm.prank(oracle2);
            secureToken.voteVerifyHuman(human, true, true);
        }
    }
}