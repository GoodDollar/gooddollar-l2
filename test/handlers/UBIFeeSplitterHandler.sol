// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../../src/UBIFeeSplitter.sol";
import "../../src/GoodDollarToken.sol";

contract UBIFeeSplitterHandler {
    UBIFeeSplitter public splitter;
    GoodDollarToken public gd;

    address public dAppRecipient;

    uint256 public totalFeesSent;
    uint256 public totalUBIReceived;
    uint256 public totalProtocolReceived;
    uint256 public totalDAppReceived;
    uint256 public callCount;

    constructor(
        UBIFeeSplitter _splitter,
        GoodDollarToken _gd,
        address _dAppRecipient
    ) {
        splitter = _splitter;
        gd = _gd;
        dAppRecipient = _dAppRecipient;
    }

    function splitFee(uint128 _amount) external {
        uint256 amount = uint256(_amount);
        if (amount == 0) return;
        if (amount > gd.balanceOf(address(this))) return;

        gd.approve(address(splitter), amount);
        (uint256 ubi, uint256 protocol, uint256 dApp) = splitter.splitFee(amount, dAppRecipient);

        totalFeesSent += amount;
        totalUBIReceived += ubi;
        totalProtocolReceived += protocol;
        totalDAppReceived += dApp;
        callCount++;
    }
}
