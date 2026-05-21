// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../../src/risk/UnifiedRiskEngine.sol";

/**
 * @title UnifiedRiskNettingIntegrationTest
 * @notice Integration proof that UnifiedRiskEngine correctly nets exposure
 *         across spot (synthetic supply - AMM reserves) and perps (OI long - OI short),
 *         enforces per-symbol caps, and enforces protocol-wide caps across symbols.
 *
 * Scenarios proven:
 *   1. Spot-only exposure = totalSupply - ammReserve
 *   2. Perp-only exposure = OI_long - OI_short
 *   3. Netting: spot long + perp short → reduced net exposure
 *   4. checkRisk passes when projected exposure is within cap
 *   5. checkRisk reverts when projected exposure exceeds symbol cap
 *   6. Protocol cap aggregates absolute exposure across multiple symbols
 */
contract UnifiedRiskNettingIntegrationTest is Test {
    UnifiedRiskEngine engine;
    MockFactory factory;
    MockAMM amm;
    MockPerp perpEngine;
    MockSynthetic sAAPL;
    MockSynthetic sTSLA;

    bytes32 constant AAPL = keccak256("AAPL");
    bytes32 constant TSLA = keccak256("TSLA");
    address admin = makeAddr("admin");
    address trader = makeAddr("trader");

    uint256 constant SYMBOL_CAP = 500 ether;
    uint256 constant PROTOCOL_CAP = 800 ether;

    function setUp() public {
        factory = new MockFactory();
        amm = new MockAMM();
        perpEngine = new MockPerp();

        sAAPL = new MockSynthetic();
        sTSLA = new MockSynthetic();

        factory.addAsset(AAPL, address(sAAPL));
        factory.addAsset(TSLA, address(sTSLA));

        engine = new UnifiedRiskEngine(
            address(factory),
            address(amm),
            address(perpEngine),
            PROTOCOL_CAP,
            admin
        );

        vm.startPrank(admin);
        engine.setSymbolCap(AAPL, SYMBOL_CAP);
        engine.setSymbolCap(TSLA, SYMBOL_CAP);
        engine.registerSource(trader);
        vm.stopPrank();
    }

    /// Spot-only: net exposure = totalSupply - ammReserve
    function test_spotOnlyExposure() public {
        sAAPL.setTotalSupply(200 ether);
        amm.setSyntheticReserve(AAPL, 80 ether);

        int256 net = engine.getNetExposure(AAPL);
        assertEq(net, 120 ether, "Spot exposure = 200 - 80 = 120");
    }

    /// Perp-only: net exposure = OI_long - OI_short
    function test_perpOnlyExposure() public {
        perpEngine.addMarket(AAPL, 300 ether, 150 ether);

        int256 net = engine.getNetExposure(AAPL);
        assertEq(net, 150 ether, "Perp exposure = 300 - 150 = 150");
    }

    /// Netting: user long 200 spot (80 in AMM) + 100 short perp → net = 120 + (0-100) = 20
    function test_nettingSpotAndPerp() public {
        sAAPL.setTotalSupply(200 ether);
        amm.setSyntheticReserve(AAPL, 80 ether);
        perpEngine.addMarket(AAPL, 0, 100 ether);

        int256 net = engine.getNetExposure(AAPL);
        assertEq(net, 20 ether, "Netting: spot 120 + perp (-100) = 20");
    }

    /// checkRisk passes when projected exposure is within cap
    function test_checkRiskPassesWithinCap() public {
        sAAPL.setTotalSupply(200 ether);
        amm.setSyntheticReserve(AAPL, 80 ether);
        perpEngine.addMarket(AAPL, 0, 100 ether);
        // current net = 20 ether

        vm.prank(trader);
        engine.checkRisk(AAPL, int256(300 ether));
        // projected = 20 + 300 = 320, |320| = 320 < cap 500 → OK
    }

    /// checkRisk reverts when projected exposure exceeds symbol cap
    function test_checkRiskRevertsExceedingCap() public {
        sAAPL.setTotalSupply(200 ether);
        amm.setSyntheticReserve(AAPL, 80 ether);
        perpEngine.addMarket(AAPL, 0, 100 ether);
        // current net = 20 ether

        vm.prank(trader);
        vm.expectRevert(
            abi.encodeWithSelector(
                UnifiedRiskEngine.ExposureLimitExceeded.selector,
                AAPL,
                uint256(520 ether), // |20 + 500| = 520
                SYMBOL_CAP          // 500
            )
        );
        engine.checkRisk(AAPL, int256(500 ether));
    }

    /// Protocol cap aggregates absolute exposure across symbols
    function test_protocolCapAggregatesAcrossSymbols() public {
        // Raise per-symbol caps so they don't fire first
        vm.startPrank(admin);
        engine.setSymbolCap(AAPL, 1000 ether);
        engine.setSymbolCap(TSLA, 1000 ether);
        vm.stopPrank();

        // AAPL: spot 400 - amm 0 = 400 net
        sAAPL.setTotalSupply(400 ether);
        amm.setSyntheticReserve(AAPL, 0);

        // TSLA: spot 300 - amm 0 = 300 net
        sTSLA.setTotalSupply(300 ether);
        amm.setSyntheticReserve(TSLA, 0);

        // total abs = |400| + |300| = 700, protocol cap = 800
        // Try to add 200 to AAPL → AAPL becomes 600, total = 600 + 300 = 900 > 800
        vm.prank(trader);
        vm.expectRevert(
            abi.encodeWithSelector(
                UnifiedRiskEngine.ProtocolCapExceeded.selector,
                uint256(900 ether), // projected total
                PROTOCOL_CAP        // 800
            )
        );
        engine.checkRisk(AAPL, int256(200 ether));
    }

    /// Negative perp exposure (net short) correctly reduces absolute exposure
    function test_negativeNetExposureReducesTotalAbs() public {
        // AAPL: spot 100 - amm 0 + perp (0 - 200) = 100 - 200 = -100 (net short)
        sAAPL.setTotalSupply(100 ether);
        amm.setSyntheticReserve(AAPL, 0);
        perpEngine.addMarket(AAPL, 0, 200 ether);

        int256 net = engine.getNetExposure(AAPL);
        assertEq(net, -100 ether, "Net short: spot 100 + perp (-200) = -100");

        // total abs exposure = |-100| = 100 (well within protocol cap)
        uint256 totalAbs = engine.totalAbsExposure();
        assertEq(totalAbs, 100 ether);
    }
}

