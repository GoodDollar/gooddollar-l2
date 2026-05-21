// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../../src/risk/ClearingHouse.sol";
import "../handlers/ClearingHouseHandler.sol";

contract ClearingHouseInvariantTest is Test {
    ClearingHouse ch;
    MockRiskForCHHandler riskEngine;
    MockPerpForCHHandler perpEngine;
    MockOracleForCHHandler oracle;
    MockLendForCHHandler lendPool;
    ClearingHouseHandler handler;

    address admin = address(0xAD);
    address[] traders;

    bytes32 constant KEY = keccak256(abi.encodePacked("AAPL"));

    function setUp() public {
        vm.warp(10_000);

        riskEngine = new MockRiskForCHHandler();
        perpEngine = new MockPerpForCHHandler();
        oracle = new MockOracleForCHHandler();
        lendPool = new MockLendForCHHandler();

        ch = new ClearingHouse(
            address(riskEngine), address(perpEngine),
            address(oracle), address(lendPool), admin
        );

        perpEngine.addMarket(KEY, "AAPL", 500);
        oracle.setPrice(KEY, 180_00000000);

        traders.push(address(0xA1));
        traders.push(address(0xA2));
        traders.push(address(0xA3));

        handler = new ClearingHouseHandler(
            ch, perpEngine, oracle, lendPool, admin, traders
        );

        targetContract(address(handler));
    }

    // ─── Invariant 1: No-position health is always max ────────
    // Users with zero-size positions and zero lend debt must have max health.

    function invariant_noPositionMaxHealth() public view {
        for (uint256 i = 0; i < traders.length; i++) {
            (int256 sizeTokens,,,) = perpEngine.positions(0, traders[i]);
            uint256 debt = lendPool.debts(traders[i]);

            if (sizeTokens == 0 && debt == 0) {
                uint256 health = ch.getCrossMarginHealth(traders[i]);
                assertEq(health, type(uint256).max, "no-position user must have max health");
            }
        }
    }

    // ─── Invariant 2: Health is monotonic in margin ───────────
    // More margin (all else equal) should yield >= health.
    // We verify: if a user has a position, adding margin shouldn't decrease health.

    function invariant_healthMonotonicInMargin() public {
        for (uint256 i = 0; i < traders.length; i++) {
            (int256 sizeTokens, uint256 entry, uint256 margin,) =
                perpEngine.positions(0, traders[i]);
            if (sizeTokens == 0) continue;

            uint256 healthBefore = ch.getCrossMarginHealth(traders[i]);

            uint256 extraMargin = 100e18;
            perpEngine.setPosition(0, traders[i], sizeTokens, entry, margin + extraMargin);
            uint256 healthAfter = ch.getCrossMarginHealth(traders[i]);

            assertGe(healthAfter, healthBefore, "more margin must not decrease health");

            // Restore original
            perpEngine.setPosition(0, traders[i], sizeTokens, entry, margin);
        }
    }

    // ─── Invariant 3: Admin is never zero address ─────────────

    function invariant_adminNeverZero() public view {
        assertTrue(ch.admin() != address(0), "admin must never be zero");
    }

    // ─── Invariant 4: Position cap is respected ───────────────
    // If cap > 0, checkPositionCap must revert for notional > cap.

    function invariant_capEnforced() public {
        uint256 cap = ch.symbolPositionCaps(KEY);
        if (cap == 0) return;

        uint256 overCap = cap + 1;
        vm.expectRevert(
            abi.encodeWithSelector(
                ClearingHouse.PositionCapExceeded.selector,
                KEY, overCap, cap
            )
        );
        ch.checkPositionCap(KEY, 0, overCap);
    }

    // ─── Invariant 5: Paused state blocks gated functions ─────

    function invariant_pauseBlocksGated() public {
        if (!ch.paused()) return;

        vm.expectRevert(ClearingHouse.IsPaused.selector);
        ch.requireMarginHealth(traders[0]);

        vm.expectRevert(ClearingHouse.IsPaused.selector);
        ch.checkPositionCap(KEY, 0, 1);

        vm.prank(admin);
        vm.expectRevert(ClearingHouse.IsPaused.selector);
        ch.autoDeleverage(0, 1e18);
    }

    // ─── Invariant 6: Ghost call counts are consistent ────────

    function invariant_callCountSanity() public view {
        uint256 total = uint256(handler.healthCheckCount())
            + uint256(handler.capCheckCount())
            + uint256(handler.adlCount())
            + uint256(handler.pauseToggleCount());
        assertTrue(total < 100_000, "ghost counters must stay within sane bounds");
    }

    // ─── Invariant 7: Maintenance BPS is positive ─────────────

    function invariant_maintenanceBpsPositive() public view {
        assertGt(ch.maintenanceHealthBps(), 0, "maintenance health BPS must be > 0");
    }
}
