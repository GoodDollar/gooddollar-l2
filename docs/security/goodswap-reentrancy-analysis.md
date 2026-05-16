# GoodSwap Reentrancy Analysis

**Contract:** `src/GoodSwap.sol`
**Scope:** Justification for the `// slither-disable-next-line reentrancy-no-eth`
annotation on `GoodSwap.swap` (line 205).
**Status:** Reviewed — finding is a static-analyzer false positive.
**Last updated:** 2026-05-16

---

## 1. Background — Slither finding

Slither's `reentrancy-no-eth` detector reports `GoodSwap.swap` as a
medium-severity reentrancy issue because state writes happen **after** an
external call:

```
src/GoodSwap.sol:205-228 (function swap)
  External call:        IGoodSwapCallee(to).goodSwapCall(...)            line 218
  External call:        _safeTransfer(token0/token1, to, ...)            lines 216-217
  State writes (later): _reserve0, _reserve1, _blockTimestampLast        lines 296-298
                        (via _verifyAndUpdateSwap -> _update)
```

The detector is structurally correct that there is a writes-after-calls
shape. It is **not** correct that this is exploitable, for the reasons in
sections 2–4 below.

---

## 2. The defense: the `lock` mutex

`GoodSwap` uses the Uniswap-V2 mutex pattern, **not** OpenZeppelin's
`ReentrancyGuard`:

```solidity
// src/GoodSwap.sol:84-89
modifier lock() {
    if (_unlocked != 1) revert Locked();
    _unlocked = 2;
    _;
    _unlocked = 1;
}
```

Every state-mutating external function on the pair is gated by `lock`:

| Function | Visibility | `lock` modifier | Writes reserves? |
| --- | --- | --- | --- |
| `mint(address)`       | external | ✅ | ✅ (via `_update`) |
| `burn(address)`       | external | ✅ | ✅ (via `_update`) |
| `swap(...)`           | external | ✅ | ✅ (via `_verifyAndUpdateSwap → _update`) |
| `skim(address)`       | external | ✅ | ❌ (only transfers excess) |
| `sync()`              | external | ✅ | ✅ (via `_update`) |

While `swap` is mid-execution, `_unlocked == 2`. Any re-entrant call from
`goodSwapCall` into **any** of the writer functions above reverts with
`Locked()` *before* a single storage slot is touched. This is the same
guarantee that OpenZeppelin's `ReentrancyGuard` provides — Slither just does
not pattern-match the custom mutex.

---

## 3. Why writes-after-calls is intentional (flash-swap semantics)

`GoodSwap` is a 1:1 port of the Uniswap V2 `Pair` interface. The
writes-after-calls shape is the **flash-swap protocol**, not a bug:

1.  Output tokens are pushed to `to` (lines 216-217).
2.  If `data.length > 0`, the recipient's `goodSwapCall(...)` runs (line 218).
    The recipient is free to do anything (sell on another DEX, arbitrage,
    repay a debt, etc.) so long as it leaves enough input tokens in the pair
    by the time control returns.
3.  The pair reads its own balances and enforces the constant-product
    invariant: `bal0Adj * bal1Adj >= reserve0 * reserve1 * 1_000_000`
    (`_verifyAndUpdateSwap`, line 275). If the invariant fails, the entire
    swap reverts and *no* state changes commit.
4.  Only after the invariant check do reserves and the TWAP accumulator
    update (`_update`, lines 296-298).

If we reordered to a strict Checks-Effects-Interactions pattern, the pair
could no longer support flash swaps: there is no way to know the final
balance before the callback has run. Every Uniswap-V2 fork, every router,
every arbitrage bot, and every subgraph that integrates this contract
assumes the V2 callback ordering. Changing it breaks the public protocol
contract for zero security benefit.

---

## 4. Cross-function reentrancy assessment

Slither's concern with `reentrancy-no-eth` is typically: a re-entrant call
into a *different* state-reading function observes stale reserves and is
tricked into mispricing. In `GoodSwap` this is mitigated end-to-end:

| Attempted reentrant call | What happens |
| --- | --- |
| Re-enter `swap` while inside `goodSwapCall` | Reverts: `Locked()` (mutex held) |
| Re-enter `mint` / `burn` / `skim` / `sync` | Reverts: `Locked()` (mutex held) |
| Re-enter `getReserves()` (view) | Returns the *pre-swap* values. Pricing using them is **conservative** for swappers: they see lower output liquidity, not inflated. |
| Re-enter `balanceOf(...)` on token0/token1 | Tokens already moved out to `to` — but no internal state of `GoodSwap` depends on it within this call. |

