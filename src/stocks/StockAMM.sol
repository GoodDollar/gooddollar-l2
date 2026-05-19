// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import "./SyntheticAsset.sol";
import "./PriceOracle.sol";

/**
 * @title StockAMM
 * @notice Oracle-anchored AMM for gStock/gUSD (G$) pairs.
 *
 *         Unlike constant-product AMMs, the mid price is always the StockOracleV2
 *         reference price. Spread is dynamic: base + staleness + inventory skew +
 *         market-hours factor.
 *
 *         Fee: 0.30% per trade → 0.20% to LP pool, 0.10% to UBI fee splitter.
 */
interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

interface IFeeSplitter {
    function splitFee(uint256 totalFee, address dAppRecipient)
        external
        returns (uint256 ubiShare, uint256 protocolShare, uint256 dAppShare);
}

contract StockAMM is ReentrancyGuard {

    // ============ Constants ============

    uint256 public constant BPS = 10_000;
    uint256 public constant TRADE_FEE_BPS = 30;      // 0.30%
    uint256 public constant LP_FEE_BPS = 20;          // 0.20% to LP
    uint256 public constant UBI_FEE_BPS = 10;         // 0.10% to UBI

    uint256 public constant BASE_SPREAD_BPS = 10;     // 0.10% base
    uint256 public constant CLOSED_SPREAD_MULT = 5;   // 5x during closed
    uint256 public constant PRE_AFTER_SPREAD_MULT = 2; // 2x pre/after

    uint256 public constant MAX_INVENTORY_SKEW_BPS = 50; // max 0.50% skew penalty

    // ============ State ============

    address public admin;
    PriceOracle public immutable oracle;
    IERC20 public immutable gDollar;
    address public immutable feeSplitter;

    struct Pool {
        address syntheticAsset;
        bytes32 oracleKey;
        uint256 gDollarReserve;   // G$ liquidity provided by LPs
        uint256 syntheticReserve; // gStock held by pool
        uint256 totalLPShares;
        bool paused;
    }

    mapping(bytes32 => Pool) public pools;
    mapping(bytes32 => mapping(address => uint256)) public lpShares;
    bytes32[] public poolKeys;

    // ============ Events ============

    event PoolCreated(string indexed ticker, address syntheticAsset);
    event LiquidityAdded(address indexed lp, bytes32 indexed key, uint256 gDollarAmount, uint256 shares);
    event LiquidityRemoved(address indexed lp, bytes32 indexed key, uint256 gDollarOut, uint256 syntheticOut, uint256 shares);
    event Swap(address indexed trader, bytes32 indexed key, bool buyingSynthetic, uint256 amountIn, uint256 amountOut, uint256 fee);

    // ============ Errors ============

    error NotAdmin();
    error ZeroAddress();
    error ZeroAmount();
    error PoolExists(bytes32 key);
    error PoolNotFound(bytes32 key);
    error PoolPaused();
    error MarketHalted();
    error InsufficientLiquidity(uint256 available, uint256 requested);
    error InsufficientShares(uint256 have, uint256 want);
    error TransferFailed();
    error SlippageExceeded(uint256 received, uint256 minimum);

    // ============ Modifiers ============

    modifier onlyAdmin() {
        if (msg.sender != admin) revert NotAdmin();
        _;
    }

    // ============ Constructor ============

    constructor(address _oracle, address _gDollar, address _feeSplitter, address _admin) {
        if (_oracle == address(0) || _gDollar == address(0) || _feeSplitter == address(0) || _admin == address(0))
            revert ZeroAddress();
        oracle = PriceOracle(_oracle);
        gDollar = IERC20(_gDollar);
        feeSplitter = _feeSplitter;
        admin = _admin;
    }

    // ============ Admin ============

    function createPool(string calldata ticker, address syntheticAsset) external onlyAdmin {
        bytes32 key = _key(ticker);
        if (pools[key].syntheticAsset != address(0)) revert PoolExists(key);
        if (syntheticAsset == address(0)) revert ZeroAddress();

        pools[key] = Pool({
            syntheticAsset: syntheticAsset,
            oracleKey: key,
            gDollarReserve: 0,
            syntheticReserve: 0,
            totalLPShares: 0,
            paused: false
        });
        poolKeys.push(key);

        emit PoolCreated(ticker, syntheticAsset);
    }

    function setPoolPaused(string calldata ticker, bool _paused) external onlyAdmin {
        bytes32 key = _key(ticker);
        pools[key].paused = _paused;
    }

    function setAdmin(address newAdmin) external onlyAdmin {
        if (newAdmin == address(0)) revert ZeroAddress();
        admin = newAdmin;
    }

    /**
     * @notice Seed synthetic token reserve into an existing pool.
     *         Admin must have approved this contract first.
     */
    function seedSyntheticReserve(string calldata ticker, uint256 amount) external onlyAdmin {
        if (amount == 0) revert ZeroAmount();
        bytes32 key = _key(ticker);
        Pool storage pool = pools[key];
        if (pool.syntheticAsset == address(0)) revert PoolNotFound(key);

        SyntheticAsset sa = SyntheticAsset(pool.syntheticAsset);
        if (!sa.transferFrom(msg.sender, address(this), amount)) revert TransferFailed();
        pool.syntheticReserve += amount;
    }

    // ============ LP: Add / Remove Liquidity ============

    /**
     * @notice Add G$ liquidity to a pool. LP shares are minted proportionally.
     */
    function addLiquidity(string calldata ticker, uint256 gDollarAmount) external nonReentrant {
        if (gDollarAmount == 0) revert ZeroAmount();
        bytes32 key = _key(ticker);
        Pool storage pool = pools[key];
        if (pool.syntheticAsset == address(0)) revert PoolNotFound(key);

        uint256 shares;
        if (pool.totalLPShares == 0) {
            shares = gDollarAmount;
        } else {
            shares = Math.mulDiv(gDollarAmount, pool.totalLPShares, pool.gDollarReserve);
        }

        if (!gDollar.transferFrom(msg.sender, address(this), gDollarAmount)) revert TransferFailed();

        pool.gDollarReserve += gDollarAmount;
        pool.totalLPShares += shares;
        lpShares[key][msg.sender] += shares;

        emit LiquidityAdded(msg.sender, key, gDollarAmount, shares);
    }

    /**
     * @notice Remove liquidity, receiving proportional G$ and gStock.
     */
    function removeLiquidity(string calldata ticker, uint256 sharesToBurn) external nonReentrant {
        if (sharesToBurn == 0) revert ZeroAmount();
        bytes32 key = _key(ticker);
        Pool storage pool = pools[key];
        if (pool.syntheticAsset == address(0)) revert PoolNotFound(key);
        if (lpShares[key][msg.sender] < sharesToBurn) revert InsufficientShares(lpShares[key][msg.sender], sharesToBurn);

        uint256 gDollarOut = Math.mulDiv(pool.gDollarReserve, sharesToBurn, pool.totalLPShares);
        uint256 syntheticOut = Math.mulDiv(pool.syntheticReserve, sharesToBurn, pool.totalLPShares);

        lpShares[key][msg.sender] -= sharesToBurn;
        pool.totalLPShares -= sharesToBurn;
        pool.gDollarReserve -= gDollarOut;
        pool.syntheticReserve -= syntheticOut;

        if (gDollarOut > 0) {
            if (!gDollar.transfer(msg.sender, gDollarOut)) revert TransferFailed();
        }
        if (syntheticOut > 0) {
            if (!SyntheticAsset(pool.syntheticAsset).transfer(msg.sender, syntheticOut)) revert TransferFailed();
        }

        emit LiquidityRemoved(msg.sender, key, gDollarOut, syntheticOut, sharesToBurn);
    }

    // ============ Swap ============

    /**
     * @notice Buy gStock with G$. Amount is in G$.
     * @param ticker Stock ticker
     * @param gDollarIn G$ amount to spend
     * @param minSyntheticOut Minimum gStock to receive (slippage guard)
     */
    function buyStock(
        string calldata ticker,
        uint256 gDollarIn,
        uint256 minSyntheticOut
    ) external nonReentrant returns (uint256 syntheticOut) {
        if (gDollarIn == 0) revert ZeroAmount();
        bytes32 key = _key(ticker);
        Pool storage pool = pools[key];
        _validatePool(pool, key);

        uint256 oraclePrice8 = oracle.getPriceByKey(pool.oracleKey);
        uint256 spreadBps = _calcSpread(pool, key, true);
        uint256 askPrice8 = oraclePrice8 + Math.mulDiv(oraclePrice8, spreadBps, BPS);

        uint256 fee = Math.mulDiv(gDollarIn, TRADE_FEE_BPS, BPS);
        uint256 netIn = gDollarIn - fee;
        uint256 netInUSD8 = Math.mulDiv(netIn, 1e8, 1e18);
        syntheticOut = Math.mulDiv(netInUSD8, 1e18, askPrice8);

        if (syntheticOut == 0) revert ZeroAmount();
        if (syntheticOut < minSyntheticOut) revert SlippageExceeded(syntheticOut, minSyntheticOut);
        if (pool.syntheticReserve < syntheticOut) revert InsufficientLiquidity(pool.syntheticReserve, syntheticOut);

        if (!gDollar.transferFrom(msg.sender, address(this), gDollarIn)) revert TransferFailed();

        uint256 ubiFee = _routeFee(fee);
        pool.gDollarReserve += gDollarIn - ubiFee;
        pool.syntheticReserve -= syntheticOut;

        if (!SyntheticAsset(pool.syntheticAsset).transfer(msg.sender, syntheticOut)) revert TransferFailed();

        emit Swap(msg.sender, key, true, gDollarIn, syntheticOut, fee);
    }

    /**
     * @notice Sell gStock for G$. Amount is in gStock.
     * @param ticker Stock ticker
     * @param syntheticIn gStock amount to sell
     * @param minGDollarOut Minimum G$ to receive (slippage guard)
     */
    function sellStock(
        string calldata ticker,
        uint256 syntheticIn,
        uint256 minGDollarOut
    ) external nonReentrant returns (uint256 gDollarOut) {
        if (syntheticIn == 0) revert ZeroAmount();
        bytes32 key = _key(ticker);
        Pool storage pool = pools[key];
        _validatePool(pool, key);

        uint256 oraclePrice8 = oracle.getPriceByKey(pool.oracleKey);
        uint256 spreadBps = _calcSpread(pool, key, false);
        uint256 bidPrice8 = oraclePrice8 - Math.mulDiv(oraclePrice8, spreadBps, BPS);

        uint256 grossUSD8 = Math.mulDiv(syntheticIn, bidPrice8, 1e18);
        uint256 grossG = Math.mulDiv(grossUSD8, 1e18, 1e8);
        uint256 fee = Math.mulDiv(grossG, TRADE_FEE_BPS, BPS);
        gDollarOut = grossG - fee;

        if (gDollarOut == 0) revert ZeroAmount();
        if (gDollarOut < minGDollarOut) revert SlippageExceeded(gDollarOut, minGDollarOut);
        if (pool.gDollarReserve < gDollarOut + fee) revert InsufficientLiquidity(pool.gDollarReserve, gDollarOut + fee);

        SyntheticAsset sa = SyntheticAsset(pool.syntheticAsset);
        if (!sa.transferFrom(msg.sender, address(this), syntheticIn)) revert TransferFailed();

        uint256 ubiFee = _routeFee(fee);
        pool.syntheticReserve += syntheticIn;
        pool.gDollarReserve -= (gDollarOut + ubiFee);

        if (!gDollar.transfer(msg.sender, gDollarOut)) revert TransferFailed();

        emit Swap(msg.sender, key, false, syntheticIn, gDollarOut, fee);
    }

    // ============ View ============

    function getQuoteBuy(string calldata ticker, uint256 gDollarIn) external view returns (uint256 syntheticOut, uint256 fee) {
        bytes32 key = _key(ticker);
        Pool storage pool = pools[key];
        uint256 oraclePrice8 = oracle.getPriceByKey(pool.oracleKey);
        uint256 spreadBps = _calcSpread(pool, key, true);
        uint256 askPrice8 = oraclePrice8 + Math.mulDiv(oraclePrice8, spreadBps, BPS);

        fee = Math.mulDiv(gDollarIn, TRADE_FEE_BPS, BPS);
        uint256 netIn = gDollarIn - fee;
        uint256 netInUSD8 = Math.mulDiv(netIn, 1e8, 1e18);
        syntheticOut = Math.mulDiv(netInUSD8, 1e18, askPrice8);
    }

    function getQuoteSell(string calldata ticker, uint256 syntheticIn) external view returns (uint256 gDollarOut, uint256 fee) {
        bytes32 key = _key(ticker);
        Pool storage pool = pools[key];
        uint256 oraclePrice8 = oracle.getPriceByKey(pool.oracleKey);
        uint256 spreadBps = _calcSpread(pool, key, false);
        uint256 bidPrice8 = oraclePrice8 - Math.mulDiv(oraclePrice8, spreadBps, BPS);

        uint256 grossUSD8 = Math.mulDiv(syntheticIn, bidPrice8, 1e18);
        uint256 grossG = Math.mulDiv(grossUSD8, 1e18, 1e8);
        fee = Math.mulDiv(grossG, TRADE_FEE_BPS, BPS);
        gDollarOut = grossG - fee;
    }

    function poolCount() external view returns (uint256) {
        return poolKeys.length;
    }

    // ============ Internal ============

    function _validatePool(Pool storage pool, bytes32 key) internal view {
        if (pool.syntheticAsset == address(0)) revert PoolNotFound(key);
        if (pool.paused) revert PoolPaused();
    }

    /**
     * @dev Dynamic spread = base + inventory skew.
     *      Future: add staleness penalty + market-hours multiplier.
     */
    function _calcSpread(Pool storage pool, bytes32 /* key */, bool buying) internal view returns (uint256) {
        uint256 spread = BASE_SPREAD_BPS;

        if (pool.gDollarReserve > 0 && pool.syntheticReserve > 0) {
            uint256 oraclePrice8 = oracle.getPriceByKey(pool.oracleKey);
            uint256 syntheticValueG = Math.mulDiv(pool.syntheticReserve, oraclePrice8, 1e8);
            uint256 totalValue = pool.gDollarReserve + syntheticValueG;
            uint256 syntheticRatioBps = Math.mulDiv(syntheticValueG, BPS, totalValue);

            if (buying && syntheticRatioBps < 4000) {
                uint256 skew = Math.mulDiv(4000 - syntheticRatioBps, MAX_INVENTORY_SKEW_BPS, 4000);
                spread += skew;
            } else if (!buying && syntheticRatioBps > 6000) {
                uint256 skew = Math.mulDiv(syntheticRatioBps - 6000, MAX_INVENTORY_SKEW_BPS, 4000);
                spread += skew;
            }
        }

        return spread;
    }

    function _routeFee(uint256 fee) internal returns (uint256 ubiFee) {
        if (fee == 0) return 0;
        ubiFee = Math.mulDiv(fee, UBI_FEE_BPS, TRADE_FEE_BPS);
        if (ubiFee > 0) {
            if (!gDollar.transfer(feeSplitter, ubiFee)) revert TransferFailed();
        }
    }

    function _key(string calldata ticker) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(ticker));
    }
}
