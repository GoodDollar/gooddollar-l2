import { FormSkeleton } from '@/components/ui/PageSkeleton'

export default function AgentsRegisterLoading() {
  return (
    <div className="w-full max-w-5xl mx-auto py-8">
      <FormSkeleton fields={5} />
    </div>
  )
}
