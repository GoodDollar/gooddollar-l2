// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../../src/lending/StockLendOracleAdapter.sol";

contract MockStockOracleV2 {
    struct PriceEntry {
        uint256 price8;
        uint256 timestamp;
        IStockOracleV2.SessionState session;
        uint8 confidence;
        uint8 signerCount;
    }

    mapping(bytes32 => PriceEntry) public _prices;

    function setPrice(
        bytes32 h,
        uint256 price8,
        uint256 timestamp,
        IStockOracleV2.SessionState session,
        uint8 confidence,
        uint8 signerCount
    ) external {
        _prices[h] = PriceEntry(price8, timestamp, session, confidence, signerCount);
    }

    function prices(bytes32 h) external view returns (
        uint256 price8,
        uint256 timestamp,
        IStockOracleV2.SessionState session,
        uint8 confidence,
        uint8 signerCount
    ) {
        PriceEntry memory e = _prices[h];
        return (e.price8, e.timestamp, e.session, e.confidence, e.signerCount);
    }

    function symbolConfigs(bytes32) external pure returns (
        uint256 maxStalenessSeconds,
        uint256 maxDeviationBps,
        bool active
    ) {
        return (600, 200, true);
    }
}

contract StockLendOracleAdapterTest is Test {
    StockLendOracleAdapter adapter;
    MockStockOracleV2 oracle;

    address admin = address(0xA1);
    address token = address(0xBEEF);
    bytes32 symbol = keccak256(abi.encodePacked("AAPL"));

    uint256 constant PRICE = 17500000000; // $175.00 in 8 decimals

    function setUp() public {
        vm.warp(10_000);
        oracle = new MockStockOracleV2();
        adapter = new StockLendOracleAdapter(address(oracle), admin);

        vm.prank(admin);
        adapter.mapToken(token, symbol);

        oracle.setPrice(
            symbol,
            PRICE,
            block.timestamp,
            IStockOracleV2.SessionState.Open,
            100,
            3
        );
    }

    // ─── Happy path ──────────────────────────────────────────────

    function test_getAssetPrice_open_market() public view {
        uint256 price = adapter.getAssetPrice(token);
        assertEq(price, PRICE);
    }

    function test_getAssetPrice_premarket_haircut() public {
        oracle.setPrice(
            symbol, PRICE, block.timestamp,
            IStockOracleV2.SessionState.PreMarket, 80, 3
        );
        uint256 price = adapter.getAssetPrice(token);
        assertEq(price, (PRICE * 9500) / 10_000);
    }

    function test_getAssetPrice_afterhours_haircut() public {
        oracle.setPrice(
            symbol, PRICE, block.timestamp,
            IStockOracleV2.SessionState.AfterHours, 80, 3
        );
        uint256 price = adapter.getAssetPrice(token);
        assertEq(price, (PRICE * 9500) / 10_000);
    }

    function test_getAssetPrice_closed_haircut() public {
        oracle.setPrice(
            symbol, PRICE, block.timestamp,
            IStockOracleV2.SessionState.Closed, 60, 3
        );
        uint256 price = adapter.getAssetPrice(token);
        assertEq(price, (PRICE * 9000) / 10_000);
    }

    // ─── Reverts ─────────────────────────────────────────────────

    function test_revert_unmapped_token() public {
        address unknown = address(0xDEAD);
        vm.expectRevert(abi.encodeWithSelector(
            StockLendOracleAdapter.TokenNotMapped.selector, unknown
        ));
        adapter.getAssetPrice(unknown);
    }

    function test_revert_zero_price() public {
        oracle.setPrice(symbol, 0, block.timestamp, IStockOracleV2.SessionState.Open, 100, 3);
        vm.expectRevert(abi.encodeWithSelector(
            StockLendOracleAdapter.ZeroPrice.selector, token
        ));
        adapter.getAssetPrice(token);
    }

    function test_revert_halted_market() public {
        oracle.setPrice(
            symbol, PRICE, block.timestamp,
            IStockOracleV2.SessionState.Halted, 0, 3
        );
        vm.expectRevert(abi.encodeWithSelector(
            StockLendOracleAdapter.MarketHalted.selector, token
        ));
        adapter.getAssetPrice(token);
    }

    function test_revert_stale_price() public {
        oracle.setPrice(
            symbol, PRICE,
            block.timestamp - 400, // 400s > 300s staleness
            IStockOracleV2.SessionState.Open, 100, 3
        );
        vm.expectRevert(abi.encodeWithSelector(
            StockLendOracleAdapter.StalePrice.selector, token, 400, 300
        ));
        adapter.getAssetPrice(token);
    }

    // ─── Admin ───────────────────────────────────────────────────

    function test_admin_mapToken() public {
        address newToken = address(0xCAFE);
        bytes32 newSymbol = keccak256(abi.encodePacked("TSLA"));

        vm.prank(admin);
        adapter.mapToken(newToken, newSymbol);

        assertEq(adapter.tokenSymbols(newToken), newSymbol);
    }

    function test_admin_removeToken() public {
        vm.prank(admin);
        adapter.removeToken(token);

        assertEq(adapter.tokenSymbols(token), bytes32(0));
    }

    function test_admin_setHaircuts() public {
        vm.prank(admin);
        adapter.setHaircuts(8000, 9000);

        assertEq(adapter.closedMarketHaircutBps(), 8000);
        assertEq(adapter.extendedHoursHaircutBps(), 9000);
    }

    function test_admin_setStaleness() public {
        vm.prank(admin);
        adapter.setMaxLendStaleness(600);

        assertEq(adapter.maxLendStaleness(), 600);
    }

    function test_admin_transfer() public {
        address newAdmin = address(0xB2);
        vm.prank(admin);
        adapter.setAdmin(newAdmin);

        assertEq(adapter.admin(), newAdmin);
    }

    function test_revert_nonAdmin_mapToken() public {
        vm.expectRevert(StockLendOracleAdapter.NotAdmin.selector);
        adapter.mapToken(address(0x1), bytes32(uint256(1)));
    }

    function test_revert_nonAdmin_setHaircuts() public {
        vm.expectRevert(StockLendOracleAdapter.NotAdmin.selector);
        adapter.setHaircuts(8000, 9000);
    }

    // ─── getRawPrice ─────────────────────────────────────────────

    function test_getRawPrice() public view {
        (uint256 price8, IStockOracleV2.SessionState session) = adapter.getRawPrice(token);
        assertEq(price8, PRICE);
        assertTrue(session == IStockOracleV2.SessionState.Open);
    }

    function test_getRawPrice_revert_unmapped() public {
        address unknown = address(0xDEAD);
        vm.expectRevert(abi.encodeWithSelector(
            StockLendOracleAdapter.TokenNotMapped.selector, unknown
        ));
        adapter.getRawPrice(unknown);
    }

    // ─── Constructor ─────────────────────────────────────────────

    function test_revert_constructor_zeroOracle() public {
        vm.expectRevert(StockLendOracleAdapter.ZeroAddress.selector);
        new StockLendOracleAdapter(address(0), admin);
    }

    function test_revert_constructor_zeroAdmin() public {
        vm.expectRevert(StockLendOracleAdapter.ZeroAddress.selector);
        new StockLendOracleAdapter(address(oracle), address(0));
    }

    // ─── Custom haircut values ───────────────────────────────────

    function test_custom_haircut_closed() public {
        vm.prank(admin);
        adapter.setHaircuts(8500, 9200);

        oracle.setPrice(
            symbol, PRICE, block.timestamp,
            IStockOracleV2.SessionState.Closed, 60, 3
        );

        uint256 price = adapter.getAssetPrice(token);
        assertEq(price, (PRICE * 8500) / 10_000);
    }

    function test_edge_staleness_exactly_at_limit() public {
        oracle.setPrice(
            symbol, PRICE,
            block.timestamp - 300, // exactly at limit
            IStockOracleV2.SessionState.Open, 100, 3
        );
        uint256 price = adapter.getAssetPrice(token);
        assertEq(price, PRICE);
    }
}
