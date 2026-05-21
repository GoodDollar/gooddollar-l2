// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../../src/oracle/StockOracleV2.sol";

/**
 * @title StockOracleV2Handler
 * @notice Handler contract for Foundry invariant testing of StockOracleV2.
 *         Exposes bounded action functions that the fuzzer drives at random:
 *           - updateAAPL / updateTSLA (signer price updates with bounded params)
 *           - adminSetAAPL (admin emergency override)
 *           - warpForward (time advancement)
 *
 *         Ghost variables track expected state for invariant assertions.
 */
contract StockOracleV2Handler is Test {
    StockOracleV2 public oracle;
    address public signer;
    address public admin;

    // Ghost state for invariant assertions
    uint256 public lastAAPLTimestamp;
    uint256 public lastTSLATimestamp;
    uint256 public updateCount;
    uint256 public currentTimestamp;

    bytes32 public constant AAPL_HASH = keccak256(abi.encodePacked("AAPL"));
    bytes32 public constant TSLA_HASH = keccak256(abi.encodePacked("TSLA"));

    constructor(StockOracleV2 _oracle, address _signer, address _admin, uint256 _startTimestamp) {
        oracle = _oracle;
        signer = _signer;
        admin = _admin;
        currentTimestamp = _startTimestamp;
    }

    function updateAAPL(uint128 _priceSeed, uint8 _conf) external {
        currentTimestamp += 1;
        vm.warp(currentTimestamp);

        (uint256 currentPrice,,,) = oracle.getPriceUnsafe("AAPL");
        uint256 price;
        if (currentPrice == 0) {
            price = bound(uint256(_priceSeed), 1_000_000_00, 100_000_000_000_00);
        } else {
            uint256 maxDev = (currentPrice * 1000) / 10_000; // 10%
            uint256 lo = currentPrice > maxDev ? currentPrice - maxDev : 1;
            uint256 hi = currentPrice + maxDev;
            price = bound(uint256(_priceSeed), lo, hi);
        }

        uint8 conf = _conf > 100 ? 100 : _conf;

        vm.prank(signer);
        try oracle.updatePrice("AAPL", price, currentTimestamp, StockOracleV2.SessionState.Open, conf) {
            lastAAPLTimestamp = currentTimestamp;
            updateCount++;
        } catch {}
    }

    function updateTSLA(uint128 _priceSeed, uint8 _conf) external {
        currentTimestamp += 1;
        vm.warp(currentTimestamp);

        (uint256 currentPrice,,,) = oracle.getPriceUnsafe("TSLA");
        uint256 price;
        if (currentPrice == 0) {
            price = bound(uint256(_priceSeed), 1_000_000_00, 100_000_000_000_00);
        } else {
            uint256 maxDev = (currentPrice * 500) / 10_000; // 5% for TSLA
            uint256 lo = currentPrice > maxDev ? currentPrice - maxDev : 1;
            uint256 hi = currentPrice + maxDev;
            price = bound(uint256(_priceSeed), lo, hi);
        }

        uint8 conf = _conf > 100 ? 100 : _conf;

        vm.prank(signer);
        try oracle.updatePrice("TSLA", price, currentTimestamp, StockOracleV2.SessionState.Open, conf) {
            lastTSLATimestamp = currentTimestamp;
            updateCount++;
        } catch {}
    }

    function adminSetAAPL(uint128 _priceSeed) external {
        uint256 price = bound(uint256(_priceSeed), 1, type(uint128).max);

        currentTimestamp += 1;
        vm.warp(currentTimestamp);

        vm.prank(admin);
        try oracle.adminSetPrice("AAPL", price, StockOracleV2.SessionState.Open) {
            lastAAPLTimestamp = currentTimestamp;
            updateCount++;
        } catch {}
    }

    function warpForward(uint16 _seconds) external {
        uint256 sec = bound(uint256(_seconds), 1, 120);
        currentTimestamp += sec;
        vm.warp(currentTimestamp);
    }
}
