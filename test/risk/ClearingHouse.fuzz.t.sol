// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../../src/risk/ClearingHouse.sol";

// ─── Reusable mocks (same shape as unit test mocks) ───────────

contract MockRiskEngineFuzz {
    bool public paused;
    function checkRisk(bytes32, int256) external view {}
}

contract MockPerpEngineFuzz {
    struct Market {
        bytes32 oracleKey;
        bytes32 indexOracleKey;
        string ticker;
        uint256 oiLong;
        uint256 oiShort;
        uint256 maxLeverage;
        uint256 maxOI;
        uint256 mmBps;
        uint256 fundingCapBps;
        bool active;
    }

    struct PosData {
        int256 sizeTokens;
        uint256 entryPrice8;
        uint256 margin;
        uint256 lastFundingIdx;
    }

    Market[] public _markets;
    mapping(uint256 => mapping(address => PosData)) public _positions;

    function addMarket(bytes32 oKey, string memory ticker, uint256 mmBps) external {
        _markets.push(Market({
            oracleKey: oKey, indexOracleKey: oKey, ticker: ticker,
            oiLong: 0, oiShort: 0, maxLeverage: 20, maxOI: 1e30,
            mmBps: mmBps, fundingCapBps: 100, active: true
        }));
    }

    function setPosition(uint256 mid, address t, int256 sz, uint256 ep, uint256 m) external {
        _positions[mid][t] = PosData(sz, ep, m, 0);
    }

    function marketCount() external view returns (uint256) { return _markets.length; }

    function markets(uint256 id) external view returns (
        bytes32, bytes32, string memory, uint256, uint256,
        uint256, uint256, uint256, uint256, bool
    ) {
        Market storage m = _markets[id];
        return (m.oracleKey, m.indexOracleKey, m.ticker,
                m.oiLong, m.oiShort, m.maxLeverage, m.maxOI,
                m.mmBps, m.fundingCapBps, m.active);
    }

    function positions(uint256 mid, address t) external view returns (
        int256, uint256, uint256, uint256
    ) {
        PosData storage p = _positions[mid][t];
        return (p.sizeTokens, p.entryPrice8, p.margin, p.lastFundingIdx);
    }
}

contract MockOracleFuzz {
    mapping(bytes32 => uint256) public _p;

    function setPrice(bytes32 h, uint256 p) external { _p[h] = p; }

    function prices(bytes32 h) external view returns (
        uint256, uint256, uint8, uint8, uint8
    ) {
        return (_p[h], block.timestamp, 0, 100, 3);
    }
}

contract MockLendPoolFuzz {
    mapping(address => uint256) public colls;
    mapping(address => uint256) public debts;

    function setColl(address u, uint256 v) external { colls[u] = v; }
    function setDebt(address u, uint256 v) external { debts[u] = v; }

    function getUserCollateralValue(address u) external view returns (uint256) { return colls[u]; }
    function getUserDebtValue(address u) external view returns (uint256) { return debts[u]; }
}

// ─── Fuzz test suite ──────────────────────────────────────────

