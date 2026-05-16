// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title VaultManager
 * @notice CDP engine for GoodStable, inspired by MakerDAO's Vat.
 *
 * Architecture:
 *   - Vaults are keyed by (ilk, owner): mapping(bytes32 => mapping(address => Vault))
 *   - Stability fees accrue per second via a per-ilk rate accumulator (chi, RAY-scaled)
 *   - drip(ilk) must be called before any state-changing vault operation
 *   - Liquidation routes to StabilityPool first; any remainder goes to liquidator
 *   - 20% of stability fees go to UBI via UBIFeeSplitter.splitFee()
 *
 * Math:
 *   WAD = 1e18, RAY = 1e27
 *   normalizedDebt * chi = actual gUSD owed
 *   healthFactor = (collateralValue * 1e18) / (actualDebt * liquidationRatio)
 *   vault is healthy iff healthFactor >= 1e18
 *
 * Fee routing:
 *   drip() collects accrued fees as gUSD and calls feeSplitter.splitFee()
 *   with the VaultManager's dApp address as recipient (protocol treasury).
 */

import "./interfaces/IGoodStable.sol";

/**
 * @notice Enhanced UBIFeeSplitter interface for better stability fee tracking.
 *         Only implemented by StableUBIFeeSplitter, not the standard UBIFeeSplitter.
 */
import "../interfaces/IStableUBIFeeSplitterEnhanced.sol";

