// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/interfaces/IERC20.sol";

/**
 * @title GoodLendPool
 * @notice Core lending pool for GoodLend — an Aave V3-inspired lending protocol
 *         where 20% of protocol revenue funds GoodDollar UBI.
 *
 * Features:
 *   - Supply / Withdraw (earn interest via gTokens)
 *   - Borrow / Repay (variable rate debt)
 *   - Liquidation (health factor < 1.0)
 *   - Flash Loans (0.09% fee)
 *   - UBI Fee Routing (20% of reserve factor → UBI pool)
 *
 * Architecture:
 *   - Per asset: GoodLendToken (gToken) + DebtToken + InterestRateModel
 *   - Single pool entry point (all reserves)
 *   - Oracle-based pricing for health factor calculation
 *   - Reserve factor → treasury → UBIFeeSplitter
 */

interface IGoodLendToken {
    function mint(address to, uint256 amount, uint256 index) external;
    function burn(address from, uint256 amount, uint256 index) external;
    function mintToTreasury(address treasury, uint256 amount, uint256 index) external;
    function scaledTotalSupply() external view returns (uint256);
    function scaledBalanceOf(address account) external view returns (uint256);
}

interface IDebtToken {
    function mint(address to, uint256 amount, uint256 index) external;
    function burn(address from, uint256 amount, uint256 index) external;
    function scaledTotalSupply() external view returns (uint256);
    function scaledBalanceOf(address account) external view returns (uint256);
}

interface IInterestRateModel {
    function calculateRates(
        address asset,
        uint256 totalDeposits,
        uint256 totalBorrows,
        uint256 reserveFactorBPS
    ) external view returns (uint256 borrowRate, uint256 supplyRate);
}

interface IPriceOracle {
    function getAssetPrice(address asset) external view returns (uint256);
}

interface IFlashLoanReceiver {
    function executeOperation(
        address asset,
        uint256 amount,
        uint256 premium,
        address initiator,
        bytes calldata params
    ) external returns (bool);
}

