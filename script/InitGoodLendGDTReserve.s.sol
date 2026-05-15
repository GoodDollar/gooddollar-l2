// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/lending/GoodLendPool.sol";
import "../src/lending/GoodLendToken.sol";
import "../src/lending/DebtToken.sol";
import "../src/lending/InterestRateModel.sol";
import "../src/lending/SimplePriceOracle.sol";

/**
 * @title InitGoodLendGDTReserve
 * @notice Adds the GoodDollar (GDT) reserve to the already-deployed GoodLendPool
 *         so the integration verifier can supply GDT against a live reserve.
 *
 *         The pool's USDC and WETH reserves were configured by DeployGoodLend.s.sol,
 *         but GDT was never wired up — `cast call pool.getReserveData(GDT)` reverts.
 *
 *         This script:
 *           1. Reads the existing pool, oracle, and rate-model from the chain.
 *           2. Deploys a new gGDT (GoodLendToken) and dGDT (DebtToken) bound to the pool.
 *           3. Sets oracle price for GDT to $1 (matches PSM oracle assumption).
 *           4. Sets two-slope rate params for GDT on the InterestRateModel.
 *           5. Calls pool.initReserve(GDT, gGDT, dGDT, ...) as the pool admin.
 *
 *         Idempotency: re-running this script will deploy fresh receipt tokens but
 *         the `initReserve` call will revert with "asset already initialized"; that
 *         signals a no-op for the verifier (the existing reserve is still usable).
 *
 *         Usage:
 *           GDT=0x... LEND=0x... \
 *             forge script script/InitGoodLendGDTReserve.s.sol \
 *             --rpc-url http://localhost:8545 --broadcast --legacy
 */
contract InitGoodLendGDTReserve is Script {
    uint256 constant RAY = 1e27;

    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address gdt  = vm.envAddress("GDT");
        address lend = vm.envAddress("LEND");

        GoodLendPool pool = GoodLendPool(lend);

        // 1. Pull oracle + rate model from the pool itself so we never drift.
        SimplePriceOracle  oracle    = SimplePriceOracle(address(pool.oracle()));
        InterestRateModel  rateModel = InterestRateModel(address(pool.interestRateModel()));

        console.log("Pool:      ", lend);
        console.log("Oracle:    ", address(oracle));
        console.log("RateModel: ", address(rateModel));
        console.log("GDT:       ", gdt);

        vm.startBroadcast(deployerKey);

        // 2. Deploy receipt tokens bound to this pool.
        GoodLendToken gGDT = new GoodLendToken(lend, gdt, "GoodLend GDT", "gGDT");
        DebtToken     dGDT = new DebtToken    (lend, gdt, "GoodLend Debt GDT", "dGDT");
        console.log("gGDT:      ", address(gGDT));
        console.log("dGDT:      ", address(dGDT));

        // 3. Oracle: GDT pegged to $1 (1e8 — SimplePriceOracle uses 8-decimal feeds).
        oracle.setAssetPrice(gdt, 1e8);

        // 4. Rate params: 80% optimal, 1% base, 4% slope1, 60% slope2 (mirrors USDC profile).
        rateModel.setRateParams(gdt, 0.80e27, 0.01e27, 0.04e27, 0.60e27);

        // 5. Initialize the reserve.
        //    Conservative GDT params — high LTV is OK because GDT is the protocol's native unit.
        //    reserve factor 20%, LTV 70%, liq threshold 80%, liq bonus 5%, big caps for devnet.
        pool.initReserve(
            gdt,
            address(gGDT),
            address(dGDT),
            2000,         // reserve factor BPS
            7000,         // LTV BPS
            8000,         // liquidation threshold BPS
            10500,        // liquidation bonus BPS
            10_000_000,   // supply cap (10M GDT)
            8_000_000,    // borrow cap (8M GDT)
            18            // decimals
        );

        vm.stopBroadcast();

        console.log("--- GDT reserve initialised ---");
        console.log("Add to .autobuilder/addresses.env:");
        console.log("G_GDT=", address(gGDT));
        console.log("D_GDT=", address(dGDT));
    }
}
