/**
 * Flat JSON-on-disk store for GoodPredict market comments.
 *
 * Mirrors the pattern in `src/app/api/faucet/route.ts`: small, dependency-free,
 * append-only with a hard cap per market so the file never grows unbounded
 * on a long-running testnet. All writes are serialized via an in-process
 * promise chain to avoid interleaving readers on the same Node.js process.
 *
 * Storage shape:
 *   {
 *     [marketId: string]: PredictComment[]   // ordered oldest -> newest
 *   }
 *
 * Tests live in `src/lib/__tests__/predictCommentStore.test.ts`.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'

const DEFAULT_FILE = '/tmp/gooddollar-l2-predict-comments.json'

export type PredictComment = {
  id: string
  marketId: string
  author: `0x${string}`
  body: string
  createdAt: number
}

export type CommentsPage = {
  comments: PredictComment[]
  hasMore: boolean
}

export type GetCommentsOptions = {
  /** Max number of items to return. Defaults to 20. */
  limit?: number
  /** Cursor — return comments strictly older than the comment with this id. */
  before?: string
}

type StoreShape = Record<string, PredictComment[]>

function envInt(name: string, fallback: number): number {
  const raw = process.env[name]
  if (!raw) return fallback
  const n = Number.parseInt(raw, 10)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

export const commentLimits = {
  /** Maximum number of characters in a single comment body. */
  maxBodyChars: 280,
  /** Maximum number of comments retained per market. Older items get evicted. */
  maxPerMarket: envInt('PREDICT_COMMENTS_MAX_PER_MARKET', 500),
  /** Rate-limit window for per-author posting. */
  rateWindowMs: envInt('PREDICT_COMMENTS_RATE_WINDOW_MS', 60_000),
  /** Max comments an author may post per market within the rate window. */
  maxPerWindow: envInt('PREDICT_COMMENTS_MAX_PER_WINDOW', 5),
} as const

function commentsFile(): string {
  return process.env.PREDICT_COMMENTS_FILE ?? DEFAULT_FILE
}

async function readStore(): Promise<StoreShape> {
  try {
    const raw = await readFile(commentsFile(), 'utf8')
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object') {
      return parsed as StoreShape
    }
    return {}
  } catch {
    // Missing file or corrupt JSON — treat as empty.
    return {}
  }
}

async function writeStore(store: StoreShape): Promise<void> {
  const file = commentsFile()
  await mkdir(dirname(file), { recursive: true })
  await writeFile(file, JSON.stringify(store), 'utf8')
}

// Serialize writes within a single process so concurrent addComment calls
// don't lose data due to read-modify-write interleaving.
let writeQueue: Promise<unknown> = Promise.resolve()

function serialize<T>(fn: () => Promise<T>): Promise<T> {
  const next = writeQueue.then(fn, fn)
  // Swallow the result in the chain so a rejection doesn't poison future calls.
  writeQueue = next.then(
    () => undefined,
    () => undefined,
  )
  return next
}

function newId(): string {
  // Short, unique enough for human-visible UI. Not a security token.
  const rand = Math.random().toString(36).slice(2, 8)
  return `${Date.now().toString(36)}-${rand}`
}

export async function getComments(
  marketId: string,
  options: GetCommentsOptions,
): Promise<CommentsPage> {
  const store = await readStore()
  const all = store[marketId] ?? []

  // Newest-first.
  const newestFirst = [...all].sort((a, b) => b.createdAt - a.createdAt)

  let startIdx = 0
  if (options.before) {
    const idx = newestFirst.findIndex(c => c.id === options.before)
    startIdx = idx === -1 ? 0 : idx + 1
  }

  const limit = Math.min(Math.max(options.limit ?? 20, 1), 100)
  const slice = newestFirst.slice(startIdx, startIdx + limit)
  const hasMore = startIdx + slice.length < newestFirst.length

  return { comments: slice, hasMore }
}

export type AddCommentInput = {
  author: `0x${string}`
  body: string
  createdAt: number
}

export async function addComment(
  marketId: string,
  input: AddCommentInput,
): Promise<PredictComment> {
  return serialize(async () => {
    const store = await readStore()
    const list = store[marketId] ?? []
    const comment: PredictComment = {
      id: newId(),
      marketId,
      author: input.author,
      body: input.body,
      createdAt: input.createdAt,
    }
    list.push(comment)
    // Enforce cap; oldest entries are evicted.
    while (list.length > commentLimits.maxPerMarket) {
      list.shift()
    }
    store[marketId] = list
    await writeStore(store)
    return comment
  })
}

/**
 * Returns recent comments by a given author across all markets for rate
 * limiting. Cheap because per-market caps keep the store small.
 */
export async function recentByAuthor(
  marketId: string,
  author: `0x${string}`,
  windowMs: number,
  now: number,
): Promise<PredictComment[]> {
  const store = await readStore()
  const list = store[marketId] ?? []
  const a = author.toLowerCase()
  return list.filter(
    c => c.author.toLowerCase() === a && now - c.createdAt < windowMs,
  )
}
