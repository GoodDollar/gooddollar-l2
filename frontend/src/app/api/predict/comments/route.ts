import { NextResponse, type NextRequest } from 'next/server'
import { recoverMessageAddress } from 'viem'
import { withApiRateLimit } from '@/lib/withApiRateLimit'
import {
  addComment,
  commentLimits,
  getComments,
  recentByAuthor,
  type PredictComment,
} from '@/lib/predictCommentStore'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/
const SIGNATURE_RE = /^0x[0-9a-fA-F]+$/

// Minimal profanity guard. Each entry is matched with word boundaries so
// legitimate words containing the same substring (e.g. "assignment",
// "Scunthorpe", "shitake") are NOT falsely flagged. This is intentionally
// tiny — operator-side moderation is via deleting the JSON row by hand,
// per the task spec ("Out of scope: moderation tooling beyond the static
// BAD_WORDS list"). Keep the list short and well-known; expanding it
// later requires updating the unit test that exercises false-positives.
const BAD_WORDS = ['fuckin', 'fuck', 'shit', 'cunt', 'bitch'] as const
const BAD_WORDS_RE = new RegExp(
  `\\b(?:${BAD_WORDS.join('|')})\\b`,
  'i',
)

class CommentsBadRequestError extends Error {}
class CommentsUnauthorizedError extends Error {}
class CommentsRateLimitError extends Error {
  constructor(
    message: string,
    public readonly retryAfterSeconds: number,
  ) {
    super(message)
  }
}

async function parseJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json()
  } catch {
    throw new CommentsBadRequestError('Invalid JSON body')
  }
}

function asString(value: unknown): string | null {
  return typeof value === 'string' ? value : null
}

async function handleGet(request: NextRequest) {
  const url = new URL(request.url)
  const marketId = url.searchParams.get('marketId')
  if (!marketId || marketId.trim().length === 0) {
    return NextResponse.json({ error: 'marketId is required' }, { status: 400 })
  }
  const limitRaw = url.searchParams.get('limit')
  const before = url.searchParams.get('before') ?? undefined
  const limit = limitRaw ? Number.parseInt(limitRaw, 10) : undefined

  const page = await getComments(marketId, {
    limit: Number.isFinite(limit) ? limit : undefined,
    before: before ?? undefined,
  })
  return NextResponse.json(page)
}

type PostBody = {
  marketId: string
  body: string
  author: `0x${string}`
  signature: `0x${string}`
  message: string
}

function validatePostBody(raw: unknown): PostBody {
  if (!raw || typeof raw !== 'object') {
    throw new CommentsBadRequestError('Invalid request body')
  }
  const obj = raw as Record<string, unknown>

  const marketId = asString(obj.marketId)
  if (!marketId || marketId.trim().length === 0) {
    throw new CommentsBadRequestError('marketId is required')
  }

  const body = asString(obj.body)
  if (body === null) {
    throw new CommentsBadRequestError('body is required')
  }
  const trimmed = body.trim()
  if (trimmed.length === 0) {
    throw new CommentsBadRequestError('body must not be empty')
  }
  if (body.length > commentLimits.maxBodyChars) {
    throw new CommentsBadRequestError(
      `body exceeds ${commentLimits.maxBodyChars} characters`,
    )
  }
  if (BAD_WORDS_RE.test(body)) {
    throw new CommentsBadRequestError(
      'body contains a disallowed word',
    )
  }

  const author = asString(obj.author)
  if (!author || !ADDRESS_RE.test(author)) {
    throw new CommentsBadRequestError('author must be a 0x address')
  }

  const signature = asString(obj.signature)
  if (!signature || !SIGNATURE_RE.test(signature)) {
    throw new CommentsBadRequestError('signature is required')
  }

  const message = asString(obj.message)
  if (!message || message.length === 0) {
    throw new CommentsBadRequestError('message is required')
  }

  return {
    marketId: marketId.trim(),
    body,
    author: author as `0x${string}`,
    signature: signature as `0x${string}`,
    message,
  }
}

async function verifySignature(input: PostBody): Promise<void> {
  let recovered: `0x${string}`
  try {
    recovered = await recoverMessageAddress({
      message: input.message,
      signature: input.signature,
    })
  } catch {
    throw new CommentsUnauthorizedError('Invalid signature')
  }
  if (recovered.toLowerCase() !== input.author.toLowerCase()) {
    throw new CommentsUnauthorizedError('Signature does not match author')
  }
}

async function enforceRateLimit(
  marketId: string,
  author: `0x${string}`,
  now: number,
): Promise<void> {
  const recent = await recentByAuthor(
    marketId,
    author,
    commentLimits.rateWindowMs,
    now,
  )
  if (recent.length >= commentLimits.maxPerWindow) {
    const oldestInWindow = recent.reduce(
      (acc, c) => Math.min(acc, c.createdAt),
      now,
    )
    const retryAfterMs = commentLimits.rateWindowMs - (now - oldestInWindow)
    const retryAfterSeconds = Math.max(1, Math.ceil(retryAfterMs / 1000))
    throw new CommentsRateLimitError(
      'Too many comments — slow down',
      retryAfterSeconds,
    )
  }
}

async function handlePost(request: NextRequest) {
  try {
    const raw = await parseJsonBody(request)
    const input = validatePostBody(raw)

    await verifySignature(input)

    const now = Date.now()
    await enforceRateLimit(input.marketId, input.author, now)

    const stored: PredictComment = await addComment(input.marketId, {
      author: input.author,
      body: input.body,
      createdAt: now,
    })

    return NextResponse.json({ ok: true, comment: stored })
  } catch (error) {
    if (error instanceof CommentsBadRequestError) {
      return NextResponse.json(
        { error: error.message || 'Invalid request' },
        { status: 400 },
      )
    }
    if (error instanceof CommentsUnauthorizedError) {
      return NextResponse.json(
        { error: error.message || 'Unauthorized' },
        { status: 401 },
      )
    }
    if (error instanceof CommentsRateLimitError) {
      return NextResponse.json(
        {
          error: error.message,
          retryAfterSeconds: error.retryAfterSeconds,
        },
        {
          status: 429,
          headers: { 'Retry-After': String(error.retryAfterSeconds) },
        },
      )
    }
    const message = error instanceof Error ? error.message : 'Request failed'
    console.error('[predict/comments] Unexpected error:', message)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export const GET = withApiRateLimit(handleGet)
export const POST = withApiRateLimit(handlePost)
