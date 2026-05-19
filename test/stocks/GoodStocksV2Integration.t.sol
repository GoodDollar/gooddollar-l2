// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../../src/oracle/StockOracleV2.sol";
import "../../src/oracle/StockOracleV2Adapter.sol";
import "../../src/stocks/SyntheticAsset.sol";
import "../../src/stocks/SyntheticAssetFactory.sol";
import "../../src/stocks/CollateralVault.sol";
import "../../src/GoodDollarToken.sol";

contract MockFeeSplitterV2 {
    GoodDollarToken public immutable token;
    uint256 public totalReceived;

    constructor(address _token) {
        token = GoodDollarToken(_token);
    }

    function splitFee(uint256 totalFee, address) external returns (uint256, uint256, uint256) {
        if (totalFee > 0) {
            token.transferFrom(msg.sender, address(this), totalFee);
        }
        totalReceived += totalFee;
        return (totalFee / 3, totalFee / 6, totalFee / 2);
    }
}

/**
 * @title GoodStocksV2IntegrationTest
 * @notice End-to-end test proving the full GoodStocks stack works with
 *         StockOracleV2 → StockOracleV2Adapter → CollateralVault pipeline.
 */
contract GoodStocksV2IntegrationTest is Test {
    StockOracleV2 public oracleV2;
    StockOracleV2Adapter public adapter;
    SyntheticAssetFactory public factory;
    CollateralVault public vault;
    GoodDollarToken public gd;
    MockFeeSplitterV2 public feeSplitter;
    SyntheticAsset public sAAPL;
    SyntheticAsset public sTSLA;

    address public admin = address(0xAD);
    address public signer1 = address(0x51);
    address public alice = address(0xA1);
    address public bob = address(0xB0);

    uint256 constant AAPL_PRICE = 18_955_000_000; // $189.55
    uint256 constant TSLA_PRICE = 34_120_000_000; // $341.20
    uint256 constant INITIAL_SUPPLY = 100_000_000e18;

    function setUp() public {
        gd = new GoodDollarToken(admin, admin, INITIAL_SUPPLY);

        address[] memory signers = new address[](1);
        signers[0] = signer1;
        oracleV2 = new StockOracleV2(admin, signers, 1);

        adapter = new StockOracleV2Adapter(address(oracleV2), admin);

        vm.startPrank(admin);
        oracleV2.registerSymbol("AAPL", 3600, 1000);
        oracleV2.registerSymbol("TSLA", 3600, 1000);
        vm.stopPrank();

        vm.startPrank(signer1);
        oracleV2.updatePrice("AAPL", AAPL_PRICE, block.timestamp, StockOracleV2.SessionState.Open, 95);
        oracleV2.updatePrice("TSLA", TSLA_PRICE, block.timestamp, StockOracleV2.SessionState.Open, 95);
        vm.stopPrank();

        feeSplitter = new MockFeeSplitterV2(address(gd));

        vault = new CollateralVault(
            address(gd),
            address(adapter),
            address(feeSplitter),
            admin
        );

        factory = new SyntheticAssetFactory(admin);

        vm.startPrank(admin);
        address sAAPLAddr = factory.listAsset("AAPL", "Apple Inc. Synthetic", address(vault));
        sAAPL = SyntheticAsset(sAAPLAddr);
        vault.registerAsset("AAPL", sAAPLAddr);

        address sTSLAAddr = factory.listAsset("TSLA", "Tesla Inc. Synthetic", address(vault));
        sTSLA = SyntheticAsset(sTSLAAddr);
        vault.registerAsset("TSLA", sTSLAAddr);

        gd.transfer(alice, 10_000_000e18);
        gd.transfer(bob, 10_000_000e18);
        vm.stopPrank();

        vm.prank(alice);
        gd.approve(address(vault), type(uint256).max);
        vm.prank(bob);
        gd.approve(address(vault), type(uint256).max);
    }

    function test_e2e_mintAAPL_viaOracleV2() public {
        vm.prank(alice);
        vault.depositAndMint("AAPL", 10_000e18, 10e18);

        assertEq(sAAPL.balanceOf(alice), 10e18);
        assertEq(vault.debt(alice, keccak256("AAPL")), 10e18);
    }

    function test_e2e_mintTSLA_viaOracleV2() public {
        vm.prank(alice);
        vault.depositAndMint("TSLA", 100_000e18, 10e18);

        assertEq(sTSLA.balanceOf(alice), 10e18);
    }

    function test_e2e_burnReturnsCollateral() public {
        vm.prank(alice);
        vault.depositAndMint("AAPL", 10_000e18, 10e18);

        uint256 gdBefore = gd.balanceOf(alice);
        vm.prank(alice);
        vault.burn("AAPL", 5e18);

        assertEq(sAAPL.balanceOf(alice), 5e18);
        assertGt(gd.balanceOf(alice), gdBefore);
    }

    function test_e2e_undercollateralizedMintReverts() public {
        vm.prank(alice);
        vm.expectRevert();
        vault.depositAndMint("AAPL", 100e18, 10e18);
    }

    function test_e2e_feeRoutedToSplitter() public {
        uint256 splitterBefore = gd.balanceOf(address(feeSplitter));

        vm.prank(alice);
        vault.depositAndMint("AAPL", 10_000e18, 1e18);

        assertGt(gd.balanceOf(address(feeSplitter)), splitterBefore);
        assertGt(feeSplitter.totalReceived(), 0);
    }

    function test_e2e_priceChangeAffectsCollateralRatio() public {
        vm.prank(alice);
        vault.depositAndMint("AAPL", 5_000e18, 10e18);

        uint256 ratioBefore = vault.getCollateralRatio(alice, "AAPL");

        vm.warp(block.timestamp + 60);
        vm.prank(signer1);
        oracleV2.updatePrice("AAPL", 20_800_000_000, block.timestamp, StockOracleV2.SessionState.Open, 95);

        uint256 ratioAfter = vault.getCollateralRatio(alice, "AAPL");
        assertLt(ratioAfter, ratioBefore);
    }

    function test_e2e_multiStockPositions() public {
        vm.startPrank(alice);
        vault.depositAndMint("AAPL", 10_000e18, 5e18);
        vault.depositAndMint("TSLA", 100_000e18, 5e18);
        vm.stopPrank();

        assertEq(sAAPL.balanceOf(alice), 5e18);
        assertEq(sTSLA.balanceOf(alice), 5e18);
    }

    function test_e2e_liquidation_viaV2Oracle() public {
        vm.prank(alice);
        vault.depositAndMint("AAPL", 400e18, 1e18);

        _rampPrice("AAPL", 35_000_000_000);

        vm.prank(bob);
        vault.depositAndMint("AAPL", 100_000e18, 1e18);

        uint256 bobGdBefore = gd.balanceOf(bob);
        vm.prank(bob);
        vault.liquidate(alice, "AAPL");

        assertGt(gd.balanceOf(bob), bobGdBefore);
        assertEq(vault.debt(alice, keccak256("AAPL")), 0);
    }

    function test_e2e_factoryListedCount() public view {
        assertEq(factory.listedCount(), 2);
        assertEq(factory.getAsset("AAPL"), address(sAAPL));
        assertEq(factory.getAsset("TSLA"), address(sTSLA));
    }

    function test_e2e_adapterHasFeed() public view {
        assertTrue(adapter.hasFeed("AAPL"));
        assertTrue(adapter.hasFeed("TSLA"));
        assertFalse(adapter.hasFeed("GOOGL"));
    }

    function test_e2e_getMintRequirements() public view {
        (uint256 reqCol, uint256 fee, uint256 avail, bool canMint) =
            vault.getMintRequirements(alice, "AAPL", 1e18, 10_000e18);

        assertGt(reqCol, 0);
        assertGt(fee, 0);
        assertGt(avail, 0);
        assertTrue(canMint);
    }

    /// @dev Ramp price toward `target` in <=9.9% steps to stay within deviation guard.
    function _rampPrice(string memory ticker, uint256 target) internal {
        bytes32 key = keccak256(abi.encodePacked(ticker));
        (uint256 current,,,,) = oracleV2.prices(key);
        uint256 ts = block.timestamp;
        while (current < target) {
            uint256 next = current * 1099 / 1000;
            if (next > target) next = target;
            ts += 60;
            vm.warp(ts);
            vm.prank(signer1);
            oracleV2.updatePrice(ticker, next, ts, StockOracleV2.SessionState.Open, 95);
            current = next;
        }
    }

    function test_e2e_haltedMarketBlocksMint() public {
        vm.warp(block.timestamp + 60);
        vm.prank(signer1);
        oracleV2.updatePrice("AAPL", AAPL_PRICE, block.timestamp, StockOracleV2.SessionState.Halted, 50);

        vm.prank(alice);
        vm.expectRevert();
        vault.depositAndMint("AAPL", 10_000e18, 1e18);
    }
}
