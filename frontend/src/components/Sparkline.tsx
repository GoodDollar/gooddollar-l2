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
  /** Tooltip / a11y label shown when data is unavailable. */
  unavailableLabel?: string
  /**
   * Optional horizontal reference line, rendered as a faint dashed line
   * across the chart at the cap's y-coordinate. Used by the hedge stat
   * tiles to show the daily cap (task 0044). The line is included in the
   * polyline's y-scale so the cap is always in-view even when today's
   * value is much smaller.
   */
  capLine?: number
  /**
   * When true, the polyline is drawn in red instead of green even if
   * `positive` is true. Used by the caller to communicate that the
   * latest point crosses the cap — keeps the color decision local to
   * the caller, who knows what the cap means.
   */
  crossedCap?: boolean
  /** Optional test id attached to the `<svg>` so callers can locate it. */
  testId?: string
}

export const Sparkline = memo(function Sparkline({
  data,
  width = 80,
  height = 32,
  positive = true,
  unavailableLabel = 'Price history unavailable',
  capLine,
  crossedCap,
  testId,
}: SparklineProps) {
  if (data === null || data === undefined || data.length === 0) {
    const midY = height / 2
    return (
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="inline-block"
        role="img"
        aria-label={unavailableLabel}
        data-testid={testId}
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

  const candidates = Number.isFinite(capLine)
    ? [...data, capLine as number]
    : data
  const min = Math.min(...candidates)
  const max = Math.max(...candidates)
  const range = max - min || 1
  const pad = 2

  const yFor = (v: number): number =>
    pad + (1 - (v - min) / range) * (height - pad * 2)

  const points =
    data.length === 1
      ? `${pad},${yFor(data[0])} ${width - pad},${yFor(data[0])}`
      : data
          .map((v, i) => {
            const x = pad + (i / (data.length - 1)) * (width - pad * 2)
            return `${x},${yFor(v)}`
          })
          .join(' ')

  const color = !positive || crossedCap ? '#f87171' : '#4ade80'

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="inline-block"
      aria-hidden="true"
      data-testid={testId}
    >
      {Number.isFinite(capLine) && (
        <line
          data-testid={testId ? `${testId}-cap` : undefined}
          x1={pad}
          y1={yFor(capLine as number)}
          x2={width - pad}
          y2={yFor(capLine as number)}
          stroke="currentColor"
          strokeOpacity={0.45}
          strokeWidth={1}
          strokeDasharray="2 3"
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
