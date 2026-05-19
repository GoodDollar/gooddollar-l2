// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title StockLendOracleAdapter
 * @notice Bridges StockOracleV2 (bytes32 symbol → price8) to GoodLendPool's
 *         IPriceOracle interface (address asset → uint256 price).
 *
 *         Also provides session-aware pricing: during closed/halted markets,
 *         applies a haircut to the last known price so that collateral
 *         valuations are more conservative when gap risk is elevated.
 */

interface IStockOracleV2 {
    enum SessionState { Open, PreMarket, AfterHours, Closed, Halted }

    struct PriceData {
        uint256 price8;
        uint256 timestamp;
        SessionState session;
        uint8 confidence;
        uint8 signerCount;
    }

    function prices(bytes32 h) external view returns (
        uint256 price8,
        uint256 timestamp,
        SessionState session,
        uint8 confidence,
        uint8 signerCount
    );

    function symbolConfigs(bytes32 h) external view returns (
        uint256 maxStalenessSeconds,
        uint256 maxDeviationBps,
        bool active
    );
}

contract StockLendOracleAdapter {

    uint256 public constant BPS = 10_000;

    IStockOracleV2 public immutable stockOracle;
    address public admin;

    /// @notice token address → oracle symbol hash
    mapping(address => bytes32) public tokenSymbols;

    /// @notice Haircut applied during closed/halted markets (default 10% = 9000 bps)
    uint256 public closedMarketHaircutBps = 9000;

    /// @notice Haircut during pre-market / after-hours (default 5% = 9500 bps)
    uint256 public extendedHoursHaircutBps = 9500;

    /// @notice Maximum staleness allowed for lending (more conservative than trading)
    uint256 public maxLendStaleness = 300; // 5 minutes

    event TokenMapped(address indexed token, bytes32 indexed symbolHash);
    event TokenRemoved(address indexed token);
    event HaircutUpdated(uint256 closedBps, uint256 extendedBps);
    event StalenessUpdated(uint256 newMaxStaleness);

    error NotAdmin();
    error ZeroAddress();
    error TokenNotMapped(address token);
    error StalePrice(address token, uint256 age, uint256 max);
    error ZeroPrice(address token);
    error MarketHalted(address token);

    modifier onlyAdmin() {
        if (msg.sender != admin) revert NotAdmin();
        _;
    }

    constructor(address _stockOracle, address _admin) {
        if (_stockOracle == address(0) || _admin == address(0)) revert ZeroAddress();
        stockOracle = IStockOracleV2(_stockOracle);
        admin = _admin;
    }

    // ─── Admin ───────────────────────────────────────────────────

    function mapToken(address token, bytes32 symbolHash) external onlyAdmin {
        if (token == address(0)) revert ZeroAddress();
        tokenSymbols[token] = symbolHash;
        emit TokenMapped(token, symbolHash);
    }

    function removeToken(address token) external onlyAdmin {
        delete tokenSymbols[token];
        emit TokenRemoved(token);
    }

    function setHaircuts(uint256 closedBps, uint256 extendedBps) external onlyAdmin {
        closedMarketHaircutBps = closedBps;
        extendedHoursHaircutBps = extendedBps;
        emit HaircutUpdated(closedBps, extendedBps);
    }

    function setMaxLendStaleness(uint256 _seconds) external onlyAdmin {
        maxLendStaleness = _seconds;
        emit StalenessUpdated(_seconds);
    }

    function setAdmin(address _admin) external onlyAdmin {
        if (_admin == address(0)) revert ZeroAddress();
        admin = _admin;
    }

    // ─── IPriceOracle interface ──────────────────────────────────

    /**
     * @notice Returns the session-adjusted price for a stock token.
     *         Implements GoodLendPool's IPriceOracle.getAssetPrice(address).
     * @dev    Returns price in 8 decimals (same as StockOracleV2).
     *         During closed/halted markets, applies a haircut.
     */
    function getAssetPrice(address asset) external view returns (uint256) {
        bytes32 symbolHash = tokenSymbols[asset];
        if (symbolHash == bytes32(0)) revert TokenNotMapped(asset);

        (
            uint256 price8,
            uint256 timestamp,
            IStockOracleV2.SessionState session,
            ,
        ) = stockOracle.prices(symbolHash);

        if (price8 == 0) revert ZeroPrice(asset);

        if (session == IStockOracleV2.SessionState.Halted) revert MarketHalted(asset);

        uint256 age = block.timestamp - timestamp;
        if (age > maxLendStaleness) revert StalePrice(asset, age, maxLendStaleness);

        return _applySessionHaircut(price8, session);
    }

    /**
     * @notice Returns the raw (unhaircut) price — for informational use.
     */
    function getRawPrice(address asset) external view returns (uint256 price8, IStockOracleV2.SessionState session) {
        bytes32 symbolHash = tokenSymbols[asset];
        if (symbolHash == bytes32(0)) revert TokenNotMapped(asset);

        (price8, , session, , ) = stockOracle.prices(symbolHash);
    }

    // ─── Internal ────────────────────────────────────────────────

    function _applySessionHaircut(
        uint256 price8,
        IStockOracleV2.SessionState session
    ) internal view returns (uint256) {
        if (session == IStockOracleV2.SessionState.Open) {
            return price8;
        }
        if (session == IStockOracleV2.SessionState.PreMarket ||
            session == IStockOracleV2.SessionState.AfterHours) {
            return (price8 * extendedHoursHaircutBps) / BPS;
        }
        // Closed
        return (price8 * closedMarketHaircutBps) / BPS;
    }
}
