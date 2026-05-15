// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";

interface IUBIFeeSplitterMin {
    function admin() external view returns (address);
    function goodDollar() external view returns (address);
    function setGoodDollar(address) external;
}

/// @notice Idempotently rebinds the live UBIFeeSplitter to the current GDT
///         address (Phase 1 / initiative 0002, task 0010).
/// @dev    Run on devnet:
///           source .autobuilder/addresses.env
///           forge script script/RebindUBIFeeSplitterGoodDollar.s.sol \
///             --rpc-url $RPC --private-key $DEPLOYER_KEY --broadcast --legacy
contract RebindUBIFeeSplitterGoodDollar is Script {
    address constant SPLITTER_DEFAULT =
        0x809d550fca64d94Bd9F66E60752A544199cfAC3D;
    address constant GDT_DEFAULT =
        0x8f86403A4DE0BB5791fa46B8e795C547942fE4Cf;

    function run() external {
        uint256 pk = vm.envOr(
            "PRIVATE_KEY",
            uint256(
                0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
            )
        );
        address splitter = vm.envOr("FEE_SPLITTER", SPLITTER_DEFAULT);
        address gd = vm.envOr("GD_TOKEN", GDT_DEFAULT);

        IUBIFeeSplitterMin s = IUBIFeeSplitterMin(splitter);
        address before = s.goodDollar();
        console.log("FEE_SPLITTER:", splitter);
        console.log("admin       :", s.admin());
        console.log("before      :", before);
        console.log("target      :", gd);

        if (before == gd) {
            console.log("already correct, no tx sent");
            return;
        }

        require(
            s.admin() == vm.addr(pk),
            "PRIVATE_KEY is not the splitter admin"
        );

        vm.startBroadcast(pk);
        s.setGoodDollar(gd);
        vm.stopBroadcast();

        console.log("after       :", s.goodDollar());
        require(s.goodDollar() == gd, "setGoodDollar did not stick");
    }
}
