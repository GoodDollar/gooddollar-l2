import { CardSkeleton } from '@/components/ui/PageSkeleton'

export default function HedgeProofLoading() {
  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-6 animate-pulse">
      <div className="mb-6">
        <div className="h-3 w-32 bg-dark-50/40 rounded mb-2" />
        <div className="h-7 w-40 bg-dark-50/40 rounded" />
      </div>
      <CardSkeleton rows={6} />
    </div>
  )
}
