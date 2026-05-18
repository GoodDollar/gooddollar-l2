// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { NextRequest } from 'next/server'
import { privateKeyToAccount } from 'viem/accounts'

const PRIVKEY_A =
  ('0x' + 'a'.repeat(63) + '1') as `0x${string}`
const PRIVKEY_B =
  ('0x' + 'b'.repeat(63) + '2') as `0x${string}`

let tempDir: string
let commentsFile: string
let accountA: ReturnType<typeof privateKeyToAccount>
let accountB: ReturnType<typeof privateKeyToAccount>

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), 'predict-comments-route-test-'))
  commentsFile = join(tempDir, 'comments.json')
  process.env.PREDICT_COMMENTS_FILE = commentsFile
  // Big enough to keep the round-trip simple while still letting us hit the
  // rate limit in <10 posts.
  process.env.PREDICT_COMMENTS_MAX_PER_WINDOW = '5'
  process.env.PREDICT_COMMENTS_RATE_WINDOW_MS = '600000'
  // Disable the IP-based limiter from withApiRateLimit so we test only the
  // per-author logic in this route. Faucet tests rely on the same env knob.
  process.env.RATE_LIMIT_ENABLED = 'false'
  accountA = privateKeyToAccount(PRIVKEY_A)
  accountB = privateKeyToAccount(PRIVKEY_B)
  vi.resetModules()
})

afterEach(() => {
  delete process.env.PREDICT_COMMENTS_FILE
  delete process.env.PREDICT_COMMENTS_MAX_PER_WINDOW
  delete process.env.PREDICT_COMMENTS_RATE_WINDOW_MS
  delete process.env.RATE_LIMIT_ENABLED
  rmSync(tempDir, { recursive: true, force: true })
  vi.restoreAllMocks()
})

async function loadHandlers() {
  const mod = await import('../route')
  return { GET: mod.GET, POST: mod.POST }
}

// Route handlers are typed against NextRequest, but they only use Web Request
// semantics here (URL parsing, .json()). Cast through unknown so tsc stays
// quiet while the runtime behaviour is identical.
function makeGet(query: string): NextRequest {
  return new Request(
    `http://localhost/api/predict/comments?${query}`,
  ) as unknown as NextRequest
}

function makePost(body: unknown): NextRequest {
  return new Request('http://localhost/api/predict/comments', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  }) as unknown as NextRequest
}

async function signedBody(
  account: ReturnType<typeof privateKeyToAccount>,
  marketId: string,
  body: string,
) {
  const message = `Comment on market ${marketId}: ${body} @ ${Date.now()}`
  const signature = await account.signMessage({ message })
  return { marketId, body, author: account.address, signature, message }
}

describe('GET /api/predict/comments', () => {
  it('returns 400 when marketId is missing', async () => {
    const { GET } = await loadHandlers()
    const res = await GET(makeGet(''))
    expect(res.status).toBe(400)
  })

  it('returns empty list for an unknown market', async () => {
    const { GET } = await loadHandlers()
    const res = await GET(makeGet('marketId=999'))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toEqual({ comments: [], hasMore: false })
  })

  it('returns posted comments newest-first', async () => {
    const { GET, POST } = await loadHandlers()
    const a = await signedBody(accountA, '42', 'first comment')
    const post1 = await POST(makePost(a))
    expect(post1.status).toBe(200)

    await new Promise(r => setTimeout(r, 5))
    const b = await signedBody(accountA, '42', 'second comment')
    const post2 = await POST(makePost(b))
    expect(post2.status).toBe(200)

    const res = await GET(makeGet('marketId=42'))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.comments).toHaveLength(2)
    expect(json.comments[0].body).toBe('second comment')
    expect(json.comments[1].body).toBe('first comment')
  })
})

describe('POST /api/predict/comments — input validation', () => {
  it('rejects malformed JSON with 400', async () => {
    const { POST } = await loadHandlers()
    const res = await POST(makePost('not-json'))
    expect(res.status).toBe(400)
  })

  it('rejects missing marketId with 400', async () => {
    const { POST } = await loadHandlers()
    const signed = await signedBody(accountA, '42', 'hi')
    const { marketId: _omit, ...rest } = signed
    const res = await POST(makePost(rest))
    expect(res.status).toBe(400)
  })

  it('rejects empty body (after trim) with 400', async () => {
    const { POST } = await loadHandlers()
    const signed = await signedBody(accountA, '42', '   ')
    const res = await POST(makePost(signed))
    expect(res.status).toBe(400)
  })

  it('rejects body > 280 chars with 400', async () => {
    const { POST } = await loadHandlers()
    const oversized = 'x'.repeat(281)
    const signed = await signedBody(accountA, '42', oversized)
    const res = await POST(makePost(signed))
    expect(res.status).toBe(400)
  })

  it('accepts body of exactly 280 chars', async () => {
    const { POST } = await loadHandlers()
    const max = 'x'.repeat(280)
    const signed = await signedBody(accountA, '42', max)
    const res = await POST(makePost(signed))
    expect(res.status).toBe(200)
  })
})