contract GoodLendPool {
    // ============ Constants ============

    uint256 internal constant RAY = 1e27;
    uint256 internal constant SECONDS_PER_YEAR = 365 days;
    uint256 internal constant BPS = 10_000;

    // Flash loan premium: 9 bps = 0.09%
    uint256 public constant FLASH_LOAN_PREMIUM_BPS = 9;

    // ============ State ============

    struct ReserveData {
        // Token addresses
        address gToken;          // Interest-bearing deposit token
        address debtToken;       // Variable debt token
        // Configuration
        uint256 reserveFactorBPS;     // e.g., 2000 = 20% of interest to protocol
        uint256 ltvBPS;               // Loan-to-value (e.g., 7500 = 75%)
        uint256 liquidationThresholdBPS; // e.g., 8200 = 82%
        uint256 liquidationBonusBPS;  // e.g., 10500 = 5% bonus
        uint256 supplyCap;            // Max total supply (0 = unlimited)
        uint256 borrowCap;            // Max total borrow (0 = unlimited)
        uint8   decimals;
        bool    isActive;
        bool    borrowingEnabled;
        // Indexes (RAY)
        uint256 liquidityIndex;       // Grows with supply interest
        uint256 variableBorrowIndex;  // Grows with borrow interest (compounded)
        // Rates (RAY, annual)
        uint256 currentBorrowRate;
        uint256 currentSupplyRate;
        // Timestamps
        uint40  lastUpdateTimestamp;
        // Accrued to treasury (in underlying, not yet minted)
        uint256 accruedToTreasury;
    }

    // Reserves storage is internal; use getReserveData() for external reads.
    // A public mapping with a 17-field struct generates an auto-getter with 17 return
    // values which exceeds the EVM stack limit when the optimizer is disabled (forge coverage).
    mapping(address => ReserveData) internal reserves;
    address[] public reservesList;

    /// @notice Price oracle
    IPriceOracle public oracle;

    /// @notice Interest rate model
    IInterestRateModel public interestRateModel;

    /// @notice Treasury address (receives protocol revenue — should be UBIFeeSplitter)
    address public treasury;

    /// @notice Admin
    address public admin;
    /// @notice Pending admin for two-step admin transfer (GOO-493).
    address public pendingAdmin;

    /// @notice Reentrancy guard
    uint256 private _locked;

    // ============ Events ============

    event ReserveInitialized(address indexed asset, address gToken, address debtToken);
    event Supply(address indexed asset, address indexed user, uint256 amount);
    event Withdraw(address indexed asset, address indexed user, uint256 amount);
    event Borrow(address indexed asset, address indexed user, uint256 amount);
    event Repay(address indexed asset, address indexed user, uint256 amount);
    event Liquidation(
        address indexed collateralAsset,
        address indexed debtAsset,
        address indexed user,
        uint256 debtCovered,
        uint256 collateralSeized,
        address liquidator
    );
    event FlashLoan(address indexed asset, address indexed receiver, uint256 amount, uint256 premium);
    event TreasuryMint(address indexed asset, uint256 amount);
    event ReserveUpdated(address indexed asset, uint256 liquidityIndex, uint256 borrowIndex);
    event SupplyCapUpdated(address indexed asset, uint256 oldCap, uint256 newCap);
    event BorrowCapUpdated(address indexed asset, uint256 oldCap, uint256 newCap);
    event AdminTransferProposed(address indexed currentAdmin, address indexed pendingAdmin);
    event AdminTransferred(address indexed previousAdmin, address indexed newAdmin);

    // ============ Modifiers ============

    error TransferFailed();

    modifier onlyAdmin() {
        require(msg.sender == admin, "GoodLendPool: not admin");
        _;
    }

    modifier nonReentrant() {
        require(_locked == 0, "GoodLendPool: reentrant");
        _locked = 1;
        _;
        _locked = 0;
    }

    // ============ Constructor ============

    constructor(address _oracle, address _interestRateModel, address _treasury, address _admin) {
        oracle = IPriceOracle(_oracle);
        interestRateModel = IInterestRateModel(_interestRateModel);
        treasury = _treasury;
        admin = _admin;
    }

    // ============ Admin: Initialize Reserve ============

    function initReserve(
        address asset,
        address gToken,
        address debtToken,
        uint256 reserveFactorBPS_,
        uint256 ltvBPS,
        uint256 liquidationThresholdBPS,
        uint256 liquidationBonusBPS,
        uint256 supplyCap,
        uint256 borrowCap,
        uint8   assetDecimals
    ) external onlyAdmin {
        require(!reserves[asset].isActive, "GoodLendPool: already initialized");
        require(ltvBPS <= liquidationThresholdBPS, "LTV > threshold");
        require(liquidationBonusBPS >= BPS, "Bonus < 100%");

        reserves[asset] = ReserveData({
            gToken: gToken,
            debtToken: debtToken,
            reserveFactorBPS: reserveFactorBPS_,
            ltvBPS: ltvBPS,
            liquidationThresholdBPS: liquidationThresholdBPS,
            liquidationBonusBPS: liquidationBonusBPS,
            supplyCap: supplyCap,
            borrowCap: borrowCap,
            decimals: assetDecimals,
            isActive: true,
            borrowingEnabled: true,
            liquidityIndex: RAY,
            variableBorrowIndex: RAY,
            currentBorrowRate: 0,
            currentSupplyRate: 0,
            lastUpdateTimestamp: uint40(block.timestamp),
            accruedToTreasury: 0
        });
        reservesList.push(asset);

        emit ReserveInitialized(asset, gToken, debtToken);
    }

    // ============ Core: Supply ============

    /**
     * @notice Deposit underlying asset to earn interest (gTokens minted to caller).
     * @param asset   The reserve asset.
     * @param amount  Amount of underlying to supply.
     */
    function supply(address asset, uint256 amount) external nonReentrant {
        _supply(asset, amount, msg.sender);
    }

    /**
     * @notice Deposit underlying asset on behalf of another account (Aave V3-compatible).
     * @param asset       The reserve asset.
     * @param amount      Amount of underlying to supply.
     * @param onBehalfOf  Address that receives the gTokens.
     */
    function supply(address asset, uint256 amount, address onBehalfOf) external nonReentrant {
        _supply(asset, amount, onBehalfOf);
    }

    function _supply(address asset, uint256 amount, address onBehalfOf) internal {
        ReserveData storage reserve = reserves[asset];
        require(reserve.isActive, "GoodLendPool: reserve inactive");
        require(amount > 0, "GoodLendPool: zero amount");

        _updateState(asset);

        // Check supply cap
        if (reserve.supplyCap > 0) {
            uint256 totalDeposits = _totalDeposits(asset);
            require(totalDeposits + amount <= reserve.supplyCap * (10 ** reserve.decimals), "GoodLendPool: supply cap");
        }

        // Transfer underlying from caller
        if (!IERC20(asset).transferFrom(msg.sender, reserve.gToken, amount)) revert TransferFailed();

        // Mint gTokens to onBehalfOf
        IGoodLendToken(reserve.gToken).mint(onBehalfOf, amount, reserve.liquidityIndex);

        // Update rates AFTER the mint so the new totals are reflected. The function is `nonReentrant`
        // and external calls above are to protocol-deployed tokens (the underlying ERC20 and the
        // owner-configured `reserve.gToken`); cross-function reentrancy is blocked by the same
        // guard on `supply`/`withdraw`/`borrow`/`repay`/`liquidate`/`flashLoan`/`mintToTreasury`.
        // slither-disable-next-line reentrancy-no-eth
        _updateRates(asset);

        emit Supply(asset, onBehalfOf, amount);
    }

    // ============ Core: Withdraw ============

    /**
     * @notice Withdraw underlying asset by burning gTokens (sent to caller).
     * @param asset   The reserve asset.
     * @param amount  Amount of underlying to withdraw (type(uint256).max for full balance).
     */
    function withdraw(address asset, uint256 amount) external nonReentrant returns (uint256) {
        return _withdraw(asset, amount, msg.sender);
    }

    /**
     * @notice Withdraw underlying asset to a specified recipient (Aave V3-compatible).
     * @param asset   The reserve asset.
     * @param amount  Amount to withdraw (type(uint256).max for full balance).
     * @param to      Address that receives the underlying.
     */
    function withdraw(address asset, uint256 amount, address to) external nonReentrant returns (uint256) {
        return _withdraw(asset, amount, to);
    }

    function _withdraw(address asset, uint256 amount, address to) internal returns (uint256) {
        ReserveData storage reserve = reserves[asset];
        require(reserve.isActive, "GoodLendPool: reserve inactive");

        _updateState(asset);

        // Determine actual withdrawal amount (gTokens burned from msg.sender)
        uint256 userBalance = _gTokenBalance(asset, msg.sender, reserve.liquidityIndex);
        if (amount == type(uint256).max) {
            amount = userBalance;
        }
        require(amount > 0 && amount <= userBalance, "GoodLendPool: bad amount");

        // Burn gTokens from caller
        IGoodLendToken(reserve.gToken).burn(msg.sender, amount, reserve.liquidityIndex);

        // Transfer underlying from gToken contract to recipient
        // SECURITY: `reserve.gToken` is the GoodLend gToken set by the owner in `initReserve`; it is
        // NOT an arbitrary user-supplied address. The gToken pre-approves the pool to move underlying
        // on its behalf. This is the canonical Aave-style withdraw flow. False positive.
        // slither-disable-next-line arbitrary-send-erc20
        if (!IERC20(asset).transferFrom(reserve.gToken, to, amount)) revert TransferFailed();

        // Check health factor after withdrawal
        (uint256 hf, , ) = _calculateHealthFactor(msg.sender);
        require(hf >= RAY || hf == type(uint256).max, "GoodLendPool: undercollateralized");

        // Update rates AFTER the burn/transfer so the new totals are reflected. The function is
        // `nonReentrant` and external calls above are to protocol-deployed tokens; cross-function
        // reentrancy is blocked by the same guard on all other state-mutating entrypoints.
        // slither-disable-next-line reentrancy-no-eth
        _updateRates(asset);

        emit Withdraw(asset, to, amount);
        return amount;
    }

    // ============ Core: Borrow ============

    /**
     * @notice Borrow underlying asset against supplied collateral.
     * @param asset   The asset to borrow.
     * @param amount  Amount to borrow.
     */
    function borrow(address asset, uint256 amount) external nonReentrant {
        ReserveData storage reserve = reserves[asset];
        require(reserve.isActive && reserve.borrowingEnabled, "GoodLendPool: borrow disabled");
        require(amount > 0, "GoodLendPool: zero amount");

        _updateState(asset);

        // Check borrow cap
        if (reserve.borrowCap > 0) {
            uint256 totalBorrows = _totalBorrows(asset);
            require(totalBorrows + amount <= reserve.borrowCap * (10 ** reserve.decimals), "GoodLendPool: borrow cap");
        }

        // Mint debt tokens to borrower
        IDebtToken(reserve.debtToken).mint(msg.sender, amount, reserve.variableBorrowIndex);

        // Transfer underlying from gToken contract to borrower
        // SECURITY: `reserve.gToken` is owner-configured protocol state from `initReserve`, not a
        // user-supplied address. The gToken explicitly approves the pool to disburse underlying as
        // loans. Borrower identity is `msg.sender`. False positive for arbitrary-send-erc20.
        // slither-disable-next-line arbitrary-send-erc20
        if (!IERC20(asset).transferFrom(reserve.gToken, msg.sender, amount)) revert TransferFailed();

        // Check health factor
        (uint256 hf, , ) = _calculateHealthFactor(msg.sender);
        require(hf >= RAY, "GoodLendPool: undercollateralized");

        // Update rates AFTER the mint/transfer so the new totals are reflected. The function is
        // `nonReentrant` and external calls above are to protocol-deployed tokens; cross-function
        // reentrancy is blocked by the same guard on all other state-mutating entrypoints.
        // slither-disable-next-line reentrancy-no-eth
        _updateRates(asset);

        emit Borrow(asset, msg.sender, amount);
    }

    // ============ Core: Repay ============

    /**
     * @notice Repay borrowed asset.
     * @param asset   The asset to repay.
     * @param amount  Amount to repay (type(uint256).max for full debt).
     */
    function repay(address asset, uint256 amount) external nonReentrant returns (uint256) {
        ReserveData storage reserve = reserves[asset];
        require(reserve.isActive, "GoodLendPool: reserve inactive");

        _updateState(asset);

        // Get user's debt
        uint256 userDebt = _debtBalance(asset, msg.sender, reserve.variableBorrowIndex);
        if (amount == type(uint256).max) {
            amount = userDebt;
        }
        require(amount > 0, "GoodLendPool: zero amount");
        if (amount > userDebt) amount = userDebt;

        // Transfer underlying from user to gToken contract
        if (!IERC20(asset).transferFrom(msg.sender, reserve.gToken, amount)) revert TransferFailed();

        // Burn debt tokens
        IDebtToken(reserve.debtToken).burn(msg.sender, amount, reserve.variableBorrowIndex);

        // Update rates AFTER the burn/transfer so the new totals are reflected. The function is
        // `nonReentrant` and external calls above are to protocol-deployed tokens; cross-function
        // reentrancy is blocked by the same guard on all other state-mutating entrypoints.
        // slither-disable-next-line reentrancy-no-eth
        _updateRates(asset);

        emit Repay(asset, msg.sender, amount);
        return amount;
    }

    // ============ Core: Liquidation ============

    /**
     * @notice Liquidate an undercollateralized position.
     * @param collateralAsset Asset seized as collateral.
     * @param debtAsset       Asset being repaid.
     * @param user            The borrower to liquidate.
     * @param debtToCover     Amount of debt to repay.
     */
    function liquidate(
        address collateralAsset,
        address debtAsset,
        address user,
        uint256 debtToCover
    ) external nonReentrant {
        _updateState(collateralAsset);
        _updateState(debtAsset);

        // Check user is liquidatable
        (uint256 hf, , ) = _calculateHealthFactor(user);
        require(hf < RAY, "GoodLendPool: not liquidatable");

        ReserveData storage collateralReserve = reserves[collateralAsset];
        ReserveData storage debtReserve = reserves[debtAsset];

        // Close factor: 50% if HF >= 0.95, 100% if HF < 0.95
        uint256 userDebt = _debtBalance(debtAsset, user, debtReserve.variableBorrowIndex);
        uint256 maxClose = hf >= (RAY * 95) / 100 ? userDebt / 2 : userDebt;
        if (debtToCover > maxClose) debtToCover = maxClose;
        require(debtToCover > 0, "GoodLendPool: zero liquidation");

        // Calculate collateral to seize (extracted to avoid stack-too-deep without optimizer)
        uint256 collateralToSeize = _calcCollateralToSeize(debtToCover, debtAsset, collateralAsset);

        // Cap at user's collateral
        uint256 userCollateral = _gTokenBalance(collateralAsset, user, collateralReserve.liquidityIndex);
        if (collateralToSeize > userCollateral) collateralToSeize = userCollateral;

        // Liquidator pays debt
        if (!IERC20(debtAsset).transferFrom(msg.sender, debtReserve.gToken, debtToCover)) revert TransferFailed();
        IDebtToken(debtReserve.debtToken).burn(user, debtToCover, debtReserve.variableBorrowIndex);

        // Transfer collateral gTokens from user to liquidator
        IGoodLendToken(collateralReserve.gToken).burn(user, collateralToSeize, collateralReserve.liquidityIndex);

        // Send underlying to liquidator
        // SECURITY: `collateralReserve.gToken` is owner-configured reserve state, not user input;
        // the liquidator (`msg.sender`) has already burned the seized gTokens above and is entitled
        // to the underlying. Canonical Aave-style liquidation flow. False positive.
        // slither-disable-next-line arbitrary-send-erc20
        if (!IERC20(collateralAsset).transferFrom(collateralReserve.gToken, msg.sender, collateralToSeize)) revert TransferFailed();

        // Update rates AFTER the burns/transfers so the new totals are reflected. The function is
        // `nonReentrant` and external calls above are to protocol-deployed tokens; cross-function
        // reentrancy is blocked by the same guard on all other state-mutating entrypoints.
        // slither-disable-next-line reentrancy-no-eth
        _updateRates(collateralAsset);
        // slither-disable-next-line reentrancy-no-eth
        _updateRates(debtAsset);

        emit Liquidation(collateralAsset, debtAsset, user, debtToCover, collateralToSeize, msg.sender);
    }

    /**
     * @dev Compute the amount of collateral to seize for a given debt repayment.
     *      Extracted from `liquidate` to reduce stack depth for forge coverage.
     */
    function _calcCollateralToSeize(
        uint256 debtToCover,
        address debtAsset,
        address collateralAsset
    ) internal view returns (uint256 collateralToSeize) {
        ReserveData storage debtReserve      = reserves[debtAsset];
        ReserveData storage collateralReserve = reserves[collateralAsset];
        uint256 debtPrice       = oracle.getAssetPrice(debtAsset);
        uint256 collateralPrice = oracle.getAssetPrice(collateralAsset);
        require(debtPrice > 0 && collateralPrice > 0, "GoodLendPool: oracle fail");

        // collateralToSeize = (debtToCover * debtPrice / debtDecimals)
        //                     * liquidationBonus / collateralPrice * collateralDecimals
        uint256 debtValue          = debtToCover * debtPrice / (10 ** debtReserve.decimals);
        uint256 collateralAmountRaw = (debtValue * collateralReserve.liquidationBonusBPS) / BPS;
        collateralToSeize          = collateralAmountRaw * (10 ** collateralReserve.decimals) / collateralPrice;
    }

    // ============ Flash Loans ============

    /**
     * @notice Execute a flash loan.
     * @param asset    The asset to borrow.
     * @param amount   Amount to borrow.
     * @param receiver Contract that receives the funds and must repay.
     * @param params   Arbitrary data passed to receiver.
     */
    function flashLoan(
        address asset,
        uint256 amount,
        address receiver,
        bytes calldata params
    ) external nonReentrant {
        ReserveData storage reserve = reserves[asset];
        require(reserve.isActive, "GoodLendPool: reserve inactive");
        require(amount > 0, "GoodLendPool: zero amount");

        uint256 premium = (amount * FLASH_LOAN_PREMIUM_BPS) / BPS;

        // Transfer to receiver
        // SECURITY: `reserve.gToken` is owner-configured protocol state, not user input. The pool is
        // pre-approved by the gToken to disburse underlying for flash loans. Repayment is enforced
        // below on line 500. False positive for arbitrary-send-erc20.
        // slither-disable-next-line arbitrary-send-erc20
        if (!IERC20(asset).transferFrom(reserve.gToken, receiver, amount)) revert TransferFailed();

        // Callback
        require(
            IFlashLoanReceiver(receiver).executeOperation(asset, amount, premium, msg.sender, params),
            "GoodLendPool: flash loan callback failed"
        );

        // Pull back amount + premium
        // SECURITY: `receiver` is the same address that just received the loan and executed its
        // callback; pulling back principal + premium to `reserve.gToken` (owner-configured) is the
        // intended repayment path. The destination is trusted protocol state. False positive.
        // slither-disable-next-line arbitrary-send-erc20
        if (!IERC20(asset).transferFrom(receiver, reserve.gToken, amount + premium)) revert TransferFailed();

        // Accrue premium: split between suppliers and treasury
        // 1/3 of premium to protocol, 2/3 to suppliers
        uint256 protocolPremium = premium / 3;
        uint256 supplierPremium = premium - protocolPremium;

        // Protocol premium accrues to treasury. Must happen AFTER repayment so we only credit
        // premium for loans that were repaid in full. The function is `nonReentrant` and the
        // receiver callback ran above, so this state write cannot be exploited by re-entry.
        // slither-disable-next-line reentrancy-no-eth
        reserve.accruedToTreasury += protocolPremium;

        // Supplier premium increases the liquidity index slightly. Same justification as above.
        // slither-disable-next-line reentrancy-no-eth
        uint256 totalDeposits = _totalDeposits(asset);
        if (totalDeposits > 0 && supplierPremium > 0) {
            // slither-disable-next-line reentrancy-no-eth
            reserve.liquidityIndex += (supplierPremium * RAY) / totalDeposits;
        }

        emit FlashLoan(asset, receiver, amount, premium);
    }

    // ============ Mint to Treasury ============

    /**
     * @notice Mint accrued protocol revenue to treasury as gTokens.
     * @param assets Array of reserve assets to mint for.
     */
    function mintToTreasury(address[] calldata assets) external nonReentrant {
        for (uint256 i = 0; i < assets.length; i++) {
            // Within each iteration we do _updateState -> set accruedToTreasury = 0 -> mint, which
            // is CEI-compliant for THAT asset. Slither flags this loop because the *next* iteration
            // updates state for a DIFFERENT reserve after the previous iteration's external mint.
            // That is benign — each reserve's state is independent, and the function is
            // `nonReentrant` so no other entrypoint can interleave between iterations.
            // slither-disable-next-line reentrancy-no-eth
            _updateState(assets[i]);
            ReserveData storage reserve = reserves[assets[i]];
            uint256 accrued = reserve.accruedToTreasury;
            if (accrued > 0) {
                reserve.accruedToTreasury = 0;
                IGoodLendToken(reserve.gToken).mintToTreasury(treasury, accrued, reserve.liquidityIndex);
                emit TreasuryMint(assets[i], accrued);
            }
        }
    }

    // ============ View: Health Factor ============

    /**
     * @notice Get a user's health factor and account data.
     * @return healthFactor  RAY-scaled health factor (≥ 1e27 = healthy).
     * @return totalCollateralUSD  Total collateral value in USD (8 decimals).
     * @return totalDebtUSD        Total debt value in USD (8 decimals).
     */
    function getUserAccountData(address user) external view returns (
        uint256 healthFactor,
        uint256 totalCollateralUSD,
        uint256 totalDebtUSD
    ) {
        return _calculateHealthFactor(user);
    }

    /**
     * @notice Get current liquidity index for an asset (used by gToken).
     */
    function getLiquidityIndex(address asset) public view returns (uint256) {
        ReserveData storage reserve = reserves[asset];
        if (!reserve.isActive) return RAY;
        // Calculate pending interest since last update
        uint256 timeDelta = block.timestamp - reserve.lastUpdateTimestamp;
        // slither-disable-next-line incorrect-equality
        if (timeDelta == 0) return reserve.liquidityIndex;
        // Linear approximation for supply index growth
        uint256 supplyInterest = (reserve.currentSupplyRate * timeDelta) / SECONDS_PER_YEAR;
        return reserve.liquidityIndex + (reserve.liquidityIndex * supplyInterest) / RAY;
    }

    /**
     * @notice Get current borrow index for an asset (used by debtToken).
     */
    function getBorrowIndex(address asset) public view returns (uint256) {
        ReserveData storage reserve = reserves[asset];
        if (!reserve.isActive) return RAY;
        uint256 timeDelta = block.timestamp - reserve.lastUpdateTimestamp;
        // slither-disable-next-line incorrect-equality
        if (timeDelta == 0) return reserve.variableBorrowIndex;
        // Compounded: index *= (1 + rate * dt / year)
        // Simplified: linear approx for small dt
        uint256 borrowInterest = (reserve.currentBorrowRate * timeDelta) / SECONDS_PER_YEAR;
        return reserve.variableBorrowIndex + (reserve.variableBorrowIndex * borrowInterest) / RAY;
    }

    /**
     * @notice Get total deposited and borrowed for a reserve.
     */
    function getReserveData(address asset) external view returns (
        uint256 totalDeposits,
        uint256 totalBorrows,
        uint256 liquidityIndex,
        uint256 borrowIndex,
        uint256 supplyRate,
        uint256 borrowRate,
        uint256 accruedToTreasury
    ) {
        ReserveData storage r = reserves[asset];
        liquidityIndex = r.liquidityIndex;
        borrowIndex = r.variableBorrowIndex;
        supplyRate = r.currentSupplyRate;
        borrowRate = r.currentBorrowRate;
        accruedToTreasury = r.accruedToTreasury;
        totalDeposits = _totalDeposits(asset);
        totalBorrows = _totalBorrows(asset);
    }

    function getReservesCount() external view returns (uint256) {
        return reservesList.length;
    }

    // ============ Admin ============

    function setOracle(address _oracle) external onlyAdmin {
        oracle = IPriceOracle(_oracle);
    }

    function setTreasury(address _treasury) external onlyAdmin {
        treasury = _treasury;
    }

    function setReserveActive(address asset, bool active) external onlyAdmin {
        reserves[asset].isActive = active;
    }

    function setBorrowingEnabled(address asset, bool enabled) external onlyAdmin {
        reserves[asset].borrowingEnabled = enabled;
    }

    function setReserveFactor(address asset, uint256 newFactorBPS) external onlyAdmin {
        require(newFactorBPS <= BPS, "bad factor");
        _updateState(asset);
        reserves[asset].reserveFactorBPS = newFactorBPS;
        _updateRates(asset);
    }

    /**
     * @notice Step 1 of the two-step admin transfer (GOO-493).
     *         A typo or compromised key cannot brick the contract because the
     *         proposed admin must explicitly call `acceptAdmin`.
     */
    function setAdmin(address _admin) external onlyAdmin {
        require(_admin != address(0), "GoodLendPool: zero address");
        pendingAdmin = _admin;
        emit AdminTransferProposed(admin, _admin);
    }

    /**
     * @notice Step 2 of the two-step admin transfer.
     *         Must be called by the previously proposed admin.
     */
    function acceptAdmin() external {
        require(msg.sender == pendingAdmin, "GoodLendPool: not pending admin");
        address previous = admin;
        admin = pendingAdmin;
        pendingAdmin = address(0);
        emit AdminTransferred(previous, admin);
    }

    function setSupplyCap(address asset, uint256 newCap) external onlyAdmin {
        require(reserves[asset].gToken != address(0), "GoodLendPool: reserve not initialized");
        uint256 old = reserves[asset].supplyCap;
        reserves[asset].supplyCap = newCap;
        emit SupplyCapUpdated(asset, old, newCap);
    }

    function setBorrowCap(address asset, uint256 newCap) external onlyAdmin {
        require(reserves[asset].gToken != address(0), "GoodLendPool: reserve not initialized");
        uint256 old = reserves[asset].borrowCap;
        reserves[asset].borrowCap = newCap;
        emit BorrowCapUpdated(asset, old, newCap);
    }

    // ============ Internal: State Update ============

    /**
     * @dev Updates liquidity and borrow indexes based on elapsed time.
     *      Accrues protocol revenue to treasury.
     */
    function _updateState(address asset) internal {
        ReserveData storage reserve = reserves[asset];
        if (!reserve.isActive) return;

        uint256 timeDelta = block.timestamp - reserve.lastUpdateTimestamp;
        // slither-disable-next-line incorrect-equality
        if (timeDelta == 0) return;

        uint256 totalBorrows = _totalBorrows(asset);

        if (totalBorrows > 0) {
            // Calculate interest accrued
            uint256 borrowInterest = (reserve.currentBorrowRate * timeDelta) / SECONDS_PER_YEAR;

            // Update borrow index (compound)
            uint256 borrowIndexIncrement = (reserve.variableBorrowIndex * borrowInterest) / RAY;
            reserve.variableBorrowIndex += borrowIndexIncrement;

            // Total interest accrued by borrowers
            uint256 totalInterestAccrued = (totalBorrows * borrowInterest) / RAY;

            // Protocol revenue = interest * reserveFactor
            uint256 protocolRevenue = (totalInterestAccrued * reserve.reserveFactorBPS) / BPS;
            reserve.accruedToTreasury += protocolRevenue;

            // Update liquidity index (linear)
            uint256 supplyInterest = (reserve.currentSupplyRate * timeDelta) / SECONDS_PER_YEAR;
            reserve.liquidityIndex += (reserve.liquidityIndex * supplyInterest) / RAY;
        }

        reserve.lastUpdateTimestamp = uint40(block.timestamp);

        emit ReserveUpdated(asset, reserve.liquidityIndex, reserve.variableBorrowIndex);
    }

    function _updateRates(address asset) internal {
        ReserveData storage reserve = reserves[asset];
        uint256 totalDep = _totalDeposits(asset);
        uint256 totalBor = _totalBorrows(asset);

        (uint256 borrowRate, uint256 supplyRate) = interestRateModel.calculateRates(
            asset, totalDep, totalBor, reserve.reserveFactorBPS
        );

        reserve.currentBorrowRate = borrowRate;
        reserve.currentSupplyRate = supplyRate;
    }

    // ============ Internal: Helpers ============

    function _totalDeposits(address asset) internal view returns (uint256) {
        ReserveData storage reserve = reserves[asset];
        uint256 scaledSupply = IGoodLendToken(reserve.gToken).scaledTotalSupply();
        return (scaledSupply * reserve.liquidityIndex) / RAY;
    }

    function _totalBorrows(address asset) internal view returns (uint256) {
        ReserveData storage reserve = reserves[asset];
        uint256 scaledDebt = IDebtToken(reserve.debtToken).scaledTotalSupply();
        return (scaledDebt * reserve.variableBorrowIndex) / RAY;
    }

    function _gTokenBalance(address asset, address user, uint256 index) internal view returns (uint256) {
        uint256 scaled = IGoodLendToken(reserves[asset].gToken).scaledBalanceOf(user);
        return (scaled * index) / RAY;
    }

    function _debtBalance(address asset, address user, uint256 index) internal view returns (uint256) {
        uint256 scaled = IDebtToken(reserves[asset].debtToken).scaledBalanceOf(user);
        return (scaled * index) / RAY;
    }

    function _calculateHealthFactor(address user) internal view returns (
        uint256 healthFactor,
        uint256 totalCollateralUSD,
        uint256 totalDebtUSD
    ) {
        uint256 totalCollateralThresholdUSD = 0;

        for (uint256 i = 0; i < reservesList.length; i++) {
            address asset = reservesList[i];
            if (!reserves[asset].isActive) continue;

            uint256 price = oracle.getAssetPrice(asset);
            if (price == 0) continue;

            // Per-asset accumulation extracted to keep loop body stack-depth within
            // the EVM limit when the optimizer is disabled (forge coverage).
            (uint256 colUSD, uint256 debtUSD, uint256 threshUSD) =
                _accumulateAssetValues(asset, user, price);
            totalCollateralUSD          += colUSD;
            totalDebtUSD                += debtUSD;
            totalCollateralThresholdUSD += threshUSD;
        }

        if (totalDebtUSD == 0) {
            healthFactor = type(uint256).max; // No debt = infinite health
        } else {
            healthFactor = (totalCollateralThresholdUSD * RAY) / totalDebtUSD;
        }
    }

    /**
     * @dev Return the USD collateral value, debt value, and threshold-weighted collateral
     *      for a single reserve/user pair.  Extracted from `_calculateHealthFactor` to
     *      reduce stack depth for forge coverage (optimizer disabled).
     */
    function _accumulateAssetValues(
        address asset,
        address user,
        uint256 price
    ) internal view returns (
        uint256 collateralValueUSD,
        uint256 debtValueUSD,
        uint256 collateralThresholdUSD
    ) {
        ReserveData storage reserve = reserves[asset];
        // Use view-index helpers so pending interest is included in the HF calculation.
        uint256 liqIdx = getLiquidityIndex(asset);
        uint256 borIdx = getBorrowIndex(asset);

        uint256 collateral = _gTokenBalance(asset, user, liqIdx);
        if (collateral > 0) {
            collateralValueUSD    = (collateral * price) / (10 ** reserve.decimals);
            collateralThresholdUSD = (collateralValueUSD * reserve.liquidationThresholdBPS) / BPS;
        }

        uint256 debt = _debtBalance(asset, user, borIdx);
        if (debt > 0) {
            debtValueUSD = (debt * price) / (10 ** reserve.decimals);
        }
    }
}
