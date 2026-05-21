// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./StockOracleV2.sol";

/**
 * @title StockOracleV2Adapter
 * @notice Thin adapter that exposes the PriceOracle interface
 *         (getPrice + hasFeed) by delegating to StockOracleV2.
 *
 *         New CollateralVault deployments can point at this adapter
 *         since it matches the same function signatures as PriceOracle.
 */
contract StockOracleV2Adapter {
    StockOracleV2 public immutable oracleV2;
    address public admin;

    error ZeroAddress();
    error NotAdmin();
    error SymbolNotActive(bytes32 key);
    error PriceNotSet(bytes32 key);
    error PriceStale(bytes32 key, uint256 age, uint256 maxAge);
    error SessionHalted(bytes32 key);

    modifier onlyAdmin() {
        if (msg.sender != admin) revert NotAdmin();
        _;
    }

    constructor(address _oracleV2, address _admin) {
        if (_oracleV2 == address(0) || _admin == address(0)) revert ZeroAddress();
        oracleV2 = StockOracleV2(_oracleV2);
        admin = _admin;
    }

    /**
     * @notice Safe price read — reverts if stale, halted, or unregistered.
     *         Matches PriceOracle.getPrice(string) signature exactly.
     */
    function getPrice(string calldata ticker) external view returns (uint256) {
        return oracleV2.getPrice(ticker);
    }

    /**
     * @notice Unsafe read (no staleness/session checks) — returns 0 on failure.
     */
    function getPriceUnsafe(string calldata ticker) external view returns (uint256) {
        (uint256 price8,,,) = oracleV2.getPriceUnsafe(ticker);
        return price8;
    }

    /**
     * @notice Check if a symbol is registered and active.
     *         Matches PriceOracle.hasFeed(string) signature.
     */
    function hasFeed(string calldata ticker) external view returns (bool) {
        bytes32 h = keccak256(abi.encodePacked(ticker));
        (,, bool active) = oracleV2.symbolConfigs(h);
        return active;
    }

    /**
     * @notice bytes32-keyed price lookup matching the PriceOracle interface
     *         that CollateralVault expects. Reads directly from StockOracleV2's
     *         public prices mapping and applies staleness/session checks.
     */
    function getPriceByKey(bytes32 key) external view returns (uint256) {
        (uint256 maxStaleness,, bool active) = oracleV2.symbolConfigs(key);
        if (!active) revert SymbolNotActive(key);

        (uint256 price8, uint256 ts, StockOracleV2.SessionState session,,) = oracleV2.prices(key);
        if (price8 == 0) revert PriceNotSet(key);
        if (session == StockOracleV2.SessionState.Halted) revert SessionHalted(key);

        uint256 age = block.timestamp - ts;
        if (age > maxStaleness) revert PriceStale(key, age, maxStaleness);

        return price8;
    }

    function setAdmin(address newAdmin) external onlyAdmin {
        if (newAdmin == address(0)) revert ZeroAddress();
        admin = newAdmin;
    }
}
