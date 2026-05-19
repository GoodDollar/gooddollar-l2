// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../../src/stocks/StockAMM.sol";
import "../../src/stocks/SyntheticAsset.sol";
import "../../src/stocks/PriceOracle.sol";

contract StockAMMTest is Test {
    StockAMM public amm;
    PriceOracle public oracle;
    SyntheticAsset public sAAPL;

    address admin = makeAddr("admin");
    address lp = makeAddr("lp");
    address trader = makeAddr("trader");
    address treasury = makeAddr("treasury");

    MockGDollar gd;

    function setUp() public {
        gd = new MockGDollar();
        oracle = new PriceOracle(admin);
        sAAPL = new SyntheticAsset("Synthetic Apple", "sAAPL", admin);

        vm.prank(admin);
        oracle.setManualPrice("AAPL", 19_000_000_000, true); // $190.00

        amm = new StockAMM(address(oracle), address(gd), treasury, admin);

        vm.prank(admin);
        amm.createPool("AAPL", address(sAAPL));

        gd.mint(lp, 100_000 ether);
        gd.mint(trader, 50_000 ether);

        vm.startPrank(admin);
        sAAPL.mint(admin, 500 ether);
        sAAPL.approve(address(amm), 500 ether);
        amm.seedSyntheticReserve("AAPL", 500 ether);
        vm.stopPrank();
    }

    function _seedPool(uint256 gDollarAmount) internal {
        vm.startPrank(lp);
        gd.approve(address(amm), gDollarAmount);
        amm.addLiquidity("AAPL", gDollarAmount);
        vm.stopPrank();
    }

    function test_createPool() public view {
        (address syntheticAsset,,,,, bool paused) = amm.pools(keccak256(abi.encodePacked("AAPL")));
        assertEq(syntheticAsset, address(sAAPL));
        assertFalse(paused);
        assertEq(amm.poolCount(), 1);
    }

    function test_createPool_reverts_duplicate() public {
        vm.prank(admin);
        vm.expectRevert();
        amm.createPool("AAPL", address(sAAPL));
    }

    function test_addLiquidity() public {
        _seedPool(10_000 ether);

        bytes32 key = keccak256(abi.encodePacked("AAPL"));
        (,, uint256 gRes,, uint256 shares,) = amm.pools(key);
        assertEq(gRes, 10_000 ether);
        assertEq(shares, 10_000 ether);
        assertEq(amm.lpShares(key, lp), 10_000 ether);
    }

    function test_addLiquidity_proportional() public {
        _seedPool(10_000 ether);

        address lp2 = makeAddr("lp2");
        gd.mint(lp2, 5_000 ether);
        vm.startPrank(lp2);
        gd.approve(address(amm), 5_000 ether);
        amm.addLiquidity("AAPL", 5_000 ether);
        vm.stopPrank();

        bytes32 key = keccak256(abi.encodePacked("AAPL"));
        assertEq(amm.lpShares(key, lp2), 5_000 ether);
    }

    function test_removeLiquidity() public {
        _seedPool(10_000 ether);

        bytes32 key = keccak256(abi.encodePacked("AAPL"));
        uint256 shares = amm.lpShares(key, lp);

        vm.prank(lp);
        amm.removeLiquidity("AAPL", shares);

        (,, uint256 gRes,, uint256 totalShares,) = amm.pools(key);
        assertEq(gRes, 0);
        assertEq(totalShares, 0);
    }

    function test_buyStock() public {
        _seedPool(50_000 ether);

        vm.startPrank(trader);
        gd.approve(address(amm), 1_000 ether);
        uint256 out = amm.buyStock("AAPL", 1_000 ether, 0);
        vm.stopPrank();

        assertGt(out, 0);
        assertGt(sAAPL.balanceOf(trader), 0);
    }

    function test_buyStock_fee_split() public {
        _seedPool(50_000 ether);

        uint256 treasuryBefore = gd.balanceOf(treasury);

        vm.startPrank(trader);
        gd.approve(address(amm), 1_000 ether);
        amm.buyStock("AAPL", 1_000 ether, 0);
        vm.stopPrank();

        uint256 ubiFee = gd.balanceOf(treasury) - treasuryBefore;
        // UBI fee = ~0.10% of 1000 = ~1 G$. Allow range.
        assertGt(ubiFee, 0.3 ether);
        assertLt(ubiFee, 5 ether);
    }

    function test_sellStock() public {
        _seedPool(50_000 ether);

        vm.startPrank(trader);
        gd.approve(address(amm), 1_000 ether);
        uint256 bought = amm.buyStock("AAPL", 1_000 ether, 0);

        sAAPL.approve(address(amm), bought);
        uint256 gOut = amm.sellStock("AAPL", bought, 0);
        vm.stopPrank();

        assertGt(gOut, 0);
        assertLt(gOut, 1_000 ether); // lost to spread + fees
    }

    function test_buyStock_slippage_reverts() public {
        _seedPool(50_000 ether);

        vm.startPrank(trader);
        gd.approve(address(amm), 1_000 ether);
        vm.expectRevert();
        amm.buyStock("AAPL", 1_000 ether, type(uint256).max);
        vm.stopPrank();
    }

    function test_sellStock_slippage_reverts() public {
        _seedPool(50_000 ether);

        vm.prank(admin);
        sAAPL.mint(trader, 1 ether);

        vm.startPrank(trader);
        sAAPL.approve(address(amm), 1 ether);
        vm.expectRevert();
        amm.sellStock("AAPL", 1 ether, type(uint256).max);
        vm.stopPrank();
    }

    function test_pool_paused_reverts() public {
        _seedPool(50_000 ether);

        vm.prank(admin);
        amm.setPoolPaused("AAPL", true);

        vm.startPrank(trader);
        gd.approve(address(amm), 1_000 ether);
        vm.expectRevert(StockAMM.PoolPaused.selector);
        amm.buyStock("AAPL", 1_000 ether, 0);
        vm.stopPrank();
    }

    function test_insufficient_liquidity_sell_reverts() public {
        _seedPool(100 ether); // tiny G$ reserve

        vm.prank(admin);
        sAAPL.mint(trader, 10 ether); // ~$1,900 worth

        vm.startPrank(trader);
        sAAPL.approve(address(amm), 10 ether);
        vm.expectRevert();
        amm.sellStock("AAPL", 10 ether, 0); // pool only has 100 G$, needs ~$1,900
        vm.stopPrank();
    }

    function test_spread_widens_with_inventory_skew() public {
        _seedPool(50_000 ether);

        (uint256 baseOut,) = amm.getQuoteBuy("AAPL", 1_000 ether);

        // Drain most synthetic from pool by buying a lot
        vm.startPrank(trader);
        gd.approve(address(amm), 40_000 ether);
        amm.buyStock("AAPL", 15_000 ether, 0);
        vm.stopPrank();

        (uint256 skewedOut,) = amm.getQuoteBuy("AAPL", 1_000 ether);

        // Skewed pool should give less synthetic per G$ (wider ask spread)
        assertLe(skewedOut, baseOut);
    }

    function test_getQuoteBuy() public {
        _seedPool(50_000 ether);

        (uint256 out, uint256 fee) = amm.getQuoteBuy("AAPL", 1_000 ether);
        assertGt(out, 0);
        assertGt(fee, 0);
        // fee should be ~0.3% of 1000 = 3 G$
        assertGe(fee, 2.5 ether);
        assertLe(fee, 3.5 ether);
    }

    function test_getQuoteSell() public {
        _seedPool(50_000 ether);

        (uint256 out, uint256 fee) = amm.getQuoteSell("AAPL", 1 ether);
        assertGt(out, 0);
        assertGt(fee, 0);
    }

    function test_onlyAdmin_createPool() public {
        vm.prank(trader);
        vm.expectRevert(StockAMM.NotAdmin.selector);
        amm.createPool("TSLA", makeAddr("sTSLA"));
    }

    // ─── LP fee accounting tests ───────────────────────────────

    function test_buyStock_lp_fee_accrues_to_reserve() public {
        _seedPool(50_000 ether);

        bytes32 key = keccak256(abi.encodePacked("AAPL"));
        (, , uint256 reserveBefore, , ,) = amm.pools(key);

        uint256 gDollarIn = 1_000 ether;
        uint256 fee = (gDollarIn * 30) / 10_000; // 0.30%
        uint256 ubiFee = (fee * 10) / 30;         // 1/3 to UBI
        uint256 expectedReserveIncrease = gDollarIn - ubiFee;

        vm.startPrank(trader);
        gd.approve(address(amm), gDollarIn);
        amm.buyStock("AAPL", gDollarIn, 0);
        vm.stopPrank();

        (, , uint256 reserveAfter, , ,) = amm.pools(key);
        assertEq(reserveAfter - reserveBefore, expectedReserveIncrease,
            "Reserve should increase by gDollarIn minus only the UBI fee");
    }

    function test_sellStock_lp_fee_accrues_to_reserve() public {
        _seedPool(50_000 ether);

        // Buy some stock first
        vm.startPrank(trader);
        gd.approve(address(amm), 10_000 ether);
        uint256 bought = amm.buyStock("AAPL", 10_000 ether, 0);
        vm.stopPrank();

        bytes32 key = keccak256(abi.encodePacked("AAPL"));
        (, , uint256 reserveBefore, , ,) = amm.pools(key);

        // Sell it back
        vm.startPrank(trader);
        sAAPL.approve(address(amm), bought);
        amm.sellStock("AAPL", bought, 0);
        vm.stopPrank();

        (, , uint256 reserveAfter, , ,) = amm.pools(key);
        uint256 contractBalance = gd.balanceOf(address(amm));
        assertGe(contractBalance, reserveAfter,
            "Contract G$ balance must be >= gDollarReserve (no trapped tokens)");
        // Stronger: the difference should be small (just rounding)
        assertLe(contractBalance - reserveAfter, 1,
            "Contract balance and reserve should match (no trapped LP fees)");
    }

    function test_lp_earns_fee_yield() public {
        _seedPool(50_000 ether);

        bytes32 key = keccak256(abi.encodePacked("AAPL"));

        // Execute many trades to generate fees
        for (uint256 i; i < 5; ++i) {
            vm.startPrank(trader);
            gd.approve(address(amm), 5_000 ether);
            uint256 bought = amm.buyStock("AAPL", 5_000 ether, 0);
            sAAPL.approve(address(amm), bought);
            amm.sellStock("AAPL", bought, 0);
            vm.stopPrank();
        }

        // LP removes all liquidity
        uint256 shares = amm.lpShares(key, lp);
        vm.prank(lp);
        amm.removeLiquidity("AAPL", shares);

        uint256 lpBalance = gd.balanceOf(lp);
        // LP started with 100k, deposited 50k, so had 50k remaining.
        // After withdrawal, should have > 50k + 50k = 100k due to earned fees.
        assertGt(lpBalance, 100_000 ether,
            "LP should earn positive yield from trading fees");
    }
}

/// @dev Minimal ERC-20 mock for G$
contract MockGDollar {
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
        require(balanceOf[msg.sender] >= amount, "MockGD: insufficient");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(balanceOf[from] >= amount, "MockGD: insufficient");
        require(allowance[from][msg.sender] >= amount, "MockGD: allowance");
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
        return true;
    }

    function fundUBIPool(uint256) external pure {}
}
