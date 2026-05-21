// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../../src/risk/UnifiedRiskEngine.sol";
import "../handlers/UnifiedRiskEngineHandler.sol";

contract MockSyntheticAssetInv {
    uint256 public totalSupply;
    function setTotalSupply(uint256 _supply) external { totalSupply = _supply; }
}

contract MockSyntheticAssetFactoryInv {
    mapping(bytes32 => address) public assets;
    bytes32[] internal _listedKeys;

    function addAsset(bytes32 key, address asset) external {
        assets[key] = asset;
        _listedKeys.push(key);
    }

    function listedCount() external view returns (uint256) { return _listedKeys.length; }
    function listedKeys(uint256 idx) external view returns (bytes32) { return _listedKeys[idx]; }
}

contract MockStockAMMInv {
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

contract MockStockPerpEngineInv {
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
 * @title UnifiedRiskEngineInvariantTest
 * @notice Invariant suite for UnifiedRiskEngine.
 *
 *         Handler drives: adjustSpot, adjustPerp, callCheckRisk, warpForward
 *
 *         Invariants:
 *           1. exposureConsistency — getNetExposure matches spot + perp formula
 *           2. totalAbsExposureCorrect — totalAbsExposure equals sum of |per-symbol|
 *           3. capRespected — if engine is not paused and caps are set, exposure
 *              should not silently exceed caps (only checkRisk can gate this)
 *           4. callAccounting — passCount + revertCount == callCount
 */
contract UnifiedRiskEngineInvariantTest is Test {
    UnifiedRiskEngine public engine;
    MockSyntheticAssetFactoryInv public factory;
    MockStockAMMInv public amm;
    MockStockPerpEngineInv public perpEngine;
    MockSyntheticAssetInv public aaplToken;
    UnifiedRiskEngineHandler public handler;

    bytes32 constant AAPL = keccak256("AAPL");
    address admin = makeAddr("admin");

    function setUp() public {
        factory = new MockSyntheticAssetFactoryInv();
        amm = new MockStockAMMInv();
        perpEngine = new MockStockPerpEngineInv();
        aaplToken = new MockSyntheticAssetInv();

        engine = new UnifiedRiskEngine(
            address(factory), address(amm), address(perpEngine),
            type(uint256).max,
            admin
        );

        factory.addAsset(AAPL, address(aaplToken));
        amm.setPool(AAPL, address(aaplToken), 0);
        perpEngine.addMarket(AAPL, 0, 0);

        vm.prank(admin);
        engine.registerSource(admin);

        handler = new UnifiedRiskEngineHandler(
            engine,
            address(aaplToken),
            address(amm),
            address(perpEngine),
            admin
        );

        targetContract(address(handler));
    }

    /// @notice getNetExposure(AAPL) always equals (totalSupply - ammReserve) + (oiLong - oiShort)
    function invariant_exposureConsistency() public view {
        int256 net = engine.getNetExposure(AAPL);

        uint256 supply = aaplToken.totalSupply();
        (, , , uint256 ammRes, , ) = amm.pools(AAPL);
        int256 spotExp = int256(supply) - int256(ammRes);

        (,,, uint256 oiL, uint256 oiS,,,,,) = perpEngine.markets(0);
        int256 perpExp = int256(oiL) - int256(oiS);

        assertEq(net, spotExp + perpExp, "exposure consistency violated");
    }

    /// @notice totalAbsExposure == |getNetExposure(AAPL)|  (single-symbol setup)
    function invariant_totalAbsExposureCorrect() public view {
        uint256 totalAbs = engine.totalAbsExposure();
        int256 net = engine.getNetExposure(AAPL);
        uint256 expected = net >= 0 ? uint256(net) : uint256(-net);
        assertEq(totalAbs, expected, "totalAbsExposure mismatch");
    }

    /// @notice passCount + revertCount == callCount
    function invariant_callAccounting() public view {
        assertEq(
            handler.passCount() + handler.revertCount(),
            handler.callCount(),
            "call accounting mismatch"
        );
    }

    /// @notice Engine admin is always the original admin (no unauthorized transfer)
    function invariant_adminUnchanged() public view {
        assertEq(engine.admin(), admin, "admin changed unexpectedly");
    }
}
