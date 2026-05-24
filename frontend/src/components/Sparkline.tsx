import { memo } from 'react'

interface SparklineProps {
  /**
   * Series to plot. Pass `null` or `undefined` when the upstream data source
   * did not return a series — the component renders a faint dashed baseline
   * with a tooltip instead of a flat zero line, so users aren't misled into
   * thinking the price was flat.
   */
  data: number[] | null | undefined
  width?: number
  height?: number
  positive?: boolean
  /** Draw the polyline in the alert colour when the current value crossed a cap. */
  crossedCap?: boolean
  /** Optional horizontal cap marker. */
  capLine?: number
  /** Test id for dashboard assertions. */
  testId?: string
  /** Tooltip / a11y label shown when data is unavailable. */
  unavailableLabel?: string
}

export const Sparkline = memo(function Sparkline({
  data,
  width = 80,
  height = 32,
  positive = true,
  crossedCap = false,
  capLine,
  testId,
  unavailableLabel = 'Price history unavailable',
}: SparklineProps) {
  // Unavailable data — render a faint dashed baseline placeholder.
  if (data === null || data === undefined || data.length === 0) {
    const midY = height / 2
    return (
      <svg
        data-testid={testId}
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="inline-block"
        role="img"
        aria-label={unavailableLabel}
      >
        <title>{unavailableLabel}</title>
        <line
          x1={2}
          y1={midY}
          x2={width - 2}
          y2={midY}
          stroke="currentColor"
          strokeOpacity={0.25}
          strokeWidth={1}
          strokeDasharray="3 3"
          strokeLinecap="round"
        />
      </svg>
    )
  }

  const min = Math.min(...data, Number.isFinite(capLine) ? (capLine as number) : data[0])
  const max = Math.max(...data, Number.isFinite(capLine) ? (capLine as number) : data[0])
  const range = max - min || 1
  const pad = 2

  const yFor = (v: number) => pad + (1 - (v - min) / range) * (height - pad * 2)

  const points = data
    .map((v, i) => {
      const x = pad + (i / Math.max(1, data.length - 1)) * (width - pad * 2)
      const y = yFor(v)
      return `${x},${y}`
    })
    .join(' ')

  const color = crossedCap ? '#f87171' : positive ? '#4ade80' : '#f87171'

  return (
    <svg
      data-testid={testId}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="inline-block"
      aria-hidden="true"
    >
      {Number.isFinite(capLine) && (
        <line
          x1={pad}
          y1={yFor(capLine as number)}
          x2={width - pad}
          y2={yFor(capLine as number)}
          stroke="currentColor"
          strokeOpacity={0.35}
          strokeWidth={1}
          strokeDasharray="3 3"
        />
      )}
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
})
