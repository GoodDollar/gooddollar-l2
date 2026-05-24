import Link from 'next/link'

import HedgeProofErrorCard from '@/components/HedgeProofErrorCard'

/**
 * Lane 5 — "no receipt id specified" hedge-proof recovery page
 * (task 0082).
 *
 * Next.js's URL normalizer 308-redirects `/analytics/hedge/proof/`,
 * `/analytics/hedge/proof/.`, and the bare `/analytics/hedge/proof`
 * to this canonical path before any handler runs. Without a
 * `page.tsx` here, the request used to fall through to the site-wide
 * `not-found.tsx` ("Page Not Found / Back to Swap") with zero
 * mention of the hedge feature — extending the page-level
 * URL-normalizer pattern of #0074 / #0079 catches that case with a
 * branded recovery card that teaches the user the canonical URL
 * shape and offers two explicit destinations.
 *
 * Caveat: `…/proof/..` normalizes one segment higher to
 * `/analytics/hedge`, which is NOT served by this page (it would
 * need a `/analytics/hedge/page.tsx`). That case stays on the
 * site-wide 404 — documented as out of scope in the task spec.
 */

const ENDPOINT_HINT = '/analytics/hedge/proof/<receiptId>'
const LATEST_HINT = '/analytics/hedge/proof/latest'

export default function HedgeProofNoIdPage() {
  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-6">
      <header className="mb-6">
        <Link
          data-testid="hedge-proof-back-link"
          href="/analytics"
          className="text-xs text-gray-400 hover:text-white inline-flex items-center gap-1"
        >
          <span aria-hidden="true">←</span> Back to dashboard
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-white">Hedge proof</h1>
      </header>
      <HedgeProofErrorCard
        testid="hedge-proof-no-id"
        variant="neutral"
        title="No receipt id specified"
        detail="A specific hedge proof needs a receipt id. View the latest proof, or pick one from the receipts table."
        primaryAction={{
          label: 'View latest proof',
          href: '/analytics/hedge/proof/latest',
        }}
        secondaryAction={{
          label: 'Open receipts table',
          href: '/analytics#hedge-recent-receipts',
        }}
      />
      <dl
        data-testid="hedge-proof-no-id-recap"
        className="mt-4 text-xs text-gray-500 font-mono space-y-0.5"
      >
        <div>
          <dt className="inline">Endpoint: </dt>
          <dd className="inline">{ENDPOINT_HINT}</dd>
        </div>
        <div>
          <dt className="inline">Hint:&nbsp;&nbsp;&nbsp;&nbsp; </dt>
          <dd className="inline">{LATEST_HINT}</dd>
        </div>
      </dl>
    </div>
  )
}
