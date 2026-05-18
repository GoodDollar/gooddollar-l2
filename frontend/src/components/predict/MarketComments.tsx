'use client'

/**
 * MarketComments — Polymarket-parity discussion section for the Predict
 * market detail page (task 0050).
 *
 * Responsibilities:
 *
 *   • Fetch comments for the given `marketId` from `/api/predict/comments`
 *     with cursor pagination (`before` cursor).
 *
 *   • Render comments newest-first with relative timestamps so the section
 *     does not visually rot — absolute ISO strings are intentionally kept
 *     out of the DOM.
 *
 *   • Gate posting behind wallet connection. Disconnected users see a
 *     "Connect wallet to comment" CTA that opens the RainbowKit connect
 *     modal via `ConnectButton.Custom`.
 *
 *   • Connected users see a composer with a 280-char limit and live counter.
 *     Posting requires signing a structured message via `useSignMessage`
 *     so the server can recover the author address.
 *
 * The component is intentionally self-contained: the page mounts it with a
 * single `marketId` prop and does not need to thread wallet state through.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from 'react'
import { useAccount, useSignMessage } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { MessageSquare, Send, Loader2 } from 'lucide-react'

export interface MarketComment {
  id: string
  marketId: string
  author: `0x${string}`
  body: string
  createdAt: number
}

interface MarketCommentsProps {
  marketId: string
}

const MAX_BODY = 280
const PAGE_SIZE = 25

interface CommentsPage {
  comments: MarketComment[]
  hasMore: boolean
}

function formatRelative(ts: number, now: number): string {
  const diff = Math.max(0, now - ts)
  const s = Math.floor(diff / 1000)
  if (s < 30) return 'just now'
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d}d ago`
  const mo = Math.floor(d / 30)
  if (mo < 12) return `${mo}mo ago`
  const y = Math.floor(d / 365)
  return `${y}y ago`
}

function shortAddress(addr: string): string {
  if (!addr.startsWith('0x') || addr.length < 10) return addr
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

function buildMessage(marketId: string, body: string, createdAt: number): string {
  return [
    'GoodPredict — comment',
    `market: ${marketId}`,
    `time: ${createdAt}`,
    '',
    body,
  ].join('\n')
}

export default function MarketComments({ marketId }: MarketCommentsProps) {
  const { isConnected, address } = useAccount()
  const { signMessageAsync } = useSignMessage()

  const [comments, setComments] = useState<MarketComment[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [postError, setPostError] = useState<string | null>(null)
  const [now, setNow] = useState(() => Date.now())

  const loadingMoreRef = useRef(false)

  // Heartbeat to keep relative timestamps fresh without re-fetching.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(t)
  }, [])

  // Initial load
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setLoadError(null)
    void (async () => {
      try {
        const res = await fetch(
          `/api/predict/comments?marketId=${encodeURIComponent(marketId)}&limit=${PAGE_SIZE}`,
        )
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const page = (await res.json()) as CommentsPage
        if (cancelled) return
        setComments(page.comments ?? [])
        setHasMore(Boolean(page.hasMore))
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : 'Failed to load')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [marketId])

  const loadMore = useCallback(async () => {
    if (loadingMoreRef.current || !hasMore || comments.length === 0) return
    loadingMoreRef.current = true
    try {
      const before = comments[comments.length - 1]?.id
      const url = `/api/predict/comments?marketId=${encodeURIComponent(
        marketId,
      )}&limit=${PAGE_SIZE}&before=${encodeURIComponent(before)}`
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const page = (await res.json()) as CommentsPage
      setComments((prev) => [...prev, ...(page.comments ?? [])])
      setHasMore(Boolean(page.hasMore))
    } catch {
      // soft-fail; user can retry
    } finally {
      loadingMoreRef.current = false
    }
  }, [comments, hasMore, marketId])

  const onBodyChange = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
    setBody(e.target.value)
    setPostError(null)
  }, [])

  const canPost = useMemo(() => {
    const trimmed = body.trim()
    return (
      isConnected &&
      !!address &&
      !submitting &&
      trimmed.length > 0 &&
      body.length <= MAX_BODY
    )
  }, [address, body, isConnected, submitting])

  const onSubmit = useCallback(async () => {
    if (!canPost || !address) return
    setSubmitting(true)
    setPostError(null)
    try {
      const createdAt = Date.now()
      const message = buildMessage(marketId, body, createdAt)
      const signature = await signMessageAsync({ message })
      const res = await fetch('/api/predict/comments', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          marketId,
          body,
          author: address,
          signature,
          message,
        }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(data.error ?? `HTTP ${res.status}`)
      }
      const data = (await res.json()) as { comment: MarketComment }
      setComments((prev) => [data.comment, ...prev])
      setBody('')
    } catch (err) {
      setPostError(err instanceof Error ? err.message : 'Failed to post')
    } finally {
      setSubmitting(false)
    }
  }, [address, body, canPost, marketId, signMessageAsync])

  return (
    <section
      role="region"
      aria-label="Discussion"
      className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
    >
      <header className="mb-4 flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-indigo-300" aria-hidden />
        <h2 className="text-lg font-semibold text-white">Discussion</h2>
        <span className="ml-auto text-xs text-white/50">
          {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
        </span>
      </header>

      {/* Composer */}
      {isConnected && address ? (
        <div className="mb-5 rounded-xl border border-white/10 bg-white/[0.02] p-3">
          <label htmlFor="comment-body" className="sr-only">
            Comment
          </label>
          <textarea
            id="comment-body"
            aria-label="Comment"
            rows={3}
            value={body}
            onChange={onBodyChange}
            placeholder="Share your take on this market…"
            className="w-full resize-none rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-indigo-400/60"
          />
          <div className="mt-2 flex items-center justify-between">
            <span
              className={`text-xs ${body.length > MAX_BODY ? 'text-rose-400' : 'text-white/40'}`}
            >
              {body.length} / {MAX_BODY}
            </span>
            <button
              type="button"
              onClick={onSubmit}
              disabled={!canPost}
              className="inline-flex items-center gap-1 rounded-lg bg-indigo-500 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/40"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Send className="h-4 w-4" aria-hidden />
              )}
              Post
            </button>
          </div>
          {postError && (
            <p className="mt-2 text-xs text-rose-400" role="alert">
              {postError}
            </p>
          )}
        </div>
      ) : (
        <div className="mb-5 flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] p-3">
          <p className="text-sm text-white/70">
            Connect a wallet to join the discussion.
          </p>
          <ConnectButton.Custom>
            {({ openConnectModal }) => (
              <button
                type="button"
                onClick={openConnectModal}
                className="rounded-lg bg-indigo-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-400"
              >
                Connect wallet
              </button>
            )}
          </ConnectButton.Custom>
        </div>
      )}

      {/* Comment list */}
      {loading ? (
        <div
          className="flex items-center gap-2 py-6 text-sm text-white/50"
          role="status"
          aria-live="polite"
        >
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Loading comments…
        </div>
      ) : loadError ? (
        <p className="py-6 text-sm text-rose-400" role="alert">
          {loadError}
        </p>
      ) : comments.length === 0 ? (
        <p className="py-6 text-sm text-white/40">
          No comments yet. Be the first to weigh in.
        </p>
      ) : (
        <ul className="space-y-3">
          {comments.map((c) => (
            <li
              key={c.id}
              className="rounded-xl border border-white/5 bg-black/20 p-3"
            >
              <div className="mb-1 flex items-center gap-2 text-xs text-white/50">
                <span className="font-mono">{shortAddress(c.author)}</span>
                <span aria-hidden>·</span>
                <time dateTime={new Date(c.createdAt).toISOString()}>
                  {formatRelative(c.createdAt, now)}
                </time>
              </div>
              <p className="whitespace-pre-wrap text-sm text-white/90">
                {c.body}
              </p>
            </li>
          ))}
        </ul>
      )}

      {hasMore && !loading && (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={loadMore}
            className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/70 hover:bg-white/[0.08]"
          >
            Load more
          </button>
        </div>
      )}
    </section>
  )
}
