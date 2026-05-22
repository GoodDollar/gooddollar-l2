/**
 * GoodLend mock data — mirrors GoodLendPool.sol reserve structure.
 * All values are demo/devnet placeholders.
 */

export interface LendReserve {
  symbol: string
  name: string
  address: string          // devnet contract address
  decimals: number
  price: number            // USD
  // Supply side
  totalSupplied: number    // in underlying units
  supplyAPY: number        // e.g. 0.042 = 4.2%
  // Borrow side
  totalBorrowed: number
  borrowAPY: number
  // Config
  ltvBPS: number           // e.g. 7500 = 75%
  liquidationThresholdBPS: number
  liquidationBonusBPS: number
  reserveFactorBPS: number
  isActive: boolean
  borrowingEnabled: boolean
  // gToken
  gTokenSymbol: string
  // Interest rate model (two-slope kinked curve)
  optimalUtilization: number  // e.g. 0.80 = 80%
  baseRate: number            // e.g. 0.01 = 1%
  slope1: number              // rate increase per unit utilization below optimal
  slope2: number              // rate increase per unit utilization above optimal
}

export interface UserPosition {
  asset: string            // reserve symbol
  supplied: number         // underlying amount
  borrowed: number
  supplyAPY: number
  borrowAPY: number
  price: number
}

export interface UserAccountData {
  positions: UserPosition[]
  totalCollateralUSD: number
  totalBorrowedUSD: number
  healthFactor: number     // 1e27 RAY-based, but normalised to float here
  netAPY: number
  availableToBorrowUSD: number
}

