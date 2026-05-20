// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../../src/risk/ClearingHouse.sol";

// ─── Mock contracts ──────────────────────────────────────────

contract MockRiskEngine {
    bool public paused;
    bool public shouldRevert;

    function checkRisk(bytes32, int256) external view {
        require(!shouldRevert, "RiskEngine: limit exceeded");
    }

    function setShouldRevert(bool _v) external { shouldRevert = _v; }
}

contract MockPerpEngine {
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

    function addMarket(
        bytes32 oKey,
        string memory ticker,
        uint256 mmBps
    ) external {
        _markets.push(Market({
            oracleKey: oKey,
            indexOracleKey: oKey,
            ticker: ticker,
            oiLong: 0,
            oiShort: 0,
            maxLeverage: 20,
            maxOI: 1e30,
            mmBps: mmBps,
            fundingCapBps: 100,
            active: true
        }));
    }

    function setPosition(
        uint256 marketId,
        address trader,
        int256 size,
        uint256 entry,
        uint256 margin_
    ) external {
        _positions[marketId][trader] = PosData(size, entry, margin_, 0);
    }

    function marketCount() external view returns (uint256) {
        return _markets.length;
    }

    function markets(uint256 id) external view returns (
        bytes32, bytes32, string memory, uint256, uint256,
        uint256, uint256, uint256, uint256, bool
    ) {
        Market storage m = _markets[id];
        return (
            m.oracleKey, m.indexOracleKey, m.ticker,
            m.oiLong, m.oiShort, m.maxLeverage, m.maxOI,
            m.mmBps, m.fundingCapBps, m.active
        );
    }

    function positions(uint256 marketId, address trader) external view returns (
        int256, uint256, uint256, uint256
    ) {
        PosData storage p = _positions[marketId][trader];
        return (p.sizeTokens, p.entryPrice8, p.margin, p.lastFundingIdx);
    }
}

contract MockOracle {
    struct PriceData {
        uint256 price8;
        uint256 timestamp;
        uint8 session;
        uint8 confidence;
        uint8 signerCount;
    }

    mapping(bytes32 => PriceData) public _prices;

    function setPrice(bytes32 h, uint256 p, uint256 ts) external {
        _prices[h] = PriceData(p, ts, 0, 100, 3);
    }

    function prices(bytes32 h) external view returns (
        uint256, uint256, uint8, uint8, uint8
    ) {
        PriceData storage d = _prices[h];
        return (d.price8, d.timestamp, d.session, d.confidence, d.signerCount);
    }
}

contract MockLendPool {
    mapping(address => uint256) public collaterals;
    mapping(address => uint256) public debts;

    function setCollateral(address u, uint256 v) external { collaterals[u] = v; }
    function setDebt(address u, uint256 v) external { debts[u] = v; }

    function getUserCollateralValue(address u) external view returns (uint256) {
        return collaterals[u];
    }
    function getUserDebtValue(address u) external view returns (uint256) {
        return debts[u];
    }
}

// ─── Test suite ──────────────────────────────────────────────

