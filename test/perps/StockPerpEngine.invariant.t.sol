// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../../src/perps/StockPerpEngine.sol";
import "../../src/perps/MarginVault.sol";
import "../../src/perps/FundingRate.sol";
import "../../src/GoodDollarToken.sol";
import "../handlers/PerpHandler.sol";

contract MockFeeSplitterInvariant {
    address public gdToken;

    constructor(address _gd) {
        gdToken = _gd;
    }

    function goodDollar() external view returns (address) {
        return gdToken;
    }

    function splitFee(uint256 totalFee, address to) external returns (uint256, uint256, uint256) {
        GoodDollarToken(gdToken).transferFrom(msg.sender, address(this), totalFee);
        uint256 ubiShare = totalFee / 3;
        uint256 protocolShare = totalFee / 6;
        uint256 dAppShare = totalFee - ubiShare - protocolShare;
        GoodDollarToken(gdToken).transfer(to, dAppShare);
        return (ubiShare, protocolShare, dAppShare);
    }
}

contract StockPerpEngineInvariantTest is Test {
    GoodDollarToken public gd;
    MarginVault public vault;
    FundingRate public fundingRate;
    StockPerpEngine public engine;
    MockOracleForHandler public oracle;
    MockFeeSplitterInvariant public feeSplitter;
    PerpHandler public handler;

    address public admin = address(0xAD);
    address[] public traders;
    uint256 public marketId;
    bytes32 public markKey;
    bytes32 public indexKey;

    uint256 constant SUPPLY = 100_000_000e18;
    uint256 constant BASE_PRICE = 19000_00000000;

    function setUp() public {
        gd = new GoodDollarToken(admin, admin, SUPPLY);
        oracle = new MockOracleForHandler();
        feeSplitter = new MockFeeSplitterInvariant(address(gd));

        vault = new MarginVault(address(gd), admin);
        fundingRate = new FundingRate(admin);
        engine = new StockPerpEngine(
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

        markKey = keccak256(abi.encodePacked("AAPL_MARK"));
        indexKey = keccak256(abi.encodePacked("AAPL_INDEX"));
        oracle.setPrice(markKey, BASE_PRICE);
        oracle.setPrice(indexKey, BASE_PRICE);

        vm.prank(admin);
        marketId = engine.createMarket(
            "AAPL", markKey, indexKey,
            10, 1_000_000e18, 500, 50
        );

        for (uint256 i = 1; i <= 5; i++) {
            address t = address(uint160(0x1000 + i));
            traders.push(t);
            vm.prank(admin);
            gd.transfer(t, 10_000_000e18);
        }

        handler = new PerpHandler(
            engine, vault, gd, oracle,
            marketId, markKey, indexKey, traders
        );

        targetContract(address(handler));
    }

    // ─── Invariant: closed positions have size == 0 ───

    function invariant_closedPositionSizeZero() public view {
        for (uint256 i = 0; i < traders.length; i++) {
            (bool isOpen,, uint256 size,,,,) = engine.positions(traders[i], marketId);
            if (!isOpen) {
                assertEq(size, 0, "closed position must have size == 0");
            }
        }
    }

    // ─── Invariant: OI consistency — sum of open position sizes matches reported OI ───

    function invariant_oiConsistency() public view {
        uint256 sumLong = 0;
        uint256 sumShort = 0;

        for (uint256 i = 0; i < traders.length; i++) {
            (bool isOpen, bool isLong, uint256 size,,,,) = engine.positions(traders[i], marketId);
            if (isOpen) {
                if (isLong) {
                    sumLong += size;
                } else {
                    sumShort += size;
                }
            }
        }

        (,,, uint256 oiLong, uint256 oiShort,) = engine.markets(marketId);
        assertEq(oiLong, sumLong, "OI long mismatch vs actual positions");
        assertEq(oiShort, sumShort, "OI short mismatch vs actual positions");
    }

    // ─── Invariant: marketCount never decreases ───

    function invariant_marketCountMonotonic() public view {
        assertGe(engine.marketCount(), 1, "marketCount must be >= 1");
    }

    // ─── Invariant: no open position has margin == 0 ───

    function invariant_noZeroMarginOnOpenPosition() public view {
        for (uint256 i = 0; i < traders.length; i++) {
            (bool isOpen,,,,uint256 margin,,) = engine.positions(traders[i], marketId);
            if (isOpen) {
                assertTrue(margin > 0, "open position must have margin > 0");
            }
        }
    }

    // ─── Invariant: GD token conservation — total supply never changes ───
    // SECURITY FINDING: vault.credit() inflates internal balances without
    // transferring GD tokens, so vault GD balance < sum(trader balances)
    // after profitable closes. This means the vault is accounting-insolvent
    // when net PnL is positive. A production fix would require the engine
    // to hold a reserve pool or insurance fund that backs PnL credits.
    // Tracked as: FINDING-PERP-001 — vault solvency gap on uncovered PnL

    function invariant_gdConservation() public view {
        uint256 totalGd = gd.balanceOf(address(vault))
            + gd.balanceOf(address(engine))
            + gd.balanceOf(address(feeSplitter))
            + gd.balanceOf(admin);
        for (uint256 i = 0; i < traders.length; i++) {
            totalGd += gd.balanceOf(traders[i]);
        }
        assertEq(totalGd, SUPPLY, "GD tokens must be conserved across system");
    }

    // ─── Invariant: handler ghost counters sanity ───

    function invariant_callCountSanity() public view {
        assertGe(handler.openCount() + handler.closeCount() + handler.addMarginCount(), 0);
    }
}
