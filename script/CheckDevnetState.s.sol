// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/perps/PerpEngine.sol";
import "../src/perps/PerpPriceOracle.sol";

/**
 * @title CheckDevnetState
 * @notice Diagnostic script to check the current state of devnet contracts.
 */
contract CheckDevnetState is Script {
    address constant PERP_ENGINE      = 0x666D0c3da3dBc946D5128D06115bb4eed4595580;
    address constant PERP_ORACLE      = 0xf5c4a909455C00B99A90d93b48736F3196DB5621;
    address constant STOCKS_ORACLE    = 0xD0141E899a65C95a556fE2B27e5982A6DE7fDD7A;

    function run() external view {
        PerpEngine engine = PerpEngine(PERP_ENGINE);
        PerpPriceOracle oracle = PerpPriceOracle(PERP_ORACLE);

        console.log("=== PerpEngine ===");
        console.log("  admin:       ", engine.admin());
        console.log("  marketCount: ", engine.marketCount());
        console.log("  paused:      ", engine.paused());

        console.log("=== StocksPriceOracle code size ===");
        uint256 sz;
        address so = STOCKS_ORACLE;
        assembly { sz := extcodesize(so) }
        console.log("  codeSize:", sz);
    }
}
