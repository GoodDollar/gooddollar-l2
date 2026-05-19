// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../../src/risk/UnifiedRiskEngine.sol";

// ─── Mock contracts ──────────────────────────────────────────────

contract MockSyntheticAsset {
    uint256 public totalSupply;

    function setTotalSupply(uint256 _supply) external {
        totalSupply = _supply;
    }
}

contract MockSyntheticAssetFactory {
    mapping(bytes32 => address) public assets;
    bytes32[] internal _listedKeys;

    function addAsset(bytes32 key, address asset) external {
        assets[key] = asset;
        _listedKeys.push(key);
    }

    function listedCount() external view returns (uint256) {
        return _listedKeys.length;
    }

    function listedKeys(uint256 idx) external view returns (bytes32) {
        return _listedKeys[idx];
    }
}

contract MockStockAMM {
    struct MockPool {
        address syntheticAsset;
        bytes32 oracleKey;
        uint256 gDollarReserve;
        uint256 syntheticReserve;
        uint256 totalLPShares;
        bool paused;
    }
    mapping(bytes32 => MockPool) internal _pools;

    function setPool(
        bytes32 key,
        address syntheticAsset,
        bytes32 oracleKey,
        uint256 gDollarReserve,
        uint256 syntheticReserve,
        uint256 totalLPShares,
        bool poolPaused
    ) external {
        _pools[key] = MockPool(syntheticAsset, oracleKey, gDollarReserve, syntheticReserve, totalLPShares, poolPaused);
    }

    function pools(bytes32 key) external view returns (
        address, bytes32, uint256, uint256, uint256, bool
    ) {
        MockPool memory p = _pools[key];
        return (p.syntheticAsset, p.oracleKey, p.gDollarReserve, p.syntheticReserve, p.totalLPShares, p.paused);
    }
}

contract MockStockPerpEngine {
    struct MockMarket {
        bytes32 oracleKey;
        bytes32 indexOracleKey;
        string ticker;
        uint256 openInterestLong;
        uint256 openInterestShort;
        uint256 maxLeverage;
        uint256 maxOpenInterest;
        uint256 maintenanceMarginBps;
        uint256 fundingRateCapBps;
        bool active;
    }
    MockMarket[] internal _markets;

    function addMarket(
        bytes32 oracleKey,
        uint256 oiLong,
        uint256 oiShort
    ) external {
        _markets.push(MockMarket({
            oracleKey: oracleKey,
            indexOracleKey: oracleKey,
            ticker: "MOCK",
            openInterestLong: oiLong,
            openInterestShort: oiShort,
            maxLeverage: 10,
            maxOpenInterest: 1_000_000e18,
            maintenanceMarginBps: 500,
            fundingRateCapBps: 100,
            active: true
        }));
    }

    function setOI(uint256 idx, uint256 oiLong, uint256 oiShort) external {
        _markets[idx].openInterestLong = oiLong;
        _markets[idx].openInterestShort = oiShort;
    }

    function marketCount() external view returns (uint256) {
        return _markets.length;
    }

    function markets(uint256 id) external view returns (
        bytes32, bytes32, string memory, uint256, uint256,
        uint256, uint256, uint256, uint256, bool
    ) {
        MockMarket memory m = _markets[id];
        return (
            m.oracleKey, m.indexOracleKey, m.ticker,
            m.openInterestLong, m.openInterestShort,
            m.maxLeverage, m.maxOpenInterest,
            m.maintenanceMarginBps, m.fundingRateCapBps, m.active
        );
    }
}

// ─── Tests ───────────────────────────────────────────────────────

