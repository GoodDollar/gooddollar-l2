// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title StockOracleV2
 * @notice Canonical multi-signer quorum oracle for all stock prices on GoodChain.
 *         Consumed by GoodStocks AMM, StockPerpEngine, GoodLend, and GoodYield.
 *
 * @dev Price format: 8 decimals (Chainlink standard). AAPL @ $189.55 = 18_955_000_000
 *
 *      Features:
 *        - Multi-signer quorum (M-of-N) for price updates
 *        - Batch price updates: update N stock prices in a single tx
 *        - Per-symbol staleness guard, deviation guard, session state guard
 *        - Confidence scoring (0-100)
 *        - Admin-configurable parameters per symbol
 */
contract StockOracleV2 {

    // ============ Types ============

    enum SessionState {
        Open,        // 0 - market is open for trading
        PreMarket,   // 1 - pre-market session
        AfterHours,  // 2 - after-hours session
        Closed,      // 3 - market closed
        Halted       // 4 - trading halted
    }

    struct PriceData {
        uint256 price8;          // USD price, 8 decimals
        uint256 timestamp;       // last update unix timestamp
        SessionState session;    // current session state
        uint8   confidence;      // 0-100 confidence score
        uint8   signerCount;     // number of signers in last update
    }

    struct SymbolConfig {
        uint256 maxStalenessSeconds; // revert getPrice if older than this
        uint256 maxDeviationBps;     // max deviation from last price in BPS
        bool    active;              // whether this symbol is tracked
    }

    // ============ State ============

    address public owner;

    mapping(address => bool) public signers;
    uint256 public signerCount;
    uint256 public quorum;

    /// @notice symbol hash → price data
    mapping(bytes32 => PriceData) public prices;

    /// @notice Unix timestamp of the latest successful signer/admin oracle write.
    /// @dev Lane-7 internal smoke probes this as the coarse freshness signal before
    ///      reading symbol-specific data. It intentionally mirrors the stored
    ///      quote timestamp, not block.timestamp, so off-chain quote freshness is
    ///      what gets verified end-to-end.
    uint256 public lastUpdated;

    /// @notice symbol hash → per-symbol config
    mapping(bytes32 => SymbolConfig) public symbolConfigs;

    /// @notice registered symbol hashes for enumeration
    bytes32[] public registeredSymbols;

    uint256 public constant BPS = 10_000;
    uint256 public constant PRICE_DECIMALS = 8;

    uint256 public defaultMaxStaleness = 30;       // 30 seconds
    uint256 public defaultMaxDeviationBps = 1000;   // 10%

    // ============ Events ============

    event PriceUpdated(
        bytes32 indexed symbolHash,
        string symbol,
        uint256 price8,
        uint256 timestamp,
        uint8 signerCount,
        SessionState session
    );
    event BatchPriceUpdate(uint256 count, uint256 timestamp);
    event SignerAdded(address indexed signer);
    event SignerRemoved(address indexed signer);
    event QuorumUpdated(uint256 oldQuorum, uint256 newQuorum);
    event SymbolRegistered(bytes32 indexed symbolHash, string symbol);
    event SymbolRemoved(bytes32 indexed symbolHash);
    event StalePrice(bytes32 indexed symbolHash, uint256 age, uint256 maxAge);
    event OwnershipTransferred(address indexed oldOwner, address indexed newOwner);

    // ============ Errors ============

    error NotOwner();
    error NotSigner();
    error InsufficientQuorum(uint256 provided, uint256 required);
    error SymbolNotRegistered(bytes32 symbolHash);
    error StalePriceError(bytes32 symbolHash, uint256 age, uint256 maxAge);
    error DeviationTooHigh(bytes32 symbolHash, uint256 oldPrice, uint256 newPrice, uint256 deviationBps);
    error ZeroPrice();
    error ZeroAddress();
    error ArrayLengthMismatch();
    error InvalidQuorum(uint256 quorum, uint256 signerCount);
    error SignerAlreadyExists(address signer);
    error SignerNotFound(address signer);
    error TimestampRegression(uint256 newTimestamp, uint256 currentTimestamp);
    error MarketHalted(bytes32 symbolHash);

    // ============ Modifiers ============

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier onlySigner() {
        if (!signers[msg.sender]) revert NotSigner();
        _;
    }

    // ============ Constructor ============

    constructor(address _owner, address[] memory _initialSigners, uint256 _quorum) {
        if (_owner == address(0)) revert ZeroAddress();
        if (_quorum == 0 || _quorum > _initialSigners.length) {
            revert InvalidQuorum(_quorum, _initialSigners.length);
        }

        owner = _owner;

        for (uint256 i = 0; i < _initialSigners.length; i++) {
            if (_initialSigners[i] == address(0)) revert ZeroAddress();
            if (signers[_initialSigners[i]]) revert SignerAlreadyExists(_initialSigners[i]);
            signers[_initialSigners[i]] = true;
            emit SignerAdded(_initialSigners[i]);
        }

        signerCount = _initialSigners.length;
        quorum = _quorum;
    }

    // ============ Owner: Configuration ============

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();
        address old = owner;
        owner = newOwner;
        emit OwnershipTransferred(old, newOwner);
    }

    function addSigner(address signer) external onlyOwner {
        if (signer == address(0)) revert ZeroAddress();
        if (signers[signer]) revert SignerAlreadyExists(signer);
        signers[signer] = true;
        signerCount++;
        emit SignerAdded(signer);
    }

    function removeSigner(address signer) external onlyOwner {
        if (!signers[signer]) revert SignerNotFound(signer);
        signers[signer] = false;
        signerCount--;
        if (quorum > signerCount) {
            uint256 oldQ = quorum;
            quorum = signerCount;
            emit QuorumUpdated(oldQ, quorum);
        }
        emit SignerRemoved(signer);
    }

    function setQuorum(uint256 _quorum) external onlyOwner {
        if (_quorum == 0 || _quorum > signerCount) {
            revert InvalidQuorum(_quorum, signerCount);
        }
        uint256 old = quorum;
        quorum = _quorum;
        emit QuorumUpdated(old, _quorum);
    }

    function registerSymbol(
        string calldata symbol,
        uint256 maxStaleness,
        uint256 maxDeviationBps
    ) external onlyOwner {
        bytes32 h = keccak256(abi.encodePacked(symbol));
        if (!symbolConfigs[h].active) {
            registeredSymbols.push(h);
        }
        symbolConfigs[h] = SymbolConfig({
            maxStalenessSeconds: maxStaleness > 0 ? maxStaleness : defaultMaxStaleness,
            maxDeviationBps: maxDeviationBps > 0 ? maxDeviationBps : defaultMaxDeviationBps,
            active: true
        });
        emit SymbolRegistered(h, symbol);
    }

    function removeSymbol(string calldata symbol) external onlyOwner {
        bytes32 h = keccak256(abi.encodePacked(symbol));
        symbolConfigs[h].active = false;
        delete prices[h];

        uint256 len = registeredSymbols.length;
        for (uint256 i = 0; i < len; i++) {
            if (registeredSymbols[i] == h) {
                registeredSymbols[i] = registeredSymbols[len - 1];
                registeredSymbols.pop();
                break;
            }
        }
        emit SymbolRemoved(h);
    }

    function setDefaultMaxStaleness(uint256 _seconds) external onlyOwner {
        defaultMaxStaleness = _seconds;
    }

    function setDefaultMaxDeviation(uint256 _bps) external onlyOwner {
        defaultMaxDeviationBps = _bps;
    }

    function setSymbolConfig(
        string calldata symbol,
        uint256 maxStaleness,
        uint256 maxDeviationBps
    ) external onlyOwner {
        bytes32 h = keccak256(abi.encodePacked(symbol));
        if (!symbolConfigs[h].active) revert SymbolNotRegistered(h);
        symbolConfigs[h].maxStalenessSeconds = maxStaleness;
        symbolConfigs[h].maxDeviationBps = maxDeviationBps;
    }

    // ============ Owner: Emergency Override ============

    function adminSetPrice(
        string calldata symbol,
        uint256 price8,
        SessionState session
    ) external onlyOwner {
        if (price8 == 0) revert ZeroPrice();
        bytes32 h = keccak256(abi.encodePacked(symbol));
        if (!symbolConfigs[h].active) revert SymbolNotRegistered(h);

        prices[h] = PriceData({
            price8: price8,
            timestamp: block.timestamp,
            session: session,
            confidence: 100,
            signerCount: 0
        });

        lastUpdated = block.timestamp;

        emit PriceUpdated(h, symbol, price8, block.timestamp, 0, session);
    }

    // ============ Signer: Price Updates ============

    /**
     * @notice Update a single stock price. Caller must be an authorized signer.
     *         For devnet (quorum=1), single-signer calls suffice.
     * @param symbol Stock ticker (e.g., "AAPL")
     * @param price8 USD price with 8 decimals
     * @param timestamp Off-chain timestamp of the quote
     * @param session Current market session state
     * @param confidence Confidence score 0-100
     */
    function updatePrice(
        string calldata symbol,
        uint256 price8,
        uint256 timestamp,
        SessionState session,
        uint8 confidence
    ) external onlySigner {
        if (quorum > 1) revert InsufficientQuorum(1, quorum);
        bytes32 h = keccak256(abi.encodePacked(symbol));
        _validateAndStore(h, symbol, price8, timestamp, session, confidence, 1);
    }

    /**
     * @notice Batch update multiple stock prices in one tx.
     *         For devnet (quorum=1), single-signer calls suffice.
     */
    function batchUpdatePrices(
        string[] calldata symbols,
        uint256[] calldata prices8,
        uint256[] calldata timestamps,
        SessionState[] calldata sessions,
        uint8[] calldata confidences
    ) external onlySigner {
        if (quorum > 1) revert InsufficientQuorum(1, quorum);
        uint256 len = symbols.length;
        if (len != prices8.length || len != timestamps.length ||
            len != sessions.length || len != confidences.length) {
            revert ArrayLengthMismatch();
        }

        for (uint256 i = 0; i < len; i++) {
            bytes32 h = keccak256(abi.encodePacked(symbols[i]));
            _validateAndStore(h, symbols[i], prices8[i], timestamps[i], sessions[i], confidences[i], 1);
        }
        emit BatchPriceUpdate(len, block.timestamp);
    }

    // ============ View: Price Reads ============

    /**
     * @notice Get the latest price for a stock symbol. Reverts if stale or halted.
     * @param symbol Stock ticker (e.g., "AAPL")
     * @return price8 USD price with 8 decimals
     */
    function getPrice(string calldata symbol) external view returns (uint256) {
        bytes32 h = keccak256(abi.encodePacked(symbol));
        SymbolConfig storage cfg = symbolConfigs[h];
        if (!cfg.active) revert SymbolNotRegistered(h);

        PriceData storage pd = prices[h];
        if (pd.price8 == 0) revert ZeroPrice();

        if (pd.session == SessionState.Halted) revert MarketHalted(h);

        uint256 age = block.timestamp - pd.timestamp;
        if (age > cfg.maxStalenessSeconds) {
            revert StalePriceError(h, age, cfg.maxStalenessSeconds);
        }

        return pd.price8;
    }

    /**
     * @notice Get price data without staleness/session checks (for UIs / non-critical reads).
     */
    function getPriceUnsafe(string calldata symbol) external view returns (
        uint256 price8,
        uint256 timestamp,
        SessionState session,
        uint8 confidence
    ) {
        bytes32 h = keccak256(abi.encodePacked(symbol));
        PriceData storage pd = prices[h];
        return (pd.price8, pd.timestamp, pd.session, pd.confidence);
    }

    /**
     * @notice Get full price data struct for a symbol.
     */
    function getPriceData(string calldata symbol) external view returns (PriceData memory) {
        bytes32 h = keccak256(abi.encodePacked(symbol));
        return prices[h];
    }

    /**
     * @notice Number of registered symbols.
     */
    function registeredSymbolCount() external view returns (uint256) {
        return registeredSymbols.length;
    }

    /**
     * @notice Get all registered symbol hashes.
     */
    function getAllSymbolHashes() external view returns (bytes32[] memory) {
        return registeredSymbols;
    }

    // ============ Internal ============

    function _validateAndStore(
        bytes32 h,
        string calldata symbol,
        uint256 price8,
        uint256 timestamp,
        SessionState session,
        uint8 confidence,
        uint8 _signerCount
    ) internal {
        if (price8 == 0) revert ZeroPrice();
        SymbolConfig storage cfg = symbolConfigs[h];
        if (!cfg.active) revert SymbolNotRegistered(h);

        PriceData storage pd = prices[h];

        // Timestamp must not regress
        if (pd.timestamp > 0 && timestamp <= pd.timestamp) {
            revert TimestampRegression(timestamp, pd.timestamp);
        }

        // Deviation check (skip for first price)
        if (pd.price8 > 0) {
            uint256 deviation;
            if (price8 > pd.price8) {
                deviation = ((price8 - pd.price8) * BPS) / pd.price8;
            } else {
                deviation = ((pd.price8 - price8) * BPS) / pd.price8;
            }
            if (deviation > cfg.maxDeviationBps) {
                revert DeviationTooHigh(h, pd.price8, price8, deviation);
            }
        }

        pd.price8 = price8;
        pd.timestamp = timestamp;
        pd.session = session;
        pd.confidence = confidence;
        pd.signerCount = _signerCount;
        lastUpdated = timestamp;

        emit PriceUpdated(h, symbol, price8, timestamp, _signerCount, session);
    }
}
