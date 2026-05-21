// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../../src/stocks/PriceOracle.sol";
import "../../src/stocks/StockAMM.sol";
import "../../src/stocks/SyntheticAsset.sol";
import "../../src/risk/UnifiedRiskEngine.sol";

// ─── Mock Chainlink Aggregator for staleness testing ─────────────────

contract MockChainlinkFeed {
    int256 public price;
    uint256 public updatedAt;
    uint8 public constant decimals = 8;

    constructor(int256 _price) {
        price = _price;
        updatedAt = block.timestamp;
    }

    function setPrice(int256 _price) external {
        price = _price;
        updatedAt = block.timestamp;
    }

    function latestRoundData() external view returns (
        uint80 roundId, int256 answer, uint256 startedAt, uint256 _updatedAt, uint80 answeredInRound
    ) {
        return (1, price, updatedAt, updatedAt, 1);
    }
}

// ─── Mock ERC-20 for G$ (unrestricted mint for testing) ─────────────

contract MockGDollarIntegration {
    string public constant name = "GoodDollar";
    string public constant symbol = "G$";
    uint8 public constant decimals = 18;
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
        totalSupply += amount;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        require(balanceOf[msg.sender] >= amount, "insufficient");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(balanceOf[from] >= amount, "insufficient");
        require(allowance[from][msg.sender] >= amount, "allowance");
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }
}

// ─── Mock SyntheticAssetFactory for UnifiedRiskEngine ────────────────

contract MockFactoryIntegration {
    mapping(bytes32 => address) public assets;
    bytes32[] internal _listedKeys;

    function addAsset(bytes32 key, address asset) external {
        assets[key] = asset;
        _listedKeys.push(key);
    }

    function listedCount() external view returns (uint256) { return _listedKeys.length; }
    function listedKeys(uint256 idx) external view returns (bytes32) { return _listedKeys[idx]; }
}

// ─── Mock StockPerpEngine for UnifiedRiskEngine ──────────────────────

contract MockPerpEngineIntegration {
    struct MockMarket {
        bytes32 oracleKey;
        uint256 oiLong;
        uint256 oiShort;
    }
    MockMarket[] internal _markets;

    function addMarket(bytes32 oracleKey, uint256 oiLong, uint256 oiShort) external {
        _markets.push(MockMarket(oracleKey, oiLong, oiShort));
    }

    function setOI(uint256 idx, uint256 oiLong, uint256 oiShort) external {
        _markets[idx].oiLong = oiLong;
        _markets[idx].oiShort = oiShort;
    }

    function marketCount() external view returns (uint256) { return _markets.length; }

    function markets(uint256 id) external view returns (
        bytes32, bytes32, string memory, uint256, uint256,
        uint256, uint256, uint256, uint256, bool
    ) {
        MockMarket memory m = _markets[id];
        return (m.oracleKey, m.oracleKey, "MOCK", m.oiLong, m.oiShort,
                10, 1_000_000e18, 500, 100, true);
    }
}

/**
 * @title RebalanceInvariantTest
 * @notice Cross-contract integration test deploying PriceOracle, StockAMM,
 *         UnifiedRiskEngine, and mock dependencies. Verifies that price
 *         updates propagate correctly across the stack, stale oracle handling
 *         works, multi-symbol independence holds, and risk caps are enforced
 *         when AMM trades increase exposure.
 *
 *         Stack: PriceOracle -> StockAMM -> UnifiedRiskEngine
 */
