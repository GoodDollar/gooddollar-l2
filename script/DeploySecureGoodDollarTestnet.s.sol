// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/GoodDollarTokenSecure.sol";

/**
 * @title DeploySecureGoodDollarTestnet
 * @notice Deploys GoodDollarTokenSecure for security validation testing
 * @dev This script deploys the secure version of GoodDollarToken that addresses
 *      all 5 critical security vulnerabilities for testnet validation
 *
 * Security Fixes Included:
 *   - GOO-1842: True multi-sig oracle consensus (2-of-3 minimum)
 *   - GOO-1843: UBI pool remainder preservation
 *   - GOO-1844: Secure oracle governance with timelock
 *   - GOO-1845: Proper timelock design with role separation
 *   - GOO-1846: Secure minter authorization without extcodesize
 *
 * Usage (testnet):
 *   forge script script/DeploySecureGoodDollarTestnet.s.sol \
 *     --rpc-url $TESTNET_RPC --broadcast --verify
 */
contract DeploySecureGoodDollarTestnet is Script {
    // Testnet configuration addresses
    address constant ADMIN            = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;
    address constant ORACLE_1         = 0x70997970C51812dc3A010C7d01b50e0d17dc79C8;
    address constant ORACLE_2         = 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC;
    address constant ORACLE_3         = 0x90F79bf6EB2c4f870365E785982E1f101E93b906;
    address constant EMERGENCY_PAUSER = 0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65;

    uint256 constant INITIAL_SUPPLY   = 1_000_000_000 * 1e18; // 1 billion G$

    function run() external {
        uint256 key = vm.envOr(
            "PRIVATE_KEY",
            uint256(0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80)
        );
        address deployer = vm.addr(key);

        vm.startBroadcast(key);

        // Setup initial oracles for multi-sig consensus
        address[] memory initialOracles = new address[](3);
        initialOracles[0] = ORACLE_1;
        initialOracles[1] = ORACLE_2;
        initialOracles[2] = ORACLE_3;

        // Deploy GoodDollarTokenSecure with multi-sig oracle setup
        GoodDollarTokenSecure secureGDT = new GoodDollarTokenSecure(
            ADMIN,
            initialOracles,
            EMERGENCY_PAUSER,
            INITIAL_SUPPLY
        );

        console.log("GoodDollarTokenSecure (testnet):", address(secureGDT));
        console.log("Admin:", ADMIN);
        console.log("Oracle 1:", ORACLE_1);
        console.log("Oracle 2:", ORACLE_2);
        console.log("Oracle 3:", ORACLE_3);
        console.log("Emergency Pauser:", EMERGENCY_PAUSER);
        console.log("Initial Supply:", INITIAL_SUPPLY);

        // Verify initial state
        console.log("--- Security Verification ---");
        console.log("Oracle count:", secureGDT.getRoleCount(secureGDT.ORACLE_ROLE()));
        console.log("Admin role count:", secureGDT.getRoleCount(secureGDT.ADMIN_ROLE()));
        console.log("Emergency role count:", secureGDT.getRoleCount(secureGDT.EMERGENCY_ROLE()));
        console.log("Total supply:", secureGDT.totalSupply());
        console.log("Admin balance:", secureGDT.balanceOf(ADMIN));

        vm.stopBroadcast();

        console.log("--- Secure Testnet Deployment Complete ---");
        console.log("Security validation testing can now begin");
        console.log("Contract Address:", address(secureGDT));
    }
}