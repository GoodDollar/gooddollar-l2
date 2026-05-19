/**
 * Devnet configuration — single source of truth for contract addresses, RPC
 * URL, chain ID, and ABIs.
 *
 * Addresses are sourced from `op-stack/addresses.json`, which is regenerated
 * from `broadcast/` artifacts by `scripts/refresh-addresses.py` after every
 * redeploy. The script also writes `.autobuilder/addresses.env` so the
 * canonical address set is identical for backend services, cast scripts, and
 * the frontend.
 *
 * Anything still hardcoded below is a contract that the refresh script does
 * NOT track yet (typically pool tokens, sToken ERC-20s, mock collateral) —
 * those need to be either added to `SYMBOL_MAP` in the refresh script or
 * redeployed in a follow-up task. Dead-on-chain hardcoded addresses are
 * tagged with `// STALE` so they are easy to find and remediate.
 *
 * All frontend data modules should import addresses and ABIs from this module
 * instead of hardcoding values or importing from chain.ts directly.
 */

import rawAddresses from "../../../op-stack/addresses.json";

// ─── Network constants ────────────────────────────────────────────────────────

export const DEVNET_CHAIN_ID: number = rawAddresses.chain_id;
export const DEVNET_RPC_URL: string = rawAddresses.rpc_url;
export const DEVNET_EXPLORER_URL: string = rawAddresses.explorer_url;

// ─── Contract addresses ───────────────────────────────────────────────────────

/**
 * All live devnet contract addresses.
 *
 * Base contracts come from op-stack/addresses.json.
 * Extended contracts (GoodLend, GoodSwap, GoodPerps, GoodStocks, GoodStable)
 * were deployed on 2026-04-03 and are listed here directly.
 *
 * GoodStocks contracts (CollateralVault, SyntheticAssetFactory,
 * StocksPriceOracle) were redeployed on 2026-04-05 (GOO-414) with 12 synthetic
 * equities — those addresses below take precedence over the original addresses.json values.
 */
