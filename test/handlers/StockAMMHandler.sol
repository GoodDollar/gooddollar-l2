// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../../src/stocks/StockAMM.sol";
import "../../src/stocks/SyntheticAsset.sol";
import "../../src/stocks/PriceOracle.sol";

/**
 * @title StockAMMHandler
 * @notice Handler contract for Foundry invariant testing of StockAMM.
 *         Exposes bounded action functions the fuzzer drives at random:
 *           - buy / sell (trader swaps with bounded amounts)
 *           - addLiq / removeLiq (LP operations)
 *           - nudgePrice (oracle price changes within deviation bounds)
 *
 *         Ghost variables track cumulative fees for invariant assertions.
 */
contract StockAMMHandler is Test {
    StockAMM public amm;
    PriceOracle public oracle;
    SyntheticAsset public synth;
    address public gDollar;
    address public admin;
    address public trader;
    address public lp;
    address public treasury;

    bytes32 public immutable poolKey;

    uint256 public totalFeesCollected;
    uint256 public totalBuyInputG;
    uint256 public totalSellOutputG;
    uint256 public tradeCount;
    uint256 public currentOraclePrice;

    constructor(
        StockAMM _amm,
        PriceOracle _oracle,
        SyntheticAsset _synth,
        address _gDollar,
        address _admin,
        address _trader,
        address _lp,
        address _treasury,
        uint256 _startPrice
    ) {
        amm = _amm;
        oracle = _oracle;
        synth = _synth;
        gDollar = _gDollar;
        admin = _admin;
        trader = _trader;
        lp = _lp;
        treasury = _treasury;
        poolKey = keccak256(abi.encodePacked("AAPL"));
        currentOraclePrice = _startPrice;
    }

    function buy(uint128 _amountSeed) external {
        uint256 amount = bound(uint256(_amountSeed), 1 ether, 50_000 ether);

        uint256 bal = IERC20Like(gDollar).balanceOf(trader);
        if (bal < amount) return;

        uint256 treasuryBefore = IERC20Like(gDollar).balanceOf(treasury);

        vm.startPrank(trader);
        IERC20Like(gDollar).approve(address(amm), amount);
        try amm.buyStock("AAPL", amount, 0) returns (uint256 out) {
            vm.stopPrank();

            uint256 treasuryAfter = IERC20Like(gDollar).balanceOf(treasury);
            totalFeesCollected += (treasuryAfter - treasuryBefore);
            totalBuyInputG += amount;
            tradeCount++;

            if (out == 0) return;
        } catch {
            vm.stopPrank();
        }
    }

    function sell(uint128 _amountSeed) external {
        uint256 synthBal = synth.balanceOf(trader);
        if (synthBal == 0) return;

        uint256 amount = bound(uint256(_amountSeed), 1, synthBal);
        uint256 treasuryBefore = IERC20Like(gDollar).balanceOf(treasury);

        vm.startPrank(trader);
        synth.approve(address(amm), amount);
        try amm.sellStock("AAPL", amount, 0) returns (uint256 out) {
            vm.stopPrank();

            uint256 treasuryAfter = IERC20Like(gDollar).balanceOf(treasury);
            totalFeesCollected += (treasuryAfter - treasuryBefore);
            totalSellOutputG += out;
            tradeCount++;
        } catch {
            vm.stopPrank();
        }
    }

    function addLiq(uint128 _amountSeed) external {
        uint256 amount = bound(uint256(_amountSeed), 1 ether, 100_000 ether);

        uint256 bal = IERC20Like(gDollar).balanceOf(lp);
        if (bal < amount) return;

        vm.startPrank(lp);
        IERC20Like(gDollar).approve(address(amm), amount);
        try amm.addLiquidity("AAPL", amount) {
            vm.stopPrank();
        } catch {
            vm.stopPrank();
        }
    }

    function removeLiq(uint128 _sharesSeed) external {
        uint256 lpSharesHeld = amm.lpShares(poolKey, lp);
        if (lpSharesHeld == 0) return;

        uint256 shares = bound(uint256(_sharesSeed), 1, lpSharesHeld);

        vm.prank(lp);
        try amm.removeLiquidity("AAPL", shares) {} catch {}
    }

    function nudgePrice(uint128 _priceSeed) external {
        uint256 maxDev = (currentOraclePrice * 500) / 10_000; // 5%
        uint256 lo = currentOraclePrice > maxDev ? currentOraclePrice - maxDev : 1_000_000;
        uint256 hi = currentOraclePrice + maxDev;
        uint256 newPrice = bound(uint256(_priceSeed), lo, hi);

        vm.prank(admin);
        oracle.setManualPrice("AAPL", newPrice, true);
        currentOraclePrice = newPrice;
    }
}

interface IERC20Like {
    function balanceOf(address) external view returns (uint256);
    function approve(address, uint256) external returns (bool);
    function allowance(address, address) external view returns (uint256);
}
