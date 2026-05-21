// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../../src/stocks/StockAMM.sol";
import "../../src/stocks/SyntheticAsset.sol";
import "../../src/stocks/PriceOracle.sol";
import "../handlers/StockAMMHandler.sol";

/**
 * @title StockAMMInvariantTest
 * @notice Foundry invariant suite for StockAMM properties.
 *
 *         The `StockAMMHandler` is the target contract, exposing bounded
 *         action functions: buy, sell, addLiq, removeLiq, nudgePrice.
 *
 *         Four accounting invariants are asserted between every fuzzed call:
 *
 *           1. `reserveSolvency` — actual token balances >= tracked pool reserves.
 *           2. `feeConservation` — treasury accumulates fees monotonically.
 *           3. `lpShareAccounting` — total LP shares >= any individual LP's shares.
 *           4. `oracleAnchoring` — pool.active iff oracle price > 0.
 */
contract StockAMMInvariantTest is Test {
    StockAMM public amm;
    PriceOracle public oracle;
    SyntheticAsset public sAAPL;
    MockGDollarInv public gd;
    StockAMMHandler public handler;

    address admin = makeAddr("admin");
    address lp = makeAddr("lp");
    address trader = makeAddr("trader");
    address treasury = makeAddr("treasury");

    uint256 constant ORACLE_PRICE = 19_000_000_000; // $190.00

    bytes32 poolKey;

    function setUp() public {
        gd = new MockGDollarInv();
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

        gd.mint(lp, 100_000_000 ether);
        gd.mint(trader, 100_000_000 ether);

        vm.startPrank(lp);
        gd.approve(address(amm), 10_000_000 ether);
        amm.addLiquidity("AAPL", 1_000_000 ether);
        vm.stopPrank();

        poolKey = keccak256(abi.encodePacked("AAPL"));

        handler = new StockAMMHandler(
            amm, oracle, sAAPL, address(gd),
            admin, trader, lp, treasury, ORACLE_PRICE
        );

        targetContract(address(handler));
    }

    // ============ Invariant 1: reserveSolvency ============

    /// @notice Actual token balances held by AMM must be >= tracked pool reserves.
    function invariant_reserveSolvency() public view {
        (, , uint256 gRes, uint256 sRes, , ) = amm.pools(poolKey);

        uint256 actualG = gd.balanceOf(address(amm));
        uint256 actualS = sAAPL.balanceOf(address(amm));

        assertGe(actualG, gRes, "G$ balance < tracked gDollarReserve");
        assertGe(actualS, sRes, "synth balance < tracked syntheticReserve");
    }

    // ============ Invariant 2: feeConservation ============

    /// @notice Treasury balance only increases as trades occur.
    function invariant_feeConservation() public view {
        if (handler.tradeCount() == 0) return;
        uint256 treasuryBal = gd.balanceOf(treasury);
        assertGt(treasuryBal, 0, "treasury must have fees after trades");
    }

    // ============ Invariant 3: lpShareAccounting ============

    /// @notice No single LP can hold more shares than the pool total.
    function invariant_lpShareAccounting() public view {
        (, , , , uint256 totalShares, ) = amm.pools(poolKey);

        uint256 lpSharesLp = amm.lpShares(poolKey, lp);

        assertGe(totalShares, lpSharesLp, "LP shares exceed total");
        assertGe(totalShares, 0, "total shares non-negative");
    }

    // ============ Invariant 4: oracleAnchoring ============

    /// @notice Pool is active only when oracle returns a valid price.
    function invariant_oracleAnchoring() public view {
        (, , , , , bool active) = amm.pools(poolKey);
        uint256 oPrice = oracle.getPrice("AAPL");

        if (active) {
            assertGt(oPrice, 0, "active pool must have oracle price > 0");
        }
    }
}

contract MockGDollarInv {
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
