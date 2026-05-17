function Bone({ className = '' }: { className?: string }) {
  return <div className={`bg-dark-50/40 rounded-lg ${className}`} />
}

export function CardSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="animate-pulse bg-dark-100 rounded-2xl border border-gray-700/20 p-5 space-y-4">
      <Bone className="h-5 w-1/3" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex justify-between items-center">
          <Bone className="h-4 w-2/5" />
          <Bone className="h-4 w-1/4" />
        </div>
      ))}
    </div>
  )
}

export function TableSkeleton({ cols = 5, rows = 6 }: { cols?: number; rows?: number }) {
  return (
    <div className="animate-pulse bg-dark-100 rounded-2xl border border-gray-700/20 overflow-hidden">
      <div className="flex gap-4 p-4 border-b border-gray-700/20">
        {Array.from({ length: cols }).map((_, i) => (
          <Bone key={i} className="h-4 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 p-4 border-b border-gray-700/10 last:border-0">
          {Array.from({ length: cols }).map((_, c) => (
            <Bone key={c} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

export function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <div className="animate-pulse bg-dark-100 rounded-2xl border border-gray-700/20 p-5">
      <Bone className="h-5 w-1/4 mb-4" />
      <div className="bg-dark-50/20 rounded-xl" style={{ height }} />
    </div>
  )
}

export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="animate-pulse bg-dark-100 rounded-2xl border border-gray-700/20 p-5 max-w-lg mx-auto space-y-5">
      <Bone className="h-6 w-2/5" />
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Bone className="h-3 w-1/4" />
          <Bone className="h-10 w-full rounded-xl" />
        </div>
      ))}
      <Bone className="h-11 w-full rounded-xl" />
    </div>
  )
}

export function StatGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="animate-pulse grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-dark-100 rounded-2xl border border-gray-700/20 p-4 space-y-2">
          <Bone className="h-3 w-1/2" />
          <Bone className="h-6 w-3/4" />
        </div>
      ))}
    </div>
  )
}

export function PageHeaderSkeleton() {
  return (
    <div className="animate-pulse flex items-center gap-3 mb-6">
      <Bone className="w-10 h-10 rounded-xl" />
      <div>
        <Bone className="h-6 w-40 mb-1" />
        <Bone className="h-3 w-56" />
      </div>
    </div>
  )
}

export function ProfileSkeleton() {
  return (
    <div className="animate-pulse max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Bone className="w-16 h-16 rounded-full" />
        <div className="space-y-2 flex-1">
          <Bone className="h-6 w-1/3" />
          <Bone className="h-4 w-1/2" />
        </div>
      </div>
      <CardSkeleton rows={5} />
    </div>
  )
}
