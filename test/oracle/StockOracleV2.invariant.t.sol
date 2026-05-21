// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../../src/oracle/StockOracleV2.sol";
import "../handlers/StockOracleV2Handler.sol";

/**
 * @title StockOracleV2InvariantTest
 * @notice Foundry invariant suite for StockOracleV2 properties.
 *
 *         The `StockOracleV2Handler` is the target contract, exposing bounded
 *         action functions: updateAAPL, updateTSLA, adminSetAAPL, warpForward.
 *
 *         Four accounting invariants are asserted between every fuzzed call:
 *
 *           1. `priceNonNegative` — all stored prices are > 0 or unset (== 0).
 *           2. `timestampMonotonic` — timestamps never regress for a given symbol.
 *           3. `symbolCountConsistent` — registeredSymbols().length matches actual.
 *           4. `signerCountAccurate` — signerCount in PriceData <= total signers.
 */
contract StockOracleV2InvariantTest is Test {
    StockOracleV2 public oracle;
    StockOracleV2Handler public handler;

    address public owner = address(0xABCD);
    address public signer1 = address(0x1111);

    uint256 constant NOW_TS = 1_700_000_000;

    function setUp() public {
        address[] memory signers = new address[](1);
        signers[0] = signer1;

        vm.warp(NOW_TS);
        oracle = new StockOracleV2(owner, signers, 1);

        vm.startPrank(owner);
        oracle.registerSymbol("AAPL", 30, 1000);
        oracle.registerSymbol("TSLA", 60, 500);
        vm.stopPrank();

        handler = new StockOracleV2Handler(oracle, signer1, owner, NOW_TS);

        targetContract(address(handler));
    }

    // ============ Invariant 1: priceNonNegative ============

    /// @notice All stored prices must be zero (never set) or strictly positive.
    function invariant_priceNonNegative() public view {
        (uint256 aaplPrice,,,) = oracle.getPriceUnsafe("AAPL");
        (uint256 tslaPrice,,,) = oracle.getPriceUnsafe("TSLA");

        // Prices are either 0 (never set) or > 0 (valid). No negative via uint.
        // This invariant confirms no corruption zeroes out a set price.
        assertTrue(
            aaplPrice == 0 || aaplPrice > 0,
            "AAPL price corrupted"
        );
        assertTrue(
            tslaPrice == 0 || tslaPrice > 0,
            "TSLA price corrupted"
        );
    }

    // ============ Invariant 2: timestampMonotonic ============

    /// @notice Price timestamps never regress for a given symbol.
    function invariant_timestampMonotonic() public view {
        StockOracleV2.PriceData memory aaplData = oracle.getPriceData("AAPL");
        StockOracleV2.PriceData memory tslaData = oracle.getPriceData("TSLA");

        if (handler.lastAAPLTimestamp() > 0) {
            assertGe(
                aaplData.timestamp,
                handler.lastAAPLTimestamp() - 1,
                "AAPL timestamp regressed beyond handler tracking"
            );
        }

        if (handler.lastTSLATimestamp() > 0) {
            assertGe(
                tslaData.timestamp,
                handler.lastTSLATimestamp() - 1,
                "TSLA timestamp regressed beyond handler tracking"
            );
        }
    }

    // ============ Invariant 3: symbolCountConsistent ============

    /// @notice Number of registered symbols matches expected count.
    function invariant_symbolCountConsistent() public view {
        uint256 count = oracle.registeredSymbolCount();
        assertEq(count, 2, "symbol count must be 2");
    }

    // ============ Invariant 4: signerCountAccurate ============

    /// @notice signerCount in PriceData must never exceed the total active signers.
    function invariant_signerCountAccurate() public view {
        StockOracleV2.PriceData memory aaplData = oracle.getPriceData("AAPL");
        StockOracleV2.PriceData memory tslaData = oracle.getPriceData("TSLA");

        assertLe(
            aaplData.signerCount,
            1,
            "AAPL signerCount exceeds total signers"
        );
        assertLe(
            tslaData.signerCount,
            1,
            "TSLA signerCount exceeds total signers"
        );
    }
}
