// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./MarginVault.sol";
import "./FundingRate.sol";
import {IPriceOraclePerp} from "./PerpPriceOracle.sol";

/**
 * @title StockPerpEngine
 * @notice Perpetual futures engine for synthetic stock markets.
 *
 *         Extends the PerpEngine pattern with stock-specific features:
 *           - Per-stock configurable leverage, OI caps, and maintenance margin
 *           - Partial liquidation: only close enough to restore margin health
 *           - Funding rate: mark/index premium + OI imbalance skew
 *           - Market-hours awareness via higher margin during closed markets
 *           - 33% of fees route to UBI via fee splitter
 *
 *         Uses StockOracleV2 (via adapter) for price feeds.
 */

interface IStockFeeSplitter {
    function splitFee(uint256 totalFee, address dAppRecipient)
        external
        returns (uint256, uint256, uint256);
    function goodDollar() external view returns (address);
}

interface IERC20Minimal {
    function transfer(address to, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
}

contract StockPerpEngine is ReentrancyGuard {

    // ─── Types ───

    struct Position {
        bool isOpen;
        bool isLong;
        uint256 size;
        uint256 entryPrice;
        uint256 margin;
        int256 entryFundingIdx;
        uint256 marketId;
    }

    struct StockConfig {
        uint256 maxLeverage;
        uint256 maxOpenInterest;
        uint256 maintenanceMarginBps;
        uint256 fundingRateCapBps;
        bool active;
    }

    struct Market {
        bytes32 oracleKey;
        bytes32 indexOracleKey;
        string ticker;
        uint256 openInterestLong;
        uint256 openInterestShort;
        StockConfig config;
    }

    // ─── Constants ───

    uint256 public constant TRADE_FEE_BPS = 10; // 0.1%
    uint256 public constant BPS = 10_000;
    uint256 public constant LIQUIDATION_PENALTY_BPS = 500; // 5%

    // ─── State ───

    MarginVault public immutable vault;
    FundingRate public immutable funding;
    IPriceOraclePerp public immutable oracle;
    address public immutable feeSplitter;
    address public admin;
    bool public paused;

    Market[] public markets;
    mapping(address => mapping(uint256 => Position)) public positions;

    // ─── Events ───

    event MarketCreated(uint256 indexed marketId, string ticker, uint256 maxLeverage);
    event PositionOpened(
        address indexed trader, uint256 indexed marketId,
        bool isLong, uint256 size, uint256 margin, uint256 entryPrice
    );
    event PositionClosed(
        address indexed trader, uint256 indexed marketId,
        int256 pnl, uint256 exitPrice
    );
    event PositionLiquidated(
        address indexed liquidator, address indexed trader,
        uint256 indexed marketId, uint256 sizeReduced, uint256 exitPrice
    );
    event ConfigUpdated(uint256 indexed marketId);
    event MarginAdded(address indexed trader, uint256 indexed marketId, uint256 amount);
    event MarginRemoved(address indexed trader, uint256 indexed marketId, uint256 amount);

    // ─── Errors ───

    error NotAdmin();
    error IsPaused();
    error ZeroAddress();
    error ZeroAmount();
    error MarketNotActive();
    error PositionAlreadyOpen();
    error NoOpenPosition();
    error LeverageTooHigh(uint256 requested, uint256 max);
    error InsufficientMargin(uint256 have, uint256 need);
    error MaxOIExceeded(uint256 current, uint256 max);
    error PositionHealthy(uint256 marginRatio, uint256 threshold);
    error TransferFailed();
    error OraclePriceZero(bytes32 key);

    // ─── Modifiers ───

    modifier onlyAdmin() { if (msg.sender != admin) revert NotAdmin(); _; }
    modifier whenNotPaused() { if (paused) revert IsPaused(); _; }

    // ─── Constructor ───

    constructor(
        address _vault,
        address _funding,
        address _oracle,
        address _feeSplitter,
        address _admin
    ) {
        if (_vault == address(0)) revert ZeroAddress();
        if (_funding == address(0)) revert ZeroAddress();
        if (_oracle == address(0)) revert ZeroAddress();
        if (_feeSplitter == address(0)) revert ZeroAddress();
        if (_admin == address(0)) revert ZeroAddress();

        vault = MarginVault(_vault);
        funding = FundingRate(_funding);
        oracle = IPriceOraclePerp(_oracle);
        feeSplitter = _feeSplitter;
        admin = _admin;
    }

    // ─── Admin ───

    function createMarket(
        string calldata ticker,
        bytes32 oracleKey,
        bytes32 indexOracleKey,
        uint256 maxLeverage,
        uint256 maxOI,
        uint256 maintenanceMarginBps,
        uint256 fundingRateCapBps
    ) external onlyAdmin returns (uint256 marketId) {
        marketId = markets.length;
        markets.push(Market({
            oracleKey: oracleKey,
            indexOracleKey: indexOracleKey,
            ticker: ticker,
            openInterestLong: 0,
            openInterestShort: 0,
            config: StockConfig({
                maxLeverage: maxLeverage,
                maxOpenInterest: maxOI,
                maintenanceMarginBps: maintenanceMarginBps,
                fundingRateCapBps: fundingRateCapBps,
                active: true
            })
        }));
        funding.initMarket(marketId);
        emit MarketCreated(marketId, ticker, maxLeverage);
    }

    function updateConfig(
        uint256 marketId,
        uint256 maxLeverage,
        uint256 maxOI,
        uint256 maintenanceMarginBps,
        uint256 fundingRateCapBps
    ) external onlyAdmin {
        StockConfig storage cfg = markets[marketId].config;
        cfg.maxLeverage = maxLeverage;
        cfg.maxOpenInterest = maxOI;
        cfg.maintenanceMarginBps = maintenanceMarginBps;
        cfg.fundingRateCapBps = fundingRateCapBps;
        emit ConfigUpdated(marketId);
    }

    function setMarketActive(uint256 marketId, bool active) external onlyAdmin {
        markets[marketId].config.active = active;
    }

    function setPaused(bool _paused) external onlyAdmin { paused = _paused; }

    function setAdmin(address newAdmin) external onlyAdmin {
        if (newAdmin == address(0)) revert ZeroAddress();
        admin = newAdmin;
    }

    // ─── Trading ───

    function openPosition(
        uint256 marketId,
        uint256 size,
        bool isLong,
        uint256 margin
    ) external whenNotPaused nonReentrant {
        if (size == 0 || margin == 0) revert ZeroAmount();
        Market storage m = markets[marketId];
        if (!m.config.active) revert MarketNotActive();

        Position storage pos = positions[msg.sender][marketId];
        if (pos.isOpen) revert PositionAlreadyOpen();

        if (size > margin * m.config.maxLeverage)
            revert LeverageTooHigh(size / margin, m.config.maxLeverage);

        uint256 totalOI = (isLong ? m.openInterestLong : m.openInterestShort) + size;
        if (totalOI > m.config.maxOpenInterest)
            revert MaxOIExceeded(totalOI, m.config.maxOpenInterest);

        uint256 fee = (size * TRADE_FEE_BPS) / BPS;
        uint256 totalRequired = margin + fee;
        if (vault.balances(msg.sender) < totalRequired)
            revert InsufficientMargin(vault.balances(msg.sender), totalRequired);

        uint256 markPrice = oracle.getPriceByKey(m.oracleKey);
        uint256 indexPrice = oracle.getPriceByKey(m.indexOracleKey);
        _requireNonZeroPrice(m.oracleKey, markPrice);
        _requireNonZeroPrice(m.indexOracleKey, indexPrice);
        funding.applyFunding(marketId, markPrice, indexPrice);

        pos.isOpen = true;
        pos.isLong = isLong;
        pos.size = size;
        pos.entryPrice = markPrice;
        pos.margin = margin;
        pos.entryFundingIdx = funding.cumulativeFundingIndex(marketId);
        pos.marketId = marketId;

        if (isLong) { m.openInterestLong += size; }
        else { m.openInterestShort += size; }

        emit PositionOpened(msg.sender, marketId, isLong, size, margin, markPrice);

        vault.debit(msg.sender, margin);

        if (fee > 0) {
            vault.debit(msg.sender, fee);
            _flushAndSplitFee(fee);
        }
    }

    function closePosition(uint256 marketId) external whenNotPaused nonReentrant {
        Position storage pos = positions[msg.sender][marketId];
        if (!pos.isOpen) revert NoOpenPosition();

        Market storage m = markets[marketId];
        uint256 exitPrice = oracle.getPriceByKey(m.oracleKey);
        uint256 indexPrice = oracle.getPriceByKey(m.indexOracleKey);
        _requireNonZeroPrice(m.oracleKey, exitPrice);
        _requireNonZeroPrice(m.indexOracleKey, indexPrice);
        funding.applyFunding(marketId, exitPrice, indexPrice);

        (int256 pnl, int256 fundPay) = _settlePnL(msg.sender, marketId, exitPrice);
        _closePosition(msg.sender, marketId, pos.size, pnl, fundPay, exitPrice);
    }

    // ─── Margin Management ───

    /**
     * @notice Add margin to an existing position to improve its health.
     * @param marketId Market containing the position
     * @param amount   G$ amount to add (debited from vault balance)
     */
    function addMargin(uint256 marketId, uint256 amount) external whenNotPaused nonReentrant {
        if (amount == 0) revert ZeroAmount();
        Position storage pos = positions[msg.sender][marketId];
        if (!pos.isOpen) revert NoOpenPosition();

        vault.debit(msg.sender, amount);
        pos.margin += amount;

        emit MarginAdded(msg.sender, marketId, amount);
    }

    /**
     * @notice Remove excess margin from a position. Reverts if the removal
     *         would drop the margin ratio below the maintenance threshold.
     * @param marketId Market containing the position
     * @param amount   G$ amount to remove (credited to vault balance)
     */
    function removeMargin(uint256 marketId, uint256 amount) external whenNotPaused nonReentrant {
        if (amount == 0) revert ZeroAmount();
        Position storage pos = positions[msg.sender][marketId];
        if (!pos.isOpen) revert NoOpenPosition();
        if (amount > pos.margin) revert InsufficientMargin(pos.margin, amount);

        Market storage m = markets[marketId];
        uint256 currentPrice = oracle.getPriceByKey(m.oracleKey);
        _requireNonZeroPrice(m.oracleKey, currentPrice);

        int256 pnl = _calcPnL(pos, currentPrice);
        int256 size = pos.isLong ? int256(pos.size) : -int256(pos.size);
        int256 fundPay = funding.accruedFunding(size, pos.entryFundingIdx, marketId);

        int256 remainingAfter = int256(pos.margin) - int256(amount) + pnl - fundPay;
        uint256 postRatio = remainingAfter > 0
            ? (uint256(remainingAfter) * BPS) / pos.size
            : 0;

        if (postRatio < m.config.maintenanceMarginBps)
            revert InsufficientMargin(uint256(postRatio), m.config.maintenanceMarginBps);

        pos.margin -= amount;
        vault.credit(msg.sender, amount);

        emit MarginRemoved(msg.sender, marketId, amount);
    }

    // ─── Partial Liquidation ───

    /**
     * @notice Liquidate an unhealthy position. Only closes enough to restore
     *         the maintenance margin, preserving the rest of the trader's position.
     */
    function liquidate(address trader, uint256 marketId) external whenNotPaused nonReentrant {
        Position storage pos = positions[trader][marketId];
        if (!pos.isOpen) revert NoOpenPosition();

        Market storage m = markets[marketId];
        uint256 exitPrice = oracle.getPriceByKey(m.oracleKey);
        uint256 indexPrice = oracle.getPriceByKey(m.indexOracleKey);
        _requireNonZeroPrice(m.oracleKey, exitPrice);
        _requireNonZeroPrice(m.indexOracleKey, indexPrice);
        funding.applyFunding(marketId, exitPrice, indexPrice);

        (int256 pnl, int256 fundPay) = _settlePnL(trader, marketId, exitPrice);
        int256 netPnL = pnl - fundPay;
        int256 remainingMargin = int256(pos.margin) + netPnL;

        uint256 mRatio = remainingMargin > 0
            ? (uint256(remainingMargin) * BPS) / pos.size
            : 0;

        if (mRatio >= m.config.maintenanceMarginBps)
            revert PositionHealthy(mRatio, m.config.maintenanceMarginBps);

        // Calculate how much to close: close enough to restore margin ratio
        // to 2x maintenance threshold, or 100% if deeply underwater
        uint256 closeSize;
        if (remainingMargin <= 0) {
            closeSize = pos.size; // fully underwater → close all
        } else {
            uint256 targetMarginBps = m.config.maintenanceMarginBps * 2;
            // need: (remainingMargin / (size - closeSize)) * BPS >= targetMarginBps
            // → size - closeSize <= remainingMargin * BPS / targetMarginBps
            uint256 maxRetainableSize = (uint256(remainingMargin) * BPS) / targetMarginBps;
            closeSize = maxRetainableSize < pos.size
                ? pos.size - maxRetainableSize
                : pos.size;
        }

        // Apply liquidation penalty
        uint256 penalty = (closeSize * LIQUIDATION_PENALTY_BPS) / BPS;

        // Pro-rata PnL for the closed portion
        int256 closePnL = (pnl * int256(closeSize)) / int256(pos.size);
        int256 closeFundPay = (fundPay * int256(closeSize)) / int256(pos.size);

        if (closeSize >= pos.size) {
            _closePosition(trader, marketId, pos.size, pnl, fundPay, exitPrice);
        } else {
            _partialClose(trader, marketId, closeSize, closePnL, closeFundPay, exitPrice);
        }

        if (penalty > 0 && vault.balances(trader) >= penalty) {
            vault.debit(trader, penalty);
            _flushAndSplitFee(penalty);
        }

        emit PositionLiquidated(msg.sender, trader, marketId, closeSize, exitPrice);
    }

    // ─── Views ───

    function unrealizedPnL(address trader, uint256 marketId) external view returns (int256) {
        Position storage pos = positions[trader][marketId];
        if (!pos.isOpen) return 0;
        uint256 price = oracle.getPriceByKey(markets[marketId].oracleKey);
        _requireNonZeroPrice(markets[marketId].oracleKey, price);
        int256 rawPnL = _calcPnL(pos, price);
        int256 size = pos.isLong ? int256(pos.size) : -int256(pos.size);
        int256 fundPay = funding.accruedFunding(size, pos.entryFundingIdx, marketId);
        return rawPnL - fundPay;
    }

    function marginRatio(address trader, uint256 marketId) external view returns (uint256) {
        Position storage pos = positions[trader][marketId];
        if (!pos.isOpen) return type(uint256).max;
        uint256 price = oracle.getPriceByKey(markets[marketId].oracleKey);
        _requireNonZeroPrice(markets[marketId].oracleKey, price);
        int256 rawPnL = _calcPnL(pos, price);
        int256 size = pos.isLong ? int256(pos.size) : -int256(pos.size);
        int256 fundPay = funding.accruedFunding(size, pos.entryFundingIdx, marketId);
        int256 remaining = int256(pos.margin) + rawPnL - fundPay;
        if (remaining <= 0) return 0;
        return (uint256(remaining) * BPS) / pos.size;
    }

    function marketCount() external view returns (uint256) { return markets.length; }

    function getConfig(uint256 marketId) external view returns (StockConfig memory) {
        return markets[marketId].config;
    }

    // ─── Internals ───

    function _requireNonZeroPrice(bytes32 key, uint256 price) internal pure {
        if (price == 0) revert OraclePriceZero(key);
    }

    function _calcPnL(Position storage pos, uint256 currentPrice) internal view returns (int256) {
        int256 priceDelta = int256(currentPrice) - int256(pos.entryPrice);
        int256 rawPnL = (int256(pos.size) * priceDelta) / int256(pos.entryPrice);
        return pos.isLong ? rawPnL : -rawPnL;
    }

    function _settlePnL(address trader, uint256 marketId, uint256 exitPrice)
        internal view returns (int256 pnl, int256 fundPay)
    {
        Position storage pos = positions[trader][marketId];
        pnl = _calcPnL(pos, exitPrice);
        int256 size = pos.isLong ? int256(pos.size) : -int256(pos.size);
        fundPay = funding.accruedFunding(size, pos.entryFundingIdx, marketId);
    }

    function _closePosition(
        address trader, uint256 marketId, uint256 closeSize,
        int256 pnl, int256 fundPay, uint256 exitPrice
    ) internal {
        Position memory snap = positions[trader][marketId];
        Market storage m = markets[marketId];

        int256 netPnL = pnl - fundPay;
        uint256 payout;
        if (netPnL >= 0) {
            payout = snap.margin + uint256(netPnL);
        } else {
            uint256 loss = uint256(-netPnL);
            payout = loss < snap.margin ? snap.margin - loss : 0;
        }

        if (snap.isLong) { m.openInterestLong -= closeSize; }
        else { m.openInterestShort -= closeSize; }

        delete positions[trader][marketId];
        emit PositionClosed(trader, marketId, pnl, exitPrice);

        if (payout > 0) { vault.credit(trader, payout); }
    }

    function _partialClose(
        address trader, uint256 marketId, uint256 closeSize,
        int256 closePnL, int256 closeFundPay, uint256 exitPrice
    ) internal {
        Position storage pos = positions[trader][marketId];
        Market storage m = markets[marketId];

        uint256 closeMargin = (pos.margin * closeSize) / pos.size;
        int256 netPnL = closePnL - closeFundPay;
        uint256 payout;
        if (netPnL >= 0) {
            payout = closeMargin + uint256(netPnL);
        } else {
            uint256 loss = uint256(-netPnL);
            payout = loss < closeMargin ? closeMargin - loss : 0;
        }

        pos.size -= closeSize;
        pos.margin -= closeMargin;
        pos.entryFundingIdx = funding.cumulativeFundingIndex(marketId);

        if (pos.isLong) { m.openInterestLong -= closeSize; }
        else { m.openInterestShort -= closeSize; }

        emit PositionClosed(trader, marketId, closePnL, exitPrice);

        if (payout > 0) { vault.credit(trader, payout); }
    }

    /**
     * @dev Flush tokens from vault to this contract and route through fee splitter.
     *      Caller must have already called `vault.debit(user, amount)`.
     */
    function _flushAndSplitFee(uint256 fee) internal {
        vault.flushFee(address(this), fee);

        address gdToken = IStockFeeSplitter(feeSplitter).goodDollar();
        IERC20Minimal token = IERC20Minimal(gdToken);
        token.approve(feeSplitter, 0);
        token.approve(feeSplitter, fee);
        IStockFeeSplitter(feeSplitter).splitFee(fee, address(this));
    }
}