contract ClearingHouseFuzzTest is Test {
    ClearingHouse ch;
    MockRiskEngineFuzz riskEngine;
    MockPerpEngineFuzz perpEngine;
    MockOracleFuzz oracle;
    MockLendPoolFuzz lendPool;

    address admin = address(0xAD);
    address alice = address(0xA1);

    bytes32 constant KEY = keccak256(abi.encodePacked("AAPL"));
    uint256 constant BASE_PRICE = 180_00000000;

    function setUp() public {
        vm.warp(10_000);
        riskEngine = new MockRiskEngineFuzz();
        perpEngine = new MockPerpEngineFuzz();
        oracle = new MockOracleFuzz();
        lendPool = new MockLendPoolFuzz();

        ch = new ClearingHouse(
            address(riskEngine), address(perpEngine),
            address(oracle), address(lendPool), admin
        );
        perpEngine.addMarket(KEY, "AAPL", 500); // 5% MM
        oracle.setPrice(KEY, BASE_PRICE);
    }

    // ─── 1. Cross-margin health calculation ───────────────────

    function testFuzz_crossMarginHealth(
        uint256 margin,
        uint256 entryPrice,
        uint256 lendColl,
        uint256 lendDebt
    ) public {
        uint256 _margin = bound(margin, 1e18, 1e30);
        uint256 _entry = bound(entryPrice, 1_00000000, 1000_00000000);
        uint256 _lendColl = bound(lendColl, 0, 1e30);
        uint256 _lendDebt = bound(lendDebt, 0, 1e30);

        perpEngine.setPosition(0, alice, 1e18, _entry, _margin);
        lendPool.setColl(alice, _lendColl);
        lendPool.setDebt(alice, _lendDebt);

        uint256 health = ch.getCrossMarginHealth(alice);

        // Manually compute expected health
        int256 priceDiff = int256(BASE_PRICE) - int256(_entry);
        int256 rawPnL = priceDiff * 1e18 / 1e8;

        int256 signedColl = int256(_margin) + rawPnL + int256(_lendColl);
        uint256 totalColl = signedColl > 0 ? uint256(signedColl) : 0;

        uint256 notional = (1e18 * BASE_PRICE) / 1e8;
        uint256 perpMaintenance = (notional * 500) / 10_000;
        uint256 totalDebt = _lendDebt + perpMaintenance;

        if (totalDebt == 0) {
            assertEq(health, type(uint256).max);
        } else {
            uint256 expected = (totalColl * 10_000) / totalDebt;
            assertEq(health, expected, "health must match manual calculation");
        }
    }

    // ─── 2. requireMarginHealth reverts below threshold ───────

    function testFuzz_requireMarginHealthRevert(
        uint256 maintenanceBps
    ) public {
        uint256 _mBps = bound(maintenanceBps, 10_001, 1_000_000);

        vm.prank(admin);
        ch.setMaintenanceHealthBps(_mBps);

        // Alice with position that gives ~66666 BPS health
        perpEngine.setPosition(0, alice, 10e18, 170_00000000, 500e18);

        uint256 health = ch.getCrossMarginHealth(alice);
        if (health < _mBps) {
            vm.expectRevert();
            ch.requireMarginHealth(alice);
        } else {
            ch.requireMarginHealth(alice); // should not revert
        }
    }

    // ─── 3. Position cap enforcement ──────────────────────────

    function testFuzz_positionCapEnforcement(
        uint256 cap,
        uint256 notional
    ) public {
        uint256 _cap = bound(cap, 1, type(uint128).max);
        uint256 _notional = bound(notional, 1, type(uint128).max);

        vm.prank(admin);
        ch.setSymbolPositionCap(KEY, _cap);

        if (_notional > _cap) {
            vm.expectRevert(
                abi.encodeWithSelector(
                    ClearingHouse.PositionCapExceeded.selector,
                    KEY, _notional, _cap
                )
            );
        }
        ch.checkPositionCap(KEY, 0, _notional);
    }

    // ─── 4. ADL penalty calculation ───────────────────────────

    function testFuzz_adlPenaltyCalculation(
        uint256 size,
        uint256 penaltyBps
    ) public {
        uint256 _size = bound(size, 1, 1e24);
        uint256 _penaltyBps = bound(penaltyBps, 0, 5000);

        vm.startPrank(admin);
        ch.setADLPenaltyBps(_penaltyBps);

        uint256 notional = (_size * BASE_PRICE) / 1e8;
        uint256 expectedPenalty = (notional * _penaltyBps) / 10_000;

        vm.expectEmit(true, true, false, true);
        emit ClearingHouse.ADLExecuted(address(0), 0, int256(_size), expectedPenalty);
        ch.autoDeleverage(0, int256(_size));
        vm.stopPrank();
    }

    // ─── 5. ADL with negative size ────────────────────────────

    function testFuzz_adlNegativeSize(uint256 size) public {
        uint256 _size = bound(size, 1, 1e24);
        int256 negSize = -int256(_size);

        uint256 notional = (_size * BASE_PRICE) / 1e8;
        uint256 penalty = (notional * 100) / 10_000; // default 1%

        vm.prank(admin);
        vm.expectEmit(true, true, false, true);
        emit ClearingHouse.ADLExecuted(address(0), 0, negSize, penalty);
        ch.autoDeleverage(0, negSize);
    }

    // ─── 6. No-debt scenario always returns max health ────────

    function testFuzz_noDebtMaxHealth(uint256 margin) public {
        uint256 _margin = bound(margin, 0, 1e30);
        lendPool.setColl(alice, _margin);
        // No positions, no lend debt → totalDebt == 0
        assertEq(ch.getCrossMarginHealth(alice), type(uint256).max);
    }

    // ─── 7. Admin-only functions revert for non-admin ─────────

    function testFuzz_adminOnlyReverts(address caller) public {
        vm.assume(caller != admin);
        vm.startPrank(caller);

        vm.expectRevert(ClearingHouse.NotAdmin.selector);
        ch.setAdmin(address(1));

        vm.expectRevert(ClearingHouse.NotAdmin.selector);
        ch.setPaused(true);

        vm.expectRevert(ClearingHouse.NotAdmin.selector);
        ch.setMaintenanceHealthBps(5000);

        vm.expectRevert(ClearingHouse.NotAdmin.selector);
        ch.setADLPenaltyBps(200);

        vm.expectRevert(ClearingHouse.NotAdmin.selector);
        ch.setSymbolPositionCap(KEY, 1e18);

        vm.expectRevert(ClearingHouse.NotAdmin.selector);
        ch.autoDeleverage(0, 1e18);

        vm.stopPrank();
    }
}
