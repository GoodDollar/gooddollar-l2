// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../../src/perps/MarginVault.sol";
import "../../src/GoodDollarToken.sol";
import "../handlers/MarginVaultHandler.sol";

/**
 * @title MarginVaultInvariantTest
 * @notice Foundry invariant suite for `MarginVault` accounting properties.
 *
 *         The `MarginVaultHandler` is registered as the vault's `perpEngine`
 *         and exposes six bounded action functions that the fuzzer drives at
 *         random:
 *
 *             - deposit / withdraw          (user-facing)
 *             - debit / credit / transfer   (engine-only bookkeeping)
 *             - flushFee                    (engine-only token egress)
 *
 *         Three accounting invariants are asserted between every fuzzed call:
 *
 *           1. `totalDeposited == sum(balances[actor])` for the four actors.
 *           2. `balanceOf(vault) >= totalDeposited` (vault is always solvent).
 *           3. `balanceOf(vault) - totalDeposited
 *                  == totalDebits - totalCredits - totalFlushed`
 *              (the only G$ slack inside the vault is the unflushed,
 *              uncredited engine fee buffer — no phantom tokens, no leaks).
 */
contract MarginVaultInvariantTest is Test {
    GoodDollarToken public gd;
    MarginVault public vault;
    MarginVaultHandler public handler;

    address public admin = address(0xAD);
    address public alice = address(0xA1);
    address public bob = address(0xB0);
    address public carol = address(0xCA);
    address public dave = address(0xDA);

    uint256 constant SUPPLY = 1_000_000_000e18;
    uint256 constant ACTOR_BALANCE = 100_000_000e18;

    function setUp() public {
        // 1. Deploy GoodDollar token. Constructor mints SUPPLY to admin.
        gd = new GoodDollarToken(admin, admin, SUPPLY);

        // 2. Deploy vault. Admin is owner; perpEngine is unset until step 3.
        vault = new MarginVault(address(gd), admin);

        // 3. Deploy handler with the four actors and register it as the
        //    vault's engine so it can call debit / credit / transfer /
        //    flushFee directly.
        address[4] memory actors = [alice, bob, carol, dave];
        handler = new MarginVaultHandler(vault, gd, actors);

        vm.prank(admin);
        vault.setPerpEngine(address(handler));

        // 4. Fund each actor with G$ and unlimited approve the vault so
        //    fuzzed deposit() calls don't fail on allowance/balance.
        for (uint256 i = 0; i < 4; i++) {
            vm.prank(admin);
            gd.transfer(actors[i], ACTOR_BALANCE);

            vm.prank(actors[i]);
            gd.approve(address(vault), type(uint256).max);
        }

        // 5. Tell Foundry to fuzz the handler. Public state-variable getters
        //    and view functions are auto-filtered, so only the six mutating
        //    action functions are called.
        targetContract(address(handler));
    }

    // ============ Invariant 1: ledger consistency ============

    /// @notice The vault's `totalDeposited` ledger must always equal the sum
    ///         of every actor's `balances` entry. The vault never silently
    ///         mints, burns, or hides margin.
    function invariant_totalDepositedEqualsSumOfBalances() public view {
        uint256 sumBalances = handler.sumOfActorBalances();
        assertEq(
            vault.totalDeposited(),
            sumBalances,
            "totalDeposited must equal sum of actor balances"
        );
    }

    // ============ Invariant 2: vault is always solvent ============

    /// @notice The vault's actual G$ token balance must always cover its
    ///         outstanding margin obligations. If this ever breaks, users
    ///         cannot all withdraw what their `balances` entry promises.
    function invariant_vaultSolvent() public view {
        uint256 vaultTokenBal = gd.balanceOf(address(vault));
        assertGe(
            vaultTokenBal,
            vault.totalDeposited(),
            "vault token balance must be >= totalDeposited (no insolvency)"
        );
    }

    // ============ Invariant 3: fee-buffer accounting ============

    /// @notice The "slack" between the vault's actual G$ holdings and its
    ///         margin ledger must equal the unflushed, uncredited engine
    ///         fee buffer:
    ///
    ///             balanceOf(vault) - totalDeposited
    ///                 == totalDebits - totalCredits - totalFlushed
    ///
    ///         Any deviation indicates a bug in debit/credit/flushFee
    ///         accounting (e.g. a phantom token created out of thin air,
    ///         or a fee that became unrecoverable).
    function invariant_feeBufferEqualsDebitsMinusFlushed() public view {
        uint256 vaultTokenBal = gd.balanceOf(address(vault));
        uint256 vaultAccounted = vault.totalDeposited();

        // Solvency invariant (#2) guarantees this subtraction never underflows
        // when invariants are checked together; we still guard for clarity.
        uint256 slack = vaultTokenBal >= vaultAccounted
            ? vaultTokenBal - vaultAccounted
            : 0;

        uint256 expectedBuffer;
        unchecked {
            // Handler enforces totalCredits + totalFlushed <= totalDebits
            // by bounding each credit/flush at the live buffer.
            expectedBuffer = handler.totalDebits()
                - handler.totalCredits()
                - handler.totalFlushed();
        }

        assertEq(
            slack,
            expectedBuffer,
            "vault slack must equal totalDebits - totalCredits - totalFlushed"
        );
    }
}
