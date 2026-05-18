// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../../src/perps/MarginVault.sol";
import "../../src/GoodDollarToken.sol";

/**
 * @title MarginVaultHandler
 * @notice Foundry invariant action driver for `MarginVault`.
 *
 *         The handler is registered as the vault's `perpEngine`, so it can
 *         exercise both user-facing entry points (deposit / withdraw) and
 *         engine-only entry points (debit / credit / transfer / flushFee).
 *
 *         Each action function is bounded so that the underlying call is
 *         expected to succeed; this maximizes coverage by avoiding wasted
 *         randomized inputs that would only revert.
 *
 *         Ghost variables track the cumulative token-flow into/out of the
 *         vault so that the invariant test can assert vault solvency and
 *         the fee-buffer accounting equation.
 */
contract MarginVaultHandler is Test {
    MarginVault public immutable vault;
    GoodDollarToken public immutable gd;

    address[4] public actors;

    // ============ Ghost variables ============

    uint256 public totalDeposits;       // user G$ pulled into vault via deposit()
    uint256 public totalWithdrawals;    // user G$ pushed out of vault via withdraw()
    uint256 public totalDebits;         // engine bookkeeping decrease (no token move)
    uint256 public totalCredits;        // engine bookkeeping increase (no token move)
    uint256 public totalFlushed;        // engine pushed tokens out via flushFee()
    uint256 public callCount;

    // ============ Per-action call counts (debugging) ============

    uint256 public depositCalls;
    uint256 public withdrawCalls;
    uint256 public debitCalls;
    uint256 public creditCalls;
    uint256 public transferCalls;
    uint256 public flushCalls;

    constructor(MarginVault _vault, GoodDollarToken _gd, address[4] memory _actors) {
        vault = _vault;
        gd = _gd;
        actors = _actors;
    }

    // ============ Helpers ============

    function _pickActor(uint8 idx) internal view returns (address) {
        return actors[idx % 4];
    }

    function _bound(uint128 amount, uint256 cap) internal pure returns (uint256) {
        if (cap == 0) return 0;
        // bound to [0, cap]; allow zero so deposit/withdraw zero-amount branch
        // can be probed (it reverts; we skip the call in that case).
        return uint256(amount) % (cap + 1);
    }

    function getActor(uint8 idx) external view returns (address) {
        return actors[idx % 4];
    }

    function sumOfActorBalances() external view returns (uint256 sum) {
        for (uint256 i = 0; i < 4; i++) {
            sum += vault.balances(actors[i]);
        }
    }

    // ============ Action: deposit ============

    function deposit(uint8 actorIdx, uint128 amount) external {
        address actor = _pickActor(actorIdx);
        uint256 actorBal = gd.balanceOf(actor);
        uint256 amt = _bound(amount, actorBal);
        if (amt == 0) return;

        vm.prank(actor);
        vault.deposit(amt);

        totalDeposits += amt;
        depositCalls++;
        callCount++;
    }

    // ============ Action: withdraw ============

    function withdraw(uint8 actorIdx, uint128 amount) external {
        address actor = _pickActor(actorIdx);
        uint256 vaultBal = vault.balances(actor);
        uint256 amt = _bound(amount, vaultBal);
        if (amt == 0) return;

        vm.prank(actor);
        vault.withdraw(amt);

        totalWithdrawals += amt;
        withdrawCalls++;
        callCount++;
    }

    // ============ Action: debit (engine-only) ============

    function debit(uint8 actorIdx, uint128 amount) external {
        address actor = _pickActor(actorIdx);
        uint256 vaultBal = vault.balances(actor);
        uint256 amt = _bound(amount, vaultBal);
        if (amt == 0) return;

        // Handler IS the engine.
        vault.debit(actor, amt);

        totalDebits += amt;
        debitCalls++;
        callCount++;
    }

    // ============ Action: credit (engine-only) ============

    /// @notice Credit a user's margin. In production the engine only credits
    ///         against prior debits (PnL is zero-sum) or against an external
    ///         insurance fund. We model the zero-sum case by capping each
    ///         credit at the current engine "fee buffer"
    ///         (`totalDebits - totalCredits - totalFlushed`). This keeps the
    ///         vault solvent (`balanceOf(vault) >= totalDeposited`) so the
    ///         invariant test exercises a realistic engine, not a buggy one.
    function credit(uint8 actorIdx, uint128 amount) external {
        address actor = _pickActor(actorIdx);

        // Engine fee buffer = unflushed, uncredited debits.
        uint256 buffer;
        unchecked {
            // Safe: handler enforces totalCredits + totalFlushed <= totalDebits.
            buffer = totalDebits - totalCredits - totalFlushed;
        }
        if (buffer == 0) return;

        uint256 amt = _bound(amount, buffer);
        if (amt == 0) return;

        vault.credit(actor, amt);

        totalCredits += amt;
        creditCalls++;
        callCount++;
    }

    // ============ Action: engine transfer between users ============

    function transferEngine(uint8 fromIdx, uint8 toIdx, uint128 amount) external {
        address from = _pickActor(fromIdx);
        address to = _pickActor(toIdx);
        if (from == to) return;
        uint256 fromBal = vault.balances(from);
        uint256 amt = _bound(amount, fromBal);
        if (amt == 0) return;

        vault.transfer(from, to, amt);

        // No change to totalDeposited; sum of balances unchanged.
        transferCalls++;
        callCount++;
    }

    // ============ Action: flushFee ============

    /// @notice Push fee tokens out of the vault to a sink. Bounded to the
    ///         vault's current token slack (`balanceOf(vault) -
    ///         totalDeposited`) so the call is guaranteed not to over-pay.
    function flushFee(address sink, uint128 amount) external {
        if (sink == address(0) || sink == address(vault)) return;

        uint256 vaultTokenBal = gd.balanceOf(address(vault));
        uint256 vaultAccounted = vault.totalDeposited();
        if (vaultTokenBal <= vaultAccounted) return;
        uint256 slack = vaultTokenBal - vaultAccounted;

        uint256 amt = _bound(amount, slack);
        if (amt == 0) return;

        vault.flushFee(sink, amt);

        totalFlushed += amt;
        flushCalls++;
        callCount++;
    }
}
