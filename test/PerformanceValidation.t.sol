// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/GoodDollarTokenSecure.sol";

/**
 * @title PerformanceValidationTest
 * @notice Comprehensive gas optimization and performance validation for GoodDollarTokenSecure
 * @dev Validates gas efficiency, scalability limits, and performance under stress conditions
 *      for production deployment readiness assessment
 */
contract PerformanceValidationTest is Test {
    GoodDollarTokenSecure public token;

    address admin = address(0x1);
    address oracle1 = address(0x2);
    address oracle2 = address(0x3);
    address oracle3 = address(0x4);
    address emergencyPauser = address(0x5);

    address[] internal testUsers;

    uint256 constant INITIAL_SUPPLY = 1000000 ether;
    uint256 constant GAS_LIMIT_VERIFICATION = 200000; // Gas limit for single verification vote
    uint256 constant GAS_LIMIT_UBI_CLAIM = 150000;    // Gas limit for UBI claim
    uint256 constant BATCH_SIZE = 50; // Batch processing size for scalability tests

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

        // Setup large test user pool for scalability testing
        for (uint i = 0; i < 200; i++) {
            testUsers.push(address(uint160(0x10000 + i)));
        }
    }

    // ============ Gas Optimization Validation ============

    function test_VerificationGasOptimization() public {
        console.log("=== VERIFICATION GAS OPTIMIZATION ===");

        address user = testUsers[0];

        // Measure first vote gas consumption
        uint256 gasBefore = gasleft();
        vm.prank(oracle1);
        token.voteVerifyHuman(user, true, true);
        uint256 firstVoteGas = gasBefore - gasleft();

        // Measure consensus vote gas consumption
        gasBefore = gasleft();
        vm.prank(oracle2);
        token.voteVerifyHuman(user, true, true);
        uint256 consensusVoteGas = gasBefore - gasleft();

        console.log("First vote gas:", firstVoteGas);
        console.log("Consensus vote gas:", consensusVoteGas);

        // Validate gas efficiency
        assertTrue(firstVoteGas <= GAS_LIMIT_VERIFICATION, "First vote gas exceeds limit");
        assertTrue(consensusVoteGas <= GAS_LIMIT_VERIFICATION * 2, "Consensus vote gas exceeds limit");

        console.log("[PASS] Verification gas optimization within limits");
    }

    function test_UBIClaimGasOptimization() public {
        console.log("=== UBI CLAIM GAS OPTIMIZATION ===");

        // Setup verified users and UBI pool
        address user1 = testUsers[0];
        address user2 = testUsers[1];

        address[] memory users = new address[](2);
        users[0] = user1;
        users[1] = user2;
        _verifyUsers(users);
        _fundUBIPool(1000 ether);

        // Measure UBI claim gas consumption
        uint256 gasBefore = gasleft();
        vm.prank(user1);
        token.claimUBI();
        uint256 claimGas = gasBefore - gasleft();

        console.log("UBI claim gas:", claimGas);
        assertTrue(claimGas <= GAS_LIMIT_UBI_CLAIM, "UBI claim gas exceeds limit");

        // Test subsequent claim gas (should be similar)
        gasBefore = gasleft();
        vm.prank(user2);
        token.claimUBI();
        uint256 secondClaimGas = gasBefore - gasleft();

        console.log("Second UBI claim gas:", secondClaimGas);
        assertTrue(secondClaimGas <= GAS_LIMIT_UBI_CLAIM, "Second UBI claim gas exceeds limit");

        console.log("[PASS] UBI claim gas optimization validated");
    }

    function test_BatchVerificationScaling() public {
        console.log("=== BATCH VERIFICATION SCALING ===");

        uint256 totalGas = 0;
        uint256 verifiedCount = 0;

        // Process in batches to simulate real-world usage
        for (uint batch = 0; batch < 3; batch++) {
            uint256 batchStart = batch * BATCH_SIZE;
            uint256 batchEnd = batchStart + BATCH_SIZE;
            if (batchEnd > testUsers.length) batchEnd = testUsers.length;

            for (uint i = batchStart; i < batchEnd; i++) {
                address user = testUsers[i];

                uint256 gasBefore = gasleft();
                vm.prank(oracle1);
                token.voteVerifyHuman(user, true, true);
                vm.prank(oracle2);
                token.voteVerifyHuman(user, true, true);
                uint256 gasUsed = gasBefore - gasleft();

                totalGas += gasUsed;
                verifiedCount++;
            }

            console.log("Batch number:", batch + 1);
            console.log("Users in batch:", batchEnd - batchStart);
        }

        uint256 avgGasPerVerification = totalGas / verifiedCount;
        console.log("Total verified users:", verifiedCount);
        console.log("Average gas per verification:", avgGasPerVerification);

        // Validate scaling efficiency
        assertTrue(avgGasPerVerification <= GAS_LIMIT_VERIFICATION * 2, "Batch verification gas too high");
        assertEq(token.totalVerifiedHumans(), verifiedCount);

        console.log("[PASS] Batch verification scaling validated");
    }

    // ============ Storage Optimization Tests ============

    function test_StorageAccessPatterns() public {
        console.log("=== STORAGE ACCESS PATTERN OPTIMIZATION ===");

        address user = testUsers[0];

        // Test storage reads during verification
        uint256 gasBefore = gasleft();
        bool isVerified1 = token.isVerifiedHuman(user);
        uint256 readGas1 = gasBefore - gasleft();

        // Verify user
        _verifyUser(user);

        // Test storage reads after verification
        gasBefore = gasleft();
        bool isVerified2 = token.isVerifiedHuman(user);
        uint256 readGas2 = gasBefore - gasleft();

        console.log("Pre-verification read gas:", readGas1);
        console.log("Post-verification read gas:", readGas2);
        console.log("Verified status:", isVerified2);

        // Storage reads should be efficient
        assertTrue(readGas1 < 10000, "Pre-verification read gas too high");
        assertTrue(readGas2 < 10000, "Post-verification read gas too high");

        console.log("[PASS] Storage access patterns optimized");
    }

    function test_StateTransitionEfficiency() public {
        console.log("=== STATE TRANSITION EFFICIENCY ===");

        address user = testUsers[0];

        // Measure complete verification workflow gas
        uint256 gasBefore = gasleft();

        vm.prank(oracle1);
        token.voteVerifyHuman(user, true, true);
        vm.prank(oracle2);
        token.voteVerifyHuman(user, true, true);

        uint256 verificationGas = gasBefore - gasleft();

        // Measure revocation workflow gas
        gasBefore = gasleft();

        vm.prank(oracle1);
        token.voteVerifyHuman(user, true, false);
        vm.prank(oracle2);
        token.voteVerifyHuman(user, true, false);

        uint256 revocationGas = gasBefore - gasleft();

        console.log("Full verification gas:", verificationGas);
        console.log("Full revocation gas:", revocationGas);

        // State transitions should be efficient
        assertTrue(verificationGas <= GAS_LIMIT_VERIFICATION * 3, "Verification workflow gas too high");
        assertTrue(revocationGas <= GAS_LIMIT_VERIFICATION * 3, "Revocation workflow gas too high");

        console.log("[PASS] State transition efficiency validated");
    }

    // ============ Stress Testing ============

    function test_HighVolumeUBIClaims() public {
        console.log("=== HIGH VOLUME UBI CLAIMS STRESS TEST ===");

        // Setup large user pool
        uint256 userCount = 20;
        address[] memory claimUsers = new address[](userCount);

        for (uint i = 0; i < userCount; i++) {
            claimUsers[i] = testUsers[i];
        }

        _verifyUsers(claimUsers);
        _fundUBIPool(10000 ether); // Large pool for stress testing

        uint256 totalClaimGas = 0;

        // Execute high volume claims
        for (uint i = 0; i < userCount; i++) {
            uint256 gasBefore = gasleft();
            vm.prank(claimUsers[i]);
            token.claimUBI();
            uint256 claimGas = gasBefore - gasleft();
            totalClaimGas += claimGas;

            // Validate individual claim gas
            assertTrue(claimGas <= GAS_LIMIT_UBI_CLAIM * 2, "High volume claim gas exceeds limit");
        }

        uint256 avgClaimGas = totalClaimGas / userCount;
        console.log("Total claims processed:", userCount);
        console.log("Average claim gas:", avgClaimGas);
        console.log("Remaining pool:", token.ubiPool());

        assertTrue(avgClaimGas <= GAS_LIMIT_UBI_CLAIM, "Average claim gas too high under stress");

        console.log("[PASS] High volume UBI claims stress test passed");
    }

    function test_ConcurrentOperationsStress() public {
        console.log("=== CONCURRENT OPERATIONS STRESS TEST ===");

        // Simulate concurrent verifications and claims
        address[] memory verifyUsers = new address[](10);
        address[] memory claimUsers = new address[](10);

        for (uint i = 0; i < 10; i++) {
            verifyUsers[i] = testUsers[i];
            claimUsers[i] = testUsers[i + 10];
        }

        // Pre-verify claim users
        _verifyUsers(claimUsers);
        _fundUBIPool(2000 ether);

        uint256 totalGas = 0;

        // Execute concurrent operations
        for (uint i = 0; i < 10; i++) {
            uint256 gasBefore = gasleft();

            // Verification operation
            vm.prank(oracle1);
            token.voteVerifyHuman(verifyUsers[i], true, true);
            vm.prank(oracle2);
            token.voteVerifyHuman(verifyUsers[i], true, true);

            // Claim operation
            vm.prank(claimUsers[i]);
            token.claimUBI();

            uint256 combinedGas = gasBefore - gasleft();
            totalGas += combinedGas;
        }

        uint256 avgCombinedGas = totalGas / 10;
        console.log("Average combined operation gas:", avgCombinedGas);

        // Combined operations should remain efficient
        assertTrue(avgCombinedGas <= (GAS_LIMIT_VERIFICATION * 2) + GAS_LIMIT_UBI_CLAIM,
                  "Concurrent operations gas too high");

        console.log("[PASS] Concurrent operations stress test passed");
    }

    // ============ Memory and State Analysis ============

    function test_MemoryUsageOptimization() public {
        console.log("=== MEMORY USAGE OPTIMIZATION ===");

        uint256 initialGas = gasleft();

        // Test memory usage during large batch operations
        address[] memory largeBatch = new address[](100);
        for (uint i = 0; i < 100; i++) {
            largeBatch[i] = testUsers[i];
        }

        // Process large batch and measure memory efficiency
        for (uint i = 0; i < largeBatch.length; i++) {
            vm.prank(oracle1);
            token.voteVerifyHuman(largeBatch[i], true, true);
        }

        uint256 finalGas = gasleft();
        uint256 totalGasUsed = initialGas - finalGas;
        uint256 avgGasPerOperation = totalGasUsed / 100;

        console.log("Large batch gas per operation:", avgGasPerOperation);

        // Memory-efficient operations should maintain gas efficiency
        assertTrue(avgGasPerOperation <= GAS_LIMIT_VERIFICATION, "Memory usage affecting gas efficiency");

        console.log("[PASS] Memory usage optimization validated");
    }

    // ============ Helper Functions ============

    function _verifyUser(address user) internal {
        vm.prank(oracle1);
        token.voteVerifyHuman(user, true, true);
        vm.prank(oracle2);
        token.voteVerifyHuman(user, true, true);
    }

    function _verifyUsers(address[] memory users) internal {
        for (uint i = 0; i < users.length; i++) {
            _verifyUser(users[i]);
        }
    }

    function _fundUBIPool(uint256 amount) internal {
        vm.prank(admin);
        token.transfer(address(token), amount);
        vm.prank(address(token));
        token.fundUBIPool(amount);
    }
}