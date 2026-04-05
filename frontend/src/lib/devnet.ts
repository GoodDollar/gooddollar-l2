/**
 * Devnet configuration — single source of truth for contract addresses, RPC
 * URL, chain ID, and ABIs.
 *
 * Base addresses are sourced from op-stack/addresses.json (initial deployment).
 * Extended contracts (GoodLend, GoodSwap, GoodStocks redeployment, GoodStable,
 * GoodPerps) are declared here with their live devnet addresses.
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
  ConditionalTokens:     rawAddresses.contracts.ConditionalTokens as `0x${string}`,
  OptimisticResolver:    '0x30426D33a78afdb8788597D5BFaBdADc3Be95698' as `0x${string}`,

  // ── GoodLend — devnet (chain 42069), redeployed 2026-04-05 (GOO-388) ──────
  GoodLendPool:                '0x49fd2be640db2910c2fab69bb8531ab6e76127ff' as `0x${string}`,
  GoodLendPriceOracle:         '0x46b142dd1e924fab83ecc3c08e4d46e82f005e0e' as `0x${string}`,
  GoodLendInterestRateModel:   '0x367761085bf3c12e5da2df99ac6e1a824612b8fb' as `0x${string}`,
  // GoodLend reserve tokens
  MockUSDC:              '0x2b0d36facd61b71cc05ab8f3d2355ec3631c0dd5' as `0x${string}`,
  MockWETH:              '0xfbc22278a96299d91d41c453234d97b4f5eb9b2d' as `0x${string}`,
  // gTokens (interest-bearing)
  gUSDC:                 '0x4631bcabd6df18d94796344963cb60d44a4136b6' as `0x${string}`,
  gWETH:                 '0xa4899d35897033b927acfcf422bc745916139776' as `0x${string}`,
  // Debt tokens
  debtUSDC:              '0x86a2ee8faf9a840f7a2c64ca3d51209f9a02081d' as `0x${string}`,
  debtWETH:              '0xf953b3a269d80e3eb0f2947630da976b896a8c5b' as `0x${string}`,

  // ── GoodSwap — redeployed to devnet (chain 42069), 2026-04-05 (GOO-395) ──
  PoolManager:           '0xC9a43158891282A2B1475592D5719c001986Aaec' as `0x${string}`,
  GoodSwapRouter:        '0x975Ab64F4901Af5f0C96636deA0b9de3419D0c2F' as `0x${string}`,
  // GoodSwap Liquidity Pools
  SwapPoolGdWeth:        '0xeAd789bd8Ce8b9E94F5D0FCa99F8787c7e758817' as `0x${string}`,
  SwapPoolGdUsdc:        '0x95775fD3Afb1F4072794CA4ddA27F2444BCf8Ac3' as `0x${string}`,
  SwapPoolWethUsdc:      '0xd9fEc8238711935D6c8d79Bef2B9546ef23FC046' as `0x${string}`,
  // GoodSwap pool tokens (devnet mocks)
  SwapGD:                '0x547382C0D1b23f707918D3c83A77317B71Aa8470' as `0x${string}`,
  SwapWETH:              '0x7C8BaafA542c57fF9B2B90612bf8aB9E86e22C09' as `0x${string}`,
  SwapUSDC:              '0x0a17FabeA4633ce714F1Fa4a2dcA62C3bAc4758d' as `0x${string}`,

  // ── GoodPerps — redeployed to devnet (chain 42069), 2026-04-05 (GOO-450 fix) ──
  PerpEngine:            '0x021DBfF4A864Aa25c51F0ad2Cd73266Fde66199d' as `0x${string}`,
  MarginVault:           '0xb22c255250d74b0add1bfb936676d2a299bf48bd' as `0x${string}`,
  FundingRate:           '0xfd2cf3b56a73c75a7535ffe44ebabe7723c64719' as `0x${string}`,
  PerpPriceOracle:       '0xf5c4a909455c00b99a90d93b48736f3196db5621' as `0x${string}`,

  // ── GoodStocks — redeployed with 12 synthetic stocks (chain 42069), 2026-04-05 (GOO-414)
  StocksPriceOracle:     '0x20d7B364E8Ed1F4260b5B90C41c2deC3C1F6D367' as `0x${string}`,
  CollateralVault:       '0xCa57C1d3c2c35E667745448Fef8407dd25487ff8' as `0x${string}`,
  SyntheticAssetFactory: '0x2d13826359803522cCe7a4Cfa2c1b582303DD0B4' as `0x${string}`,
  // Synthetic stock tokens (sToken ERC-20s)
  sAAPL:                 '0x5CD50EA9490889cd9bF0Be5E4B7d14d10BafcA2B' as `0x${string}`,
  sTSLA:                 '0x65703FC15C25bf6CC2d6B8c17B50020F14F0DE01' as `0x${string}`,
  sNVDA:                 '0xF31b86A295a6006c81c795d00f123FeB5Afdf472' as `0x${string}`,
  sMSFT:                 '0x99F3D3F8feE4e5aCA92927c5E8D0495b8d008480' as `0x${string}`,
  sAMZN:                 '0x66e356591Fcf2A44D85Fb48a0DcB89b4EaFeF39d' as `0x${string}`,
  sGOOGL:                '0x525679c456C772EA5a44ac83696677b473fcb7EA' as `0x${string}`,
  sMETA:                 '0x863dDb1Dd6D87CA97eCDee7A330890914C185e01' as `0x${string}`,
  sJPM:                  '0x0e4cFDa4118D7B73619ccCe1f7E7d83bdAb6BA84' as `0x${string}`,
  sV:                    '0xb30C073428D029Af183475F44BEAeD4bBfa0A039' as `0x${string}`,
  sDIS:                  '0xB32580EbF3d5Ae6365B191D19233777A324DcC0f' as `0x${string}`,
  sNFLX:                 '0xE86b8E2b0952B04885df6063df92484bc2006B0a' as `0x${string}`,
  sAMD:                  '0xD327c8301A078DaA271dd357Ddd63A8432219308' as `0x${string}`,

  // ── Governance — redeployed 2026-04-04 (GOO-313, GOO-238) ──────────────────
  VoteEscrowedGD:        '0x0B7108B29ad73097cF7E549D542915348d885e5f' as `0x${string}`,
  GoodDAO:               '0x53AAfBd184086d72fA233AE83e1a7B1339B5415C' as `0x${string}`,
  GoodTimelock:          '0xF66CfDf074D2FFD6A4037be3A669Ed04380Aef2B' as `0x${string}`,

  // ── GoodStable — CDP vault system (chain 42069), redeployed 2026-04-04 (GOO-298) ─
  gUSD:                  '0x6B99600daD0a1998337357696827381D122825F3' as `0x${string}`,
  VaultManager:          '0xcfbD78F3D57B620ddEff73F193dD5Bf595a730db' as `0x${string}`,
  CollateralRegistry:    '0xca9507C5F707103e86B45DF4b35C37FE2700BB5B' as `0x${string}`,
  StabilityPool:         '0x56cB5406C23d0fb16EaC535D6108CA72980c8072' as `0x${string}`,
  PegStabilityModule:    '0xa2a0D69221829d6005E31Bb187A0A5DEBEaD8331' as `0x${string}`,
  StablePriceOracle:     '0xB719422a0A484025c1A22a8dEEaFC67E81F43CfD' as `0x${string}`,
  StableFeeSplitter:     '0xBA6BfBa894B5cAF04c3462A5C8556fFBa4de6782' as `0x${string}`,
  // GoodStable collateral tokens (separate from GoodLend mocks)
  StableMockWETH:        '0x7314AEeC874A25A1131F49dA9679D05f8d931175' as `0x${string}`,
  StableMockUSDC:        '0xD604C06206f6DeDd82d42F90D1F5bB34a2E7c5dd' as `0x${string}`,
  StableMockGD:          '0x132F7D9033b28B08cbc520e1cfD83c6dA3abfA36' as `0x${string}`,

  // ── UBI Analytics — deployed (chain 42069), 2026-04-03 (GOO-226) ──────────
  UBIRevenueTracker:     '0x021DBfF4A864Aa25c51F0ad2Cd73266Fde66199d' as `0x${string}`,

  // ── GoodYield — VaultFactory (chain 42069), deployed 2026-04-04 (GOO-240) ──
  VaultFactory:          '0x77AD263Cd578045105FBFC88A477CAd808d39Cf6' as `0x${string}`,

  // ── GoodYield Initial Vaults — deployed 2026-04-04 (GOO-242) ──
  ETHLendingVault:       '0xa6AB86f760ae5D6fbF06056a7887b816610A4668' as `0x${string}`,
  GUSDStabilityVault:    '0x6BdBEc8Be23eB0F4A1aeF4B4dDf85bdfF0BdbF97' as `0x${string}`,
  GDLendingVault:        '0xAD438cEf9a586FcCF01a521bce9465e500a4259E' as `0x${string}`,

  // ── Agent Registry — deployed (chain 42069), 2026-04-04 (GOO-243) ────────
  AgentRegistry:         '0xA9d0Fb5837f9c42c874e16da96094b14Af0e2784' as `0x${string}`,

  // ── QA TestRegistry — deployed (chain 42069), 2026-04-03 ─────────────────
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
