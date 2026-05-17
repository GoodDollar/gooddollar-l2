// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../../src/perps/MarginVault.sol";
import "../../src/GoodDollarToken.sol";

contract MarginVaultFuzzTest is Test {
    GoodDollarToken public gd;
    MarginVault public vault;

    address public admin = address(0xAD);
    address public alice = address(0xA1);
    address public bob = address(0xB0);
    address public engineMock = address(0xE0);

    uint256 constant INITIAL_SUPPLY = 100_000_000e18;
    uint256 constant USER_BALANCE = 50_000_000e18;

    function setUp() public {
        gd = new GoodDollarToken(admin, admin, INITIAL_SUPPLY);
        vault = new MarginVault(address(gd), admin);

        vm.prank(admin);
        vault.setPerpEngine(engineMock);

        vm.prank(admin);
        gd.transfer(alice, USER_BALANCE);
        vm.prank(admin);
        gd.transfer(bob, USER_BALANCE);

        vm.prank(alice);
        gd.approve(address(vault), type(uint256).max);
        vm.prank(bob);
        gd.approve(address(vault), type(uint256).max);
    }

    // ============ deposit fuzz ============

    function testFuzz_deposit_increases_balance(uint128 _amount) public {
        uint256 amount = uint256(_amount);
        vm.assume(amount > 0 && amount <= USER_BALANCE);

        uint256 balBefore = vault.balances(alice);
        uint256 tdBefore = vault.totalDeposited();

        vm.prank(alice);
        vault.deposit(amount);

        assertEq(vault.balances(alice), balBefore + amount, "balance mismatch");
        assertEq(vault.totalDeposited(), tdBefore + amount, "totalDeposited mismatch");
    }

    function testFuzz_deposit_transfers_token(uint128 _amount) public {
        uint256 amount = uint256(_amount);
        vm.assume(amount > 0 && amount <= USER_BALANCE);

        uint256 tokenBefore = gd.balanceOf(alice);

        vm.prank(alice);
        vault.deposit(amount);

        assertEq(gd.balanceOf(alice), tokenBefore - amount, "token not transferred");
        assertGe(gd.balanceOf(address(vault)), amount, "vault should hold tokens");
    }

    function testFuzz_deposit_reverts_zero() public {
        vm.expectRevert(MarginVault.ZeroAmount.selector);
        vm.prank(alice);
        vault.deposit(0);
    }

    // ============ withdraw fuzz ============

    function testFuzz_withdraw_decreases_balance(uint128 _deposit, uint128 _withdraw) public {
        uint256 dep = uint256(_deposit);
        uint256 wit = uint256(_withdraw);
        vm.assume(dep > 0 && dep <= USER_BALANCE);
        vm.assume(wit > 0 && wit <= dep);

        vm.prank(alice);
        vault.deposit(dep);

        uint256 balBefore = vault.balances(alice);
        uint256 tdBefore = vault.totalDeposited();
        uint256 tokenBefore = gd.balanceOf(alice);

        vm.prank(alice);
        vault.withdraw(wit);

        assertEq(vault.balances(alice), balBefore - wit, "balance not decreased");
        assertEq(vault.totalDeposited(), tdBefore - wit, "totalDeposited not decreased");
        assertEq(gd.balanceOf(alice), tokenBefore + wit, "token not returned");
    }

    function testFuzz_withdraw_reverts_exceeds_balance(uint128 _deposit, uint128 _extra) public {
        uint256 dep = uint256(_deposit);
        uint256 extra = uint256(_extra);
        vm.assume(dep > 0 && dep <= USER_BALANCE);
        vm.assume(extra > 0);
        uint256 withdrawAmount = dep + extra;
        vm.assume(withdrawAmount > dep); // no overflow

        vm.prank(alice);
        vault.deposit(dep);

        vm.expectRevert();
        vm.prank(alice);
        vault.withdraw(withdrawAmount);
    }

    function testFuzz_withdraw_reverts_zero() public {
        vm.prank(alice);
        vault.deposit(1000e18);

        vm.expectRevert(MarginVault.ZeroAmount.selector);
        vm.prank(alice);
        vault.withdraw(0);
    }

    // ============ Balance invariant ============

    function testFuzz_balance_invariant_multiOp(
        uint128 _dep1,
        uint128 _dep2,
        uint128 _wit1
    ) public {
        uint256 dep1 = uint256(_dep1);
        uint256 dep2 = uint256(_dep2);
        uint256 wit1 = uint256(_wit1);

        vm.assume(dep1 > 0 && dep1 <= 10_000_000e18);
        vm.assume(dep2 > 0 && dep2 <= 10_000_000e18);
        uint256 totalDep = dep1 + dep2;
        vm.assume(totalDep >= dep1); // no overflow
        vm.assume(totalDep <= USER_BALANCE);
        vm.assume(wit1 > 0 && wit1 <= totalDep);

        vm.prank(alice);
        vault.deposit(dep1);
        vm.prank(alice);
        vault.deposit(dep2);
        vm.prank(alice);
        vault.withdraw(wit1);

        assertEq(
            vault.balances(alice),
            totalDep - wit1,
            "balance should equal sum(deposits) - sum(withdrawals)"
        );
    }

    // ============ Access control fuzz ============

    function testFuzz_debit_onlyEngine(address _caller, uint128 _amount) public {
        uint256 amount = uint256(_amount);
        vm.assume(_caller != engineMock);
        vm.assume(amount > 0);

        vm.prank(alice);
        vault.deposit(1_000_000e18);

        vm.expectRevert(MarginVault.NotEngine.selector);
        vm.prank(_caller);
        vault.debit(alice, amount);
    }

    function testFuzz_credit_onlyEngine(address _caller, uint128 _amount) public {
        uint256 amount = uint256(_amount);
        vm.assume(_caller != engineMock);
        vm.assume(amount > 0);

        vm.expectRevert(MarginVault.NotEngine.selector);
        vm.prank(_caller);
        vault.credit(alice, amount);
    }

    function testFuzz_debit_works_fromEngine(uint128 _dep, uint128 _debit) public {
        uint256 dep = uint256(_dep);
        uint256 deb = uint256(_debit);
        vm.assume(dep > 0 && dep <= USER_BALANCE);
        vm.assume(deb > 0 && deb <= dep);

        vm.prank(alice);
        vault.deposit(dep);

        uint256 balBefore = vault.balances(alice);

        vm.prank(engineMock);
        vault.debit(alice, deb);

        assertEq(vault.balances(alice), balBefore - deb, "debit mismatch");
    }

    function testFuzz_credit_works_fromEngine(uint128 _amount) public {
        uint256 amount = uint256(_amount);
        vm.assume(amount > 0 && amount <= 10_000_000e18);

        uint256 balBefore = vault.balances(alice);

        vm.prank(engineMock);
        vault.credit(alice, amount);

        assertEq(vault.balances(alice), balBefore + amount, "credit mismatch");
    }
}