contract UnifiedRiskEngineTest is Test {
    UnifiedRiskEngine engine;
    MockSyntheticAssetFactory factory;
    MockStockAMM amm;
    MockStockPerpEngine perpEngine;
    MockSyntheticAsset aaplToken;

    bytes32 constant AAPL = keccak256("AAPL");
    bytes32 constant TSLA = keccak256("TSLA");
    address admin = address(0xAD);

    function setUp() public {
        factory = new MockSyntheticAssetFactory();
        amm = new MockStockAMM();
        perpEngine = new MockStockPerpEngine();
        aaplToken = new MockSyntheticAsset();

        engine = new UnifiedRiskEngine(
            address(factory),
            address(amm),
            address(perpEngine),
            1_000_000e18, // protocol cap
            admin
        );

        factory.addAsset(AAPL, address(aaplToken));
        amm.setPool(AAPL, address(aaplToken), AAPL, 500_000e18, 200e18, 1000e18, false);
        perpEngine.addMarket(AAPL, 0, 0);
    }

    // ─── Constructor ──────────────────────────────────────

    function test_constructor_setsImmutables() public view {
        assertEq(address(engine.factory()), address(factory));
        assertEq(address(engine.amm()), address(amm));
        assertEq(address(engine.perpEngine()), address(perpEngine));
        assertEq(engine.protocolCap(), 1_000_000e18);
        assertEq(engine.admin(), admin);
    }

    function test_constructor_revertsZeroFactory() public {
        vm.expectRevert(UnifiedRiskEngine.ZeroAddress.selector);
        new UnifiedRiskEngine(address(0), address(amm), address(perpEngine), 1e18, admin);
    }

    function test_constructor_revertsZeroAdmin() public {
        vm.expectRevert(UnifiedRiskEngine.ZeroAddress.selector);
        new UnifiedRiskEngine(address(factory), address(amm), address(perpEngine), 1e18, address(0));
    }

    // ─── Spot exposure ───────────────────────────────────

    function test_spotExposure_totalSupplyMinusAMMReserve() public {
        aaplToken.setTotalSupply(1000e18);
        // AMM holds 200e18 synthetic reserve (set in setUp)
        // Net spot = 1000 - 200 = 800
        int256 net = engine.getNetExposure(AAPL);
        assertEq(net, 800e18);
    }

    function test_spotExposure_zeroWhenNoAsset() public view {
        int256 net = engine.getNetExposure(TSLA);
        assertEq(net, 0);
    }

    // ─── Perp exposure ───────────────────────────────────

    function test_perpExposure_longMinusShort() public {
        aaplToken.setTotalSupply(0);
        amm.setPool(AAPL, address(aaplToken), AAPL, 0, 0, 0, false);
        perpEngine.setOI(0, 500e18, 200e18);

        int256 net = engine.getNetExposure(AAPL);
        // spot = 0 - 0 = 0, perp = 500 - 200 = 300
        assertEq(net, 300e18);
    }

    function test_perpExposure_netShort() public {
        aaplToken.setTotalSupply(0);
        amm.setPool(AAPL, address(aaplToken), AAPL, 0, 0, 0, false);
        perpEngine.setOI(0, 100e18, 400e18);

        int256 net = engine.getNetExposure(AAPL);
        assertEq(net, -300e18);
    }

    // ─── Combined exposure ───────────────────────────────

    function test_combinedExposure_spotPlusPerp() public {
        aaplToken.setTotalSupply(1000e18);
        // AMM reserve = 200e18 (setUp), so spot = 800
        perpEngine.setOI(0, 500e18, 200e18);
        // perp = 300, total = 800 + 300 = 1100

        int256 net = engine.getNetExposure(AAPL);
        assertEq(net, 1100e18);
    }

    // ─── Total absolute exposure ─────────────────────────

    function test_totalAbsExposure_sumOfAbsValues() public {
        MockSyntheticAsset tslaToken = new MockSyntheticAsset();
        factory.addAsset(TSLA, address(tslaToken));
        amm.setPool(TSLA, address(tslaToken), TSLA, 0, 0, 0, false);
        perpEngine.addMarket(TSLA, 0, 0);

        aaplToken.setTotalSupply(1000e18);
        // AAPL spot = 1000 - 200 = 800 (positive)

        tslaToken.setTotalSupply(100e18);
        perpEngine.setOI(1, 50e18, 300e18);
        // TSLA spot = 100 - 0 = 100, perp = 50 - 300 = -250, net = -150

        uint256 totalAbs = engine.totalAbsExposure();
        // |800| + |-150| = 950
        assertEq(totalAbs, 950e18);
    }

    // ─── checkRisk ───────────────────────────────────────

    function test_checkRisk_passesWithinCap() public {
        aaplToken.setTotalSupply(100e18);
        amm.setPool(AAPL, address(aaplToken), AAPL, 0, 0, 0, false);

        vm.prank(admin);
        engine.setSymbolCap(AAPL, 500e18);
        vm.prank(admin);
        engine.registerSource(address(this));

        engine.checkRisk(AAPL, 200e18);
    }

    function test_checkRisk_revertsExceedingSymbolCap() public {
        aaplToken.setTotalSupply(100e18);
        amm.setPool(AAPL, address(aaplToken), AAPL, 0, 0, 0, false);

        vm.prank(admin);
        engine.setSymbolCap(AAPL, 200e18);
        vm.prank(admin);
        engine.registerSource(address(this));

        // current = 100, additional = 200, projected = 300 > 200 cap
        vm.expectRevert(
            abi.encodeWithSelector(
                UnifiedRiskEngine.ExposureLimitExceeded.selector,
                AAPL,
                300e18,
                200e18
            )
        );
        engine.checkRisk(AAPL, 200e18);
    }

    function test_checkRisk_revertsExceedingProtocolCap() public {
        aaplToken.setTotalSupply(900_000e18);
        amm.setPool(AAPL, address(aaplToken), AAPL, 0, 0, 0, false);

        vm.prank(admin);
        engine.registerSource(address(this));

        // current net = 900_000, additional = 200_000, projected = 1_100_000
        // With fix: totalAbs = |1_100_000| = 1_100_000 > 1_000_000 cap
        vm.expectRevert(); // ProtocolCapExceeded
        engine.checkRisk(AAPL, 200_000e18);
    }

    function test_checkRisk_emitsExposureChanged() public {
        aaplToken.setTotalSupply(100e18);
        amm.setPool(AAPL, address(aaplToken), AAPL, 0, 0, 0, false);

        vm.prank(admin);
        engine.registerSource(address(this));

        vm.expectEmit(true, false, false, true);
        emit UnifiedRiskEngine.ExposureChanged(AAPL, 300e18, block.timestamp);

        engine.checkRisk(AAPL, 200e18);
    }

    function test_checkRisk_revertsWhenPaused() public {
        vm.prank(admin);
        engine.registerSource(address(this));
        vm.prank(admin);
        engine.setPaused(true);

        vm.expectRevert(UnifiedRiskEngine.IsPaused.selector);
        engine.checkRisk(AAPL, 1e18);
    }

    function test_checkRisk_noCap_alwaysPasses() public {
        aaplToken.setTotalSupply(0);
        amm.setPool(AAPL, address(aaplToken), AAPL, 0, 0, 0, false);

        vm.prank(admin);
        engine.setProtocolCap(0);
        vm.prank(admin);
        engine.registerSource(address(this));

        engine.checkRisk(AAPL, 999_999_999e18);
    }

    // ─── Admin ───────────────────────────────────────────

    function test_setSymbolCap_onlyAdmin() public {
        vm.expectRevert(UnifiedRiskEngine.NotAdmin.selector);
        engine.setSymbolCap(AAPL, 100e18);
    }

    function test_setSymbolCap_works() public {
        vm.prank(admin);
        engine.setSymbolCap(AAPL, 500e18);
        assertEq(engine.symbolCaps(AAPL), 500e18);
    }

    function test_setProtocolCap_onlyAdmin() public {
        vm.expectRevert(UnifiedRiskEngine.NotAdmin.selector);
        engine.setProtocolCap(100e18);
    }

    function test_setAdmin_onlyAdmin() public {
        vm.expectRevert(UnifiedRiskEngine.NotAdmin.selector);
        engine.setAdmin(address(0x1));
    }

    function test_setAdmin_revertsZeroAddress() public {
        vm.prank(admin);
        vm.expectRevert(UnifiedRiskEngine.ZeroAddress.selector);
        engine.setAdmin(address(0));
    }

    function test_setAdmin_works() public {
        address newAdmin = address(0xBEEF);
        vm.prank(admin);
        engine.setAdmin(newAdmin);
        assertEq(engine.admin(), newAdmin);
    }

    function test_registerSource_works() public {
        address source = address(0xCAFE);
        vm.prank(admin);
        engine.registerSource(source);
        assertTrue(engine.registeredSources(source));
    }

    function test_registerSource_revertsZeroAddress() public {
        vm.prank(admin);
        vm.expectRevert(UnifiedRiskEngine.ZeroAddress.selector);
        engine.registerSource(address(0));
    }

    function test_setPaused_emitsEvent() public {
        vm.prank(admin);
        vm.expectEmit(false, false, false, true);
        emit UnifiedRiskEngine.Paused(true);
        engine.setPaused(true);
    }

    // ─── Bug fix: protocol-cap double-counting ──────────────

    function test_protocolCap_noDoubleCounting() public {
        // Set up: AAPL has 800e18 net exposure (1000 supply - 200 AMM reserve)
        aaplToken.setTotalSupply(1000e18);
        // AMM reserve is 200e18 from setUp

        // Set protocol cap to 900e18
        vm.prank(admin);
        engine.setProtocolCap(900e18);
        vm.prank(admin);
        engine.registerSource(address(this));

        // Adding 50e18 should succeed: total = |800+50| = 850 < 900
        // (With the old double-counting bug, total would be 800 + 850 = 1650 > 900)
        engine.checkRisk(AAPL, 50e18);
    }

    function test_protocolCap_correctlyRejectsOverCap() public {
        aaplToken.setTotalSupply(1000e18);

        vm.prank(admin);
        engine.setProtocolCap(900e18);
        vm.prank(admin);
        engine.registerSource(address(this));

        // Adding 150e18 should fail: total = |800+150| = 950 > 900
        vm.expectRevert();
        engine.checkRisk(AAPL, 150e18);
    }

    function test_protocolCap_multiSymbol_correctTotal() public {
        MockSyntheticAsset tslaToken = new MockSyntheticAsset();
        factory.addAsset(TSLA, address(tslaToken));
        amm.setPool(TSLA, address(tslaToken), TSLA, 0, 0, 0, false);

        aaplToken.setTotalSupply(500e18);
        // AAPL net = 500 - 200 = 300
        tslaToken.setTotalSupply(400e18);
        // TSLA net = 400 - 0 = 400
        // totalAbs = |300| + |400| = 700

        vm.prank(admin);
        engine.setProtocolCap(800e18);
        vm.prank(admin);
        engine.registerSource(address(this));

        // Adding 50 to AAPL: new AAPL net = 350, new totalAbs = 350 + 400 = 750 < 800
        engine.checkRisk(AAPL, 50e18);
    }

    // ─── Source enforcement ─────────────────────────────────

    function test_checkRisk_revertsUnregisteredSource() public {
        aaplToken.setTotalSupply(0);
        amm.setPool(AAPL, address(aaplToken), AAPL, 0, 0, 0, false);

        // Don't register this contract as a source
        vm.expectRevert(
            abi.encodeWithSelector(
                UnifiedRiskEngine.SourceNotRegistered.selector,
                address(this)
            )
        );
        engine.checkRisk(AAPL, 1e18);
    }

    function test_checkRisk_registeredSourceCanCall() public {
        aaplToken.setTotalSupply(0);
        amm.setPool(AAPL, address(aaplToken), AAPL, 0, 0, 0, false);

        vm.prank(admin);
        engine.registerSource(address(this));

        engine.checkRisk(AAPL, 1e18);
    }

    function test_checkRisk_adminCanCallDirectly() public {
        aaplToken.setTotalSupply(0);
        amm.setPool(AAPL, address(aaplToken), AAPL, 0, 0, 0, false);

        vm.prank(admin);
        engine.checkRisk(AAPL, 1e18);
    }
}
