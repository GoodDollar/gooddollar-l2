// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../../src/stocks/StockAMM.sol";
import "../../src/stocks/SyntheticAsset.sol";
import "../../src/stocks/PriceOracle.sol";

/**
 * @title StockAMMFuzzTest
 * @notice Fuzz tests for StockAMM covering buyStock, sellStock,
 *         addLiquidity, removeLiquidity, and spread calculations.
 */
contract StockAMMFuzzTest is Test {
    StockAMM public amm;
    PriceOracle public oracle;
    SyntheticAsset public sAAPL;
    MockGDollarFuzz public gd;

    address admin = makeAddr("admin");
    address lp = makeAddr("lp");
    address trader = makeAddr("trader");
    address treasury = makeAddr("treasury");

    uint256 constant ORACLE_PRICE = 19_000_000_000; // $190.00 (8 decimals)

    function setUp() public {
        gd = new MockGDollarFuzz();
        oracle = new PriceOracle(admin);
        sAAPL = new SyntheticAsset("Synthetic Apple", "sAAPL", admin);

        vm.prank(admin);
        oracle.setManualPrice("AAPL", ORACLE_PRICE, true);

        amm = new StockAMM(address(oracle), address(gd), treasury, admin);

        vm.prank(admin);
        amm.createPool("AAPL", address(sAAPL));

        vm.startPrank(admin);
        sAAPL.mint(admin, 10_000 ether);
        sAAPL.approve(address(amm), 10_000 ether);
        amm.seedSyntheticReserve("AAPL", 10_000 ether);
        vm.stopPrank();

        gd.mint(lp, 10_000_000 ether);
        gd.mint(trader, 10_000_000 ether);

        vm.startPrank(lp);
        gd.approve(address(amm), 1_000_000 ether);
        amm.addLiquidity("AAPL", 1_000_000 ether);
        vm.stopPrank();
    }

    // ============ buyStock fuzz ============

    function testFuzz_buyStock_outputPositive(uint128 _amount) public {
        uint256 amount = bound(uint256(_amount), 1 ether, 500_000 ether);

        vm.startPrank(trader);
        gd.approve(address(amm), amount);
        uint256 out = amm.buyStock("AAPL", amount, 0);
        vm.stopPrank();

        assertGt(out, 0, "buy output must be positive");
    }

    function testFuzz_buyStock_feeExact(uint128 _amount) public {
        uint256 amount = bound(uint256(_amount), 100 ether, 100_000 ether);

        uint256 expectedFee = (amount * 30) / 10_000;
        uint256 ubiFee = (expectedFee * 10) / 30;
        uint256 treasuryBefore = gd.balanceOf(treasury);

        vm.startPrank(trader);
        gd.approve(address(amm), amount);
        amm.buyStock("AAPL", amount, 0);
        vm.stopPrank();

        uint256 treasuryAfter = gd.balanceOf(treasury);
        assertEq(treasuryAfter - treasuryBefore, ubiFee, "UBI fee must match formula");
    }

    function testFuzz_buyStock_rejectsZero() public {
        vm.prank(trader);
        vm.expectRevert(StockAMM.ZeroAmount.selector);
        amm.buyStock("AAPL", 0, 0);
    }

    // ============ sellStock fuzz ============

    function testFuzz_sellStock_outputPositive(uint128 _buyAmount) public {
        uint256 buyAmount = bound(uint256(_buyAmount), 1 ether, 100_000 ether);

        vm.startPrank(trader);
        gd.approve(address(amm), buyAmount);
        uint256 bought = amm.buyStock("AAPL", buyAmount, 0);

        sAAPL.approve(address(amm), bought);
        uint256 gOut = amm.sellStock("AAPL", bought, 0);
        vm.stopPrank();

        assertGt(gOut, 0, "sell output must be positive");
        assertLt(gOut, buyAmount, "round-trip must cost something (spread + fees)");
    }

    function testFuzz_sellStock_rejectsZero() public {
        vm.prank(trader);
        vm.expectRevert(StockAMM.ZeroAmount.selector);
        amm.sellStock("AAPL", 0, 0);
    }

    // ============ addLiquidity fuzz ============

    function testFuzz_addLiquidity_sharesProportional(uint128 _amount) public {
        uint256 amount = bound(uint256(_amount), 1 ether, 1_000_000 ether);

        bytes32 key = keccak256(abi.encodePacked("AAPL"));
        (,, uint256 reserveBefore,,uint256 sharesBefore,) = amm.pools(key);

        address lp2 = makeAddr("lp2");
        gd.mint(lp2, amount);

        vm.startPrank(lp2);
        gd.approve(address(amm), amount);
        amm.addLiquidity("AAPL", amount);
        vm.stopPrank();

        uint256 newShares = amm.lpShares(key, lp2);
        uint256 expectedShares = (amount * sharesBefore) / reserveBefore;
        assertEq(newShares, expectedShares, "shares must be proportional");
    }

    function testFuzz_addLiquidity_rejectsZero() public {
        vm.prank(lp);
        vm.expectRevert(StockAMM.ZeroAmount.selector);
        amm.addLiquidity("AAPL", 0);
    }

    // ============ removeLiquidity fuzz ============

    function testFuzz_removeLiquidity_returnsProportional(uint128 _fraction) public {
        uint256 fraction = bound(uint256(_fraction), 1, 10_000);

        bytes32 key = keccak256(abi.encodePacked("AAPL"));
        uint256 lpSharesTotal = amm.lpShares(key, lp);
        uint256 sharesToBurn = (lpSharesTotal * fraction) / 10_000;
        if (sharesToBurn == 0) return;

        (,, uint256 gResBefore,uint256 sResBefore, uint256 totalSharesBefore,) = amm.pools(key);

        uint256 expectedGOut = (gResBefore * sharesToBurn) / totalSharesBefore;
        uint256 expectedSOut = (sResBefore * sharesToBurn) / totalSharesBefore;

        vm.prank(lp);
        amm.removeLiquidity("AAPL", sharesToBurn);

        (,, uint256 gResAfter,uint256 sResAfter,,) = amm.pools(key);

        assertEq(gResBefore - gResAfter, expectedGOut, "G$ returned proportionally");
        assertEq(sResBefore - sResAfter, expectedSOut, "synthetic returned proportionally");
    }

    // ============ Spread bounds fuzz ============

    function testFuzz_spread_buyAskAboveOracle(uint128 _amount) public {
        uint256 amount = bound(uint256(_amount), 100 ether, 100_000 ether);

        (uint256 out, uint256 fee) = amm.getQuoteBuy("AAPL", amount);

        uint256 netIn = amount - fee;
        uint256 netInUSD8 = (netIn * 1e8) / 1e18;
        uint256 effectiveAskPrice8 = (netInUSD8 * 1e18) / out;

        assertGe(effectiveAskPrice8, ORACLE_PRICE, "ask price must be >= oracle price");
    }

    function testFuzz_spread_sellBidBelowOracle(uint128 _amount) public {
        uint256 synthAmount = bound(uint256(_amount), 0.01 ether, 100 ether);

        (uint256 gOut, uint256 fee) = amm.getQuoteSell("AAPL", synthAmount);

        uint256 grossG = gOut + fee;
        uint256 grossUSD8 = (grossG * 1e8) / 1e18;
        uint256 effectiveBidPrice8 = (grossUSD8 * 1e18) / synthAmount;

        assertLe(effectiveBidPrice8, ORACLE_PRICE, "bid price must be <= oracle price");
    }
}

contract MockGDollarFuzz {
    string public constant name = "MockGDollar";
    string public constant symbol = "G$";
    uint8 public constant decimals = 18;
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    function mint(address to, uint256 amount) external {
        totalSupply += amount;
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        require(balanceOf[msg.sender] >= amount, "insufficient");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(balanceOf[from] >= amount, "insufficient");
        require(allowance[from][msg.sender] >= amount, "allowance");
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
        return true;
    }

    function fundUBIPool(uint256) external pure {}
}