contract ClearingHouseTest is Test {
    ClearingHouse ch;
    MockRiskEngine riskEngine;
    MockPerpEngine perpEngine;
    MockOracle oracle;
    MockLendPool lendPool;

    address admin = address(0xAD);
    address alice = address(0xA1);
    address bob = address(0xB0);

    bytes32 constant AAPL_KEY = keccak256(abi.encodePacked("AAPL"));
    uint256 constant AAPL_PRICE = 180_00000000; // $180

    function setUp() public {
        vm.warp(10_000);

        riskEngine = new MockRiskEngine();
        perpEngine = new MockPerpEngine();
        oracle = new MockOracle();
        lendPool = new MockLendPool();

        ch = new ClearingHouse(
            address(riskEngine),
            address(perpEngine),
            address(oracle),
            address(lendPool),
            admin
        );

        perpEngine.addMarket(AAPL_KEY, "AAPL", 500); // 5% maintenance
        oracle.setPrice(AAPL_KEY, AAPL_PRICE, block.timestamp);
    }

    // ─── Cross-margin health: no positions ───────────────────

    function test_healthNoPositions() public view {
        uint256 health = ch.getCrossMarginHealth(alice);
        assertEq(health, type(uint256).max, "No debt = max health");
    }

    // ─── Cross-margin: perp only ─────────────────────────────

    function test_healthPerpLong_profitable() public {
        // Alice long 10 AAPL at $170, current $180 → PnL = +$100
        perpEngine.setPosition(0, alice, 10e18, 170_00000000, 500e18);

        uint256 health = ch.getCrossMarginHealth(alice);
        // totalCollateral = margin(500) + PnL(10 * (180-170)) = 500 + 100 = 600
        // totalDebt = maintenance = (10 * 180 / 1e8) * 5% ... let me compute
        // notional = 10e18 * 180e8 / 1e8 = 10e18 * 180 = 1800e18
        // maintenance = 1800e18 * 500 / 10000 = 90e18
        // health = 600e18 * 10000 / 90e18 = 66666
        assertTrue(health > 10_000, "Profitable long should be healthy");
    }

    function test_healthPerpLong_underwater() public {
        // Alice long 10 AAPL at $200, current $180 → PnL = -$200
        perpEngine.setPosition(0, alice, 10e18, 200_00000000, 100e18);

        uint256 health = ch.getCrossMarginHealth(alice);
        // totalCollateral = max(100 + (-200), 0) = 0
        // totalDebt = maintenance = (10 * 180) * 5% = 90
        // health = 0 * 10000 / 90 = 0
        assertEq(health, 0, "Underwater position should have 0 health");
    }

    // ─── Cross-margin: perp + lending ────────────────────────

    function test_crossMarginPerpAndLend() public {
        // Alice has perp PnL of +$100, lending collateral of $500, lending debt of $200
        perpEngine.setPosition(0, alice, 10e18, 170_00000000, 200e18);
        lendPool.setCollateral(alice, 500e18);
        lendPool.setDebt(alice, 200e18);

        uint256 health = ch.getCrossMarginHealth(alice);
        // perpMargin=200, PnL=10*(180-170)=100, lendColl=500
        // totalCollateral = 200 + 100 + 500 = 800
        // lendDebt=200, perpMaintenance = 1800 * 5% = 90
        // totalDebt = 200 + 90 = 290
        // health = 800 * 10000 / 290 = 27586
        assertTrue(health > 10_000, "Cross-margin should be healthy");
    }

    function test_crossMarginPerp_offsetsLendDebt() public {
        // Alice: perp profitable, lending in shortfall
        perpEngine.setPosition(0, alice, 10e18, 170_00000000, 300e18);
        lendPool.setCollateral(alice, 100e18);
        lendPool.setDebt(alice, 350e18);

        uint256 health = ch.getCrossMarginHealth(alice);
        // perpMargin=300, PnL=100, lendColl=100
        // totalCollateral = 300 + 100 + 100 = 500
        // lendDebt=350, perpMaintenance=90
        // totalDebt = 350 + 90 = 440
        // health = 500 * 10000 / 440 = 11363
        assertTrue(health > 10_000, "Perp profits offset lend debt");
    }

    // ─── requireMarginHealth ─────────────────────────────────

    function test_requireMarginHealth_healthy() public view {
        ch.requireMarginHealth(alice);
    }

    function test_requireMarginHealth_reverts_unhealthy() public {
        perpEngine.setPosition(0, alice, 10e18, 200_00000000, 50e18);
        lendPool.setDebt(alice, 100e18);

        vm.expectRevert();
        ch.requireMarginHealth(alice);
    }

    function test_requireMarginHealth_reverts_whenPaused() public {
        vm.prank(admin);
        ch.setPaused(true);

        vm.expectRevert(ClearingHouse.IsPaused.selector);
        ch.requireMarginHealth(alice);
    }

    // ─── Position caps ───────────────────────────────────────

    function test_checkPositionCap_passes() public {
        vm.prank(admin);
        ch.setSymbolPositionCap(AAPL_KEY, 1_000_000e18);

        ch.checkPositionCap(AAPL_KEY, 100, 500_000e18);
    }

    function test_checkPositionCap_reverts_exceeded() public {
        vm.prank(admin);
        ch.setSymbolPositionCap(AAPL_KEY, 1_000_000e18);

        vm.expectRevert(
            abi.encodeWithSelector(
                ClearingHouse.PositionCapExceeded.selector,
                AAPL_KEY, 2_000_000e18, 1_000_000e18
            )
        );
        ch.checkPositionCap(AAPL_KEY, 100, 2_000_000e18);
    }

    function test_checkPositionCap_noCap_passes() public {
        ch.checkPositionCap(AAPL_KEY, 100, 999_999_999e18);
    }

    function test_checkPositionCap_riskEngineReverts() public {
        riskEngine.setShouldRevert(true);

        vm.expectRevert("RiskEngine: limit exceeded");
        ch.checkPositionCap(AAPL_KEY, 100, 100e18);
    }

    function test_checkPositionCap_reverts_whenPaused() public {
        vm.prank(admin);
        ch.setPaused(true);

        vm.expectRevert(ClearingHouse.IsPaused.selector);
        ch.checkPositionCap(AAPL_KEY, 100, 100e18);
    }

    // ─── Auto-deleveraging ───────────────────────────────────

    function test_ADL_emitsEvent() public {
        vm.prank(admin);
        vm.expectEmit(true, true, false, true);
        emit ClearingHouse.ADLExecuted(address(0), 0, 5e18, 9e18);
        // notional = 5e18 * 180e8 / 1e8 = 900e18
        // penalty = 900e18 * 100 / 10000 = 9e18
        ch.autoDeleverage(0, 5e18);
    }

    function test_ADL_negative_size() public {
        vm.prank(admin);
        ch.autoDeleverage(0, -3e18);
        // Should not revert — absSize = 3e18
    }

    function test_ADL_onlyAdmin() public {
        vm.expectRevert(ClearingHouse.NotAdmin.selector);
        vm.prank(alice);
        ch.autoDeleverage(0, 1e18);
    }

    function test_ADL_reverts_whenPaused() public {
        vm.prank(admin);
        ch.setPaused(true);

        vm.prank(admin);
        vm.expectRevert(ClearingHouse.IsPaused.selector);
        ch.autoDeleverage(0, 1e18);
    }

    // ─── Admin functions ─────────────────────────────────────

    function test_setAdmin() public {
        vm.prank(admin);
        ch.setAdmin(bob);
        assertEq(ch.admin(), bob);
    }

    function test_setAdmin_revert_notAdmin() public {
        vm.prank(alice);
        vm.expectRevert(ClearingHouse.NotAdmin.selector);
        ch.setAdmin(bob);
    }

    function test_setAdmin_revert_zero() public {
        vm.prank(admin);
        vm.expectRevert(ClearingHouse.ZeroAddress.selector);
        ch.setAdmin(address(0));
    }

    function test_setPaused() public {
        vm.prank(admin);
        ch.setPaused(true);
        assertTrue(ch.paused());

        vm.prank(admin);
        ch.setPaused(false);
        assertFalse(ch.paused());
    }

    function test_setMaintenanceHealthBps() public {
        vm.prank(admin);
        ch.setMaintenanceHealthBps(12_000);
        assertEq(ch.maintenanceHealthBps(), 12_000);
    }

    function test_setADLPenaltyBps() public {
        vm.prank(admin);
        ch.setADLPenaltyBps(200);
        assertEq(ch.adlPenaltyBps(), 200);
    }

    function test_setSymbolPositionCap() public {
        vm.prank(admin);
        ch.setSymbolPositionCap(AAPL_KEY, 5_000_000e18);
        assertEq(ch.symbolPositionCaps(AAPL_KEY), 5_000_000e18);
    }

    // ─── Constructor reverts ─────────────────────────────────

    function test_constructor_revert_zeroRiskEngine() public {
        vm.expectRevert(ClearingHouse.ZeroAddress.selector);
        new ClearingHouse(address(0), address(perpEngine), address(oracle), address(lendPool), admin);
    }

    function test_constructor_revert_zeroPerpEngine() public {
        vm.expectRevert(ClearingHouse.ZeroAddress.selector);
        new ClearingHouse(address(riskEngine), address(0), address(oracle), address(lendPool), admin);
    }

    function test_constructor_revert_zeroOracle() public {
        vm.expectRevert(ClearingHouse.ZeroAddress.selector);
        new ClearingHouse(address(riskEngine), address(perpEngine), address(0), address(lendPool), admin);
    }

    function test_constructor_revert_zeroLendPool() public {
        vm.expectRevert(ClearingHouse.ZeroAddress.selector);
        new ClearingHouse(address(riskEngine), address(perpEngine), address(oracle), address(0), admin);
    }

    function test_constructor_revert_zeroAdmin() public {
        vm.expectRevert(ClearingHouse.ZeroAddress.selector);
        new ClearingHouse(address(riskEngine), address(perpEngine), address(oracle), address(lendPool), address(0));
    }

    // ─── Edge: short position PnL ────────────────────────────

    function test_healthPerpShort_profitable() public {
        // Alice short 5 AAPL at $200, current $180 → profit
        perpEngine.setPosition(0, alice, -5e18, 200_00000000, 300e18);

        uint256 health = ch.getCrossMarginHealth(alice);
        // PnL for short: -(price_diff * size) when size < 0
        // priceDiff = 180 - 200 = -20 (in 8dec), rawPnL = -20 * 5 / 1 = -100
        // But size < 0, so rawPnL = -(-100) = +100
        // totalCollateral = 300 + 100 = 400
        // notional = 5 * 180 = 900, maintenance = 900 * 5% = 45
        // health = 400 * 10000 / 45 = 88888
        assertTrue(health > 10_000, "Profitable short should be healthy");
    }

    function test_healthPerpShort_underwater() public {
        // Alice short 5 AAPL at $160, current $180 → loss
        perpEngine.setPosition(0, alice, -5e18, 160_00000000, 50e18);

        uint256 health = ch.getCrossMarginHealth(alice);
        // priceDiff = 180 - 160 = +20, rawPnL = 20 * 5 = 100
        // size < 0, so rawPnL = -100
        // totalCollateral = max(50 + (-100), 0) = 0
        assertEq(health, 0);
    }

    // ─── Edge: multiple markets ──────────────────────────────

    function test_healthMultipleMarkets() public {
        bytes32 TSLA_KEY = keccak256(abi.encodePacked("TSLA"));
        perpEngine.addMarket(TSLA_KEY, "TSLA", 800); // 8% MM
        oracle.setPrice(TSLA_KEY, 250_00000000, block.timestamp);

        // Alice long 10 AAPL at $170 (profit) + short 5 TSLA at $260 (profit)
        perpEngine.setPosition(0, alice, 10e18, 170_00000000, 500e18);
        perpEngine.setPosition(1, alice, -5e18, 260_00000000, 300e18);

        uint256 health = ch.getCrossMarginHealth(alice);
        // AAPL: margin=500, PnL=+100, maint=90
        // TSLA: margin=300, PnL=+50 (260-250=10 * 5, short so +50), maint = 5*250*8%=100
        // totalCollateral = 500+100+300+50 = 950
        // totalDebt = 90 + 100 = 190
        // health = 950 * 10000 / 190 = 50000
        assertTrue(health > 10_000);
    }

    // ─── Zero oracle price guards ───────────────────────────

    function test_ADL_revert_zeroOraclePrice() public {
        bytes32 TSLA_KEY = keccak256(abi.encodePacked("TSLA"));
        perpEngine.addMarket(TSLA_KEY, "TSLA", 800);
        // Deliberately do NOT set oracle price for TSLA_KEY → defaults to 0

        vm.prank(admin);
        vm.expectRevert(
            abi.encodeWithSelector(ClearingHouse.OraclePriceZero.selector, TSLA_KEY)
        );
        ch.autoDeleverage(1, 5e18);
    }

    function test_health_revert_zeroOraclePrice_withPosition() public {
        // Alice has an open position but oracle price is 0
        perpEngine.setPosition(0, alice, 10e18, 170_00000000, 500e18);
        oracle.setPrice(AAPL_KEY, 0, block.timestamp);

        vm.expectRevert(
            abi.encodeWithSelector(ClearingHouse.OraclePriceZero.selector, AAPL_KEY)
        );
        ch.getCrossMarginHealth(alice);
    }

    function test_health_noPosition_zeroOracle_ok() public {
        // No position for alice — zero oracle price should not cause revert
        oracle.setPrice(AAPL_KEY, 0, block.timestamp);

        uint256 health = ch.getCrossMarginHealth(alice);
        assertEq(health, type(uint256).max, "No positions = max health regardless of oracle");
    }
}
