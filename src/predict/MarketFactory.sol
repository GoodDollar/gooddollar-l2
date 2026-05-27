// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./ConditionalTokens.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title MarketFactory
 * @notice Creates and resolves GoodPredict binary outcome markets.
 *
 *         Flow:
 *           1. Admin creates a market with a question and resolution deadline.
 *           2. Anyone can buy YES/NO tokens by depositing G$ (1:1 collateral).
 *              Each purchase mints both YES and NO tokens to a pool; caller
 *              receives the side they want.
 *           3. After deadline, a resolver (oracle/admin) calls resolve(YES/NO).
 *           4. Winners redeem YES (if YES wins) or NO (if NO wins) tokens for G$.
 *              A 1% fee is charged on winnings and routed to the UBI fee splitter.
 */

interface IPredictToken {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

interface IUBIFeeSplitterPredict {
    function splitFee(uint256 totalFee, address dAppRecipient) external returns (uint256 ubiShare, uint256 protocolShare, uint256 dAppShare);
}

contract MarketFactory is ReentrancyGuard {
    // ============ Types ============

    enum MarketStatus { Open, Closed, ResolvedYES, ResolvedNO, Voided }

    struct Market {
        string question;
        uint256 endTime;
        MarketStatus status;
        uint256 totalYES;        // total YES tokens issued
        uint256 totalNO;         // total NO tokens issued
        uint256 collateral;      // total G$ locked
        address resolver;        // who can resolve this market
    }

    // ============ State ============

    ConditionalTokens public immutable tokens;
    IPredictToken public immutable goodDollar;
    address public immutable feeSplitter;
    address public admin;

    Market[] public markets;

    /// @notice Secondary allowlist of addresses authorised to call createMarket
    ///         in addition to the admin. Used on devnet/integration runs so the
    ///         QA Bot's `verify-onchain-integration.sh` can drive the full
    ///         create→buy→resolve flow from a single tester key without
    ///         transferring admin away from the deployer. On production
    ///         networks this mapping is expected to remain empty (or curated)
    ///         and the contract behaves as if it were single-admin.
    mapping(address => bool) public marketCreators;

    uint256 public constant REDEEM_FEE_BPS = 100; // 1%
    uint256 public constant BPS = 10000;

    // ============ Events ============

    event MarketCreated(uint256 indexed marketId, string question, uint256 endTime, address resolver);
    event Bought(uint256 indexed marketId, address indexed buyer, bool isYES, uint256 amount, uint256 cost);
    event Redeemed(uint256 indexed marketId, address indexed redeemer, uint256 amount, uint256 payout);
    event MarketResolved(uint256 indexed marketId, MarketStatus result);
    event MarketVoided(uint256 indexed marketId);
    event MarketCreatorSet(address indexed who, bool allowed);

    // ============ Errors ============

    error NotAdmin();
    error ZeroAddress();
    error ZeroAmount();
    error MarketNotOpen();
    error MarketNotClosed();
    error MarketNotResolved();
    error MarketExpired();
    error MarketNotExpired();
    error Unauthorized();
    error TransferFailed();
    error NoWinningTokensExist();

    // ============ Modifiers ============

    modifier onlyAdmin() {
        if (msg.sender != admin) revert NotAdmin();
        _;
    }

    /// @dev Admin OR any address explicitly granted via `setMarketCreator`.
    ///      Reverts with the same `NotAdmin()` selector to keep the existing
    ///      revert ABI stable for tooling that already pattern-matches on
    ///      `0x7bfa4b9f`.
    modifier onlyMarketCreator() {
        if (msg.sender != admin && !marketCreators[msg.sender]) revert NotAdmin();
        _;
    }

    // ============ Constructor ============

    constructor(address _goodDollar, address _feeSplitter, address _admin) {
        if (_goodDollar == address(0)) revert ZeroAddress();
        if (_feeSplitter == address(0)) revert ZeroAddress();
        if (_admin == address(0)) revert ZeroAddress();

        goodDollar = IPredictToken(_goodDollar);
        feeSplitter = _feeSplitter;
        admin = _admin;

        tokens = new ConditionalTokens(address(this));
    }

    // ============ Market Creation ============

    /**
     * @notice Create a new binary outcome market.
     * @param question Human-readable question (e.g., "Will BTC exceed $100k by 2026?")
     * @param endTime UNIX timestamp when trading closes
     * @param resolver Address authorised to resolve this market (admin if zero)
     * @return marketId Index in the markets array
     */
    function createMarket(
        string calldata question,
        uint256 endTime,
        address resolver
    ) external onlyMarketCreator returns (uint256 marketId) {
        if (endTime <= block.timestamp) revert MarketExpired();
        address res = resolver == address(0) ? admin : resolver;

        marketId = markets.length;
        markets.push(Market({
            question: question,
            endTime: endTime,
            status: MarketStatus.Open,
            totalYES: 0,
            totalNO: 0,
            collateral: 0,
            resolver: res
        }));

        emit MarketCreated(marketId, question, endTime, res);
    }

    // ============ Trading ============

    /**
     * @notice Buy YES or NO outcome tokens for a market.
     * @param marketId Market index
     * @param isYES True for YES tokens, false for NO tokens
     * @param amount Number of outcome tokens to buy (1e18 = 1 token = 1 G$)
     */
    // slither-disable-next-line reentrancy-no-eth
    function buy(uint256 marketId, bool isYES, uint256 amount) external nonReentrant {
        require(amount > 0, "MF: amount must be greater than zero");
        require(marketId < markets.length, "MF: market does not exist");
        Market storage m = markets[marketId];
        require(m.status == MarketStatus.Open, "MF: market is not open for trading");
        require(block.timestamp < m.endTime, string(abi.encodePacked("MF: market expired at ", toString(m.endTime), " current time is ", toString(block.timestamp))));

        // Each token costs 1 G$
        bool ok = goodDollar.transferFrom(msg.sender, address(this), amount);
        require(ok, "MF: G$ transfer failed - check balance and allowance");

        m.collateral += amount;

        uint256 tokenId = isYES ? marketId * 2 : marketId * 2 + 1;
        if (isYES) {
            m.totalYES += amount;
        } else {
            m.totalNO += amount;
        }

        tokens.mint(msg.sender, tokenId, amount);
        emit Bought(marketId, msg.sender, isYES, amount, amount);
    }

    // ============ Resolution ============

    /**
     * @notice Close a market after its end time (required before resolution).
     */
    function closeMarket(uint256 marketId) external {
        Market storage m = markets[marketId];
        if (m.status != MarketStatus.Open) revert MarketNotOpen();
        if (block.timestamp < m.endTime) revert MarketNotExpired();
        m.status = MarketStatus.Closed;
    }

    /**
     * @notice Resolve a market as YES or NO.
     * @param marketId Market index
     * @param yesWon True if YES outcome wins
     */
    function resolve(uint256 marketId, bool yesWon) external {
        Market storage m = markets[marketId];
        if (m.status != MarketStatus.Closed) revert MarketNotClosed();
        if (msg.sender != m.resolver && msg.sender != admin) revert Unauthorized();

        m.status = yesWon ? MarketStatus.ResolvedYES : MarketStatus.ResolvedNO;
        emit MarketResolved(marketId, m.status);
    }

    /**
     * @notice Void a market (return collateral 1:1 to token holders).
     * @dev Used when resolution is impossible or disputed.
     */
    function voidMarket(uint256 marketId) external onlyAdmin {
        Market storage m = markets[marketId];
        if (m.status != MarketStatus.Open && m.status != MarketStatus.Closed) {
            revert MarketNotOpen();
        }
        m.status = MarketStatus.Voided;
        emit MarketVoided(marketId);
    }

    // ============ Redemption ============

    /**
     * @notice Redeem winning tokens for G$.
     * @param marketId Market index
     * @param amount Number of winning tokens to redeem
     */
    // slither-disable-next-line reentrancy-no-eth
    function redeem(uint256 marketId, uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();
        Market storage m = markets[marketId];

        bool isVoided = m.status == MarketStatus.Voided;
        bool isYESWin = m.status == MarketStatus.ResolvedYES;
        bool isNOWin = m.status == MarketStatus.ResolvedNO;

        if (!isVoided && !isYESWin && !isNOWin) revert MarketNotResolved();

        uint256 tokenId;
        uint256 payout;
        uint256 collateralDecrement;
        uint256 fee = 0;

        if (isVoided) {
            // Redeem either YES or NO at 1:1 (both valid)
            // Try YES first, then NO
            uint256 yesId = marketId * 2;
            uint256 noId = marketId * 2 + 1;
            if (tokens.balanceOf(msg.sender, yesId) >= amount) {
                tokenId = yesId;
            } else {
                tokenId = noId;
            }
            payout = amount; // 1:1 no fee on void
            collateralDecrement = amount;
        } else {
            tokenId = isYESWin ? marketId * 2 : marketId * 2 + 1;
            uint256 winningSupply = isYESWin ? m.totalYES : m.totalNO;

            // Check for division by zero - if no winning tokens exist, void the market
            if (winningSupply == 0) revert NoWinningTokensExist();

            // Pro-rata share of total collateral (gross, before fee)
            // slither-disable-start divide-before-multiply
            uint256 grossPayout = (amount * m.collateral) / winningSupply;

            // Deduct 1% fee, route to UBI via fee splitter
            fee = (grossPayout * REDEEM_FEE_BPS) / BPS;
            // slither-disable-end divide-before-multiply
            payout = grossPayout - fee;
            collateralDecrement = grossPayout; // full gross amount leaves the contract
        }

        // CEI: all state updates before any external interaction
        m.collateral -= collateralDecrement;
        tokens.burn(msg.sender, tokenId, amount);

        if (fee > 0) {
            require(goodDollar.approve(feeSplitter, fee), "MF: approve failed");
            // slither-disable-next-line unused-return
            IUBIFeeSplitterPredict(feeSplitter).splitFee(fee, address(this));
        }

        bool ok2 = goodDollar.transfer(msg.sender, payout);
        if (!ok2) revert TransferFailed();

        emit Redeemed(marketId, msg.sender, amount, payout);
    }

    // ============ View ============

    function marketCount() external view returns (uint256) {
        return markets.length;
    }

    /// @dev Utility function to convert uint256 to string for error messages
    function toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }

