// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/oracle/StockOracleV2.sol";

/**
 * @title DeployStockOracleV2
 * @notice Deploys StockOracleV2 with initial signers and registers stock symbols.
 *
 * Usage (devnet):
 *   forge script script/DeployStockOracleV2.s.sol --rpc-url http://localhost:8545 \
 *     --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
 *     --broadcast
 */
contract DeployStockOracleV2 is Script {
    function run() external {
        uint256 deployerKey = vm.envOr("DEPLOYER_KEY",
            uint256(0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80));
        address deployer = vm.addr(deployerKey);

        // For devnet: single signer = deployer, quorum = 1
        address signer1 = vm.envOr("ORACLE_SIGNER_1", deployer);
        address signer2 = vm.envOr("ORACLE_SIGNER_2", address(0));
        address signer3 = vm.envOr("ORACLE_SIGNER_3", address(0));

        address[] memory signersList;
        uint256 quorumVal;

        if (signer3 != address(0)) {
            signersList = new address[](3);
            signersList[0] = signer1;
            signersList[1] = signer2;
            signersList[2] = signer3;
            quorumVal = vm.envOr("ORACLE_QUORUM", uint256(2));
        } else if (signer2 != address(0)) {
            signersList = new address[](2);
            signersList[0] = signer1;
            signersList[1] = signer2;
            quorumVal = vm.envOr("ORACLE_QUORUM", uint256(2));
        } else {
            signersList = new address[](1);
            signersList[0] = signer1;
            quorumVal = 1;
        }

        vm.startBroadcast(deployerKey);

        StockOracleV2 oracle = new StockOracleV2(deployer, signersList, quorumVal);
        console.log("StockOracleV2 deployed at:", address(oracle));
        console.log("  Signers:", signersList.length);
        console.log("  Quorum:", quorumVal);

        string[10] memory symbols = [
            "AAPL", "TSLA", "NVDA", "MSFT", "META",
            "AMZN", "GOOGL", "SPY", "QQQ", "NFLX"
        ];

        for (uint256 i = 0; i < symbols.length; i++) {
            oracle.registerSymbol(symbols[i], 30, 1000);
        }

        console.log("Registered 10 stock symbols");

        uint256[10] memory seedPrices = [
            uint256(19_150_000_000),   // AAPL $191.50
            uint256(17_830_000_000),   // TSLA $178.30
            uint256(13_095_000_000),   // NVDA $130.95
            uint256(43_200_000_000),   // MSFT $432.00
            uint256(51_020_000_000),   // META $510.20
            uint256(18_650_000_000),   // AMZN $186.50
            uint256(17_580_000_000),   // GOOGL $175.80
            uint256(52_800_000_000),   // SPY $528.00
            uint256(44_200_000_000),   // QQQ $442.00
            uint256(72_100_000_000)    // NFLX $721.00
        ];

        for (uint256 i = 0; i < symbols.length; i++) {
            oracle.updatePrice(
                symbols[i],
                seedPrices[i],
                block.timestamp,
                StockOracleV2.SessionState.Open,
                90
            );
        }

        console.log("Seeded initial stock prices");

        vm.stopBroadcast();
    }
}
