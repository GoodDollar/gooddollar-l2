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
    address constant GOOD_DOLLAR_DEFAULT      = 0x5FbDB2315678afecb367f032d93F642f64180aa3;
    address constant UBI_FEE_SPLITTER_DEFAULT = 0xC0BF43A4Ca27e0976195E6661b099742f10507e5;
    address constant ADMIN                    = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;

    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address goodDollar = vm.envOr("GOOD_DOLLAR_TOKEN", GOOD_DOLLAR_DEFAULT);
        address feeSplitter = vm.envOr("UBI_FEE_SPLITTER", UBI_FEE_SPLITTER_DEFAULT);
        vm.startBroadcast(pk);

        MarketFactory mf = new MarketFactory(goodDollar, feeSplitter, ADMIN);
        console.log("MarketFactory:", address(mf));
        console.log("ConditionalTokens:", address(mf.tokens()));

        vm.stopBroadcast();
    }
}
