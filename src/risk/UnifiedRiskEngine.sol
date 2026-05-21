// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title UnifiedRiskEngine
 * @notice Aggregates net user exposure per symbol across spot (synthetic
 *         supply), AMM inventory, and perp open interest.  Position-opening
 *         operations in StockAMM and StockPerpEngine call `checkRisk()` to
 *         enforce per-symbol and protocol-wide exposure caps.
 *
 * @dev    The engine is *read-only* with respect to positions — it queries
 *         other contracts for their current state rather than maintaining a
 *         redundant shadow ledger.
 */

// ─── Minimal external interfaces ────────────────────────────────

interface ISyntheticAsset {
    function totalSupply() external view returns (uint256);
}

interface ISyntheticAssetFactory {
    function assets(bytes32 key) external view returns (address);
    function listedCount() external view returns (uint256);
    function listedKeys(uint256 idx) external view returns (bytes32);
}

interface IStockAMM {
    function pools(bytes32 key) external view returns (
        address syntheticAsset,
        bytes32 oracleKey,
        uint256 gDollarReserve,
        uint256 syntheticReserve,
        uint256 totalLPShares,
        bool paused
    );
}

interface IStockPerpEngine {
    function marketCount() external view returns (uint256);
    // Auto-getter flattens the nested StockConfig struct into its components:
    // (oracleKey, indexOracleKey, ticker, openInterestLong, openInterestShort,
    //  maxLeverage, maxOpenInterest, maintenanceMarginBps, fundingRateCapBps, active)
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

contract UnifiedRiskEngine {
    // ─── Errors ─────────────────────────────────────────────────

    error NotAdmin();
    error ZeroAddress();
    error ExposureLimitExceeded(bytes32 symbol, uint256 current, uint256 cap);
    error ProtocolCapExceeded(uint256 current, uint256 cap);
    error SourceNotRegistered(address source);
    error IsPaused();

    // ─── Events ─────────────────────────────────────────────────

    event ExposureChanged(bytes32 indexed symbol, int256 netExposure, uint256 timestamp);
    event SymbolCapUpdated(bytes32 indexed symbol, uint256 cap);
    event ProtocolCapUpdated(uint256 cap);
    event ExposureSourceRegistered(address indexed source);
    event Paused(bool state);

    // ─── State ──────────────────────────────────────────────────

    address public admin;
    bool public paused;

    ISyntheticAssetFactory public immutable factory;
    IStockAMM public immutable amm;
    IStockPerpEngine public immutable perpEngine;

    /// per-symbol OI cap (in G$ notional / token units)
    mapping(bytes32 => uint256) public symbolCaps;

    /// protocol-wide aggregate exposure cap
    uint256 public protocolCap;

    /// whitelisted callers allowed to invoke `checkRisk`
    mapping(address => bool) public registeredSources;

    // ─── Modifiers ──────────────────────────────────────────────

    modifier onlyAdmin() {
        if (msg.sender != admin) revert NotAdmin();
        _;
    }

    modifier whenNotPaused() {
        if (paused) revert IsPaused();
        _;
    }

    // ─── Constructor ────────────────────────────────────────────

    constructor(
        address _factory,
        address _amm,
        address _perpEngine,
        uint256 _protocolCap,
        address _admin
    ) {
        if (_factory == address(0)) revert ZeroAddress();
        if (_amm == address(0)) revert ZeroAddress();
        if (_perpEngine == address(0)) revert ZeroAddress();
        if (_admin == address(0)) revert ZeroAddress();

        factory = ISyntheticAssetFactory(_factory);
        amm = IStockAMM(_amm);
        perpEngine = IStockPerpEngine(_perpEngine);
        protocolCap = _protocolCap;
        admin = _admin;
    }

    // ─── Risk gate (called by AMM / PerpEngine before position open) ──

    /**
     * @notice Pre-trade risk check.  Reverts if accepting the new
     *         `additionalExposure` for `symbol` would breach limits.
     * @param symbol        keccak256(ticker)
     * @param additionalExposure  signed delta in token-unit terms
     *                            (>0 for new longs, <0 for new shorts)
     */
    function checkRisk(
        bytes32 symbol,
        int256 additionalExposure
    ) external whenNotPaused {
        int256 currentNet = getNetExposure(symbol);
        int256 projected = currentNet + additionalExposure;

        uint256 absProjected = projected >= 0 ? uint256(projected) : uint256(-projected);

        uint256 cap = symbolCaps[symbol];
        if (cap > 0 && absProjected > cap) {
            revert ExposureLimitExceeded(symbol, absProjected, cap);
        }

        if (protocolCap > 0) {
            uint256 totalAbs = _totalAbsExposure() + absProjected;
            if (totalAbs > protocolCap) {
                revert ProtocolCapExceeded(totalAbs, protocolCap);
            }
        }

        emit ExposureChanged(symbol, projected, block.timestamp);
    }

    // ─── Exposure queries ───────────────────────────────────────

    /**
     * @notice Net user exposure for a single symbol:
     *         + synthetic totalSupply (minted by users)
     *         + perp OI long − OI short
     *         − AMM synthetic reserve (pool holds these, not users)
     * @dev    Positive = users are net long, protocol is net short.
     */
    function getNetExposure(bytes32 symbol) public view returns (int256) {
        int256 spotExposure = _spotExposure(symbol);
        int256 perpExposure = _perpExposure(symbol);
        return spotExposure + perpExposure;
    }

    /**
     * @return Absolute sum of net exposure across all listed symbols.
     */
    function totalAbsExposure() external view returns (uint256) {
        return _totalAbsExposure();
    }

    // ─── Admin ──────────────────────────────────────────────────

    function setAdmin(address _admin) external onlyAdmin {
        if (_admin == address(0)) revert ZeroAddress();
        admin = _admin;
    }

    function setPaused(bool _paused) external onlyAdmin {
        paused = _paused;
        emit Paused(_paused);
    }

    function setSymbolCap(bytes32 symbol, uint256 cap) external onlyAdmin {
        symbolCaps[symbol] = cap;
        emit SymbolCapUpdated(symbol, cap);
    }

    function setProtocolCap(uint256 cap) external onlyAdmin {
        protocolCap = cap;
        emit ProtocolCapUpdated(cap);
    }

    function registerSource(address source) external onlyAdmin {
        if (source == address(0)) revert ZeroAddress();
        registeredSources[source] = true;
        emit ExposureSourceRegistered(source);
    }

    // ─── Internal helpers ───────────────────────────────────────

    /**
     * Spot exposure: totalSupply of synthetic minus what the AMM pool holds.
     * Users minted totalSupply, some of which sits in the AMM pool.
     * Net user-held = totalSupply − ammSyntheticReserve.
     */
    function _spotExposure(bytes32 symbol) internal view returns (int256) {
        address asset = factory.assets(symbol);
        if (asset == address(0)) return 0;

        uint256 totalSupply = ISyntheticAsset(asset).totalSupply();

        (, , , uint256 syntheticReserve, , ) = amm.pools(symbol);

        return int256(totalSupply) - int256(syntheticReserve);
    }

    /**
     * Perp exposure: OI long − OI short for matching symbol.
     * Iterates perp markets to find matching oracleKey prefix.
     */
    function _perpExposure(bytes32 symbol) internal view returns (int256) {
        uint256 count = perpEngine.marketCount();
        int256 net;
        for (uint256 i; i < count; ++i) {
            (bytes32 oKey, , , uint256 oiLong, uint256 oiShort, , , , , ) = perpEngine.markets(i);
            if (oKey == symbol) {
                net += int256(oiLong) - int256(oiShort);
            }
        }
        return net;
    }

    function _totalAbsExposure() internal view returns (uint256) {
        uint256 total;
        uint256 count = factory.listedCount();
        for (uint256 i; i < count; ++i) {
            bytes32 key = factory.listedKeys(i);
            int256 net = getNetExposure(key);
            total += net >= 0 ? uint256(net) : uint256(-net);
        }
        return total;
    }
}