const RESERVES: LendReserve[] = [
  {
    symbol: 'WETH',
    name: 'Wrapped Ether',
    address: '0xETH_DEVNET',
    decimals: 18,
    price: 3012.45,
    totalSupplied: 4_820,
    supplyAPY: 0.0185,
    totalBorrowed: 3_210,
    borrowAPY: 0.0320,
    ltvBPS: 8000,
    liquidationThresholdBPS: 8250,
    liquidationBonusBPS: 10500,
    reserveFactorBPS: 1500,
    isActive: true,
    borrowingEnabled: true,
    gTokenSymbol: 'gWETH',
    optimalUtilization: 0.80,
    baseRate: 0.01,
    slope1: 0.04,
    slope2: 0.75,
  },
  {
    symbol: 'WBTC',
    name: 'Wrapped Bitcoin',
    address: '0xBTC_DEVNET',
    decimals: 8,
    price: 60125.80,
    totalSupplied: 285,
    supplyAPY: 0.0045,
    totalBorrowed: 112,
    borrowAPY: 0.0125,
    ltvBPS: 7000,
    liquidationThresholdBPS: 7500,
    liquidationBonusBPS: 11000,
    reserveFactorBPS: 2000,
    isActive: true,
    borrowingEnabled: true,
    gTokenSymbol: 'gWBTC',
    optimalUtilization: 0.65,
    baseRate: 0.005,
    slope1: 0.03,
    slope2: 1.00,
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    address: '0xUSDC_DEVNET',
    decimals: 6,
    price: 1.00,
    totalSupplied: 12_400_000,
    supplyAPY: 0.0624,
    totalBorrowed: 9_850_000,
    borrowAPY: 0.0890,
    ltvBPS: 7500,
    liquidationThresholdBPS: 8000,
    liquidationBonusBPS: 10500,
    reserveFactorBPS: 1000,
    isActive: true,
    borrowingEnabled: true,
    gTokenSymbol: 'gUSDC',
    optimalUtilization: 0.90,
    baseRate: 0.00,
    slope1: 0.04,
    slope2: 0.60,
  },
  {
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    address: '0xDAI_DEVNET',
    decimals: 18,
    price: 1.00,
    totalSupplied: 6_200_000,
    supplyAPY: 0.0580,
    totalBorrowed: 4_120_000,
    borrowAPY: 0.0810,
    ltvBPS: 7500,
    liquidationThresholdBPS: 8000,
    liquidationBonusBPS: 10500,
    reserveFactorBPS: 1000,
    isActive: true,
    borrowingEnabled: true,
    gTokenSymbol: 'gDAI',
    optimalUtilization: 0.90,
    baseRate: 0.00,
    slope1: 0.04,
    slope2: 0.60,
  },
  {
    symbol: 'G$',
    name: 'GoodDollar',
    address: '0xGD_DEVNET',
    decimals: 18,
    price: 0.0102,
    totalSupplied: 980_000_000,
    supplyAPY: 0.1240,
    totalBorrowed: 420_000_000,
    borrowAPY: 0.1980,
    ltvBPS: 5000,
    liquidationThresholdBPS: 6500,
    liquidationBonusBPS: 11500,
    reserveFactorBPS: 3300,
    isActive: true,
    borrowingEnabled: true,
    gTokenSymbol: 'gG$',
    optimalUtilization: 0.70,
    baseRate: 0.02,
    slope1: 0.10,
    slope2: 1.50,
  },
  {
    symbol: 'gAAPL',
    name: 'Synthetic Apple Inc.',
    address: '0xgAAPL_DEVNET',
    decimals: 18,
    price: 198.42,
    totalSupplied: 0,
    supplyAPY: 0,
    totalBorrowed: 0,
    borrowAPY: 0,
    ltvBPS: 5500,
    liquidationThresholdBPS: 6500,
    liquidationBonusBPS: 11000,
    reserveFactorBPS: 3300,
    isActive: true,
    borrowingEnabled: false,
    gTokenSymbol: 'ggAAPL',
    optimalUtilization: 0.70,
    baseRate: 0.02,
    slope1: 0.06,
    slope2: 1.20,
  },
  {
    symbol: 'gTSLA',
    name: 'Synthetic Tesla Inc.',
    address: '0xgTSLA_DEVNET',
    decimals: 18,
    price: 178.65,
    totalSupplied: 0,
    supplyAPY: 0,
    totalBorrowed: 0,
    borrowAPY: 0,
    ltvBPS: 5000,
    liquidationThresholdBPS: 6000,
    liquidationBonusBPS: 12000,
    reserveFactorBPS: 3300,
    isActive: true,
    borrowingEnabled: false,
    gTokenSymbol: 'ggTSLA',
    optimalUtilization: 0.65,
    baseRate: 0.03,
    slope1: 0.08,
    slope2: 1.50,
  },
  {
    symbol: 'gNVDA',
    name: 'Synthetic NVIDIA Corp.',
    address: '0xgNVDA_DEVNET',
    decimals: 18,
    price: 131.88,
    totalSupplied: 0,
    supplyAPY: 0,
    totalBorrowed: 0,
    borrowAPY: 0,
    ltvBPS: 5500,
    liquidationThresholdBPS: 6500,
    liquidationBonusBPS: 11000,
    reserveFactorBPS: 3300,
    isActive: true,
    borrowingEnabled: false,
    gTokenSymbol: 'ggNVDA',
    optimalUtilization: 0.65,
    baseRate: 0.03,
    slope1: 0.07,
    slope2: 1.30,
  },
  {
    symbol: 'gMSFT',
    name: 'Synthetic Microsoft Corp.',
    address: '0xgMSFT_DEVNET',
    decimals: 18,
    price: 432.15,
    totalSupplied: 0,
    supplyAPY: 0,
    totalBorrowed: 0,
    borrowAPY: 0,
    ltvBPS: 6000,
    liquidationThresholdBPS: 7000,
    liquidationBonusBPS: 10500,
    reserveFactorBPS: 3300,
    isActive: true,
    borrowingEnabled: false,
    gTokenSymbol: 'ggMSFT',
    optimalUtilization: 0.70,
    baseRate: 0.02,
    slope1: 0.05,
    slope2: 1.10,
  },
  {
    symbol: 'gMETA',
    name: 'Synthetic Meta Platforms',
    address: '0xgMETA_DEVNET',
    decimals: 18,
    price: 507.30,
    totalSupplied: 0,
    supplyAPY: 0,
    totalBorrowed: 0,
    borrowAPY: 0,
    ltvBPS: 5500,
    liquidationThresholdBPS: 6500,
    liquidationBonusBPS: 11000,
    reserveFactorBPS: 3300,
    isActive: true,
    borrowingEnabled: false,
    gTokenSymbol: 'ggMETA',
    optimalUtilization: 0.70,
    baseRate: 0.02,
    slope1: 0.06,
    slope2: 1.20,
  },
  {
    symbol: 'gSPY',
    name: 'Synthetic S&P 500 ETF',
    address: '0xgSPY_DEVNET',
    decimals: 18,
    price: 538.20,
    totalSupplied: 0,
    supplyAPY: 0,
    totalBorrowed: 0,
    borrowAPY: 0,
    ltvBPS: 6500,
    liquidationThresholdBPS: 7500,
    liquidationBonusBPS: 10500,
    reserveFactorBPS: 3300,
    isActive: true,
    borrowingEnabled: false,
    gTokenSymbol: 'ggSPY',
    optimalUtilization: 0.75,
    baseRate: 0.015,
    slope1: 0.04,
    slope2: 0.90,
  },
]

