import { CardSkeleton } from '@/components/ui/PageSkeleton'

export default function InviteLoading() {
  return (
    <div className="min-h-screen px-4 py-12 max-w-2xl mx-auto animate-pulse">
      <div className="text-center mb-10">
        <div className="h-6 w-36 bg-dark-50/40 rounded-full mx-auto mb-4" />
        <div className="h-9 w-80 bg-dark-50/40 rounded-lg mx-auto mb-3" />
        <div className="h-4 w-64 bg-dark-50/30 rounded mx-auto" />
      </div>
      <CardSkeleton rows={6} />
      <div className="mt-8 grid sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-dark-50 bg-dark-100/40 p-4">
            <div className="w-8 h-8 bg-dark-50/40 rounded mb-2" />
            <div className="h-4 w-24 bg-dark-50/30 rounded mb-1" />
            <div className="h-3 w-36 bg-dark-50/20 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