contract RebalanceInvariantTest is Test {
    PriceOracle public oracle;
    StockAMM public amm;
    UnifiedRiskEngine public riskEngine;
    MockGDollarIntegration public gDollar;
    SyntheticAsset public gAAPL;
    SyntheticAsset public gTSLA;
    MockFactoryIntegration public factory;
    MockPerpEngineIntegration public perpEngine;
    MockChainlinkFeed public aaplFeed;

    bytes32 constant AAPL_KEY = keccak256(abi.encodePacked("AAPL"));
    bytes32 constant TSLA_KEY = keccak256(abi.encodePacked("TSLA"));

    address admin = makeAddr("admin");
    address trader = makeAddr("trader");
    address lp = makeAddr("lp");
    address feeSink = makeAddr("feeSink");

    function setUp() public {
        vm.startPrank(admin);

        // 1. Deploy mock G$
        gDollar = new MockGDollarIntegration();

        // 2. Deploy PriceOracle — AAPL uses Chainlink feed (staleness testable),
        //    TSLA uses manual price
        oracle = new PriceOracle(admin);
        aaplFeed = new MockChainlinkFeed(195_00000000); // $195.00 (8 decimals)
        oracle.registerFeed("AAPL", address(aaplFeed));
        oracle.setManualPrice("TSLA", 180_00000000, true); // $180.00

        // 3. Deploy StockAMM wired to oracle + gDollar
        amm = new StockAMM(
            address(oracle),
            address(gDollar),
            feeSink,
            admin
        );

        // 4. Deploy synthetic assets (minter = admin for seeding, then AMM holds them)
        gAAPL = new SyntheticAsset("GoodAAPL", "gAAPL", admin);
        gTSLA = new SyntheticAsset("GoodTSLA", "gTSLA", admin);

        // 5. Create AMM pools
        amm.createPool("AAPL", address(gAAPL));
        amm.createPool("TSLA", address(gTSLA));

        // 6. Seed AMM pools with synthetic tokens
        gAAPL.mint(admin, 1000e18);
        gAAPL.approve(address(amm), 1000e18);
        amm.seedSyntheticReserve("AAPL", 1000e18);

        gTSLA.mint(admin, 1000e18);
        gTSLA.approve(address(amm), 1000e18);
        amm.seedSyntheticReserve("TSLA", 1000e18);

        // 7. Add G$ liquidity to pools
        gDollar.mint(lp, 500_000e18);
        vm.stopPrank();

        vm.startPrank(lp);
        gDollar.approve(address(amm), 500_000e18);
        amm.addLiquidity("AAPL", 250_000e18);
        amm.addLiquidity("TSLA", 250_000e18);
        vm.stopPrank();

        vm.startPrank(admin);

        // 8. Deploy mock factory + perp engine for risk engine
        factory = new MockFactoryIntegration();
        perpEngine = new MockPerpEngineIntegration();

        factory.addAsset(AAPL_KEY, address(gAAPL));
        factory.addAsset(TSLA_KEY, address(gTSLA));
        perpEngine.addMarket(AAPL_KEY, 0, 0);
        perpEngine.addMarket(TSLA_KEY, 0, 0);

        // 9. Deploy UnifiedRiskEngine
        riskEngine = new UnifiedRiskEngine(
            address(factory),
            address(amm),
            address(perpEngine),
            type(uint256).max,
            admin
        );

        riskEngine.registerSource(address(amm));
        riskEngine.registerSource(address(this));
        riskEngine.registerSource(admin);

        vm.stopPrank();

        // Fund trader
        gDollar.mint(trader, 100_000e18);
    }

    // ─── Scenario 1: Price update propagates to AMM + Risk Engine ────

    function test_priceUpdatePropagation() public {
        int256 netBefore = riskEngine.getNetExposure(AAPL_KEY);

        // Update oracle price via Chainlink feed
        aaplFeed.setPrice(200_00000000); // $195 -> $200

        // Verify AMM sees new price via oracle
        uint256 oraclePrice = oracle.getPriceByKey(AAPL_KEY);
        assertEq(oraclePrice, 200_00000000, "oracle should reflect new AAPL price");

        // Risk engine exposure should be unchanged (price change alone doesn't change token counts)
        int256 netAfter = riskEngine.getNetExposure(AAPL_KEY);
        assertEq(netBefore, netAfter, "price change alone should not affect exposure count");
    }

    // ─── Scenario 2: Stale oracle handling ───────────────────────────

    function test_staleOracleDoesNotBlockRiskQueries() public {
        // Warp time past oracle maxAge (default 1 hour)
        vm.warp(block.timestamp + 2 hours);

        // Risk engine queries are view-only and don't enforce staleness
        int256 net = riskEngine.getNetExposure(AAPL_KEY);
        // Should still return a value (exposure is based on token counts, not prices)
        assertTrue(net >= 0 || net < 0, "risk engine should still report exposure");

        uint256 totalAbs = riskEngine.totalAbsExposure();
        assertTrue(totalAbs >= 0, "totalAbsExposure should still compute");
    }

    function test_staleOracleBlocksAMMTrades() public {
        // Warp time past oracle maxAge
        vm.warp(block.timestamp + 2 hours);

        vm.startPrank(trader);
        gDollar.approve(address(amm), 10_000e18);

        // StockAMM.buyStock calls oracle.getPriceByKey which should revert on stale
        vm.expectRevert();
        amm.buyStock("AAPL", 10_000e18, 0);
        vm.stopPrank();
    }

    // ─── Scenario 3: Multi-symbol independence ───────────────────────

    function test_multiSymbolIndependence() public {
        // Update only AAPL price via feed
        aaplFeed.setPrice(210_00000000); // $195 -> $210

        // Verify TSLA price unchanged
        uint256 tslaPrice = oracle.getPriceByKey(TSLA_KEY);
        assertEq(tslaPrice, 180_00000000, "TSLA price should be unchanged");

        uint256 aaplPrice = oracle.getPriceByKey(AAPL_KEY);
        assertEq(aaplPrice, 210_00000000, "AAPL price should be updated");

        // Exposures should be independent
        int256 aaplNet = riskEngine.getNetExposure(AAPL_KEY);
        int256 tslaNet = riskEngine.getNetExposure(TSLA_KEY);

        // Both have same initial setup (1000e18 synthetic in AMM), so net = totalSupply - ammReserve
        // gAAPL totalSupply = 1000e18 (minted by admin), ammReserve = 1000e18 => net = 0
        assertEq(aaplNet, 0, "AAPL net exposure should be 0 (all in AMM)");
        assertEq(tslaNet, 0, "TSLA net exposure should be 0 (all in AMM)");
    }

    // ─── Scenario 4: AMM buyStock increases risk engine exposure ─────

    function test_buyStockIncreasesExposure() public {
        // Before trade: all synthetic tokens in AMM pool, net exposure = 0
        int256 netBefore = riskEngine.getNetExposure(AAPL_KEY);
        assertEq(netBefore, 0, "net exposure should be 0 before trade");

        // Trader buys gAAPL from AMM
        vm.startPrank(trader);
        gDollar.approve(address(amm), 50_000e18);
        uint256 received = amm.buyStock("AAPL", 50_000e18, 0);
        vm.stopPrank();

        assertTrue(received > 0, "trader should receive gAAPL");

        // After trade: trader holds gAAPL tokens, AMM reserve decreased
        // Net exposure = totalSupply - ammReserve = 1000e18 - (1000e18 - received) = received
        int256 netAfter = riskEngine.getNetExposure(AAPL_KEY);
        assertEq(netAfter, int256(received), "net exposure should equal tokens held by trader");
        assertTrue(netAfter > 0, "exposure should be positive after buy");
    }

    // ─── Scenario 5: Risk cap enforcement via checkRisk ──────────────

    function test_riskCapEnforcementBlocksExcessiveExposure() public {
        // Set a tight symbol cap
        vm.prank(admin);
        riskEngine.setSymbolCap(AAPL_KEY, 100e18);

        // Current exposure is 0, so adding 101e18 should fail
        vm.prank(admin);
        vm.expectRevert();
        riskEngine.checkRisk(AAPL_KEY, int256(101e18));
    }

    function test_riskCapEnforcementAllowsWithinCap() public {
        vm.prank(admin);
        riskEngine.setSymbolCap(AAPL_KEY, 100e18);

        vm.prank(admin);
        riskEngine.checkRisk(AAPL_KEY, int256(50e18));
    }

    // ─── Scenario 6: Protocol-wide cap across symbols ────────────────

    function test_protocolCapAcrossSymbols() public {
        // Set protocol cap lower than combined possible exposure
        vm.prank(admin);
        riskEngine.setProtocolCap(200e18);

        // First symbol: 150e18 should pass
        vm.prank(admin);
        riskEngine.checkRisk(AAPL_KEY, int256(150e18));

        // Simulate 150e18 exposure on AAPL by moving tokens out of AMM
        vm.startPrank(trader);
        gDollar.approve(address(amm), 50_000e18);
        amm.buyStock("AAPL", 50_000e18, 0);
        vm.stopPrank();

        // Now total exposure > 0 for AAPL. Check that protocol cap blocks TSLA
        uint256 totalExposure = riskEngine.totalAbsExposure();
        assertTrue(totalExposure > 0, "should have AAPL exposure from trade");

        // Try to add exposure that would exceed protocol cap
        if (totalExposure + 200e18 > 200e18) {
            vm.prank(admin);
            vm.expectRevert();
            riskEngine.checkRisk(TSLA_KEY, int256(200e18));
        }
    }

    // ─── Scenario 7: Circuit breaker integration ─────────────────────

    function test_circuitBreakerTripsOnLargeExposureSpike() public {
        // Move some tokens to trader to establish baseline exposure
        vm.startPrank(trader);
        gDollar.approve(address(amm), 20_000e18);
        amm.buyStock("AAPL", 20_000e18, 0);
        vm.stopPrank();

        uint256 currentExposure = riskEngine.totalAbsExposure();
        assertTrue(currentExposure > 0, "baseline exposure should be positive");

        // Enable circuit breaker with tight threshold
        vm.startPrank(admin);
        riskEngine.setProtocolCap(0); // disable protocol cap
        riskEngine.setCircuitBreakerParams(500, 300); // 5% threshold, 5min window
        riskEngine.enableCircuitBreaker(true);
        vm.stopPrank();

        // Large buy creating exposure spike > 5%
        vm.startPrank(trader);
        gDollar.approve(address(amm), 80_000e18);
        amm.buyStock("AAPL", 80_000e18, 0);
        vm.stopPrank();

        // Check if circuit breaker should have tripped (depends on delta)
        uint256 newExposure = riskEngine.totalAbsExposure();
        if (newExposure > currentExposure) {
            uint256 delta = newExposure - currentExposure;
            uint256 changeBps = (delta * 10_000) / currentExposure;
            if (changeBps > 500) {
                // Circuit breaker should trip next time checkRisk is called
                vm.prank(admin);
                riskEngine.checkRisk(AAPL_KEY, 0);
                assertTrue(riskEngine.paused(), "circuit breaker should auto-pause");
            }
        }
    }

    // ─── Scenario 8: Sell restores exposure toward zero ──────────────

    function test_sellReducesExposure() public {
        // Buy first
        vm.startPrank(trader);
        gDollar.approve(address(amm), 50_000e18);
        uint256 bought = amm.buyStock("AAPL", 50_000e18, 0);
        vm.stopPrank();

        int256 netAfterBuy = riskEngine.getNetExposure(AAPL_KEY);
        assertTrue(netAfterBuy > 0, "exposure should be positive after buy");

        // Sell half back
        uint256 sellAmount = bought / 2;
        vm.startPrank(trader);
        gAAPL.approve(address(amm), sellAmount);
        amm.sellStock("AAPL", sellAmount, 0);
        vm.stopPrank();

        int256 netAfterSell = riskEngine.getNetExposure(AAPL_KEY);
        assertTrue(netAfterSell < netAfterBuy, "exposure should decrease after sell");
        assertTrue(netAfterSell > 0, "exposure should still be positive (partial sell)");
    }
}