// ─── Minimal mocks matching UnifiedRiskEngine interfaces ────────────

contract MockSynthetic {
    uint256 public totalSupply;

    function setTotalSupply(uint256 s) external {
        totalSupply = s;
    }
}

contract MockFactory {
    mapping(bytes32 => address) public assets;
    bytes32[] internal _keys;

    function addAsset(bytes32 key, address asset) external {
        assets[key] = asset;
        _keys.push(key);
    }

    function listedCount() external view returns (uint256) {
        return _keys.length;
    }

    function listedKeys(uint256 idx) external view returns (bytes32) {
        return _keys[idx];
    }
}

contract MockAMM {
    mapping(bytes32 => uint256) internal _syntheticReserves;

    function setSyntheticReserve(bytes32 key, uint256 reserve) external {
        _syntheticReserves[key] = reserve;
    }

    function pools(bytes32 key) external view returns (
        address, bytes32, uint256, uint256, uint256, bool
    ) {
        return (address(0), key, 0, _syntheticReserves[key], 0, false);
    }
}

contract MockPerp {
    struct M {
        bytes32 oracleKey;
        uint256 oiLong;
        uint256 oiShort;
    }
    M[] internal _markets;

    function addMarket(bytes32 key, uint256 oiLong, uint256 oiShort) external {
        _markets.push(M(key, oiLong, oiShort));
    }

    function setOI(uint256 idx, uint256 oiLong, uint256 oiShort) external {
        _markets[idx].oiLong = oiLong;
        _markets[idx].oiShort = oiShort;
    }

    function marketCount() external view returns (uint256) {
        return _markets.length;
    }

    function markets(uint256 id) external view returns (
        bytes32, bytes32, string memory, uint256, uint256,
        uint256, uint256, uint256, uint256, bool
    ) {
        M memory m = _markets[id];
        return (m.oracleKey, m.oracleKey, "MOCK", m.oiLong, m.oiShort, 10, 1e24, 500, 100, true);
    }
}
