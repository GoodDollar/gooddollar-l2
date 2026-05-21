// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../../src/risk/UnifiedRiskEngine.sol";

contract MockSyntheticAssetFuzz {
    uint256 public totalSupply;
    function setTotalSupply(uint256 _supply) external { totalSupply = _supply; }
}

contract MockSyntheticAssetFactoryFuzz {
    mapping(bytes32 => address) public assets;
    bytes32[] internal _listedKeys;

    function addAsset(bytes32 key, address asset) external {
        assets[key] = asset;
        _listedKeys.push(key);
    }

    function listedCount() external view returns (uint256) { return _listedKeys.length; }
    function listedKeys(uint256 idx) external view returns (bytes32) { return _listedKeys[idx]; }
}

contract MockStockAMMFuzzRisk {
    struct MockPool {
        address syntheticAsset;
        bytes32 oracleKey;
        uint256 gDollarReserve;
        uint256 syntheticReserve;
        uint256 totalLPShares;
        bool paused;
    }
    mapping(bytes32 => MockPool) internal _pools;

    function setPool(bytes32 key, address syntheticAsset, uint256 syntheticReserve) external {
        _pools[key] = MockPool(syntheticAsset, key, 0, syntheticReserve, 0, false);
    }

    function pools(bytes32 key) external view returns (address, bytes32, uint256, uint256, uint256, bool) {
        MockPool memory p = _pools[key];
        return (p.syntheticAsset, p.oracleKey, p.gDollarReserve, p.syntheticReserve, p.totalLPShares, p.paused);
    }
}

contract MockStockPerpEngineFuzz {
    struct MockMarket {
        bytes32 oracleKey;
        uint256 openInterestLong;
        uint256 openInterestShort;
    }
    MockMarket[] internal _markets;

    function addMarket(bytes32 oracleKey, uint256 oiLong, uint256 oiShort) external {
        _markets.push(MockMarket(oracleKey, oiLong, oiShort));
    }

    function setOI(uint256 idx, uint256 oiLong, uint256 oiShort) external {
        _markets[idx].openInterestLong = oiLong;
        _markets[idx].openInterestShort = oiShort;
    }

    function marketCount() external view returns (uint256) { return _markets.length; }

    function markets(uint256 id) external view returns (
        bytes32, bytes32, string memory, uint256, uint256,
        uint256, uint256, uint256, uint256, bool
    ) {
        MockMarket memory m = _markets[id];
        return (m.oracleKey, m.oracleKey, "MOCK", m.openInterestLong, m.openInterestShort,
                10, 1_000_000e18, 500, 100, true);
    }
}

/**
 * @title UnifiedRiskEngineFuzzTest
 * @notice Fuzz tests for UnifiedRiskEngine covering exposure calculations,
 *         cap enforcement, and circuit breaker behavior.
 */