    function getMarket(uint256 marketId)
        external
        view
        returns (
            string memory question,
            uint256 endTime,
            MarketStatus status,
            uint256 totalYES,
            uint256 totalNO,
            uint256 collateral
        )
    {
        Market storage m = markets[marketId];
        return (m.question, m.endTime, m.status, m.totalYES, m.totalNO, m.collateral);
    }

    /**
     * @notice Implied probability of YES winning, in BPS (5000 = 50%)
     * @dev Simple constant-product approximation: YES / (YES + NO)
     */
    function impliedProbabilityYES(uint256 marketId) external view returns (uint256) {
        Market storage m = markets[marketId];
        uint256 total = m.totalYES + m.totalNO;
        if (total == 0) return 5000; // 50% when no bets yet
        return (m.totalYES * BPS) / total;
    }

    // ============ Admin ============

    function setAdmin(address newAdmin) external onlyAdmin {
        if (newAdmin == address(0)) revert ZeroAddress();
        admin = newAdmin;
    }

    /**
     * @notice Grant or revoke market-creation rights for an address. Admin-only.
     * @dev Idempotent: setting an already-true value to true (or already-false
     *      to false) is a no-op other than re-emitting the event. The admin
     *      itself does not need to be added — it is always authorised.
     * @param who     Address whose market-creator status to update.
     * @param allowed True to grant, false to revoke.
     */
    function setMarketCreator(address who, bool allowed) external onlyAdmin {
        if (who == address(0)) revert ZeroAddress();
        marketCreators[who] = allowed;
        emit MarketCreatorSet(who, allowed);
    }
}
