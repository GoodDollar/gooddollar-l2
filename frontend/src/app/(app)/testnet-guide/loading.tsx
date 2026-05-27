import { CardSkeleton, PageHeaderSkeleton } from '@/components/ui/PageSkeleton'

export default function TestnetGuideLoading() {
  return (
    <div className="min-h-screen animate-pulse">
      <div className="border-b border-white/10 bg-dark-50/50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="h-5 w-24 bg-dark-50/40 rounded-full mb-3" />
          <div className="h-10 w-72 bg-dark-50/40 rounded-lg mb-2" />
          <div className="h-4 w-96 bg-dark-50/30 rounded" />
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 mt-8 flex flex-col lg:flex-row gap-8">
        <nav className="lg:w-56 flex-shrink-0">
          <div className="lg:sticky lg:top-20 bg-dark-50 rounded-xl p-4 space-y-2">
            {[75, 90, 65, 85, 70, 95, 80, 60].map((w, i) => (
              <div key={i} className="h-4 bg-dark-50/40 rounded" style={{ width: `${w}%` }} />
            ))}
          </div>
        </nav>
        <div className="flex-1 space-y-8">
          <PageHeaderSkeleton />
          <CardSkeleton rows={3} />
          <CardSkeleton rows={5} />
          <CardSkeleton rows={4} />
        </div>
      </div>
    </div>
  )
}
