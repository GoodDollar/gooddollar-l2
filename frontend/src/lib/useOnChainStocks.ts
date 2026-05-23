'use client'

/**
 * useOnChainStocks — reads synthetic stock data from on-chain contracts.
 *
 * Replaces mock MOCK_STOCKS/MOCK_HOLDINGS/MOCK_TRADES from stockData.ts
 * with real reads from SyntheticAssetFactory, CollateralVault, and PriceOracle.
 *
 * Falls back to empty data when contracts are unavailable.
 */

import { useMemo } from 'react'
import { useReadContract, useReadContracts, useAccount } from 'wagmi'
import { SyntheticAssetFactoryABI, CollateralVaultABI, PriceOracleABI } from './abi'
import { CONTRACTS } from './chain'
import type { Stock, PortfolioHolding } from './stockData'

// ─── Fallback demo stocks when on-chain data is unavailable ──────────────────
//
// Task 0035: This fallback exists so the listing page can still render a
// ticker label + sentinel price while the on-chain `getPrice` reads return
// zero. It is NOT a market-data feed. Every quantitative field except
// `price` MUST stay at the zero / null sentinel so the canonical
// `hasLiveOracleChange` / `hasLiveOracleFundamentals` guards trip
// correctly and the listing renders honest em-dashes instead of
// painting a hardcoded percentage / volume / market-cap as if the
// oracle had reported it. The `listing-no-data-honesty` suite locks
// this shape — if you need to add a ticker, add it with zeros.
//
// Exported for the data-layer regression test.
export const FALLBACK_STOCKS: Stock[] = [
  { ticker: 'AAPL', name: 'sAAPL', displayName: 'Apple Inc.', sector: 'Technology', description: 'Apple Inc. — smartphones, computers, services.', price: 218.27, change24h: 0, volume24h: 0, marketCap: 0, high52w: 0, low52w: 0, sparkline7d: null, peRatio: 0, eps: 0, dividendYield: 0, avgVolume: 0 },
  { ticker: 'MSFT', name: 'sMSFT', displayName: 'Microsoft Corp.', sector: 'Technology', description: 'Microsoft Corp. — Windows, Azure, Office.', price: 388.45, change24h: 0, volume24h: 0, marketCap: 0, high52w: 0, low52w: 0, sparkline7d: null, peRatio: 0, eps: 0, dividendYield: 0, avgVolume: 0 },
  { ticker: 'GOOGL', name: 'sGOOGL', displayName: 'Alphabet Inc.', sector: 'Technology', description: 'Alphabet Inc. — Google, YouTube, Cloud.', price: 161.12, change24h: 0, volume24h: 0, marketCap: 0, high52w: 0, low52w: 0, sparkline7d: null, peRatio: 0, eps: 0, dividendYield: 0, avgVolume: 0 },
  { ticker: 'AMZN', name: 'sAMZN', displayName: 'Amazon.com', sector: 'Consumer', description: 'Amazon.com — e-commerce & AWS cloud.', price: 186.21, change24h: 0, volume24h: 0, marketCap: 0, high52w: 0, low52w: 0, sparkline7d: null, peRatio: 0, eps: 0, dividendYield: 0, avgVolume: 0 },
  { ticker: 'NVDA', name: 'sNVDA', displayName: 'NVIDIA Corp.', sector: 'Technology', description: 'NVIDIA Corp. — GPUs & AI computing.', price: 104.75, change24h: 0, volume24h: 0, marketCap: 0, high52w: 0, low52w: 0, sparkline7d: null, peRatio: 0, eps: 0, dividendYield: 0, avgVolume: 0 },
  { ticker: 'TSLA', name: 'sTSLA', displayName: 'Tesla Inc.', sector: 'Automotive', description: 'Tesla Inc. — electric vehicles & energy.', price: 272.18, change24h: 0, volume24h: 0, marketCap: 0, high52w: 0, low52w: 0, sparkline7d: null, peRatio: 0, eps: 0, dividendYield: 0, avgVolume: 0 },
  { ticker: 'META', name: 'sMETA', displayName: 'Meta Platforms', sector: 'Technology', description: 'Meta Platforms — Facebook, Instagram, WhatsApp.', price: 567.89, change24h: 0, volume24h: 0, marketCap: 0, high52w: 0, low52w: 0, sparkline7d: null, peRatio: 0, eps: 0, dividendYield: 0, avgVolume: 0 },
  { ticker: 'NFLX', name: 'sNFLX', displayName: 'Netflix', sector: 'Entertainment', description: 'Netflix — streaming entertainment.', price: 998.61, change24h: 0, volume24h: 0, marketCap: 0, high52w: 0, low52w: 0, sparkline7d: null, peRatio: 0, eps: 0, dividendYield: 0, avgVolume: 0 },
  { ticker: 'AMD', name: 'sAMD', displayName: 'AMD', sector: 'Technology', description: 'AMD — CPUs, GPUs, adaptive computing.', price: 101.32, change24h: 0, volume24h: 0, marketCap: 0, high52w: 0, low52w: 0, sparkline7d: null, peRatio: 0, eps: 0, dividendYield: 0, avgVolume: 0 },
  { ticker: 'COIN', name: 'sCOIN', displayName: 'Coinbase Global', sector: 'Finance', description: 'Coinbase Global — crypto exchange platform.', price: 178.54, change24h: 0, volume24h: 0, marketCap: 0, high52w: 0, low52w: 0, sparkline7d: null, peRatio: 0, eps: 0, dividendYield: 0, avgVolume: 0 },
]

