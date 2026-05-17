// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../../src/perps/MarginVault.sol";
import "../../src/perps/FundingRate.sol";
import "../../src/perps/PerpEngine.sol";
import "../../src/GoodDollarToken.sol";
import "../../src/stocks/PriceOracle.sol";

contract MockFuzzFeed {
    int256 public price;

    constructor(int256 _price) {
        price = _price;
    }

    function setPrice(int256 _price) external {
        price = _price;
    }

    function decimals() external pure returns (uint8) { return 8; }

    function latestRoundData()
        external
        view
        returns (uint80, int256, uint256, uint256, uint80)
    {
        return (1, price, block.timestamp, block.timestamp, 1);
    }
}

contract MockFuzzFeeSplitter {
    GoodDollarToken public immutable token;
    uint256 public totalReceived;

    constructor(address _token) {
        token = GoodDollarToken(_token);
    }

    function goodDollar() external view returns (address) {
        return address(token);
    }

    function splitFee(uint256 totalFee, address to) external returns (uint256, uint256, uint256) {
        token.transferFrom(msg.sender, address(this), totalFee);
        totalReceived += totalFee;
        uint256 ubiShare = totalFee / 3;
        uint256 protocolShare = totalFee / 6;
        uint256 liquidatorShare = totalFee / 2;
        if (liquidatorShare > 0) {
            token.transfer(to, liquidatorShare);
        }
        return (ubiShare, protocolShare, liquidatorShare);
    }
}

