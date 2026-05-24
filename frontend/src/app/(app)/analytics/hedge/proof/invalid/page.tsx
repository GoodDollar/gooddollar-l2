import Link from 'next/link'

import HedgeProofErrorCard from '@/components/HedgeProofErrorCard'

/**
 * Lane 5 — branded fallback for malformed hedge-proof URLs (task 0047).
 *
 * Next.js's framework-level pathname decoder rejects URLs whose
 * percent-encoded segments are truncated (e.g. `/foo%E0%80`) before any
 * page or route runs, dropping the user on a chrome-less default 400
 * page. The custom server in `scripts/next-runtime-server.mjs` rewrites
 * those requests to this page via `normalizeMalformedHedgeProofPath`, so
 * the operator always lands inside the GoodDollar shell with a clear
 * recovery path. The address bar URL is preserved because the rewrite
 * happens server-side before Next.js sees the request.
 */

export default function HedgeProofInvalidIdPage() {
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
        testid="hedge-proof-invalid-id"
        variant="error"
        title="Receipt id is not valid"
        detail="The receipt id in the URL couldn't be decoded. It may have been truncated when the link was copied. Check the link or open the dashboard to pick a fresh receipt."
      />
    </div>
  )
}
