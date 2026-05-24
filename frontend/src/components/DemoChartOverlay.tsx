interface DemoChartOverlayProps {
  isLive: boolean
}

export function DemoChartOverlay({ isLive }: DemoChartOverlayProps) {
  if (isLive) return null
  return (
    <div
      role="note"
      aria-label="Chart candles are illustrative demo data"
      className="absolute top-2 left-2 z-10 inline-flex items-center gap-1.5 rounded-md border border-yellow-500/25 bg-yellow-500/10 px-2 py-1 text-[11px] font-medium text-yellow-300 backdrop-blur-sm"
    >
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
      <span>Demo chart · candles are illustrative</span>
    </div>
  )
}