contract PerpEngineFuzzTest is Test {
    GoodDollarToken public gd;
    PriceOracle public oracle;
    MarginVault public vault;
    FundingRate public fundingRate;
    PerpEngine public engine;
    MockFuzzFeed public btcFeed;
    MockFuzzFeed public btcIndexFeed;
    MockFuzzFeeSplitter public feeSplitter;

    address public admin = address(0xAD);
    address public trader = address(0xA1);

    uint256 constant INITIAL_SUPPLY = 100_000_000e18;
    int256 constant BTC_PRICE = 5_000_000_000_000; // $50,000 with 8 decimals

    bytes32 public btcKey;
    bytes32 public btcIndexKey;
    uint256 public btcMarketId;

    function setUp() public {
        gd = new GoodDollarToken(admin, admin, INITIAL_SUPPLY);
        oracle = new PriceOracle(admin);
        btcFeed = new MockFuzzFeed(BTC_PRICE);
        btcIndexFeed = new MockFuzzFeed(BTC_PRICE);

        vm.prank(admin);
        oracle.registerFeed("BTC", address(btcFeed));
        vm.prank(admin);
        oracle.registerFeed("BTC_INDEX", address(btcIndexFeed));
        btcKey = keccak256(abi.encodePacked("BTC"));
        btcIndexKey = keccak256(abi.encodePacked("BTC_INDEX"));

        feeSplitter = new MockFuzzFeeSplitter(address(gd));
        vault = new MarginVault(address(gd), admin);
        fundingRate = new FundingRate(admin);
        engine = new PerpEngine(
            address(vault),
            address(fundingRate),
            address(oracle),
            address(feeSplitter),
            admin
        );

        vm.prank(admin);
        vault.setPerpEngine(address(engine));
        vm.prank(admin);
        fundingRate.setPerpEngine(address(engine));

        vm.prank(admin);
        btcMarketId = engine.createMarket(btcKey, btcIndexKey, 50);

        vm.prank(admin);
        gd.transfer(trader, 50_000_000e18);

        vm.prank(trader);
        gd.approve(address(vault), type(uint256).max);
    }

    // ============ openPosition fuzz ============

    /// @notice Fuzz open with valid size/margin — position must be stored correctly
    function testFuzz_openPosition_stores_correctly(
        uint128 _size,
        uint128 _margin,
        bool _isLong
    ) public {
        uint256 size = uint256(_size);
        uint256 margin = uint256(_margin);

        vm.assume(size > 0 && margin > 0);
        vm.assume(size <= margin * 50); // within max leverage
        uint256 fee = (size * 10) / 10000; // 0.1%
        uint256 totalRequired = margin + fee;
        vm.assume(totalRequired <= 50_000_000e18);
        vm.assume(totalRequired >= margin); // no overflow

        vm.prank(trader);
        vault.deposit(totalRequired);

        vm.prank(trader);
        engine.openPosition(btcMarketId, size, _isLong, margin);

        (
            bool isOpen,
            bool isLong,
            uint256 posSize,
            uint256 entryPrice,
            uint256 posMargin,
            ,
            uint256 mktId
        ) = engine.positions(trader, btcMarketId);

        assertTrue(isOpen, "position should be open");
        assertEq(isLong, _isLong, "isLong mismatch");
        assertEq(posSize, size, "size mismatch");
        assertEq(posMargin, margin, "margin mismatch");
        assertEq(entryPrice, uint256(BTC_PRICE), "entry price mismatch");
        assertEq(mktId, btcMarketId, "market id mismatch");
    }

    /// @notice Fuzz open — margin must be deducted from vault
    function testFuzz_openPosition_debits_margin(
        uint128 _size,
        uint128 _margin
    ) public {
        uint256 size = uint256(_size);
        uint256 margin = uint256(_margin);

        vm.assume(size > 0 && margin > 0);
        vm.assume(size <= margin * 50);
        uint256 fee = (size * 10) / 10000;
        uint256 totalRequired = margin + fee;
        vm.assume(totalRequired <= 50_000_000e18);
        vm.assume(totalRequired >= margin);

        vm.prank(trader);
        vault.deposit(totalRequired);

        uint256 balBefore = vault.balances(trader);

        vm.prank(trader);
        engine.openPosition(btcMarketId, size, true, margin);

        assertEq(vault.balances(trader), balBefore - totalRequired, "vault balance should be debited by margin + fee");
    }

    /// @notice Fuzz open — fee must reach the fee splitter
    function testFuzz_openPosition_routes_fee(
        uint128 _size,
        uint128 _margin
    ) public {
        uint256 size = uint256(_size);
        uint256 margin = uint256(_margin);

        vm.assume(size > 0 && margin > 0);
        vm.assume(size <= margin * 50);
        uint256 fee = (size * 10) / 10000;
        vm.assume(fee > 0);
        uint256 totalRequired = margin + fee;
        vm.assume(totalRequired <= 50_000_000e18);
        vm.assume(totalRequired >= margin);

        vm.prank(trader);
        vault.deposit(totalRequired);

        uint256 splitterBefore = feeSplitter.totalReceived();

        vm.prank(trader);
        engine.openPosition(btcMarketId, size, true, margin);

        assertEq(feeSplitter.totalReceived(), splitterBefore + fee, "fee not routed to splitter");
    }

    /// @notice Fuzz open — open interest must be updated
    function testFuzz_openPosition_updates_oi(
        uint128 _size,
        uint128 _margin,
        bool _isLong
    ) public {
        uint256 size = uint256(_size);
        uint256 margin = uint256(_margin);

        vm.assume(size > 0 && margin > 0);
        vm.assume(size <= margin * 50);
        uint256 fee = (size * 10) / 10000;
        uint256 totalRequired = margin + fee;
        vm.assume(totalRequired <= 50_000_000e18);
        vm.assume(totalRequired >= margin);

        vm.prank(trader);
        vault.deposit(totalRequired);

        (,,, , uint256 oiLongBefore, uint256 oiShortBefore) = engine.markets(btcMarketId);

        vm.prank(trader);
        engine.openPosition(btcMarketId, size, _isLong, margin);

        (,,,, uint256 oiLongAfter, uint256 oiShortAfter) = engine.markets(btcMarketId);

        if (_isLong) {
            assertEq(oiLongAfter, oiLongBefore + size, "long OI not updated");
            assertEq(oiShortAfter, oiShortBefore, "short OI should be unchanged");
        } else {
            assertEq(oiShortAfter, oiShortBefore + size, "short OI not updated");
            assertEq(oiLongAfter, oiLongBefore, "long OI should be unchanged");
        }
    }

    /// @notice Fuzz — zero size must revert
    function testFuzz_openPosition_reverts_zeroSize(uint128 _margin) public {
        uint256 margin = uint256(_margin);
        vm.assume(margin > 0 && margin <= 50_000_000e18);

        vm.prank(trader);
        vault.deposit(margin);

        vm.expectRevert(PerpEngine.ZeroAmount.selector);
        vm.prank(trader);
        engine.openPosition(btcMarketId, 0, true, margin);
    }

    /// @notice Fuzz — zero margin must revert
    function testFuzz_openPosition_reverts_zeroMargin(uint128 _size) public {
        vm.assume(uint256(_size) > 0);

        vm.expectRevert(PerpEngine.ZeroAmount.selector);
        vm.prank(trader);
        engine.openPosition(btcMarketId, uint256(_size), true, 0);
    }

    /// @notice Fuzz — leverage too high must revert
    function testFuzz_openPosition_reverts_leverageTooHigh(
        uint128 _margin
    ) public {
        uint256 margin = uint256(_margin);
        vm.assume(margin > 0 && margin <= 1_000_000e18);

        uint256 size = margin * 51; // 51x > 50x max
        uint256 fee = (size * 10) / 10000;
        uint256 totalRequired = margin + fee;

        vm.prank(trader);
        vault.deposit(totalRequired);

        vm.expectRevert();
        vm.prank(trader);
        engine.openPosition(btcMarketId, size, true, margin);
    }

    /// @notice Fuzz — insufficient margin must revert
    function testFuzz_openPosition_reverts_insufficientBalance(
        uint128 _size,
        uint128 _margin
    ) public {
        uint256 size = uint256(_size);
        uint256 margin = uint256(_margin);

        vm.assume(size > 0 && margin > 0);
        vm.assume(size <= margin * 50);
        uint256 fee = (size * 10) / 10000;
        uint256 totalRequired = margin + fee;
        vm.assume(totalRequired > 1 && totalRequired <= 50_000_000e18);
        vm.assume(totalRequired >= margin);

        // Deposit 1 less than needed
        vm.prank(trader);
        vault.deposit(totalRequired - 1);

        vm.expectRevert();
        vm.prank(trader);
        engine.openPosition(btcMarketId, size, true, margin);
    }

    // ============ closePosition fuzz ============

    /// @notice Fuzz close at same price — full margin returned minus fee
    function testFuzz_closePosition_samePriceMarginsReturned(
        uint128 _size,
        uint128 _margin
    ) public {
        uint256 size = uint256(_size);
        uint256 margin = uint256(_margin);

        vm.assume(size > 0 && margin > 0);
        vm.assume(size <= margin * 50);
        uint256 fee = (size * 10) / 10000;
        uint256 totalRequired = margin + fee;
        vm.assume(totalRequired <= 10_000_000e18);
        vm.assume(totalRequired >= margin);

        vm.prank(trader);
        vault.deposit(totalRequired);

        vm.prank(trader);
        engine.openPosition(btcMarketId, size, true, margin);

        uint256 balBefore = vault.balances(trader);

        vm.prank(trader);
        engine.closePosition(btcMarketId);

        (bool isOpen,,,,,,) = engine.positions(trader, btcMarketId);
        assertFalse(isOpen, "position should be closed");

        assertEq(vault.balances(trader), balBefore + margin, "margin should be returned at same price");
    }

    /// @notice Fuzz close — OI must decrease back to prior value
    function testFuzz_closePosition_restores_oi(
        uint128 _size,
        uint128 _margin,
        bool _isLong
    ) public {
        uint256 size = uint256(_size);
        uint256 margin = uint256(_margin);

        vm.assume(size > 0 && margin > 0);
        vm.assume(size <= margin * 50);
        uint256 fee = (size * 10) / 10000;
        uint256 totalRequired = margin + fee;
        vm.assume(totalRequired <= 10_000_000e18);
        vm.assume(totalRequired >= margin);

        (,,,,uint256 oiLongPre, uint256 oiShortPre) = engine.markets(btcMarketId);

        vm.prank(trader);
        vault.deposit(totalRequired);

        vm.prank(trader);
        engine.openPosition(btcMarketId, size, _isLong, margin);

        vm.prank(trader);
        engine.closePosition(btcMarketId);

        (,,,,uint256 oiLongPost, uint256 oiShortPost) = engine.markets(btcMarketId);
        assertEq(oiLongPost, oiLongPre, "long OI should be restored");
        assertEq(oiShortPost, oiShortPre, "short OI should be restored");
    }

    /// @notice Closing a non-existent position must revert
    function testFuzz_closePosition_reverts_noPosition(uint256 _mktId) public {
        vm.assume(_mktId < 1); // only btcMarketId=0 exists
        vm.expectRevert(PerpEngine.NoOpenPosition.selector);
        vm.prank(trader);
        engine.closePosition(_mktId);
    }

    // ============ Leverage bounds fuzz ============

    /// @notice Fuzz leverage bounds: valid leverage should never exceed maxLeverage
    function testFuzz_leverageBounds_accepted(
        uint128 _margin
    ) public {
        uint256 margin = uint256(_margin);
        vm.assume(margin >= 1e18 && margin <= 1_000_000e18);

        // Pick a random leverage between 1x and 50x
        uint256 maxLev = 50;
        uint256 size = margin * maxLev; // exactly at max leverage
        uint256 fee = (size * 10) / 10000;
        uint256 totalRequired = margin + fee;
        vm.assume(totalRequired <= 50_000_000e18);

        vm.prank(trader);
        vault.deposit(totalRequired);

        // Should not revert — exactly at limit
        vm.prank(trader);
        engine.openPosition(btcMarketId, size, true, margin);

        (bool isOpen,,,,,,) = engine.positions(trader, btcMarketId);
        assertTrue(isOpen, "position should be open at max leverage");
    }

    /// @notice Fuzz leverage bounds: 1 wei above max must always revert
    function testFuzz_leverageBounds_rejected(
        uint128 _margin
    ) public {
        uint256 margin = uint256(_margin);
        vm.assume(margin >= 1e18 && margin <= 1_000_000e18);

        uint256 size = margin * 50 + 1; // 1 wei above max
        uint256 fee = (size * 10) / 10000;
        uint256 totalRequired = margin + fee;

        vm.prank(trader);
        vault.deposit(totalRequired);

        vm.expectRevert();
        vm.prank(trader);
        engine.openPosition(btcMarketId, size, true, margin);
    }
}
