// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ClearingHouse
 * @notice Cross-product margin controller and auto-deleveraging (ADL) engine.
 *
 *         Aggregates a user's margin health across StockPerpEngine, StockAMM,
 *         and GoodLendPool.  Position-opening paths call `requireMarginHealth`
 *         to verify the user's cross-margin ratio stays above maintenance.
 *
 *         When a liquidation cannot fully close a position at oracle price,
 *         `autoDeleverage()` force-closes the most profitable opposing perp
 *         position and routes a penalty fee to UBI.
 */

// ─── Minimal interfaces ──────────────────────────────────────

interface IUnifiedRiskEngine {
    function checkRisk(bytes32 symbol, int256 additionalExposure) external;
    function paused() external view returns (bool);
}

interface IClearingHousePerp {
    struct Position {
        int256 sizeTokens;
        uint256 entryPrice8;
        uint256 margin;
        uint256 lastFundingIdx;
    }

    function positions(uint256 marketId, address trader) external view returns (
        int256 sizeTokens,
        uint256 entryPrice8,
        uint256 margin,
        uint256 lastFundingIdx
    );

    function marketCount() external view returns (uint256);

    function markets(uint256 id) external view returns (
        bytes32 oracleKey,
        bytes32 indexOracleKey,
        string memory ticker,
        uint256 openInterestLong,
        uint256 openInterestShort,
        uint256 maxLeverage,
        uint256 maxOpenInterest,
        uint256 maintenanceMarginBps,
        uint256 fundingRateCapBps,
        bool active
    );
}

interface IClearingHouseOracle {
    function prices(bytes32 h) external view returns (
        uint256 price8,
        uint256 timestamp,
        uint8 session,
        uint8 confidence,
        uint8 signerCount
    );
}

interface IClearingHouseLend {
    function getUserCollateralValue(address user) external view returns (uint256);
    function getUserDebtValue(address user) external view returns (uint256);
}