const FACTORY = CONTRACTS.SyntheticAssetFactory
const VAULT = CONTRACTS.CollateralVault
const ORACLE = CONTRACTS.StocksPriceOracle

// Static metadata for known stocks (sector/description/company name enrichment)
const STOCK_META: Record<string, { sector: string; description: string; companyName: string }> = {
  AAPL:  { sector: 'Technology', description: 'Apple Inc. — smartphones, computers, services.', companyName: 'Apple Inc.' },
  TSLA:  { sector: 'Automotive', description: 'Tesla Inc. — electric vehicles & energy.', companyName: 'Tesla Inc.' },
  NVDA:  { sector: 'Technology', description: 'NVIDIA Corp. — GPUs & AI computing.', companyName: 'NVIDIA Corp.' },
  MSFT:  { sector: 'Technology', description: 'Microsoft Corp. — Windows, Azure, Office.', companyName: 'Microsoft Corp.' },
  AMZN:  { sector: 'Consumer', description: 'Amazon.com — e-commerce & AWS cloud.', companyName: 'Amazon.com' },
  GOOGL: { sector: 'Technology', description: 'Alphabet Inc. — Google, YouTube, Cloud.', companyName: 'Alphabet Inc.' },
  META:  { sector: 'Technology', description: 'Meta Platforms — Facebook, Instagram, WhatsApp.', companyName: 'Meta Platforms' },
  JPM:   { sector: 'Finance', description: 'JPMorgan Chase — banking & financial services.', companyName: 'JPMorgan Chase' },
  V:     { sector: 'Finance', description: 'Visa Inc. — global payments network.', companyName: 'Visa Inc.' },
  DIS:   { sector: 'Entertainment', description: 'Walt Disney — media, parks, streaming.', companyName: 'Walt Disney' },
  NFLX:  { sector: 'Entertainment', description: 'Netflix — streaming entertainment.', companyName: 'Netflix' },
  AMD:   { sector: 'Technology', description: 'AMD — CPUs, GPUs, adaptive computing.', companyName: 'AMD' },
  COIN:  { sector: 'Finance', description: 'Coinbase Global — crypto exchange platform.', companyName: 'Coinbase Global' },
}

// Known tickers (matches what DeployGoodStocks deployed)
const KNOWN_TICKERS = ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'AMZN', 'GOOGL', 'META', 'JPM', 'V', 'DIS', 'NFLX', 'AMD']

// ─── Read all stock listings + prices from chain ─────────────────────────────