contract VaultManager {
    // ============ Constants ============

    uint256 public constant WAD = 1e18;
    uint256 public constant RAY = 1e27;

    // ============ Structs ============

    struct Vault {
        uint256 collateral;     // raw token units locked
        uint256 normalizedDebt; // debt / chi at time of mint (normalized)
    }

    struct IlkAccumulator {
        uint256 chi;       // RAY — rate accumulator (starts at RAY = 1.0)
        uint256 lastDrip;  // timestamp of last drip
        uint256 totalNormalizedDebt; // sum of all normalizedDebt for this ilk
    }

    // ============ State ============

    IgUSD               public immutable gusd;
    ICollateralRegistry public immutable registry;
    IPriceOracle        public immutable oracle;
    IStabilityPool      public stabilityPool;
    IUBIFeeSplitter     public immutable feeSplitter;

    address public admin;
    /// @notice Pending admin for the two-step admin transfer (GOO-493).
    address public pendingAdmin;
    address public dAppRecipient;   // receives dApp share of stability fees
    bool    public paused;

    /// @notice ilk -> owner -> Vault
    mapping(bytes32 => mapping(address => Vault)) public vaults;

    /// @notice ilk -> rate accumulator state
    mapping(bytes32 => IlkAccumulator) public accumulators;

    /// @notice ilk -> total actual debt outstanding (in gUSD)
    mapping(bytes32 => uint256) public ilkDebt;

    // ============ Reentrancy ============
    // Uses 1=unlocked / 2=locked (not 0/1) so the slot is always non-zero.
    // Avoids the cold zero→non-zero SSTORE (20k gas) at function entry that
    // caused eth_estimateGas to underestimate by ~21k gas for the USDC ilk
    // (GOO-325). With this pattern, cold entry costs ~2900 gas instead of ~20k.

    uint256 private _locked = 1;
    modifier nonReentrant() {
        require(_locked == 1, "Reentrant");
        _locked = 2;
        _;
        _locked = 1;
    }

    // ============ Events ============

    event VaultOpened(address indexed owner, bytes32 indexed ilk);
    event CollateralDeposited(address indexed owner, bytes32 indexed ilk, uint256 amount);
    event CollateralWithdrawn(address indexed owner, bytes32 indexed ilk, uint256 amount);
    event GUSDMinted(address indexed owner, bytes32 indexed ilk, uint256 amount);
    event GUSDRepaid(address indexed owner, bytes32 indexed ilk, uint256 amount);
    event VaultClosed(address indexed owner, bytes32 indexed ilk);
    event VaultLiquidated(
        address indexed liquidator,
        address indexed owner,
        bytes32 indexed ilk,
        uint256 debtRepaid,
        uint256 collSeized
    );
    event FeeCollected(bytes32 indexed ilk, uint256 feeGUSD);
    event StabilityPoolSet(address pool);
    event Drip(bytes32 indexed ilk, uint256 newChi, uint256 feeAccrued);
    event AdminTransferProposed(address indexed currentAdmin, address indexed pendingAdmin);
    event AdminTransferred(address indexed previousAdmin, address indexed newAdmin);

    // ============ Constructor ============

    constructor(
        address _gusd,
        address _registry,
        address _oracle,
        address _feeSplitter,
        address _dAppRecipient,
        address _admin
    ) {
        require(_gusd           != address(0), "VM: zero gUSD");
        require(_registry       != address(0), "VM: zero registry");
        require(_oracle         != address(0), "VM: zero oracle");
        require(_feeSplitter    != address(0), "VM: zero splitter");
        require(_dAppRecipient  != address(0), "VM: zero dApp recipient");
        require(_admin          != address(0), "VM: zero admin");

        gusd           = IgUSD(_gusd);
        registry       = ICollateralRegistry(_registry);
        oracle         = IPriceOracle(_oracle);
        feeSplitter    = IUBIFeeSplitter(_feeSplitter);
        dAppRecipient  = _dAppRecipient;
        admin          = _admin;
    }

    // ============ Modifiers ============

    modifier onlyAdmin() {
        require(msg.sender == admin, "VM: not admin");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "VM: paused");
        _;
    }

    // ============ Admin ============

    function setStabilityPool(address _pool) external onlyAdmin {
        require(_pool != address(0), "VM: zero address");
        stabilityPool = IStabilityPool(_pool);
        emit StabilityPoolSet(_pool);
    }

    function setDAppRecipient(address _recipient) external onlyAdmin {
        require(_recipient != address(0), "VM: zero address");
        dAppRecipient = _recipient;
    }

    function setPaused(bool _paused) external onlyAdmin {
        paused = _paused;
    }

    /**
     * @notice Step 1 of the two-step admin transfer (GOO-493).
     *         The current admin proposes a new admin; ownership remains with
     *         the existing admin until the proposed admin calls `acceptAdmin`.
     */
    function transferAdmin(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "VM: zero address");
        pendingAdmin = newAdmin;
        emit AdminTransferProposed(admin, newAdmin);
    }

    /**
     * @notice Step 2 of the two-step admin transfer.
     *         Must be called by the previously proposed admin. Reverts otherwise.
     */
    function acceptAdmin() external {
        require(msg.sender == pendingAdmin, "VM: not pending admin");
        address previous = admin;
        admin = pendingAdmin;
        pendingAdmin = address(0);
        emit AdminTransferred(previous, admin);
    }

    // ============ Rate Accumulator ============

    /**
     * @notice Update the per-ilk chi accumulator and collect accrued stability fees.
     *         Must be called before any vault state change.
     */
    /// @dev External mint/approve/splitFee calls happen against trusted gusd + feeSplitter
    ///      contracts. Accumulator state updates inside this function are CEI-correct
    ///      (chi/lastDrip update before external mint+splitFee), but Slither flags
    ///      `ilkDebt`/`acc.chi` writes that occur in CALLERS after `drip()` returns.
    ///      That is the canonical MakerDAO pattern: drip settles the fee accumulator BEFORE
    ///      the caller mutates `totalNormalizedDebt`. Reordering would charge fees on debt
    ///      that does not yet exist. All callers use `nonReentrant`.
    // slither-disable-next-line reentrancy-no-eth
    function drip(bytes32 ilk) public {
        IlkAccumulator storage acc = accumulators[ilk];

        // Initialize accumulator on first use
        if (acc.chi == 0) {
            acc.chi = RAY;
            acc.lastDrip = block.timestamp;
            return;
        }

        uint256 elapsed = block.timestamp - acc.lastDrip;
        // slither-disable-next-line incorrect-equality
        if (elapsed == 0) return;

        ICollateralRegistry.CollateralConfig memory cfg = registry.getConfig(ilk);

        // Inline cfg.stabilityFeeRate to avoid an extra local variable on the stack.
        // forge coverage disables the optimizer, so every slot counts; _rpow uses assembly
        // which consumes several more slots, leaving no headroom.
        uint256 newChi = _rpow(cfg.stabilityFeeRate, elapsed, RAY);
        newChi = (acc.chi * newChi) / RAY;

        if (newChi <= acc.chi) {
            acc.lastDrip = block.timestamp;
            return;
        }

        uint256 chiDelta = newChi - acc.chi;
        acc.chi      = newChi;
        acc.lastDrip = block.timestamp;

        // Accrued fee = totalNormalizedDebt * chiDelta (in RAY)
        // Convert to WAD for gUSD
        uint256 feeRay = acc.totalNormalizedDebt * chiDelta;
        uint256 feeWAD = feeRay / RAY;

        // slither-disable-next-line incorrect-equality
        if (feeWAD == 0) {
            emit Drip(ilk, newChi, 0);
            return;
        }

        // Mint accrued fee gUSD and route to UBIFeeSplitter.
        // Use splitFeeToken (not splitFee) because stability fees are in gUSD,
        // not G$. splitFee would revert — it pulls G$ via transferFrom.
        gusd.mint(address(this), feeWAD);
        require(gusd.approve(address(feeSplitter), feeWAD), "VM: approve failed");

        // Try enhanced stability fee tracking if supported (StableUBIFeeSplitter)
        // Falls back to standard splitFeeToken if method doesn't exist
        try this._callStabilityFeeTracking(feeWAD, dAppRecipient, address(gusd), ilk) {
            // Enhanced tracking succeeded
        } catch {
            // Fallback to standard method for backward compatibility
            // slither-disable-next-line unused-return
            feeSplitter.splitFeeToken(feeWAD, dAppRecipient, address(gusd));
        }

        ilkDebt[ilk] += feeWAD;

        emit FeeCollected(ilk, feeWAD);
        emit Drip(ilk, newChi, feeWAD);
    }

    /**
     * @notice Helper function to call enhanced stability fee tracking.
     *         Attempts to use StableUBIFeeSplitter.splitStabilityFee() if available.
     * @dev This is called via try/catch to maintain compatibility with standard UBIFeeSplitter.
     */
    function _callStabilityFeeTracking(
        uint256 feeWAD,
        address _dAppRecipient,
        address token,
        bytes32 ilk
    ) external {
        require(msg.sender == address(this), "VM: only self");

        // Attempt enhanced tracking call (only works with StableUBIFeeSplitter)
        // If feeSplitter is standard UBIFeeSplitter, this will revert and fallback to splitFeeToken
        // slither-disable-next-line unused-return
        try IStableUBIFeeSplitterEnhanced(address(feeSplitter)).splitStabilityFee(
            feeWAD,
            _dAppRecipient,
            token,
            ilk
        ) returns (uint256, uint256, uint256) {
            // Enhanced tracking succeeded
        } catch {
            // This will revert, causing the try/catch in drip() to use fallback
            revert("Enhanced tracking not supported");
        }
    }

    // ============ Vault Lifecycle ============

    /**
     * @notice Open a vault for `ilk`. Vaults are implicitly created on first deposit,
     *         but this function emits an event and validates the ilk exists.
     */
    function openVault(bytes32 ilk) external whenNotPaused {
        ICollateralRegistry.CollateralConfig memory cfg = registry.getConfig(ilk);
        require(cfg.active, "VM: ilk not active");
        drip(ilk);
        emit VaultOpened(msg.sender, ilk);
    }

    /**
     * @notice Deposit collateral into caller's vault for `ilk`.
     * @param ilk    Collateral type key
     * @param amount Token amount to deposit (in collateral token decimals)
     */
    function depositCollateral(bytes32 ilk, uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "VM: zero amount");
        ICollateralRegistry.CollateralConfig memory cfg = registry.getConfig(ilk);
        require(cfg.active, "VM: ilk not active");

        drip(ilk);

        address token = cfg.token;
        require(
            IERC20(token).transferFrom(msg.sender, address(this), amount),
            "VM: collateral transfer failed"
        );

        vaults[ilk][msg.sender].collateral += amount;

        emit CollateralDeposited(msg.sender, ilk, amount);
    }

    /**
     * @notice Withdraw collateral from caller's vault.
     *         Vault must remain healthy after withdrawal.
     */
    function withdrawCollateral(bytes32 ilk, uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "VM: zero amount");

        drip(ilk);

        Vault storage vault = vaults[ilk][msg.sender];
        require(vault.collateral >= amount, "VM: insufficient collateral");

        vault.collateral -= amount;

        // Ensure vault stays healthy after withdrawal
        if (vault.normalizedDebt > 0) {
            require(_isHealthy(ilk, vault), "VM: vault unhealthy");
        }

        ICollateralRegistry.CollateralConfig memory cfg = registry.getConfig(ilk);
        require(
            IERC20(cfg.token).transfer(msg.sender, amount),
            "VM: collateral send failed"
        );

        emit CollateralWithdrawn(msg.sender, ilk, amount);
    }

    /**
     * @notice Mint gUSD against collateral in caller's vault.
     * @param ilk    Collateral type key
     * @param amount gUSD to mint (18 decimals)
     */
    /// @dev MakerDAO-style accumulator: `drip()` must settle the stability-fee chi BEFORE the new
    ///      mint changes `totalNormalizedDebt`; otherwise the fee would be charged against the new
    ///      debt as if it had been outstanding the whole time. `nonReentrant` blocks the cross-
    ///      function reentry path Slither warns about.
    // slither-disable-next-line reentrancy-no-eth
    function mintGUSD(bytes32 ilk, uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "VM: zero amount");

        drip(ilk);

        ICollateralRegistry.CollateralConfig memory cfg = registry.getConfig(ilk);
        require(cfg.active, "VM: ilk not active");

        IlkAccumulator storage acc = accumulators[ilk];
        uint256 chi = acc.chi == 0 ? RAY : acc.chi;

        // Normalized debt = gUSD / chi
        uint256 normalizedAmount = (amount * RAY) / chi;

        Vault storage vault = vaults[ilk][msg.sender];
        vault.normalizedDebt += normalizedAmount;
        acc.totalNormalizedDebt += normalizedAmount;

        // Check debt ceiling
        uint256 newActualDebt = (acc.totalNormalizedDebt * chi) / RAY;
        require(newActualDebt <= cfg.debtCeiling, "VM: debt ceiling exceeded");

        ilkDebt[ilk] = newActualDebt;

        // Check vault health
        require(_isHealthy(ilk, vault), "VM: collateral ratio too low");

        gusd.mint(msg.sender, amount);

        emit GUSDMinted(msg.sender, ilk, amount);
    }

    /**
     * @notice Repay gUSD debt on caller's vault.
     * @param ilk    Collateral type key
     * @param amount gUSD to repay (18 decimals). Use type(uint256).max to repay all.
     */
    // Note: repayGUSD intentionally omits whenNotPaused — users must always be able to
    // reduce their debt even during an emergency pause (prevents debt traps).
    /// @dev `drip()` must run first so chi reflects accrued fees BEFORE we reduce
    ///      `totalNormalizedDebt`; reordering would leak fees on the repaid portion.
    ///      `nonReentrant` blocks cross-function reentry.
    // slither-disable-next-line reentrancy-no-eth
    function repayGUSD(bytes32 ilk, uint256 amount) external nonReentrant {
        drip(ilk);

        Vault storage vault = vaults[ilk][msg.sender];
        IlkAccumulator storage acc = accumulators[ilk];
        uint256 chi = acc.chi == 0 ? RAY : acc.chi;

        // Compute actual debt outstanding
        uint256 actualDebt = (vault.normalizedDebt * chi) / RAY;

        // Clamp to actual debt
        if (amount > actualDebt) amount = actualDebt;
        require(amount > 0, "VM: nothing to repay");

        // Normalize repayment amount
        uint256 normalizedRepay = (amount * RAY) / chi;
        if (normalizedRepay > vault.normalizedDebt) {
            normalizedRepay = vault.normalizedDebt;
        }

        vault.normalizedDebt         -= normalizedRepay;
        acc.totalNormalizedDebt      -= normalizedRepay;

        uint256 newIlkDebt = acc.totalNormalizedDebt * chi / RAY;
        ilkDebt[ilk] = newIlkDebt;

        gusd.burnFrom(msg.sender, amount);

        emit GUSDRepaid(msg.sender, ilk, amount);
    }

    /**
     * @notice Close vault: repay all debt and withdraw all collateral in one call.
     */
    /// @dev `drip()` settles fees before debt is zeroed; ordering is required by the chi
    ///      accumulator. `nonReentrant` blocks cross-function reentry via the gusd/collateral
    ///      tokens.
    // slither-disable-next-line reentrancy-no-eth
    function closeVault(bytes32 ilk) external nonReentrant whenNotPaused {
        drip(ilk);

        Vault storage vault = vaults[ilk][msg.sender];
        IlkAccumulator storage acc = accumulators[ilk];
        uint256 chi = acc.chi == 0 ? RAY : acc.chi;

        uint256 actualDebt = (vault.normalizedDebt * chi) / RAY;

        if (actualDebt > 0) {
            acc.totalNormalizedDebt -= vault.normalizedDebt;
            vault.normalizedDebt = 0;
            ilkDebt[ilk] = (acc.totalNormalizedDebt * chi) / RAY;
            gusd.burnFrom(msg.sender, actualDebt);
            emit GUSDRepaid(msg.sender, ilk, actualDebt);
        }

        uint256 collateral = vault.collateral;
        if (collateral > 0) {
            vault.collateral = 0;
            ICollateralRegistry.CollateralConfig memory cfg = registry.getConfig(ilk);
            require(
                IERC20(cfg.token).transfer(msg.sender, collateral),
                "VM: collateral send failed"
            );
            emit CollateralWithdrawn(msg.sender, ilk, collateral);
        }

        emit VaultClosed(msg.sender, ilk);
    }

    // ============ Liquidation ============

    /**
     * @notice Liquidate an unhealthy vault.
     *         The liquidator does NOT need to provide any funds themselves.
     *         Instead:
     *         1. StabilityPool offsets as much debt as it can (burning pool gUSD).
     *         2. Any remaining debt is repaid by the liquidator directly.
     *         3. Seized collateral (plus penalty) goes to SP first, remainder to liquidator.
     *
     * @param ilk   Collateral type key
     * @param owner Vault owner to liquidate
     */
    /// @dev `drip()` settles chi before we mark the vault as liquidated; ordering is required
    ///      so liquidation uses the up-to-date debt. `nonReentrant` blocks cross-function reentry
    ///      via the gusd/collateral tokens and the StabilityPool offset hook.
    // slither-disable-next-line reentrancy-no-eth
    function liquidate(bytes32 ilk, address owner) external nonReentrant whenNotPaused {
        require(owner != address(0), "VM: zero owner");

        drip(ilk);

        Vault storage vault = vaults[ilk][owner];
        require(vault.normalizedDebt > 0, "VM: vault has no debt");
        require(!_isHealthy(ilk, vault), "VM: vault is healthy");

        ICollateralRegistry.CollateralConfig memory cfg = registry.getConfig(ilk);
        IlkAccumulator storage acc = accumulators[ilk];
        uint256 chi = acc.chi == 0 ? RAY : acc.chi;

        uint256 actualDebt = (vault.normalizedDebt * chi) / RAY;
        uint256 collateral = vault.collateral;

        // Seize all collateral (vault is unhealthy, so all collateral covers debt + penalty)
        uint256 seizedCollateral = collateral;

        // Wipe vault state
        acc.totalNormalizedDebt -= vault.normalizedDebt;
        vault.normalizedDebt = 0;
        vault.collateral     = 0;
        ilkDebt[ilk] = (acc.totalNormalizedDebt * chi) / RAY;

        // Stability pool offset extracted to helper to keep stack depth within EVM limit
        // (forge coverage disables the optimizer, so every local variable counts).
        address colToken = cfg.token;
        (uint256 spDebt, uint256 spColl) =
            _offsetWithStabilityPool(actualDebt, seizedCollateral, ilk, colToken);
        uint256 liqColl = seizedCollateral - spColl;

        // Remaining debt after SP offset
        uint256 remainingDebt = actualDebt - spDebt;

        if (remainingDebt > 0) {
            // Liquidator covers remaining debt
            gusd.burnFrom(msg.sender, remainingDebt);
        }

        // Send remaining collateral to liquidator
        if (liqColl > 0) {
            require(
                IERC20(colToken).transfer(msg.sender, liqColl),
                "VM: liquidator collateral send failed"
            );
        }

        emit VaultLiquidated(msg.sender, owner, ilk, actualDebt, seizedCollateral);
    }

    // ============ Internal helpers ============

    /**
     * @dev Runs the StabilityPool offset step of a liquidation.
     *      Extracted from `liquidate` to keep that function's stack depth within the
     *      EVM limit when forge coverage disables the optimizer.
     *
     * @return spDebt  Amount of debt absorbed by the StabilityPool.
     * @return spColl  Amount of collateral transferred to the StabilityPool.
     */
    function _offsetWithStabilityPool(
        uint256 actualDebt,
        uint256 seizedCollateral,
        bytes32 ilk,
        address colToken
    ) internal returns (uint256 spDebt, uint256 spColl) {
        if (address(stabilityPool) == address(0)) return (0, 0);

        uint256 spBalance = stabilityPool.totalDeposits();
        if (spBalance == 0) return (0, 0);

        // SP absorbs up to min(spBalance, actualDebt)
        spDebt = actualDebt < spBalance ? actualDebt : spBalance;

        // Proportional collateral: spColl = seizedCollateral * spDebt / actualDebt
        if (actualDebt > 0) {
            spColl = (seizedCollateral * spDebt) / actualDebt;
        }

        if (spColl > 0 && spDebt > 0) {
            require(IERC20(colToken).approve(address(stabilityPool), spColl), "VM: approve failed");
            stabilityPool.offset(spDebt, ilk, spColl);
        }
    }

    /**
     * @notice Returns true if vault health factor >= 1.0 (healthy).
     *   healthFactor = collateralValue * WAD / (actualDebt * liquidationRatio)
     */
    function _isHealthy(bytes32 ilk, Vault storage vault) internal view returns (bool) {
        if (vault.normalizedDebt == 0) return true;

        IlkAccumulator storage acc = accumulators[ilk];
        uint256 chi = acc.chi == 0 ? RAY : acc.chi;
        // slither-disable-start divide-before-multiply
        uint256 actualDebt = (vault.normalizedDebt * chi) / RAY;

        if (actualDebt == 0) return true;

        ICollateralRegistry.CollateralConfig memory cfg = registry.getConfig(ilk);
        uint256 price = oracle.getPrice(ilk);

        uint256 collValueWAD = _collateralToGUSD(vault.collateral, price, cfg.token);

        // healthFactor = collValue * WAD / (debt * liquidationRatio / WAD)
        //             = collValue * WAD * WAD / (debt * liquidationRatio)
        uint256 debtTimesRatio = actualDebt * cfg.liquidationRatio / WAD;
        // slither-disable-end divide-before-multiply
        if (debtTimesRatio == 0) return true;

        uint256 vaultHealthFactor = (collValueWAD * WAD) / debtTimesRatio;
        return vaultHealthFactor >= WAD;
    }

    /**
     * @notice Convert raw collateral amount to gUSD value (18-decimal).
     *         Handles token decimals: fetches from token if needed.
     *         For gas efficiency, USDC (6-decimal) must be scaled up.
     */
    function _collateralToGUSD(
        uint256 collAmount,
        uint256 price18,
        address token
    ) internal view returns (uint256) {
        // Fetch decimals directly — silent failure would silently mis-scale amounts (GOO-197)
        uint8 dec = IERC20Decimals(token).decimals();

        uint256 normalized;
        if (dec < 18) {
            normalized = collAmount * (10 ** (18 - dec));
        } else if (dec > 18) {
            normalized = collAmount / (10 ** (dec - 18));
        } else {
            normalized = collAmount;
        }

        // value = normalized * price / WAD
        return (normalized * price18) / WAD;
    }

    /**
     * @dev RAY-precision exponentiation (binary exponentiation).
     *      result = base^n with base and result in RAY units.
     *
     *      Originally implemented with inline assembly for gas efficiency.
     *      Rewritten in pure Solidity so that forge coverage (which disables
     *      the optimizer) can compile it — the assembly version exceeds the
     *      EVM stack limit after coverage instrumentation adds extra slots.
     */
    function _rpow(uint256 x, uint256 n, uint256 base) internal pure returns (uint256 z) {
        if (x == 0) {
            // slither-disable-next-line incorrect-equality
            return n == 0 ? base : 0;
        }
        // SECURITY: `n % 2` is the standard exponentiation-by-squaring parity check on the
        // exponent (loop control), not a source of randomness. There is no PRNG here. False
        // positive for weak-prng.
        // slither-disable-next-line weak-prng
        z = n % 2 != 0 ? x : base;
        uint256 half = base / 2;
        // slither-disable-start divide-before-multiply
        for (n /= 2; n != 0; n /= 2) {
            uint256 xx = x * x;
            require(x == 0 || xx / x == x, "rpow/overflow");
            uint256 xxRound = xx + half;
            require(xxRound >= xx, "rpow/overflow");
            x = xxRound / base;
            // SECURITY: Same exponentiation-by-squaring parity check on the exponent. Not a PRNG.
            // slither-disable-next-line weak-prng
            if (n % 2 != 0) {
                uint256 zx = z * x;
                require(x == 0 || zx / x == z, "rpow/overflow");
                uint256 zxRound = zx + half;
                require(zxRound >= zx, "rpow/overflow");
                z = zxRound / base;
            }
        }
        // slither-disable-end divide-before-multiply
    }

    // ============ Views ============

    /**
     * @notice Current actual debt for a vault (includes accrued fees).
     */
    function vaultDebt(bytes32 ilk, address owner) external view returns (uint256) {
        Vault storage vault = vaults[ilk][owner];
        IlkAccumulator storage acc = accumulators[ilk];
        uint256 chi = acc.chi == 0 ? RAY : acc.chi;
        return (vault.normalizedDebt * chi) / RAY;
    }

    /**
     * @notice Health factor of a vault (WAD-scaled). >= 1e18 is healthy.
     */
    function healthFactor(bytes32 ilk, address owner) external view returns (uint256) {
        Vault storage vault = vaults[ilk][owner];
        // slither-disable-next-line incorrect-equality
        if (vault.normalizedDebt == 0) return type(uint256).max;

        IlkAccumulator storage acc = accumulators[ilk];
        uint256 chi = acc.chi == 0 ? RAY : acc.chi;
        // slither-disable-start divide-before-multiply
        uint256 actualDebt = (vault.normalizedDebt * chi) / RAY;
        if (actualDebt == 0) return type(uint256).max;

        ICollateralRegistry.CollateralConfig memory cfg = registry.getConfig(ilk);
        uint256 price = oracle.getPrice(ilk);
        uint256 collValueWAD = _collateralToGUSD(vault.collateral, price, cfg.token);

        uint256 debtTimesRatio = actualDebt * cfg.liquidationRatio / WAD;
        // slither-disable-end divide-before-multiply
        // slither-disable-next-line incorrect-equality
        if (debtTimesRatio == 0) return type(uint256).max;

        return (collValueWAD * WAD) / debtTimesRatio;
    }

    /**
     * @notice Preview accrued (but not yet dripped) stability fee for an ilk.
     */
    function pendingFee(bytes32 ilk) external view returns (uint256) {
        IlkAccumulator storage acc = accumulators[ilk];
        // slither-disable-next-line incorrect-equality
        if (acc.chi == 0 || acc.totalNormalizedDebt == 0) return 0;

        ICollateralRegistry.CollateralConfig memory cfg = registry.getConfig(ilk);
        uint256 elapsed = block.timestamp - acc.lastDrip;
        // slither-disable-next-line incorrect-equality
        if (elapsed == 0) return 0;

        uint256 newChi = _rpow(cfg.stabilityFeeRate, elapsed, RAY);
        newChi = (acc.chi * newChi) / RAY;
        if (newChi <= acc.chi) return 0;

        uint256 chiDelta = newChi - acc.chi;
        return (acc.totalNormalizedDebt * chiDelta) / RAY;
    }
}

// IERC20Decimals is imported from ./interfaces/IGoodStable.sol