contract UnifiedRiskEngineFuzzTest is Test {
    UnifiedRiskEngine public engine;
    MockSyntheticAssetFactoryFuzz public factory;
    MockStockAMMFuzzRisk public amm;
    MockStockPerpEngineFuzz public perpEngine;
    MockSyntheticAssetFuzz public aaplToken;

    bytes32 constant AAPL = keccak256("AAPL");
    address admin = makeAddr("admin");

    function setUp() public {
        factory = new MockSyntheticAssetFactoryFuzz();
        amm = new MockStockAMMFuzzRisk();
        perpEngine = new MockStockPerpEngineFuzz();
        aaplToken = new MockSyntheticAssetFuzz();

        engine = new UnifiedRiskEngine(
            address(factory), address(amm), address(perpEngine),
            type(uint256).max, // no protocol cap initially
            admin
        );

        factory.addAsset(AAPL, address(aaplToken));
        amm.setPool(AAPL, address(aaplToken), 0);
        perpEngine.addMarket(AAPL, 0, 0);

        vm.prank(admin);
        engine.registerSource(address(this));
    }

    // ============ Spot exposure formula: totalSupply - ammReserve ============

    function testFuzz_spotExposure_formula(uint128 _supply, uint128 _reserve) public {
        uint256 supply = uint256(_supply);
        uint256 reserve = uint256(_reserve);

        aaplToken.setTotalSupply(supply);
        amm.setPool(AAPL, address(aaplToken), reserve);
        perpEngine.setOI(0, 0, 0);

        int256 net = engine.getNetExposure(AAPL);
        int256 expected = int256(supply) - int256(reserve);
        assertEq(net, expected, "spot exposure = totalSupply - ammReserve");
    }

    // ============ Perp exposure formula: oiLong - oiShort ============

    function testFuzz_perpExposure_formula(uint128 _oiLong, uint128 _oiShort) public {
        uint256 oiLong = uint256(_oiLong);
        uint256 oiShort = uint256(_oiShort);

        aaplToken.setTotalSupply(0);
        amm.setPool(AAPL, address(aaplToken), 0);
        perpEngine.setOI(0, oiLong, oiShort);

        int256 net = engine.getNetExposure(AAPL);
        int256 expected = int256(oiLong) - int256(oiShort);
        assertEq(net, expected, "perp exposure = oiLong - oiShort");
    }

    // ============ Combined: spot + perp ============

    function testFuzz_combinedExposure(
        uint96 _supply, uint96 _reserve,
        uint96 _oiLong, uint96 _oiShort
    ) public {
        uint256 supply = uint256(_supply);
        uint256 reserve = uint256(_reserve);
        uint256 oiLong = uint256(_oiLong);
        uint256 oiShort = uint256(_oiShort);

        aaplToken.setTotalSupply(supply);
        amm.setPool(AAPL, address(aaplToken), reserve);
        perpEngine.setOI(0, oiLong, oiShort);

        int256 net = engine.getNetExposure(AAPL);
        int256 expectedSpot = int256(supply) - int256(reserve);
        int256 expectedPerp = int256(oiLong) - int256(oiShort);
        assertEq(net, expectedSpot + expectedPerp, "combined = spot + perp");
    }

    // ============ checkRisk within cap passes ============

    function testFuzz_checkRisk_withinCap(uint64 _additional) public {
        uint256 additional = bound(uint256(_additional), 0, 500e18);

        aaplToken.setTotalSupply(100e18);
        amm.setPool(AAPL, address(aaplToken), 0);
        perpEngine.setOI(0, 0, 0);

        vm.prank(admin);
        engine.setSymbolCap(AAPL, 1000e18);
        vm.prank(admin);
        engine.setProtocolCap(1000e18);

        engine.checkRisk(AAPL, int256(additional));
    }

    // ============ checkRisk exceeding symbol cap reverts ============

    function testFuzz_checkRisk_exceedsSymbolCap(uint64 _capSeed) public {
        uint256 cap = bound(uint256(_capSeed), 1e18, 500e18);

        aaplToken.setTotalSupply(0);
        amm.setPool(AAPL, address(aaplToken), 0);
        perpEngine.setOI(0, 0, 0);

        vm.prank(admin);
        engine.setSymbolCap(AAPL, cap);

        uint256 overAmount = cap + 1;

        vm.expectRevert();
        engine.checkRisk(AAPL, int256(overAmount));
    }

    // ============ checkRisk when paused always reverts ============

    function testFuzz_checkRisk_revertsPaused(int64 _additional) public {
        vm.prank(admin);
        engine.setPaused(true);

        vm.expectRevert(UnifiedRiskEngine.IsPaused.selector);
        engine.checkRisk(AAPL, int256(_additional));
    }

    // ============ checkRisk from unregistered source reverts ============

    function testFuzz_checkRisk_unregisteredReverts(address _caller) public {
        vm.assume(_caller != address(this) && _caller != admin);

        vm.prank(_caller);
        vm.expectRevert();
        engine.checkRisk(AAPL, 1);
    }

    // ============ Circuit breaker trips on large spike ============

    function testFuzz_circuitBreaker_trips(uint64 _spikeSeed) public {
        uint256 baseSupply = 1000e18;
        aaplToken.setTotalSupply(baseSupply);
        amm.setPool(AAPL, address(aaplToken), 0);
        perpEngine.setOI(0, 0, 0);

        vm.startPrank(admin);
        engine.setProtocolCap(0);
        engine.setCircuitBreakerParams(1000, 300); // 10%, 5min
        engine.enableCircuitBreaker(true);
        vm.stopPrank();

        uint256 spike = bound(uint256(_spikeSeed), 150e18, 5000e18);
        aaplToken.setTotalSupply(baseSupply + spike);

        engine.checkRisk(AAPL, 0);
        assertTrue(engine.paused(), "should auto-pause on >10% spike");
    }

    // ============ Circuit breaker does NOT trip below threshold ============

    function testFuzz_circuitBreaker_noTrip(uint64 _smallDelta) public {
        uint256 baseSupply = 10000e18;
        aaplToken.setTotalSupply(baseSupply);
        amm.setPool(AAPL, address(aaplToken), 0);
        perpEngine.setOI(0, 0, 0);

        vm.startPrank(admin);
        engine.setProtocolCap(0);
        engine.setCircuitBreakerParams(2000, 300); // 20%, 5min
        engine.enableCircuitBreaker(true);
        vm.stopPrank();

        uint256 smallDelta = bound(uint256(_smallDelta), 0, 1900e18);
        aaplToken.setTotalSupply(baseSupply + smallDelta);

        engine.checkRisk(AAPL, 0);
        assertFalse(engine.paused(), "should NOT pause on <20% change");
    }

    // ============ Window elapse resets snapshot ============

    function testFuzz_circuitBreaker_windowReset(uint32 _warp) public {
        uint256 baseSupply = 1000e18;
        aaplToken.setTotalSupply(baseSupply);
        amm.setPool(AAPL, address(aaplToken), 0);
        perpEngine.setOI(0, 0, 0);

        vm.startPrank(admin);
        engine.setProtocolCap(0);
        engine.setCircuitBreakerParams(500, 300); // 5%, 5min
        engine.enableCircuitBreaker(true);
        vm.stopPrank();

        uint256 warpTime = bound(uint256(_warp), 301, 100_000);
        vm.warp(block.timestamp + warpTime);

        aaplToken.setTotalSupply(5000e18);
        engine.checkRisk(AAPL, 0);
        assertFalse(engine.paused(), "window elapsed -> snapshot rotates, no trip");
    }
}