export function useOnChainStocks(): { stocks: Stock[]; isLoading: boolean; isLive: boolean; refetch: () => void } {
  // Read prices for all known tickers from StocksPriceOracle
  const priceContracts = useMemo(() => {
    if (!ORACLE) return []
    return KNOWN_TICKERS.map(ticker => ({
      address: ORACLE as `0x${string}`,
      abi: PriceOracleABI,
      functionName: 'getPrice' as const,
      args: [ticker] as [string],
    }))
  }, [])

  const { data: priceData, isLoading, refetch } = useReadContracts({
    contracts: priceContracts,
    query: { enabled: priceContracts.length > 0, refetchInterval: 30_000, staleTime: 30_000 },
  })

  const stocks = useMemo<Stock[]>(() => {
    if (!priceData || priceData.length === 0) return []

    return KNOWN_TICKERS.map((ticker, i) => {
      const r = priceData[i]
      const price = r?.status === 'success' && typeof r.result === 'bigint'
        ? Number(r.result) / 1e8
        : 0

      if (price === 0) return null

      const meta = STOCK_META[ticker] ?? { sector: 'Unknown', description: `Synthetic ${ticker}`, companyName: ticker }

      return {
        ticker,
        name: `s${ticker}`,
        displayName: meta.companyName,
        sector: meta.sector,
        description: meta.description,
        price,
        change24h: 0,
        volume24h: 0,
        marketCap: 0,
        high52w: price * 1.15,
        low52w: price * 0.75,
        sparkline7d: null,
        peRatio: 0,
        eps: 0,
        dividendYield: 0,
        avgVolume: 0,
      }
    }).filter(Boolean) as Stock[]
  }, [priceData])

  const finalStocks = stocks.length > 0 ? stocks : FALLBACK_STOCKS
  return { stocks: finalStocks, isLoading, isLive: stocks.length > 0, refetch }
}

// ─── Read user's on-chain portfolio (CollateralVault positions) ──────────────

export function useOnChainHoldings(): {
  holdings: PortfolioHolding[]
  isLoading: boolean
} {
  const { address } = useAccount()

  // Read positions for all tickers
  const posContracts = useMemo(() => {
    if (!VAULT || !address) return []
    return KNOWN_TICKERS.map(ticker => ({
      address: VAULT as `0x${string}`,
      abi: CollateralVaultABI,
      functionName: 'getPosition' as const,
      args: [address, ticker] as [string, string],
    }))
  }, [address])

  // Read prices
  const priceContracts = useMemo(() => {
    if (!ORACLE) return []
    return KNOWN_TICKERS.map(ticker => ({
      address: ORACLE as `0x${string}`,
      abi: PriceOracleABI,
      functionName: 'getPrice' as const,
      args: [ticker] as [string],
    }))
  }, [])

  const { data: posData, isLoading: posLoading } = useReadContracts({
    contracts: posContracts,
    query: { enabled: posContracts.length > 0, refetchInterval: 15_000, staleTime: 15_000 },
  })

  const { data: priceData } = useReadContracts({
    contracts: priceContracts,
    query: { enabled: priceContracts.length > 0, refetchInterval: 30_000, staleTime: 30_000 },
  })

  const holdings = useMemo<PortfolioHolding[]>(() => {
    if (!posData) return []

    const result: PortfolioHolding[] = []
    for (let i = 0; i < KNOWN_TICKERS.length; i++) {
      const posR = posData[i]
      if (posR?.status !== 'success' || !posR.result) continue

      const [collateralAmount, debtAmount] = posR.result as unknown as [bigint, bigint]
      if (debtAmount === BigInt(0)) continue // no position

      const shares = Number(debtAmount) / 1e18
      const collateral = Number(collateralAmount) / 1e18

      const priceR = priceData?.[i]
      const currentPrice = priceR?.status === 'success' && typeof priceR.result === 'bigint'
        ? Number(priceR.result) / 1e8
        : 0

      result.push({
        ticker: KNOWN_TICKERS[i],
        shares,
        avgCost: currentPrice, // CDP doesn't track avg cost, use current
        currentPrice,
        collateralDeposited: collateral,
        collateralRequired: shares * currentPrice * 0.5, // min 200% → 50% of value
      })
    }
    return result
  }, [posData, priceData])

  return { holdings, isLoading: posLoading }
}
