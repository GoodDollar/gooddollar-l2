// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// @title Multicall3 (devnet-safe, no-assembly variant)
/// @notice Aggregate results from multiple function calls in a single RPC
///         request. ABI-compatible with the canonical Multicall3
///         (https://github.com/mds1/multicall) so wagmi/viem's
///         `useReadContracts` hook and viem's `multicall` action work
///         out of the box.
/// @dev    Vendored into this repo so we can inject the runtime bytecode
///         at the canonical address `0xcA11bde05977b3631167028862bE2a173976CA11`
///         on our Anvil devnet via `anvil_setCode`. The original
///         Multicall3 uses inline assembly for hot-path gas savings;
///         this variant uses plain Solidity to stay portable across the
///         solc / via-IR settings already in `foundry.toml`. The external
///         ABI (function selectors, struct layout, return shapes) is
///         identical, which is all the off-chain tooling cares about.
contract Multicall3 {
    struct Call {
        address target;
        bytes callData;
    }

    struct Call3 {
        address target;
        bool allowFailure;
        bytes callData;
    }

    struct Call3Value {
        address target;
        bool allowFailure;
        uint256 value;
        bytes callData;
    }

    struct Result {
        bool success;
        bytes returnData;
    }

    function aggregate(Call[] calldata calls)
        public
        payable
        returns (uint256 blockNumber, bytes[] memory returnData)
    {
        blockNumber = block.number;
        uint256 length = calls.length;
        returnData = new bytes[](length);
        for (uint256 i = 0; i < length;) {
            (bool success, bytes memory ret) = calls[i].target.call(calls[i].callData);
            require(success, "Multicall3: call failed");
            returnData[i] = ret;
            unchecked {
                ++i;
            }
        }
    }

    function tryAggregate(bool requireSuccess, Call[] calldata calls)
        public
        payable
        returns (Result[] memory returnData)
    {
        uint256 length = calls.length;
        returnData = new Result[](length);
        for (uint256 i = 0; i < length;) {
            (bool success, bytes memory ret) = calls[i].target.call(calls[i].callData);
            if (requireSuccess) {
                require(success, "Multicall3: call failed");
            }
            returnData[i] = Result(success, ret);
            unchecked {
                ++i;
            }
        }
    }

    function tryBlockAndAggregate(bool requireSuccess, Call[] calldata calls)
        public
        payable
        returns (uint256 blockNumber, bytes32 blockHash, Result[] memory returnData)
    {
        blockNumber = block.number;
        blockHash = blockhash(block.number);
        returnData = tryAggregate(requireSuccess, calls);
    }

    function blockAndAggregate(Call[] calldata calls)
        public
        payable
        returns (uint256 blockNumber, bytes32 blockHash, Result[] memory returnData)
    {
        (blockNumber, blockHash, returnData) = tryBlockAndAggregate(true, calls);
    }

    function aggregate3(Call3[] calldata calls)
        public
        payable
        returns (Result[] memory returnData)
    {
        uint256 length = calls.length;
        returnData = new Result[](length);
        for (uint256 i = 0; i < length;) {
            (bool success, bytes memory ret) = calls[i].target.call(calls[i].callData);
            if (!success && !calls[i].allowFailure) {
                revert("Multicall3: call failed");
            }
            returnData[i] = Result(success, ret);
            unchecked {
                ++i;
            }
        }
    }

    function aggregate3Value(Call3Value[] calldata calls)
        public
        payable
        returns (Result[] memory returnData)
    {
        uint256 valAccumulator;
        uint256 length = calls.length;
        returnData = new Result[](length);
        for (uint256 i = 0; i < length;) {
            uint256 val = calls[i].value;
            unchecked {
                valAccumulator += val;
            }
            (bool success, bytes memory ret) =
                calls[i].target.call{value: val}(calls[i].callData);
            if (!success && !calls[i].allowFailure) {
                revert("Multicall3: call failed");
            }
            returnData[i] = Result(success, ret);
            unchecked {
                ++i;
            }
        }
        require(msg.value == valAccumulator, "Multicall3: value mismatch");
    }

    function getBlockHash(uint256 blockNumber) public view returns (bytes32 blockHash) {
        blockHash = blockhash(blockNumber);
    }

    function getBlockNumber() public view returns (uint256 blockNumber) {
        blockNumber = block.number;
    }

    function getCurrentBlockCoinbase() public view returns (address coinbase) {
        coinbase = block.coinbase;
    }

    function getCurrentBlockGasLimit() public view returns (uint256 gaslimit) {
        gaslimit = block.gaslimit;
    }

    function getCurrentBlockTimestamp() public view returns (uint256 timestamp) {
        timestamp = block.timestamp;
    }

    function getEthBalance(address addr) public view returns (uint256 balance) {
        balance = addr.balance;
    }

    function getLastBlockHash() public view returns (bytes32 blockHash) {
        blockHash = blockhash(block.number - 1);
    }

    function getBasefee() public view returns (uint256 basefee) {
        basefee = block.basefee;
    }

    function getChainId() public view returns (uint256 chainid) {
        chainid = block.chainid;
    }
}
