'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'

/**
 * Lane 5 — in-app hedge proof viewer.
 *
 * Replaces the raw `text/markdown` dead-end at
 * `/api/hedge/proof/latest` with a styled, branded page that lives
 * inside the app shell. Fetches `latest.json` (a JSON companion route
 * that returns the markdown body alongside pointer metadata), renders
 * the body via `react-markdown` (HTML escaped by default — no
 * rehype-raw, no XSS surface), and shows a friendly error state per
 * failure mode with a "Back to dashboard" link and a "View raw
 * markdown" escape hatch.
 *
 * The existing markdown route (`/api/hedge/proof/latest`) is
 * unchanged so curl / automation users see no behavioural change.
 */

type ProofResponse =
  | {
      status: 'ok'
      markdown: string
      pointer: { path: string; timestamp: number; summary: string }
    }
  | { status: 'engine_down'; reason: string }
  | { status: 'no_proof' }
  | { status: 'engine_error'; reason: string; httpStatus: number }
  | { status: 'unreadable'; reason: string }
  | { status: 'forbidden'; reason: string }
  | { status: 'missing'; reason: string }

type ViewState =
  | { kind: 'loading' }
  | { kind: 'ok'; data: Extract<ProofResponse, { status: 'ok' }> }
  | { kind: 'no_proof' }
  | { kind: 'error'; copy: ErrorCopy }

interface ErrorCopy {
  title: string
  detail: string
}

function copyForResponse(res: ProofResponse): ErrorCopy {
  switch (res.status) {
    case 'ok':
    case 'no_proof':
      return { title: 'Hedge proof unavailable', detail: 'No further detail available.' }
    case 'engine_down':
      return {
        title: 'Hedge engine unreachable',
        detail: 'Could not fetch the latest proof pointer from the hedge engine.',
      }
    case 'engine_error':
      return {
        title: 'Hedge engine returned an error',
        detail: `Proof pointer endpoint returned HTTP ${res.httpStatus}.`,
      }
    case 'unreadable':
      return {
        title: 'Hedge engine returned an unreadable response',
        detail: res.reason,
      }
    case 'forbidden':
      return {
        title: 'Proof path forbidden',
        detail: res.reason,
      }
    case 'missing':
      return {
        title: 'Hedge proof file missing',
        detail: res.reason,
      }
  }
}

function copyForNetwork(): ErrorCopy {
  return {
    title: 'No network connection',
    detail: 'Could not reach the proof endpoint. Check your connection and retry.',
  }
}

function renderTimestamp(ms: number): { iso: string; relative: string } {
  const iso = Number.isFinite(ms) ? new Date(ms).toISOString() : ''
  const diff = Math.max(0, Math.floor((Date.now() - ms) / 1000))
  let relative: string
  if (!Number.isFinite(ms)) relative = 'unknown'
  else if (diff < 60) relative = `${diff}s ago`
  else if (diff < 3600) relative = `${Math.floor(diff / 60)}m ago`
  else if (diff < 86400) relative = `${Math.floor(diff / 3600)}h ago`
  else relative = `${Math.floor(diff / 86400)}d ago`
  return { iso, relative }
}

export default function HedgeProofViewerPage() {
  const [view, setView] = useState<ViewState>({ kind: 'loading' })

  const load = useCallback(async () => {
    setView({ kind: 'loading' })
    let res: Response
    try {
      res = await fetch('/api/hedge/proof/latest.json', { cache: 'no-store' })
    } catch {
      setView({ kind: 'error', copy: copyForNetwork() })
      return
    }
    let body: ProofResponse
    try {
      body = (await res.json()) as ProofResponse
    } catch {
      setView({
        kind: 'error',
        copy: {
          title: 'Hedge engine returned an unreadable response',
          detail: 'The proof endpoint did not return JSON.',
        },
      })
      return
    }
    if (body.status === 'ok') {
      setView({ kind: 'ok', data: body })
      return
    }
    if (body.status === 'no_proof') {
      setView({ kind: 'no_proof' })
      return
    }
    setView({ kind: 'error', copy: copyForResponse(body) })
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-6">
      <PageHeader />
      {view.kind === 'loading' && <LoadingState />}
      {view.kind === 'ok' && <OkState data={view.data} />}
      {view.kind === 'no_proof' && (
        <NotFoundState
          title="No hedge proof yet"
          detail="The hedge engine has not written any proof artifacts yet. The dashboard will surface a proof link the moment the next cycle completes."
          onRetry={load}
        />
      )}
      {view.kind === 'error' && (
        <NotFoundState
          title={view.copy.title}
          detail={view.copy.detail}
          onRetry={load}
          variant="error"
        />
      )}
    </div>
  )
}

function PageHeader() {
  return (
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
  )
}

function LoadingState() {
  return (
    <section
      data-testid="hedge-proof-loading"
      className="space-y-3 animate-pulse"
      aria-busy="true"
    >
      <div className="h-5 bg-dark-50 rounded w-2/3" />
      <div className="h-4 bg-dark-50 rounded w-1/2" />
      <div className="h-4 bg-dark-50 rounded w-3/4" />
      <div className="h-4 bg-dark-50 rounded w-5/6" />
    </section>
  )
}

function OkState({
  data,
}: {
  data: Extract<ProofResponse, { status: 'ok' }>
}) {
  const ts = renderTimestamp(data.pointer.timestamp)
  return (
    <article data-testid="hedge-proof-viewer">
      <div className="mb-4 flex items-center gap-3 flex-wrap text-xs text-gray-400">
        <span title={ts.iso} data-testid="hedge-proof-timestamp">
          {ts.relative}
        </span>
        {data.pointer.summary && (
          <span
            data-testid="hedge-proof-summary"
            className="rounded-md bg-dark-50 px-2 py-0.5 font-mono text-gray-300"
            title={data.pointer.summary}
          >
            {data.pointer.summary}
          </span>
        )}
        <a
          data-testid="hedge-proof-raw-link"
          href="/api/hedge/proof/latest"
          target="_blank"
          rel="noopener noreferrer"
          className="text-goodgreen hover:underline"
        >
          View raw markdown
        </a>
      </div>
      <div
        data-testid="hedge-proof-body"
        className="prose prose-invert max-w-none rounded-xl border border-dark-50 bg-dark-100/40 p-5"
      >
        <ReactMarkdown>{data.markdown}</ReactMarkdown>
      </div>
    </article>
  )
}

function NotFoundState({
  title,
  detail,
  onRetry,
  variant = 'neutral',
}: {
  title: string
  detail: string
  onRetry: () => void | Promise<void>
  variant?: 'error' | 'neutral'
}) {
  const wrapperClass =
    variant === 'error'
      ? 'border-red-500/30 bg-red-500/10'
      : 'border-dark-50 bg-dark-100/40'
  const titleColor = variant === 'error' ? 'text-red-200' : 'text-white'
  return (
    <section
      data-testid="hedge-proof-error"
      className={`rounded-xl border ${wrapperClass} p-5`}
    >
      <h2 className={`text-base font-semibold ${titleColor}`}>{title}</h2>
      <p className="mt-1 text-sm text-gray-300">{detail}</p>
      <div className="mt-4 flex items-center gap-3 flex-wrap">
        <button
          type="button"
          data-testid="hedge-proof-retry"
          onClick={() => void onRetry()}
          className="text-xs px-3 py-1.5 rounded-md border border-dark-50 text-gray-200 hover:bg-dark-50"
        >
          Retry
        </button>
        <Link
          href="/analytics"
          className="text-xs text-gray-400 hover:text-white"
        >
          ← Back to dashboard
        </Link>
      </div>
    </section>
  )
}
