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

import rawAddresses from '../../../op-stack/addresses.json'

// ─── Network constants ────────────────────────────────────────────────────────

export const DEVNET_CHAIN_ID: number = rawAddresses.chain_id
export const DEVNET_RPC_URL: string = rawAddresses.rpc_url
export const DEVNET_EXPLORER_URL: string = rawAddresses.explorer_url

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
  GoodDollarToken:       rawAddresses.contracts.GoodDollarToken as `0x${string}`,
  UBIClaimV2:            rawAddresses.contracts.UBIClaimV2 as `0x${string}`,
  UBIFeeSplitter:        rawAddresses.contracts.UBIFeeSplitter as `0x${string}`,
  LiFiBridgeAggregator:  rawAddresses.contracts.LiFiBridgeAggregator as `0x${string}`,
  ValidatorStaking:      rawAddresses.contracts.ValidatorStaking as `0x${string}`,
  UBIFeeHook:            rawAddresses.contracts.UBIFeeHook as `0x${string}`,
  MarketFactory:         rawAddresses.contracts.MarketFactory as `0x${string}`,
  // ConditionalTokens: in JSON but currently no code on-chain after re-snapshot;
  // surfaced via JSON so the next refresh-addresses run picks up a redeploy.
  ConditionalTokens:     rawAddresses.contracts.ConditionalTokens as `0x${string}`,
  OptimisticResolver:    '0x30426D33a78afdb8788597D5BFaBdADc3Be95698' as `0x${string}`, // STALE: not in JSON, no code on-chain — needs redeploy task

  // ── GoodLend — sourced from op-stack/addresses.json (chain 42069) ────────
  // Previous hardcoded GoodLendPool (0x49fd…) was wiped by chain re-snapshot.
  GoodLendPool:                rawAddresses.contracts.GoodLendPool as `0x${string}`,
  GoodLendPriceOracle:         '0x46b142dd1e924fab83ecc3c08e4d46e82f005e0e' as `0x${string}`, // STALE: no code on-chain — needs redeploy task
  GoodLendInterestRateModel:   '0x367761085bf3c12e5da2df99ac6e1a824612b8fb' as `0x${string}`, // STALE: no code on-chain — needs redeploy task
  // GoodLend reserve tokens — JSON-tracked
  MockUSDC:              rawAddresses.contracts.MockUSDC as `0x${string}`,
  MockWETH:              rawAddresses.contracts.MockWETH as `0x${string}`,
  // gTokens (interest-bearing) — STALE: not in JSON, no code on-chain — needs redeploy task
  gUSDC:                 '0x4631bcabd6df18d94796344963cb60d44a4136b6' as `0x${string}`,
  gWETH:                 '0xa4899d35897033b927acfcf422bc745916139776' as `0x${string}`,
  // Debt tokens — STALE: not in JSON, no code on-chain — needs redeploy task
  debtUSDC:              '0x86a2ee8faf9a840f7a2c64ca3d51209f9a02081d' as `0x${string}`,
  debtWETH:              '0xf953b3a269d80e3eb0f2947630da976b896a8c5b' as `0x${string}`,

  // ── GoodSwap — re-seeded to devnet (chain 42069), 2026-05-15 (Task 0011) ──
  // Router and pools have valid bytecode on-chain. Pool tokens (SwapGD/WETH/
  // USDC) are stale and need a redeploy.
  PoolManager:           '0xC9a43158891282A2B1475592D5719c001986Aaec' as `0x${string}`, // STALE: no code on-chain — needs redeploy task
  GoodSwapRouter:        '0x975cDd867aCB99f0195be09C269E2440aa1b1FA8' as `0x${string}`,
  // GoodSwap Liquidity Pools (verified alive)
  SwapPoolGdWeth:        '0xd6096fbEd8bCc461d06b0C468C8b1cF7d45dC92d' as `0x${string}`,
  SwapPoolGdUsdc:        '0x0aD6371dd7E9923d9968D63Eb8B9858c700abD9d' as `0x${string}`,
  SwapPoolWethUsdc:      '0xAA5c5496e2586F81d8d2d0B970eB85aB088639c2' as `0x${string}`,
  // GoodSwap pool tokens (devnet mocks) — STALE: no code on-chain — needs redeploy task
  SwapGD:                '0x547382C0D1b23f707918D3c83A77317B71Aa8470' as `0x${string}`,
  SwapWETH:              '0x7C8BaafA542c57fF9B2B90612bf8aB9E86e22C09' as `0x${string}`,
  SwapUSDC:              '0x0a17FabeA4633ce714F1Fa4a2dcA62C3bAc4758d' as `0x${string}`,

  // ── GoodPerps — sourced from op-stack/addresses.json (chain 42069) ───────
  // Previous hardcoded PerpEngine address (0x021DBfF4…) collided with the
  // legacy UBIRevenueTracker slot and had no code on-chain.
  PerpEngine:            rawAddresses.contracts.PerpEngine as `0x${string}`,
  MarginVault:           rawAddresses.contracts.MarginVault as `0x${string}`,
  FundingRate:           rawAddresses.contracts.FundingRate as `0x${string}`,
  PerpPriceOracle:       rawAddresses.contracts.PerpPriceOracle as `0x${string}`,

  // ── GoodStocks — sourced from op-stack/addresses.json (chain 42069) ──────
  // CollateralVault and SyntheticAssetFactory now live in the JSON; only the
  // sToken ERC-20s are still hardcoded and need a redeploy.
  StocksPriceOracle:     rawAddresses.contracts.StocksPriceOracle as `0x${string}`,
  CollateralVault:       rawAddresses.contracts.CollateralVault as `0x${string}`,
  SyntheticAssetFactory: rawAddresses.contracts.SyntheticAssetFactory as `0x${string}`,
  // Synthetic stock tokens (sToken ERC-20s) — STALE: no code on-chain — needs redeploy task
  sAAPL:                 '0xfD195EeC3ADB4D9484065dcde04D9F657a5F8c45' as `0x${string}`,
  sTSLA:                 '0xAB8C68E77d2584437b8F2ceD454D33e6B7d1eF48' as `0x${string}`,
  sNVDA:                 '0x60f83010b4a0509ea8c7a7993471e9a4B3C82dBc' as `0x${string}`,
  sMSFT:                 '0xC15476cFC8559FD9528141aBea459A709d86b586' as `0x${string}`,
  sAMZN:                 '0xB701cDEA95F11bad434eb5F4fAd1320ED3544394' as `0x${string}`,
  sGOOGL:                '0xfC97F96F115d4411821BD64Be4C6Ad670F7c0818' as `0x${string}`,
  sMETA:                 '0xa9859e16D4DE5e71649F5D28cd47Dddce2af40CB' as `0x${string}`,
  sJPM:                  '0x9511722bF565DF7420AB739B8e49894c5471Fb28' as `0x${string}`,
  sV:                    '0x6efeD18c2878F48179F9B52b251c7d4C834BBC0A' as `0x${string}`,
  sDIS:                  '0x3FDc5a01c707Ef3B708Dcdab36014aF3e229E473' as `0x${string}`,
  sNFLX:                 '0x3B156D26a707de6E792Af47D5890E11D124F8D6C' as `0x${string}`,
  sAMD:                  '0x85eD4d86A147a281569Dac55DA64D74d9fF53409' as `0x${string}`,

  // ── Governance — sourced from op-stack/addresses.json ────────────────────
  VoteEscrowedGD:        rawAddresses.contracts.VoteEscrowedGD as `0x${string}`,
  GoodDAO:               rawAddresses.contracts.GoodDAO as `0x${string}`,
  GoodTimelock:          '0xF66CfDf074D2FFD6A4037be3A669Ed04380Aef2B' as `0x${string}`, // STALE: no code on-chain — needs redeploy task

  // ── GoodStable — sourced from op-stack/addresses.json (chain 42069) ──────
  // Previous hardcoded addresses (gUSD 0x5D42…, VaultManager 0xAb7b…, etc.)
  // were wiped by chain re-snapshot.
  gUSD:                  rawAddresses.contracts.gUSD as `0x${string}`,
  VaultManager:          rawAddresses.contracts.VaultManager as `0x${string}`,
  CollateralRegistry:    rawAddresses.contracts.CollateralRegistry as `0x${string}`,
  StabilityPool:         rawAddresses.contracts.StabilityPool as `0x${string}`,
  PegStabilityModule:    rawAddresses.contracts.PegStabilityModule as `0x${string}`,
  StablePriceOracle:     '0xACA81583840B1bF2dDF6cdE824ADa250C1936b4D' as `0x${string}`, // STALE: not in JSON — needs redeploy task
  StableFeeSplitter:     '0xDdE78e6202518ff4936b5302Cc2891Ec180e8bFF' as `0x${string}`, // STALE: not in JSON — needs redeploy task
  // GoodStable collateral tokens (separate from GoodLend mocks) — STALE: no code on-chain
  StableMockWETH:        '0x8bCE54fF8aB45CB075b044AE117b8fD91F9351AB' as `0x${string}`,
  StableMockUSDC:        '0x74Cf9087aD26D541930bAc724B7ab21BA8F00A27' as `0x${string}`,
  StableMockGD:          '0xeFab0bEB0a557e452b398035Ea964948C750B2FD' as `0x${string}`,

  // ── UBI Analytics — sourced from op-stack/addresses.json ─────────────────
  // Previous hardcoded UBIRevenueTracker (0x021DBfF4…) was actually the OLD
  // PerpEngine address — wrong contract entirely. Now wired to the canonical
  // 0xfd6f… deployed alongside the current revenue/UBI splitter pair.
  UBIRevenueTracker:     rawAddresses.contracts.UBIRevenueTracker as `0x${string}`,

  // ── GoodYield — sourced from op-stack/addresses.json (chain 42069) ───────
  VaultFactory:          rawAddresses.contracts.VaultFactory as `0x${string}`,

  // ── GoodYield Initial Vaults — STALE: no code on-chain — needs redeploy task ──
  ETHLendingVault:       '0xa6AB86f760ae5D6fbF06056a7887b816610A4668' as `0x${string}`,
  GUSDStabilityVault:    '0x6BdBEc8Be23eB0F4A1aeF4B4dDf85bdfF0BdbF97' as `0x${string}`,
  GDLendingVault:        '0xAD438cEf9a586FcCF01a521bce9465e500a4259E' as `0x${string}`,

  // ── Agent Registry — sourced from op-stack/addresses.json ────────────────
  AgentRegistry:         rawAddresses.contracts.AgentRegistry as `0x${string}`,

  // ── QA TestRegistry — STALE: not in JSON, no code on-chain ───────────────
  TestRegistry:          '0x12bcb546bc60ff39f1adfc7ce4605d5bd6a6a876' as `0x${string}`,
} as const

/**
 * @deprecated Use CONTRACTS instead. Kept for backward compatibility.
 */
export const DEVNET_CONTRACTS = CONTRACTS

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
} from './abi'
