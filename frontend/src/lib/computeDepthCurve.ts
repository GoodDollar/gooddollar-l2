export interface DepthPoint {
  size: number
  price: number
  impact: number
}

export interface DepthCurveResult {
  buyPoints: DepthPoint[]
  sellPoints: DepthPoint[]
  oraclePrice: number
  maxSize: number
}

/**
 * Computes AMM depth/liquidity curve based on oracle-anchored pricing with
 * dynamic spread + inventory skew model.
 *
 * executionPrice = oraclePrice * (1 ± (baseSpread + skewFactor * sizeRatio))
 *
 * Buy side: price increases with size (user pays more for bigger buys)
 * Sell side: price decreases with size (user gets less for bigger sells)
 */
export function computeDepthCurve(params: {
  oraclePrice: number
  baseSpread?: number
  skewFactor?: number
  maxPoolCapacity?: number
  steps?: number
}): DepthCurveResult {
  const {
    oraclePrice,
    baseSpread = 0.0015,
    skewFactor = 0.08,
    maxPoolCapacity = 500_000,
    steps = 50,
  } = params

  const buyPoints: DepthPoint[] = []
  const sellPoints: DepthPoint[] = []

  for (let i = 0; i <= steps; i++) {
    const sizeRatio = i / steps
    const size = sizeRatio * maxPoolCapacity
    const impact = baseSpread + skewFactor * sizeRatio

    buyPoints.push({
      size,
      price: oraclePrice * (1 + impact),
      impact: impact * 100,
    })

    sellPoints.push({
      size,
      price: oraclePrice * (1 - impact),
      impact: -impact * 100,
    })
  }

  return { buyPoints, sellPoints, oraclePrice, maxSize: maxPoolCapacity }
}
