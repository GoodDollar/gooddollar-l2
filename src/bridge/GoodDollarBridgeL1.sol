// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title GoodDollar Bridge L1
 * @notice Locks G$, ETH, and USDC on Ethereum L1 for bridging to GoodDollar L2.
 *         Uses the OP Stack cross-domain messaging pattern.
 * @dev L1 side: lock tokens on deposit, unlock on finalized withdrawal.
 *      Cross-domain messages are relayed via IL1CrossDomainMessenger.
 */

interface IBridgeToken {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

interface IL1CrossDomainMessenger {
    function sendMessage(address target, bytes calldata message, uint32 gasLimit) external;
    function xDomainMessageSender() external view returns (address);
}

contract GoodDollarBridgeL1 is ReentrancyGuard {
    IL1CrossDomainMessenger public immutable messenger;
    address public l2Bridge;
    address public admin;
    /// @notice Pending admin for the two-step admin transfer (GOO-493).
    address public pendingAdmin;

    IBridgeToken public immutable goodDollar;
    IBridgeToken public immutable usdc;

    mapping(address => mapping(address => uint256)) public deposits;
    uint256 public totalGDollarLocked;
    uint256 public totalUSDCLocked;
    uint256 public totalETHLocked;

    bool public paused;

    /// @notice Gas limit forwarded to the L2 messenger for finalize* calls.
    ///         Configurable so we can respond to OP Stack gas repricing without
    ///         redeploying the bridge (GOO-1548 — no hardcoded gas limits).
    ///         Bounded by `MIN_X_DOMAIN_GAS_LIMIT` and `MAX_X_DOMAIN_GAS_LIMIT`
    ///         to prevent grief / unbounded gas consumption.
    uint32 public xDomainGasLimit = 200_000;

    /// @dev Sanity bounds for the cross-domain gas limit.
    uint32 public constant MIN_X_DOMAIN_GAS_LIMIT = 50_000;
    uint32 public constant MAX_X_DOMAIN_GAS_LIMIT = 2_000_000;

    event DepositInitiated(
        address indexed token,
        address indexed from,
        address indexed to,
        uint256 amount,
        bytes32 depositHash
    );
    event WithdrawalFinalized(
        address indexed token,
        address indexed to,
        uint256 amount,
        bytes32 withdrawalHash
    );
    event ETHDepositInitiated(address indexed from, address indexed to, uint256 amount);
    event ETHWithdrawalFinalized(address indexed to, uint256 amount);
    event XDomainGasLimitUpdated(uint32 oldLimit, uint32 newLimit);
    event AdminTransferProposed(address indexed currentAdmin, address indexed pendingAdmin);
    event AdminTransferred(address indexed previousAdmin, address indexed newAdmin);

    error ZeroAmount();
    error ZeroAddress();
    error BridgePaused();
    error NotMessenger();
    error NotL2Bridge();
    error NotAdmin();
    error TransferFailed();
    error InsufficientETH();
    error PeerNotConfigured();
    error GasLimitOutOfRange();
    error NotPendingAdmin();

    modifier onlyAdmin() {
        if (msg.sender != admin) revert NotAdmin();
        _;
    }

    modifier whenNotPaused() {
        if (paused) revert BridgePaused();
        _;
    }

    modifier onlyFromL2Bridge() {
        if (msg.sender != address(messenger)) revert NotMessenger();
        if (messenger.xDomainMessageSender() != l2Bridge) revert NotL2Bridge();
        _;
    }

    /// @dev Guard against deposits before setL2Bridge() is called — would lock
    ///      funds permanently since the cross-domain message targets address(0).
    modifier peerConfigured() {
        if (l2Bridge == address(0)) revert PeerNotConfigured();
        _;
    }

    constructor(
        address _messenger,
        address _goodDollar,
        address _usdc,
        address _admin
    ) {
        if (_messenger == address(0)) revert ZeroAddress();
        if (_goodDollar == address(0)) revert ZeroAddress();
        if (_usdc == address(0)) revert ZeroAddress();
        if (_admin == address(0)) revert ZeroAddress();

        messenger = IL1CrossDomainMessenger(_messenger);
        goodDollar = IBridgeToken(_goodDollar);
        usdc = IBridgeToken(_usdc);
        admin = _admin;
    }

    function setL2Bridge(address _l2Bridge) external onlyAdmin {
        if (_l2Bridge == address(0)) revert ZeroAddress();
        l2Bridge = _l2Bridge;
    }

    // ============ Deposits (L1 → L2) ============

    function depositGDollar(address to, uint256 amount) external whenNotPaused peerConfigured nonReentrant {
        if (amount == 0) revert ZeroAmount();
        if (to == address(0)) revert ZeroAddress();

        bool success = goodDollar.transferFrom(msg.sender, address(this), amount);
        if (!success) revert TransferFailed();

        deposits[address(goodDollar)][msg.sender] += amount;
        totalGDollarLocked += amount;

        bytes memory message = abi.encodeCall(
            IGoodDollarBridgeL2.finalizeDeposit,
            (address(goodDollar), msg.sender, to, amount)
        );
        messenger.sendMessage(l2Bridge, message, xDomainGasLimit);

        bytes32 depositHash = keccak256(abi.encodePacked(address(goodDollar), msg.sender, to, amount, block.number));
        emit DepositInitiated(address(goodDollar), msg.sender, to, amount, depositHash);
    }

    function depositUSDC(address to, uint256 amount) external whenNotPaused peerConfigured nonReentrant {
        if (amount == 0) revert ZeroAmount();
        if (to == address(0)) revert ZeroAddress();

        bool success = usdc.transferFrom(msg.sender, address(this), amount);
        if (!success) revert TransferFailed();

        deposits[address(usdc)][msg.sender] += amount;
        totalUSDCLocked += amount;

        bytes memory message = abi.encodeCall(
            IGoodDollarBridgeL2.finalizeDeposit,
            (address(usdc), msg.sender, to, amount)
        );
        messenger.sendMessage(l2Bridge, message, xDomainGasLimit);

        bytes32 depositHash = keccak256(abi.encodePacked(address(usdc), msg.sender, to, amount, block.number));
        emit DepositInitiated(address(usdc), msg.sender, to, amount, depositHash);
    }

    function depositETH(address to) external payable whenNotPaused peerConfigured nonReentrant {
        if (msg.value == 0) revert ZeroAmount();
        if (to == address(0)) revert ZeroAddress();

        totalETHLocked += msg.value;

        bytes memory message = abi.encodeCall(
            IGoodDollarBridgeL2.finalizeETHDeposit,
            (msg.sender, to, msg.value)
        );
        messenger.sendMessage(l2Bridge, message, xDomainGasLimit);

        emit ETHDepositInitiated(msg.sender, to, msg.value);
    }

    // ============ Withdrawal Finalization (L2 → L1) ============
    // Called by L1CrossDomainMessenger after 7-day challenge period

    function finalizeGDollarWithdrawal(
        address to,
        uint256 amount
    ) external onlyFromL2Bridge nonReentrant {
        require(amount <= totalGDollarLocked, "Withdrawal exceeds locked amount");
        totalGDollarLocked -= amount;
        bool success = goodDollar.transfer(to, amount);
        if (!success) revert TransferFailed();

        bytes32 hash = keccak256(abi.encodePacked(address(goodDollar), to, amount, block.number));
        emit WithdrawalFinalized(address(goodDollar), to, amount, hash);
    }

    function finalizeUSDCWithdrawal(
        address to,
        uint256 amount
    ) external onlyFromL2Bridge nonReentrant {
        require(amount <= totalUSDCLocked, "Withdrawal exceeds locked amount");
        totalUSDCLocked -= amount;
        bool success = usdc.transfer(to, amount);
        if (!success) revert TransferFailed();

        bytes32 hash = keccak256(abi.encodePacked(address(usdc), to, amount, block.number));
        emit WithdrawalFinalized(address(usdc), to, amount, hash);
    }

    function finalizeETHWithdrawal(
        address to,
        uint256 amount
    ) external onlyFromL2Bridge nonReentrant {
        if (address(this).balance < amount) revert InsufficientETH();
        require(amount <= totalETHLocked, "Withdrawal exceeds locked amount");
        totalETHLocked -= amount;

        (bool success, ) = to.call{value: amount}("");
        if (!success) revert TransferFailed();

        emit ETHWithdrawalFinalized(to, amount);
    }

    // ============ Admin ============

    function setPaused(bool _paused) external onlyAdmin {
        paused = _paused;
    }

    /**
     * @notice Update the gas limit forwarded to the L2 messenger.
     *         Bounded so a misconfigured admin cannot brick deposits or
     *         set an unbounded gas value.
     */
    function setXDomainGasLimit(uint32 newLimit) external onlyAdmin {
        if (newLimit < MIN_X_DOMAIN_GAS_LIMIT || newLimit > MAX_X_DOMAIN_GAS_LIMIT) {
            revert GasLimitOutOfRange();
        }
        emit XDomainGasLimitUpdated(xDomainGasLimit, newLimit);
        xDomainGasLimit = newLimit;
    }

    /**
     * @notice Step 1 of a two-step admin transfer (GOO-493).
     *         A typo or compromised key cannot brick admin because the
     *         proposed admin must explicitly call `acceptAdmin`.
     */
    function setAdmin(address newAdmin) external onlyAdmin {
        if (newAdmin == address(0)) revert ZeroAddress();
        pendingAdmin = newAdmin;
        emit AdminTransferProposed(admin, newAdmin);
    }

    /**
     * @notice Step 2 of the two-step admin transfer.
     *         Must be called by the previously proposed admin.
     */
    function acceptAdmin() external {
        if (msg.sender != pendingAdmin) revert NotPendingAdmin();
        address previous = admin;
        admin = pendingAdmin;
        pendingAdmin = address(0);
        emit AdminTransferred(previous, admin);
    }

    receive() external payable {}
}

interface IGoodDollarBridgeL2 {
    function finalizeDeposit(address token, address from, address to, uint256 amount) external;
    function finalizeETHDeposit(address from, address to, uint256 amount) external;
}