export const CONTRACTS = {
  // ── Core (from op-stack/addresses.json) ──────────────────────────────────
  GoodDollarToken: rawAddresses.contracts.GoodDollarToken as `0x${string}`,
  UBIClaimV2: rawAddresses.contracts.UBIClaimV2 as `0x${string}`,
  UBIFeeSplitter: rawAddresses.contracts.UBIFeeSplitter as `0x${string}`,
  LiFiBridgeAggregator: rawAddresses.contracts
    .LiFiBridgeAggregator as `0x${string}`,
  ValidatorStaking: rawAddresses.contracts.ValidatorStaking as `0x${string}`,
  UBIFeeHook: rawAddresses.contracts.UBIFeeHook as `0x${string}`,
  MarketFactory: rawAddresses.contracts.MarketFactory as `0x${string}`,
  // ConditionalTokens: in JSON but currently no code on-chain after re-snapshot;
  // surfaced via JSON so the next refresh-addresses run picks up a redeploy.
  ConditionalTokens: rawAddresses.contracts.ConditionalTokens as `0x${string}`,
  OptimisticResolver:
    "0x7c8baafa542c57ff9b2b90612bf8ab9e86e22c09" as `0x${string}`, // STALE: not in JSON, no code on-chain — needs redeploy task

  // ── GoodLend — sourced from op-stack/addresses.json (chain 42069) ────────
  // Previous hardcoded GoodLendPool (0x49fd…) was wiped by chain re-snapshot.
  GoodLendPool: rawAddresses.contracts.GoodLendPool as `0x${string}`,
  GoodLendPriceOracle:
    "0x9d4454b023096f34b160d6b654540c56a1f81688" as `0x${string}`, // STALE: no code on-chain — needs redeploy task
  GoodLendInterestRateModel:
    "0x809d550fca64d94bd9f66e60752a544199cfac3d" as `0x${string}`, // STALE: no code on-chain — needs redeploy task
  // GoodLend reserve tokens — JSON-tracked
  MockUSDC: rawAddresses.contracts.MockUSDC as `0x${string}`,
  MockWETH: rawAddresses.contracts.MockWETH as `0x${string}`,
  // gTokens (interest-bearing) — STALE: not in JSON, no code on-chain — needs redeploy task
  gUSDC: "0xb7278a61aa25c888815afc32ad3cc52ff24fe575" as `0x${string}`,
  gWETH: "0x82e01223d51eb87e16a03e24687edf0f294da6f1" as `0x${string}`,
  // Debt tokens — STALE: not in JSON, no code on-chain — needs redeploy task
  debtUSDC: "0xcd8a1c3ba11cf5ecfa6267617243239504a98d90" as `0x${string}`,
  debtWETH: "0x2bdcc0de6be1f7d2ee689a0342d76f52e8efaba3" as `0x${string}`,

  // ── GoodSwap — re-seeded to devnet (chain 42069), 2026-05-15 (Task 0011) ──
  // Router, pools, and pool tokens were re-seeded after the 2026-05-18 devnet reset.
  PoolManager: "0xC9a43158891282A2B1475592D5719c001986Aaec" as `0x${string}`, // STALE: no code on-chain — needs redeploy task
  GoodSwapRouter: "0xa6e99a4ed7498b3cddcbb61a6a607a4925faa1b7" as `0x${string}`,
  // GoodSwap Liquidity Pools (verified alive)
  SwapPoolGdWeth: "0x6f6f570f45833e249e27022648a26f4076f48f78" as `0x${string}`,
  SwapPoolGdUsdc: "0xca8c8688914e0f7096c920146cd0ad85cd7ae8b9" as `0x${string}`,
  SwapPoolWethUsdc:
    "0xb0f05d25e41fbc2b52013099ed9616f1206ae21b" as `0x${string}`,
  // GoodSwap pool tokens — deployed by DeploySwapInfra after reset.
  SwapGD: "0xb9beecd1a582768711de1ee7b0a1d582d9d72a6c" as `0x${string}`,
  SwapWETH: "0x8a93d247134d91e0de6f96547cb0204e5be8e5d8" as `0x${string}`,
  SwapUSDC: "0x40918ba7f132e0acba2ce4de4c4baf9bd2d7d849" as `0x${string}`,

  // ── GoodPerps — sourced from op-stack/addresses.json (chain 42069) ───────
  // Previous hardcoded PerpEngine address (0x021DBfF4…) collided with the
  // legacy UBIRevenueTracker slot and had no code on-chain.
  PerpEngine: rawAddresses.contracts.PerpEngine as `0x${string}`,
  MarginVault: rawAddresses.contracts.MarginVault as `0x${string}`,
  FundingRate: rawAddresses.contracts.FundingRate as `0x${string}`,
  PerpPriceOracle: rawAddresses.contracts.PerpPriceOracle as `0x${string}`,

  // ── GoodStocks — sourced from op-stack/addresses.json (chain 42069) ──────
  // CollateralVault and SyntheticAssetFactory now live in the JSON; only the
  // sToken ERC-20s are still hardcoded and need a redeploy.
  StocksPriceOracle: rawAddresses.contracts.StocksPriceOracle as `0x${string}`,
  CollateralVault: rawAddresses.contracts.CollateralVault as `0x${string}`,
  SyntheticAssetFactory: rawAddresses.contracts
    .SyntheticAssetFactory as `0x${string}`,
  // Synthetic stock tokens (sToken ERC-20s) — live after reset
  sAAPL: "0x4a46860E025D02f60Bff5f44afB25ed75298784C" as `0x${string}`,
  sTSLA: "0x4565072738662672Bb9B1b1b5CF015C4b05A9328" as `0x${string}`,
  sNVDA: "0x873B05552B084BB737107ED762C36e2eB64b4cDe" as `0x${string}`,
  sMSFT: "0xC1F24d2C4C30A6DD19277EfB3771e724889eaa5f" as `0x${string}`,
  sAMZN: "0x0d3AA1Ff33792CD98b966846B0F661276E8eA4e1" as `0x${string}`,
  sGOOGL: "0xd6A7D966Ea6eDeA76330eA64A773318148E8F02D" as `0x${string}`,
  sMETA: "0xA0A6e9950d626A1f4F707a82BdE6e48ACFc2FF82" as `0x${string}`,
  sJPM: "0x6bA870E970f80cD9F7bD3E23EEd8b3Ed042728Cf" as `0x${string}`,
  sV: "0x7921b17aBf22438a597b3c02017ab6E524fe8521" as `0x${string}`,
  sDIS: "0x00029cf217b9b1696A51d2145386f601d56D425f" as `0x${string}`,
  sNFLX: "0xa27e40C9393FeD9E92CbFC42127519155484f89C" as `0x${string}`,
  sAMD: "0xe320Ed42E8FFbFd8efd219bC35fe0F66c5773890" as `0x${string}`,

  // ── Governance — sourced from op-stack/addresses.json ────────────────────
  VoteEscrowedGD: rawAddresses.contracts.VoteEscrowedGD as `0x${string}`,
  GoodDAO: rawAddresses.contracts.GoodDAO as `0x${string}`,
  GoodTimelock: "0x5e6cb7e728e1c320855587e1d9c6f7972ebdd6d5" as `0x${string}`, // STALE: no code on-chain — needs redeploy task

  // ── GoodStable — sourced from op-stack/addresses.json (chain 42069) ──────
  // Previous hardcoded addresses (gUSD 0x5D42…, VaultManager 0xAb7b…, etc.)
  // were wiped by chain re-snapshot.
  gUSD: rawAddresses.contracts.gUSD as `0x${string}`,
  VaultManager: rawAddresses.contracts.VaultManager as `0x${string}`,
  CollateralRegistry: rawAddresses.contracts
    .CollateralRegistry as `0x${string}`,
  StabilityPool: rawAddresses.contracts.StabilityPool as `0x${string}`,
  PegStabilityModule: rawAddresses.contracts
    .PegStabilityModule as `0x${string}`,
  StablePriceOracle:
    "0x8bce54ff8ab45cb075b044ae117b8fd91f9351ab" as `0x${string}`, // STALE: not in JSON — needs redeploy task
  StableFeeSplitter:
    "0x26b862f640357268bd2d9e95bc81553a2aa81d7e" as `0x${string}`, // STALE: not in JSON — needs redeploy task
  // GoodStable collateral tokens (separate from GoodLend mocks) — live after reset
  StableMockWETH: "0xb2b580ce436e6f77a5713d80887e14788ef49c9a" as `0x${string}`,
  StableMockUSDC: "0xb377a2eed7566ac9fcb0ba673604f9bf875e2bab" as `0x${string}`,
  StableMockGD: "0x66f625b8c4c635af8b74ece2d7ed0d58b4af3c3d" as `0x${string}`,

  // ── UBI Analytics — sourced from op-stack/addresses.json ─────────────────
  // Previous hardcoded UBIRevenueTracker (0x021DBfF4…) was actually the OLD
  // PerpEngine address — wrong contract entirely. Now wired to the canonical
  // 0xfd6f… deployed alongside the current revenue/UBI splitter pair.
  UBIRevenueTracker: rawAddresses.contracts.UBIRevenueTracker as `0x${string}`,

  // ── GoodYield — sourced from op-stack/addresses.json (chain 42069) ───────
  VaultFactory: rawAddresses.contracts.VaultFactory as `0x${string}`,

  // ── GoodYield Initial Vaults — live after reset ──
  ETHLendingVault:
    "0xE5b9c837CF35ad00937CE3B553A1F13807EAC8f4" as `0x${string}`,
  GUSDStabilityVault:
    "0xa327526e816a9f9958C2C1A936BEcC4675CACC4b" as `0x${string}`,
  GDLendingVault: "0x8dB9B84E12FF48cC14B5ECE688e95A0597fA42B8" as `0x${string}`,

  // ── Agent Registry — sourced from op-stack/addresses.json ────────────────
  AgentRegistry: rawAddresses.contracts.AgentRegistry as `0x${string}`,

  // ── QA TestRegistry — live after reset ───────────────────────────────────
  TestRegistry: "0x0a17fabea4633ce714f1fa4a2dca62c3bac4758d" as `0x${string}`,
} as const;

/**
 * @deprecated Use CONTRACTS instead. Kept for backward compatibility.
 */
export const DEVNET_CONTRACTS = CONTRACTS;

// ─── ABIs ─────────────────────────────────────────────────────────────────────
// Re-exported from abi.ts so all consumers can import both addresses and ABIs
// from a single module.

export {
  GoodDollarTokenABI,
  MarketFactoryABI,
  ConditionalTokensABI,
  UBIFeeHookABI,
  GoodLendPoolABI,
  PerpEngineABI,
  CollateralVaultABI,
  SyntheticAssetFactoryABI,
  MarginVaultABI,
  FundingRateABI,
  ERC20ABI,
  GoodLendPriceOracleABI,
  PriceOracleABI,
  VaultManagerABI,
  CollateralRegistryABI,
  GoodPoolABI,
  GoodSwapRouterABI,
  VoteEscrowedGDABI,
  GoodDAOABI,
  TestRegistryABI,
  UBIRevenueTrackerABI,
  VaultFactoryABI,
  GoodVaultABI,
} from "./abi";
