// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title IERC20Transfer
/// @notice Minimal ERC20 surface used by UBIFeeSplitter-style contracts (subset of IERC20).
interface IERC20Transfer {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}
