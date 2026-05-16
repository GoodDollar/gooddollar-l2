# GoodDollar L2 Dune Dashboard Spec

Purpose: make the public testnet measurable from day one. Dune should be the external proof layer for the GoodDollar L2 story: every useful transaction can be traced to protocol activity, fees, and UBI funding.

## Launch Requirement

Dune dashboard is part of the testnet move, alongside:

- public RPC
- explorer
- faucet
- status page
- canonical `addresses.json`
- parallel dapp test matrix

Do not treat Dune as a marketing afterthought. It is a release artifact.

## Dashboard Narrative

1. **Network usage** — are users and agents actually transacting?
2. **Dapp usage** — which protocols are used: Swap, Perps, Predict, Lend, Stable, Stocks, Bridge, Claim?
3. **UBI impact** — how much fee flow reaches UBI contracts?
4. **Agent economy** — are AI agents creating wallets and generating useful on-chain activity?
5. **Reliability** — success/revert rate, indexed txs, faucet retention, contract health.

## Core Tiles

### 1. Testnet Overview

- Latest indexed block
- Daily transactions
- Daily active wallets
- Cumulative active wallets
- New wallets per day
- Successful vs reverted txs
- Gas used per day

### 2. Dapp Activity Matrix

Break down transactions by canonical protocol contract:

- GoodSwap
- GoodPerps
- GoodPredict
- GoodLend
- GoodStable
- GoodStocks
- Bridge
- UBI Claim
- Governance
- Agent Registry

Metrics per dapp:

- daily tx count
- daily active users
- cumulative tx count
- volume where event data supports it
- success/revert rate

### 3. UBI Funding

Track every fee-to-UBI pathway:

- total UBI fees routed daily
- cumulative UBI fees routed
- UBI fees by protocol
- UBI fee share as % of total protocol fees
- UBIPoolFunded events
- UBIClaimed count and amount
- daily unique claimers

### 4. Agent Economy

From `AgentRegistry` and wallet activity:

- registered agents
- active agents per day
- agent txs/day
- agent-generated volume
- agent-generated UBI contribution
- top agents by UBI contribution
- agent retention cohorts

### 5. Testnet Funnel

Use faucet + on-chain actions:

- faucet recipients
- faucet amount distributed
- % of faucet recipients who make 1+ dapp tx
- % who make 3+ dapp txs
- time from faucet to first tx
- retained active wallets D1/D7

## Required Events / Sources

Existing events already useful for Dune:

- `UBIClaimV2.UBIClaimed(address claimer,uint256 amount,uint256 epoch)`
- `GoodDollarTokenSecure.UBIPoolFunded(address from,uint256 amount)`
- `GoodDollarTokenSecure.UBIClaimed(address claimer,uint256 amount,uint256 timestamp)`
- `AgentRegistry.AgentRegistered(address agent,string name,address owner)`
- `AgentRegistry.ActivityRecorded(address agent,address user,string protocol,uint256 volume,uint256 fees)`
- `GoodSwapRouter.Swap(...)`
- `GoodSwap.Swap(...)`
- `LiFiBridgeAggregator.UBIFeeCollected(uint256 swapId,address token,uint256 amount)`
- `MultiChainBridge.RoutingFeeCollected(address token,uint256 totalFee,uint256 ubiShare)`
- `PerpEngine.PositionOpened(...)`
- `PerpEngine.PositionClosed(...)`
- `PerpEngine.PositionLiquidated(...)`
- `PerpUBIFeeSplitter.FeeSplit(...)`
- `PerpUBIFeeSplitter.TradingFeeSplit(...)`
- `PerpUBIFeeSplitter.FundingFeeSplit(...)`
- `PerpUBIFeeSplitter.LiquidationUBI(...)`
- `VoteEscrowedGD.EarlyUnlocked(address user,uint256 received,uint256 penalty,uint256 toUBI)`
- `GoodVault.Harvested(uint256 profit,uint256 loss,uint256 ubiFee,uint256 mgmtFee)`

## Event Standardization Before Public Testnet

Add or normalize one canonical event shape in every fee-producing protocol:

```solidity
event UBIFeeRouted(
    bytes32 indexed protocol,
    address indexed payer,
    address indexed token,
    uint256 grossFee,
    uint256 ubiAmount,
    bytes32 actionId
);
```

Rules:

- `protocol`: stable ID such as `keccak256("GOODSWAP")`, `keccak256("GOODPERPS")`
- `payer`: user/agent responsible for the fee when known
- `token`: fee token, native ETH represented as `address(0)`
- `grossFee`: full fee charged
- `ubiAmount`: amount routed to UBI
- `actionId`: order id, market id, position id, bridge request id, or `bytes32(0)`

This avoids fragile Dune SQL that has to infer UBI fee flow differently for every dapp.

## Dune Query Pack

Create queries in this order:

1. contract labels / address book
2. daily active wallets
3. protocol transaction classifier
4. UBI fee routed daily
5. UBI fee routed by protocol
6. UBI claims daily
7. agent activity leaderboard
8. faucet-to-first-tx funnel
9. reverted transaction rate by contract
10. testnet overview rollup

## Indexing Prerequisite

Dune can only query chains it indexes. For local chain `42069`, use internal indexer/status pages. For public testnet launch, choose a Dune-indexed environment or request indexing before announcing the Dune dashboard.

If Dune indexing is not live on launch day, publish an interim internal SQL/API dashboard and mark Dune as `pending indexing` in the testnet checklist.
