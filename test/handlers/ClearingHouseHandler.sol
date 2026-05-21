// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../../src/risk/ClearingHouse.sol";

// ─── Minimal mock oracle for handler ──────────────────────────

contract MockOracleForCHHandler {
    mapping(bytes32 => uint256) public _p;
    function setPrice(bytes32 h, uint256 p) external { _p[h] = p; }
    function prices(bytes32 h) external view returns (uint256, uint256, uint8, uint8, uint8) {
        return (_p[h], block.timestamp, 0, 100, 3);
    }
}

// ─── Minimal mock perp for handler ────────────────────────────

contract MockPerpForCHHandler {
    struct Market {
        bytes32 oracleKey; bytes32 indexOracleKey; string ticker;
        uint256 oiLong; uint256 oiShort; uint256 maxLeverage;
        uint256 maxOI; uint256 mmBps; uint256 fundingCapBps; bool active;
    }
    struct PosData { int256 sizeTokens; uint256 entryPrice8; uint256 margin; uint256 lastFundingIdx; }

    Market[] public _markets;
    mapping(uint256 => mapping(address => PosData)) public _positions;

    function addMarket(bytes32 oKey, string memory ticker, uint256 mmBps) external {
        _markets.push(Market(oKey, oKey, ticker, 0, 0, 20, 1e30, mmBps, 100, true));
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
    function positions(uint256 mid, address t) external view returns (int256, uint256, uint256, uint256) {
        PosData storage p = _positions[mid][t];
        return (p.sizeTokens, p.entryPrice8, p.margin, p.lastFundingIdx);
    }
}

contract MockRiskForCHHandler {
    bool public paused;
    function checkRisk(bytes32, int256) external view {}
}

contract MockLendForCHHandler {
    mapping(address => uint256) public colls;
    mapping(address => uint256) public debts;
    function setColl(address u, uint256 v) external { colls[u] = v; }
    function setDebt(address u, uint256 v) external { debts[u] = v; }
    function getUserCollateralValue(address u) external view returns (uint256) { return colls[u]; }
    function getUserDebtValue(address u) external view returns (uint256) { return debts[u]; }
}

// ─── Handler contract ─────────────────────────────────────────

contract ClearingHouseHandler is Test {
    ClearingHouse public ch;
    MockPerpForCHHandler public perpEngine;
    MockOracleForCHHandler public oracle;
    MockLendForCHHandler public lendPool;
    address public admin;

    address[] public traders;
    bytes32 constant KEY = keccak256(abi.encodePacked("AAPL"));
    uint256 public currentPrice;

    // Ghost state for invariant tracking
    uint256 public healthCheckCount;
    uint256 public capCheckCount;
    uint256 public adlCount;
    uint256 public pauseToggleCount;

    constructor(
        ClearingHouse _ch,
        MockPerpForCHHandler _perp,
        MockOracleForCHHandler _oracle,
        MockLendForCHHandler _lend,
        address _admin,
        address[] memory _traders
    ) {
        ch = _ch;
        perpEngine = _perp;
        oracle = _oracle;
        lendPool = _lend;
        admin = _admin;
        traders = _traders;
        currentPrice = 180_00000000;
    }

    // ─── Actions ──────────────────────────────────────────────

    function openPosition(uint256 traderSeed, uint256 size, uint256 entry, uint256 margin) external {
        address trader = traders[traderSeed % traders.length];
        size = bound(size, 1e16, 100e18);
        entry = bound(entry, 1_00000000, 500_00000000);
        margin = bound(margin, 10e18, 10_000e18);

        perpEngine.setPosition(0, trader, int256(size), entry, margin);
    }

    function openShort(uint256 traderSeed, uint256 size, uint256 entry, uint256 margin) external {
        address trader = traders[traderSeed % traders.length];
        size = bound(size, 1e16, 100e18);
        entry = bound(entry, 1_00000000, 500_00000000);
        margin = bound(margin, 10e18, 10_000e18);

        perpEngine.setPosition(0, trader, -int256(size), entry, margin);
    }

    function closePosition(uint256 traderSeed) external {
        address trader = traders[traderSeed % traders.length];
        perpEngine.setPosition(0, trader, 0, 0, 0);
    }

    function setLendState(uint256 traderSeed, uint256 coll, uint256 debt) external {
        address trader = traders[traderSeed % traders.length];
        coll = bound(coll, 0, 1e30);
        debt = bound(debt, 0, 1e30);

        lendPool.setColl(trader, coll);
        lendPool.setDebt(trader, debt);
    }

    function updatePrice(uint256 newPrice) external {
        currentPrice = bound(newPrice, 1_00000000, 1000_00000000);
        oracle.setPrice(KEY, currentPrice);
    }

    function checkHealth(uint256 traderSeed) external {
        address trader = traders[traderSeed % traders.length];
        ch.getCrossMarginHealth(trader);
        healthCheckCount++;
    }

    function checkCap(uint256 notional) external {
        notional = bound(notional, 0, 1e30);
        try ch.checkPositionCap(KEY, 0, notional) {
            capCheckCount++;
        } catch {
            capCheckCount++;
        }
    }

    function triggerADL(uint256 size) external {
        size = bound(size, 1, 1e24);
        vm.prank(admin);
        ch.autoDeleverage(0, int256(size));
        adlCount++;
    }

    function togglePause() external {
        vm.prank(admin);
        ch.setPaused(!ch.paused());
        pauseToggleCount++;
    }

    function setMaintenanceBps(uint256 bps) external {
        bps = bound(bps, 1, 100_000);
        vm.prank(admin);
        ch.setMaintenanceHealthBps(bps);
    }

    function setCap(uint256 cap) external {
        cap = bound(cap, 0, 1e30);
        vm.prank(admin);
        ch.setSymbolPositionCap(KEY, cap);
    }
}
