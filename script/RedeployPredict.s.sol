// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/predict/MarketFactory.sol";

/**
 * @title RedeployPredict
 * @notice Redeploys MarketFactory (which creates its own ConditionalTokens)
 *         to get verifiable bytecode on Blockscout.
 */
contract RedeployPredict is Script {
    address constant GOOD_DOLLAR     = 0x36C02dA8a0983159322a80FFE9F24b1acfF8B570;
    address constant UBI_FEE_SPLITTER= 0x976fcd02f7C4773dd89C309fBF55D5923B4c98a1;
    address constant ADMIN           = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;

    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(pk);

        MarketFactory mf = new MarketFactory(GOOD_DOLLAR, UBI_FEE_SPLITTER, ADMIN);
        console.log("MarketFactory:", address(mf));
        console.log("ConditionalTokens:", address(mf.tokens()));

        vm.stopBroadcast();
    }
}