The only externally observable side effect during the window between the
callback and the invariant check is that the pair's token balances and
reserves are temporarily out of sync. The mutex prevents this window from
being entered by another writer. A read-only reentrancy that read
`getReserves()` from a *third-party contract* mid-callback would see the old
reserves; consumers that need a manipulation-resistant price should use the
TWAP cumulatives (`price0CumulativeLast` / `price1CumulativeLast`) which
update at the end of the swap, exactly as they would in Uniswap V2.

---

## 5. Read-only reentrancy

`getReserves()` returns `(_reserve0, _reserve1, _blockTimestampLast)`. During
the flash-swap callback these values are stale relative to the in-flight
balance changes. Integrators that price LP tokens off of spot reserves
(Curve-style oracles, naive TWAP-of-spot consumers) can be manipulated by
re-entering during the callback. Mitigations available to integrators:

- Use `price0CumulativeLast` / `price1CumulativeLast` with sufficient elapsed
  time (Uniswap V2 TWAP), which only update inside the `lock`-protected
  `_update` call.
- Avoid pricing off of `getReserves()` from within a callback or in the same
  transaction as a swap.
- If integrating LP-token pricing, follow the
  [BlockSec / ChainSecurity guidance](https://chainsecurity.com/heartbreaks-curve-lp-oracles/)
  for V2-style pairs.

These are integrator-side concerns, not flaws in `GoodSwap` itself, and they
are inherited unchanged from the Uniswap V2 pair semantics that GoodSwap
deliberately preserves.

---

## 6. Why not migrate to OpenZeppelin's `nonReentrant`?

Considered and rejected for this iteration:

1.  **It does not silence Slither.** Existing tasks 0049
    (`StabilityPool.deposit`) and 0050 (`PegStabilityModule.swap`) both
    found that the `reentrancy-no-eth` detector keeps firing even with
    `nonReentrant` present, because the detector flags ordering of writes
    vs. external calls, not the presence of a guard.
2.  **It would not change runtime behaviour.** Both the `lock` mutex and
    `ReentrancyGuard.nonReentrant` use a single transient storage slot
    flipped at entry and exit. The set of call sequences they reject is
    identical for this contract.
3.  **It would add cost and break the V2 ABI parity.** The current `lock`
    implementation is byte-for-byte compatible with Uniswap V2 audits and
    every downstream fork. Replacing it would force a re-audit of an
    otherwise well-understood mutex with no security upside.

The appropriate action — and the action we take — is to annotate the false
positive with `// slither-disable-next-line reentrancy-no-eth` plus an
in-source comment block (`src/GoodSwap.sol:192-204`) that explains the
defense and points back to this document.

---

## 7. Test coverage

Reentrancy and flash-swap behaviour for `GoodSwap` are covered by the
existing Foundry test suite at `test/swap/GoodSwap.t.sol` (572 lines). The
suite includes:

- Mutex enforcement: re-entrant calls into `mint`/`burn`/`swap`/`skim`/`sync`
  from inside `goodSwapCall` revert with `Locked()`.
- Flash-swap happy path: callback can transfer the input token in mid-flight
  and the constant-product invariant still holds.
- Flash-swap negative path: if the callback fails to leave enough input in
  the pair, `InvariantViolated()` is raised and the entire swap reverts.

No additional tests are required for this documentation-only change. The
annotation does not modify any contract semantics.

---

## 8. References

- Uniswap V2 Core, `UniswapV2Pair.sol` — original `lock` modifier and
  flash-swap design (`function swap`).
- `src/GoodSwap.sol:84-89` — `lock` modifier definition.
- `src/GoodSwap.sol:192-228` — annotated `swap` function.
- `src/yield/GoodVault.sol:215` — house style for
  `slither-disable-next-line reentrancy-no-eth` annotations.
- `.autobuilder/initiatives/0002-security-hardening/tasks/0049-stabilitypool-cei-deposit-offset.md`
  — prior precedent for treating `reentrancy-no-eth` on nonReentrant-protected
  functions.
- `.autobuilder/initiatives/0002-security-hardening/tasks/0050-pegstabilitymodule-cei-swap.md`
  — same.