describe('POST /api/predict/comments — signature verification', () => {
  it('rejects a forged signature with 401', async () => {
    const { POST } = await loadHandlers()
    const signed = await signedBody(accountA, '42', 'hello')
    // Tamper with the signature (flip the last hex char) — recovery now
    // returns a different address that does NOT match `author`.
    const tampered = signed.signature.slice(0, -1) + (signed.signature.endsWith('0') ? '1' : '0')
    const res = await POST(
      makePost({ ...signed, signature: tampered as `0x${string}` }),
    )
    expect(res.status).toBe(401)
  })

  it('rejects when author does not match recovered signer with 401', async () => {
    const { POST } = await loadHandlers()
    // A signs the message, but we claim B is the author.
    const message = `Comment on market 42: hello @ ${Date.now()}`
    const signature = await accountA.signMessage({ message })
    const res = await POST(
      makePost({
        marketId: '42',
        body: 'hello',
        author: accountB.address,
        signature,
        message,
      }),
    )
    expect(res.status).toBe(401)
  })

  it('accepts a valid signature with 200 and returns the stored comment', async () => {
    const { POST } = await loadHandlers()
    const signed = await signedBody(accountA, '42', 'hello world')
    const res = await POST(makePost(signed))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.comment.body).toBe('hello world')
    expect(json.comment.marketId).toBe('42')
    expect(json.comment.author.toLowerCase()).toBe(accountA.address.toLowerCase())
    expect(typeof json.comment.id).toBe('string')
    expect(typeof json.comment.createdAt).toBe('number')
  })
})

describe('POST /api/predict/comments — rate limit', () => {
  it('returns 429 after maxPerWindow posts from the same author', async () => {
    const { POST } = await loadHandlers()
    // 5 should succeed.
    for (let i = 0; i < 5; i++) {
      const signed = await signedBody(accountA, '42', `post #${i}`)
      const res = await POST(makePost(signed))
      expect(res.status).toBe(200)
    }
    // 6th must be denied.
    const signed = await signedBody(accountA, '42', 'over the limit')
    const res = await POST(makePost(signed))
    expect(res.status).toBe(429)
    const json = await res.json()
    expect(typeof json.retryAfterSeconds).toBe('number')
  })

  it('does not block a different author from posting', async () => {
    const { POST } = await loadHandlers()
    for (let i = 0; i < 5; i++) {
      const signed = await signedBody(accountA, '42', `post #${i}`)
      const res = await POST(makePost(signed))
      expect(res.status).toBe(200)
    }
    const signedB = await signedBody(accountB, '42', 'other author')
    const res = await POST(makePost(signedB))
    expect(res.status).toBe(200)
  })
})

describe('POST /api/predict/comments — pagination', () => {
  it('supports limit + before cursor on GET', async () => {
    const { GET, POST } = await loadHandlers()
    // Post 3 comments.
    for (let i = 0; i < 3; i++) {
      const signed = await signedBody(accountA, '42', `c${i}`)
      const res = await POST(makePost(signed))
      expect(res.status).toBe(200)
      await new Promise(r => setTimeout(r, 5))
    }
    const page1 = await (await GET(makeGet('marketId=42&limit=2'))).json()
    expect(page1.comments).toHaveLength(2)
    expect(page1.hasMore).toBe(true)
    const lastId = page1.comments[page1.comments.length - 1].id

    const page2 = await (
      await GET(makeGet(`marketId=42&limit=2&before=${lastId}`))
    ).json()
    expect(page2.comments).toHaveLength(1)
    expect(page2.hasMore).toBe(false)
  })

  it('rejects a body that matches the BAD_WORDS regex with HTTP 400', async () => {
    const { POST } = await loadHandlers()
    // Use a deliberately tame placeholder to keep this codebase clean — the
    // regex itself is in BAD_WORDS_RE in the route. We rely on the assertion
    // that *something* in the regex set is rejected.
    const signed = await signedBody(accountA, '42', 'this is fuckin terrible')
    const res = await POST(makePost(signed))
    expect(res.status).toBe(400)
    const j = await res.json()
    expect(String(j.error)).toMatch(/disallowed|profanity|word/i)
  })

  it('does not falsely flag legitimate words containing substrings', async () => {
    // "assignment", "scunthorpe", "shitake" must NOT match.
    const { POST } = await loadHandlers()
    const signed = await signedBody(
      accountA,
      '42',
      'My assignment from Scunthorpe was about shitake mushrooms',
    )
    const res = await POST(makePost(signed))
    expect(res.status).toBe(200)
  })
})
