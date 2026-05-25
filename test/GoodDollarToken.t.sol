// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/GoodDollarToken.sol";

contract MockMinterContract {}

contract GoodDollarTokenTest is Test {
    GoodDollarToken public token;
    address admin = address(1);
    address oracle = address(2);
    address alice = address(3);
    address bob = address(4);

    uint256 constant INITIAL_SUPPLY = 1_000_000_000e18; // 1B G$

    function setUp() public {
        token = new GoodDollarToken(admin, oracle, INITIAL_SUPPLY);
    }

    // ============ Token Basics ============

    function test_name() public view {
        assertEq(token.name(), "GoodDollar");
    }

    function test_symbol() public view {
        assertEq(token.symbol(), "G$");
    }

    function test_decimals() public view {
        assertEq(token.decimals(), 18);
    }

    function test_initialSupply() public view {
        assertEq(token.totalSupply(), INITIAL_SUPPLY);
        assertEq(token.balanceOf(admin), INITIAL_SUPPLY);
    }

    function test_transfer() public {
        vm.prank(admin);
        token.transfer(alice, 100e18);
        assertEq(token.balanceOf(alice), 100e18);
        assertEq(token.balanceOf(admin), INITIAL_SUPPLY - 100e18);
    }

    function test_approve_and_transferFrom() public {
        vm.prank(admin);
        token.approve(alice, 100e18);

        vm.prank(alice);
        token.transferFrom(admin, bob, 50e18);

        assertEq(token.balanceOf(bob), 50e18);
        assertEq(token.allowance(admin, alice), 50e18);
    }

    // ============ UBI Claims ============

    function test_claimUBI_verified() public {
        // Verify alice
        vm.prank(oracle);
        token.verifyHuman(alice, true);
        assertTrue(token.isVerifiedHuman(alice));
        assertEq(token.totalVerifiedHumans(), 1);

        // Claim
        vm.prank(alice);
        token.claimUBI();

        assertEq(token.balanceOf(alice), 1e18); // 1 G$ daily UBI
        assertEq(token.totalSupply(), INITIAL_SUPPLY + 1e18);
    }

    function test_claimUBI_revert_unverified() public {
        vm.prank(alice);
        vm.expectRevert("Not verified human");
        token.claimUBI();
    }

    function test_claimUBI_revert_double_claim() public {
        vm.prank(oracle);
        token.verifyHuman(alice, true);

        vm.prank(alice);
        token.claimUBI();

        vm.prank(alice);
        vm.expectRevert("Already claimed today");
        token.claimUBI();
    }

    function test_claimUBI_after_24h() public {
        vm.prank(oracle);
        token.verifyHuman(alice, true);

        vm.prank(alice);
        token.claimUBI();
        assertEq(token.balanceOf(alice), 1e18);

        // Advance 24 hours
        vm.warp(block.timestamp + 24 hours);

        vm.prank(alice);
        token.claimUBI();
        assertEq(token.balanceOf(alice), 2e18);
    }

    function test_claimUBI_with_pool() public {
        // Fund UBI pool
        vm.prank(admin);
        token.approve(address(token), 1000e18);
        vm.prank(admin);
        token.fundUBIPool(1000e18);
        assertEq(token.ubiPool(), 1000e18);

        // Verify alice (only verified human)
        vm.prank(oracle);
        token.verifyHuman(alice, true);

        uint256 supplyBefore = token.totalSupply();
        uint256 contractBalBefore = token.balanceOf(address(token));

        // Claim - should get base + full pool share
        vm.prank(alice);
        token.claimUBI();

        // 1 G$ base + 1000 G$ pool share (she is the only verified human)
        assertEq(token.balanceOf(alice), 1e18 + 1000e18);

        // Supply only increases by base UBI (1e18), NOT by pool share.
        // Pool share redistributes existing tokens, not new mints.
        assertEq(token.totalSupply(), supplyBefore + 1e18);

        // Contract balance decreases by pool share (tokens transferred out)
        assertEq(token.balanceOf(address(token)), contractBalBefore - 1000e18);

        // Pool is now empty
        assertEq(token.ubiPool(), 0);
    }

    // ============ Identity ============

    function test_batchVerify() public {
        address[] memory humans = new address[](3);
        humans[0] = alice;
        humans[1] = bob;
        humans[2] = address(5);

        vm.prank(oracle);
        token.batchVerifyHumans(humans);

        assertTrue(token.isVerifiedHuman(alice));
        assertTrue(token.isVerifiedHuman(bob));
        assertTrue(token.isVerifiedHuman(address(5)));
        assertEq(token.totalVerifiedHumans(), 3);
    }

    function test_removeVerification() public {
        vm.prank(oracle);
        token.verifyHuman(alice, true);
        assertEq(token.totalVerifiedHumans(), 1);

        vm.prank(oracle);
        token.verifyHuman(alice, false);
        assertEq(token.totalVerifiedHumans(), 0);
        assertFalse(token.isVerifiedHuman(alice));
    }

    // ============ Governance ============

    function test_setDailyUBI() public {
        vm.prank(admin);
        token.setDailyUBIAmount(5e18); // 5 G$ per day

        vm.prank(oracle);
        token.verifyHuman(alice, true);

        vm.prank(alice);
        token.claimUBI();
        assertEq(token.balanceOf(alice), 5e18);
    }

    function test_setDailyUBI_reverts_nonAdmin() public {
        vm.prank(alice);
        vm.expectRevert("Not admin");
        token.setDailyUBIAmount(2e18);
    }

    function test_setIdentityOracle() public {
        address newOracle = address(0xBEEF);

        vm.prank(admin);
        token.setIdentityOracle(newOracle);
        assertEq(token.identityOracle(), newOracle);

        vm.prank(newOracle);
        token.verifyHuman(alice, true);
        assertTrue(token.isVerifiedHuman(alice));
    }

    function test_setIdentityOracle_reverts_nonAdmin() public {
        vm.prank(bob);
        vm.expectRevert("Not admin");
        token.setIdentityOracle(address(0xBEEF));
    }

    function test_setAdmin_transfersPrivileges() public {
        address newAdmin = address(0xCAFE);

        vm.prank(admin);
        token.setAdmin(newAdmin);
        assertEq(token.admin(), newAdmin);

        vm.prank(admin);
        vm.expectRevert("Not admin");
        token.setDailyUBIAmount(2e18);

        vm.prank(newAdmin);
        token.setDailyUBIAmount(2e18);
        assertEq(token.dailyUBIAmount(), 2e18);
    }

    function test_setAdmin_reverts_nonAdmin() public {
        vm.prank(alice);
        vm.expectRevert("Not admin");
        token.setAdmin(address(0xCAFE));
    }

    function test_setMinter_authorizeContractMinter() public {
        MockMinterContract minter = new MockMinterContract();

        vm.prank(admin);
        token.setMinter(address(minter), true);
        assertTrue(token.minters(address(minter)));

        vm.prank(address(minter));
        token.mint(alice, 10e18);
        assertEq(token.balanceOf(alice), 10e18);
    }

    function test_setMinter_deauthorize() public {
        MockMinterContract minter = new MockMinterContract();

        vm.prank(admin);
        token.setMinter(address(minter), true);

        vm.prank(admin);
        token.setMinter(address(minter), false);
        assertFalse(token.minters(address(minter)));

        vm.prank(address(minter));
        vm.expectRevert("Not authorized minter");
        token.mint(alice, 1e18);
    }

    function test_setMinter_reverts_nonAdmin() public {
        vm.prank(bob);
        vm.expectRevert("Not admin");
        token.setMinter(address(0x1234), true);
    }

    function test_setMinter_reverts_zeroAddress() public {
        vm.prank(admin);
        vm.expectRevert("Minter cannot be zero address");
        token.setMinter(address(0), true);
    }

    function test_setMinter_reverts_eoaWhenAuthorizing() public {
        vm.prank(admin);
        vm.expectRevert("Minter must be a contract");
        token.setMinter(alice, true);
    }

    function test_calculateUBIFee() public view {
        uint256 fee = token.calculateUBIFee(1000e18);
        assertEq(fee, 100e18); // 10% of 1000
    }
}
