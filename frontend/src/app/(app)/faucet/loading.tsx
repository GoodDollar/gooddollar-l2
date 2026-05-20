import { FormSkeleton } from '@/components/ui/PageSkeleton'

export default function FaucetLoading() {
  return (
    <div className="w-full max-w-lg mx-auto mt-4 sm:mt-8 animate-pulse">
      <div className="text-center mb-8">
        <div className="w-12 h-12 rounded-full bg-dark-50/40 mx-auto mb-4" />
        <div className="h-8 w-48 bg-dark-50/40 rounded-lg mx-auto mb-2" />
        <div className="h-4 w-64 bg-dark-50/30 rounded mx-auto" />
      </div>
      <FormSkeleton fields={2} />
    </div>
  )
}