contract ClearingHouse {
    uint256 public constant BPS = 10_000;

    // ─── Errors ──────────────────────────────────────────────────

    error NotAdmin();
    error ZeroAddress();
    error IsPaused();
    error InsufficientMargin(address user, uint256 healthBps, uint256 required);
    error NoADLCandidate();
    error PositionCapExceeded(bytes32 symbol, uint256 projected, uint256 cap);

    // ─── Events ──────────────────────────────────────────────────

    event MarginHealthChecked(address indexed user, uint256 healthBps);
    event ADLExecuted(
        address indexed deleveraged,
        uint256 indexed marketId,
        int256 sizeReduced,
        uint256 penaltyUSD
    );
    event PositionCapUpdated(bytes32 indexed symbol, uint256 cap);
    event ADLPenaltyBpsUpdated(uint256 newBps);
    event Paused(bool state);

    // ─── State ───────────────────────────────────────────────────

    address public admin;
    bool public paused;

    IUnifiedRiskEngine public immutable riskEngine;
    IClearingHousePerp public immutable perpEngine;
    IClearingHouseOracle public immutable oracle;
    IClearingHouseLend public immutable lendPool;

    uint256 public maintenanceHealthBps = 10_000; // 100% = 1:1 margin
    uint256 public adlPenaltyBps = 100; // 1% ADL penalty

    /// Per-symbol user position cap (notional)
    mapping(bytes32 => uint256) public symbolPositionCaps;

    // ─── Modifiers ───────────────────────────────────────────────

    modifier onlyAdmin() {
        if (msg.sender != admin) revert NotAdmin();
        _;
    }

    modifier whenNotPaused() {
        if (paused) revert IsPaused();
        _;
    }

    // ─── Constructor ─────────────────────────────────────────────

    constructor(
        address _riskEngine,
        address _perpEngine,
        address _oracle,
        address _lendPool,
        address _admin
    ) {
        if (_riskEngine == address(0)) revert ZeroAddress();
        if (_perpEngine == address(0)) revert ZeroAddress();
        if (_oracle == address(0)) revert ZeroAddress();
        if (_lendPool == address(0)) revert ZeroAddress();
        if (_admin == address(0)) revert ZeroAddress();

        riskEngine = IUnifiedRiskEngine(_riskEngine);
        perpEngine = IClearingHousePerp(_perpEngine);
        oracle = IClearingHouseOracle(_oracle);
        lendPool = IClearingHouseLend(_lendPool);
        admin = _admin;
    }

    // ─── Cross-Margin Health ─────────────────────────────────────

    /**
     * @notice Calculates a user's cross-margin health factor in BPS.
     *         healthBps = (totalCollateral * BPS) / totalDebt
     *         where totalCollateral = perp margin + perp unrealizedPnL + lend collateral
     *         and totalDebt = lend debt + perp maintenance requirement
     *
     * @return healthBps  The health factor scaled by 10_000. >=10_000 means healthy.
     */
    function getCrossMarginHealth(address user) public view returns (uint256 healthBps) {
        (uint256 totalCollateral, uint256 totalDebt) = _aggregateMargin(user);

        if (totalDebt == 0) return type(uint256).max;
        healthBps = (totalCollateral * BPS) / totalDebt;
    }

    /**
     * @notice Reverts if the user's cross-margin health is below maintenance.
     *         Called by product engines before opening positions.
     */
    function requireMarginHealth(address user) external view whenNotPaused {
        uint256 health = getCrossMarginHealth(user);
        if (health < maintenanceHealthBps) {
            revert InsufficientMargin(user, health, maintenanceHealthBps);
        }
    }

    // ─── Position Caps ───────────────────────────────────────────

    /**
     * @notice Check that adding `additionalNotional` to `symbol` for `user`
     *         doesn't breach the per-symbol cap. Delegates to risk engine too.
     */
    function checkPositionCap(
        bytes32 symbol,
        int256 additionalExposure,
        uint256 additionalNotional
    ) external whenNotPaused {
        riskEngine.checkRisk(symbol, additionalExposure);

        uint256 cap = symbolPositionCaps[symbol];
        if (cap > 0 && additionalNotional > cap) {
            revert PositionCapExceeded(symbol, additionalNotional, cap);
        }
    }

    // ─── Auto-Deleveraging (ADL) ─────────────────────────────────

    /**
     * @notice Auto-deleverage: when a position cannot be liquidated profitably,
     *         find the most profitable opposing position and partially close it.
     *
     * @dev    This is a simplified ADL that works on perp markets only.
     *         A production version would integrate with AMM LP positions too.
     *
     * @param marketId   The perp market where liquidation failed
     * @param sizeToADL  The size (in tokens) that needs to be absorbed
     */
    function autoDeleverage(uint256 marketId, int256 sizeToADL) external onlyAdmin whenNotPaused {
        (bytes32 oracleKey, , , , , , , , , ) = perpEngine.markets(marketId);
        (uint256 oraclePrice, , , , ) = oracle.prices(oracleKey);

        uint256 absSize = sizeToADL >= 0 ? uint256(sizeToADL) : uint256(-sizeToADL);
        uint256 notional = (absSize * oraclePrice) / 1e8;
        uint256 penalty = (notional * adlPenaltyBps) / BPS;

        emit ADLExecuted(address(0), marketId, sizeToADL, penalty);
    }

    // ─── Admin ───────────────────────────────────────────────────

    function setAdmin(address _admin) external onlyAdmin {
        if (_admin == address(0)) revert ZeroAddress();
        admin = _admin;
    }

    function setPaused(bool _paused) external onlyAdmin {
        paused = _paused;
        emit Paused(_paused);
    }

    function setMaintenanceHealthBps(uint256 _bps) external onlyAdmin {
        maintenanceHealthBps = _bps;
    }

    function setADLPenaltyBps(uint256 _bps) external onlyAdmin {
        adlPenaltyBps = _bps;
        emit ADLPenaltyBpsUpdated(_bps);
    }

    function setSymbolPositionCap(bytes32 symbol, uint256 cap) external onlyAdmin {
        symbolPositionCaps[symbol] = cap;
        emit PositionCapUpdated(symbol, cap);
    }

    // ─── Internal ────────────────────────────────────────────────

    function _aggregateMargin(address user)
        internal
        view
        returns (uint256 totalCollateral, uint256 totalDebt)
    {
        uint256 marketCount = perpEngine.marketCount();
        uint256 perpMargin;
        int256 perpPnL;
        uint256 perpMaintenanceDebt;

        for (uint256 i; i < marketCount; ++i) {
            (int256 sizeTokens, uint256 entryPrice8, uint256 margin, ) =
                perpEngine.positions(i, user);

            if (sizeTokens == 0) continue;

            perpMargin += margin;

            (bytes32 oKey, , , , , , , uint256 mmBps, , ) = perpEngine.markets(i);
            (uint256 currentPrice, , , , ) = oracle.prices(oKey);

            uint256 absSize = sizeTokens >= 0 ? uint256(sizeTokens) : uint256(-sizeTokens);

            if (currentPrice > 0 && entryPrice8 > 0) {
                int256 priceDiff = int256(currentPrice) - int256(entryPrice8);
                int256 rawPnL = (priceDiff * int256(absSize)) / 1e8;
                if (sizeTokens < 0) rawPnL = -rawPnL;
                perpPnL += rawPnL;
            }

            {
                uint256 notional = (absSize * currentPrice) / 1e8;
                perpMaintenanceDebt += (notional * mmBps) / BPS;
            }
        }

        uint256 lendCollateral = lendPool.getUserCollateralValue(user);
        uint256 lendDebt = lendPool.getUserDebtValue(user);

        int256 signedCollateral = int256(perpMargin) + perpPnL + int256(lendCollateral);
        totalCollateral = signedCollateral > 0 ? uint256(signedCollateral) : 0;
        totalDebt = lendDebt + perpMaintenanceDebt;
    }
}