/**
 * Two-slope kinked interest rate model.
 * Returns borrow APY and supply APY at a given utilization.
 */
export function getRateAtUtilization(
  reserve: LendReserve,
  utilization: number
): { borrowAPY: number; supplyAPY: number } {
  const u = Math.max(0, Math.min(1, utilization))
  const { optimalUtilization: uOpt, baseRate, slope1, slope2, reserveFactorBPS } = reserve
  let borrowRate: number
  if (u <= uOpt) {
    borrowRate = baseRate + (u / uOpt) * slope1
  } else {
    borrowRate = baseRate + slope1 + ((u - uOpt) / (1 - uOpt)) * slope2
  }
  const reserveFactor = reserveFactorBPS / 10_000
  const supplyRate = borrowRate * u * (1 - reserveFactor)
  return { borrowAPY: borrowRate, supplyAPY: supplyRate }
}

export function getReserves(): LendReserve[] {
  return RESERVES
}

export function getReserveBySymbol(symbol: string): LendReserve | undefined {
  return RESERVES.find(r => r.symbol === symbol)
}

export function getAvailableLiquidity(reserve: LendReserve): number {
  return reserve.totalSupplied - reserve.totalBorrowed
}

export function getUtilizationRate(reserve: LendReserve): number {
  if (reserve.totalSupplied === 0) return 0
  return reserve.totalBorrowed / reserve.totalSupplied
}

/** Demo user positions (wallet connected simulation) */
export function getUserAccountData(): UserAccountData {
  const positions: UserPosition[] = [
    { asset: 'WETH', supplied: 1.5, borrowed: 0, supplyAPY: 0.0185, borrowAPY: 0.0320, price: 3012.45 },
    { asset: 'USDC', supplied: 2_500, borrowed: 1_200, supplyAPY: 0.0624, borrowAPY: 0.0890, price: 1.00 },
  ]

  const totalCollateralUSD = positions.reduce((acc, p) => acc + p.supplied * p.price, 0)
  const totalBorrowedUSD = positions.reduce((acc, p) => acc + p.borrowed * p.price, 0)

  // health factor: sum(collateral_i * liqThreshold_i) / totalDebt
  // Simplified: use 80% avg liquidation threshold
  const weightedThreshold = 0.80
  const healthFactor = totalBorrowedUSD === 0
    ? Infinity
    : (totalCollateralUSD * weightedThreshold) / totalBorrowedUSD

  const supplyIncome = positions.reduce((acc, p) => acc + p.supplied * p.price * p.supplyAPY, 0)
  const borrowCost = positions.reduce((acc, p) => acc + p.borrowed * p.price * p.borrowAPY, 0)
  const netAPY = totalCollateralUSD > 0
    ? (supplyIncome - borrowCost) / totalCollateralUSD
    : 0

  // Max borrow: 75% LTV on collateral minus existing debt
  const maxBorrowUSD = totalCollateralUSD * 0.75 - totalBorrowedUSD

  return {
    positions,
    totalCollateralUSD,
    totalBorrowedUSD,
    healthFactor,
    netAPY,
    availableToBorrowUSD: Math.max(0, maxBorrowUSD),
  }
}

export function formatAPY(apy: number): string {
  return `${(apy * 100).toFixed(2)}%`
}

export function formatUSD(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(2)}K`
  return `$${value.toFixed(2)}`
}

export function formatHealthFactor(hf: number): string {
  if (!isFinite(hf)) return '∞'
  return hf.toFixed(2)
}

export function healthFactorColor(hf: number): string {
  if (!isFinite(hf) || hf >= 2) return 'text-green-400'
  if (hf >= 1.5) return 'text-goodgreen'
  if (hf >= 1.2) return 'text-yellow-400'
  return 'text-red-400'
}
