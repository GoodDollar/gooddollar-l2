// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../../src/risk/UnifiedRiskEngine.sol";

interface IMockSyntheticAssetFuzz {
    function setTotalSupply(uint256 supply) external;
    function totalSupply() external view returns (uint256);
}

interface IMockStockAMMFuzzRisk {
    function setPool(bytes32 key, address syntheticAsset, uint256 syntheticReserve) external;
}

interface IMockStockPerpEngineFuzz {
    function setOI(uint256 idx, uint256 oiLong, uint256 oiShort) external;
}

/**
 * @title UnifiedRiskEngineHandler
 * @notice Handler for Foundry invariant testing of UnifiedRiskEngine.
 *         Drives mock state changes and checkRisk calls.
 *
 *         Actions: adjustSpot, adjustPerp, callCheckRisk, warpForward
 *
 *         Ghost: tracks total checkRisk calls, pass/fail counts.
 */
contract UnifiedRiskEngineHandler is Test {
    UnifiedRiskEngine public engine;
    IMockSyntheticAssetFuzz public aaplToken;
    IMockStockAMMFuzzRisk public amm;
    IMockStockPerpEngineFuzz public perpEngine;
    address public admin;

    bytes32 public constant AAPL = keccak256("AAPL");

    uint256 public callCount;
    uint256 public passCount;
    uint256 public revertCount;

    constructor(
        UnifiedRiskEngine _engine,
        address _aaplToken,
        address _amm,
        address _perpEngine,
        address _admin
    ) {
        engine = _engine;
        aaplToken = IMockSyntheticAssetFuzz(_aaplToken);
        amm = IMockStockAMMFuzzRisk(_amm);
        perpEngine = IMockStockPerpEngineFuzz(_perpEngine);
        admin = _admin;
    }

    function adjustSpot(uint96 _supply, uint96 _reserve) external {
        aaplToken.setTotalSupply(uint256(_supply));
        amm.setPool(AAPL, address(aaplToken), uint256(_reserve));
    }

    function adjustPerp(uint96 _oiLong, uint96 _oiShort) external {
        perpEngine.setOI(0, uint256(_oiLong), uint256(_oiShort));
    }

    function callCheckRisk(int64 _additional) external {
        callCount++;
        vm.prank(admin);
        try engine.checkRisk(AAPL, int256(_additional)) {
            passCount++;
        } catch {
            revertCount++;
        }
    }

    function warpForward(uint32 _seconds) external {
        uint256 dt = bound(uint256(_seconds), 1, 600);
        vm.warp(block.timestamp + dt);
    }
}
