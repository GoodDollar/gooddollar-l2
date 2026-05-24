import path from 'path'
import { promises as fs } from 'fs'

import Link from 'next/link'

/**
 * In-app runbook page for the lane-1 live-prices-on-chain pipeline.
 *
 * Renders `docs/runbooks/lane1-live-prices-on-chain.md` from disk so every
 * "Runbook →" deep-link in the lane-1 surfaces (`/lane1` failure card,
 * `/lane1` diagnostics card, OracleStatusBadge offline popover,
 * StalePriceBanner, analytics Lane-1 panel) lands on readable recovery
 * content instead of GitHub's "Page not found" page (task 0065).
 *
 * The runbook is rendered as plain text inside a styled `<pre>` so no
 * markdown dependency is introduced. The acceptance criterion is that the
 * content is readable, not HTML-rendered; the source-of-truth is a single
 * markdown file shipped with the lane-1 commit.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const RUNBOOK_REPO_PATH = 'docs/runbooks/lane1-live-prices-on-chain.md'

interface RunbookLoad {
  body: string | null
  resolvedPath: string
  error: string | null
}

async function loadRunbook(): Promise<RunbookLoad> {
  // `next dev`/`next start` runs with cwd = frontend/, so the repo root is
  // one level up. We resolve relative to cwd rather than __dirname so the
  // lookup behaves the same in dev (.next compiled to dist/) and prod.
  const resolvedPath = path.resolve(process.cwd(), '..', RUNBOOK_REPO_PATH)
  try {
    const body = await fs.readFile(resolvedPath, 'utf8')
    return { body, resolvedPath, error: null }
  } catch (err) {
    return {
      body: null,
      resolvedPath,
      error: err instanceof Error ? err.message : 'runbook unavailable',
    }
  }
}

export default async function Lane1RunbookPage() {
  const runbook = await loadRunbook()

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-white">
          Lane 1 — live-prices-on-chain runbook
        </h1>
        <Link
          href="/lane1"
          className="text-sm text-goodgreen hover:underline"
          data-testid="lane1-runbook-back-link"
        >
          ← Back to /lane1
        </Link>
      </div>

      <p className="text-xs text-gray-500 mb-4 font-mono break-all">
        source: {RUNBOOK_REPO_PATH}
      </p>

      {runbook.body ? (
        <article
          data-testid="lane1-runbook-body"
          className="bg-dark-100/60 rounded-xl p-5 border border-dark-50"
        >
          <pre className="whitespace-pre-wrap text-sm text-gray-200 font-mono leading-relaxed">
            {runbook.body}
          </pre>
        </article>
      ) : (
        <section
          className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-5"
          role="alert"
          data-testid="lane1-runbook-missing"
        >
          <h2 className="text-lg font-semibold text-yellow-300 mb-2">
            Runbook unavailable
          </h2>
          <p className="text-sm text-yellow-200">
            <span aria-hidden>⚠ </span>
            Could not read{' '}
            <code className="bg-dark-100 px-1 rounded">{runbook.resolvedPath}</code>:{' '}
            <span className="font-mono text-yellow-100">{runbook.error}</span>
          </p>
          <p className="text-sm text-yellow-200 mt-3">
            The runbook file ships with the lane-1 commit at{' '}
            <code className="bg-dark-100 px-1 rounded">{RUNBOOK_REPO_PATH}</code>.
            Verify the deployment includes the repo's <code>docs/</code> tree.
          </p>
        </section>
      )}
    </div>
  )
}
