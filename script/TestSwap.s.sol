// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";

interface ISwapRouter {
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256 amountOut);
    function getAmountOut(uint256 amountIn, address tokenIn, address tokenOut) external view returns (uint256);
}

interface ISwapERC20 {
    function approve(address spender, uint256 amount) external returns (bool);
    function balanceOf(address) external view returns (uint256);
    function mint(address to, uint256 amount) external;
}

contract TestSwap is Script {
    address constant ROUTER    = 0x975Ab64F4901Af5f0C96636deA0b9de3419D0c2F;
    address constant SWAP_GD   = 0x547382C0D1b23f707918D3c83A77317B71Aa8470;
    address constant SWAP_WETH = 0x7C8BaafA542c57fF9B2B90612bf8aB9E86e22C09;

    function run() external {
        uint256 key = vm.envOr(
            "PRIVATE_KEY",
            uint256(0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80)
        );
        address deployer = vm.addr(key);

        uint256 amountIn = 3_000e18; // 3000 G$

        // Read-only quote first
        uint256 expectedOut = ISwapRouter(ROUTER).getAmountOut(amountIn, SWAP_GD, SWAP_WETH);
        console.log("Quote: 3000 G$ -> WETH expected:", expectedOut);

        vm.startBroadcast(key);

        // Mint test tokens for deployer
        ISwapERC20(SWAP_GD).mint(deployer, amountIn);

        uint256 wethBefore = ISwapERC20(SWAP_WETH).balanceOf(deployer);

        // Approve router to spend G$
        ISwapERC20(SWAP_GD).approve(ROUTER, amountIn);

        // Execute swap: 3000 G$ -> WETH, min = expectedOut (exact quote)
        address[] memory path = new address[](2);
        path[0] = SWAP_GD;
        path[1] = SWAP_WETH;

        uint256 received = ISwapRouter(ROUTER).swapExactTokensForTokens(
            amountIn,
            expectedOut,
            path,
            deployer,
            block.timestamp + 3600
        );

        uint256 wethAfter = ISwapERC20(SWAP_WETH).balanceOf(deployer);

        vm.stopBroadcast();

        console.log("Swap executed!");
        console.log("  WETH received:", received);
        console.log("  WETH balance delta:", wethAfter - wethBefore);
        console.log("SUCCESS: live swap verified on devnet");
    }
}
