export type ProductType = 'amm' | 'perps' | 'predict' | 'lend' | 'yield'
export type Direction = 'long' | 'short'
export type ResidualClassification = 'hedged' | 'partial' | 'unhedged'

export interface ProductExposure {
  product: ProductType | string
  sizeUsd: number
  direction: Direction
}

export interface ExposureAggregation {
  grossLongUsd: number
  grossShortUsd: number
  netExposureUsd: number
}

export interface SymbolExposureSummary extends ExposureAggregation {
  symbol: string
  classification: ResidualClassification
  byProduct: ProductExposure[]
}

export function aggregateExposure(exposures: ProductExposure[]): ExposureAggregation {
  let grossLong = 0
  let grossShort = 0

  for (const e of exposures) {
    if (e.direction === 'long') grossLong += e.sizeUsd
    else grossShort += e.sizeUsd
  }

  return {
    grossLongUsd: grossLong,
    grossShortUsd: grossShort,
    netExposureUsd: grossLong - grossShort,
  }
}

export function classifyResidual(
  netExposureUsd: number,
  grossTotalUsd: number,
): ResidualClassification {
  if (grossTotalUsd === 0) return 'hedged'
  const ratio = Math.abs(netExposureUsd) / grossTotalUsd
  if (ratio < 0.1) return 'hedged'
  if (ratio <= 0.5) return 'partial'
  return 'unhedged'
}

export function computePortfolioDelta(
  symbolNets: Array<{ symbol: string; netExposureUsd: number }>,
): number {
  return symbolNets.reduce((sum, s) => sum + s.netExposureUsd, 0)
}
