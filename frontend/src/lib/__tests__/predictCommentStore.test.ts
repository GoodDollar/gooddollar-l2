// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

let tempDir: string
let commentsFile: string

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), 'predict-comments-store-test-'))
  commentsFile = join(tempDir, 'comments.json')
  process.env.PREDICT_COMMENTS_FILE = commentsFile
  vi.resetModules()
})

afterEach(() => {
  delete process.env.PREDICT_COMMENTS_FILE
  rmSync(tempDir, { recursive: true, force: true })
  vi.restoreAllMocks()
})

async function loadStore() {
  return await import('../predictCommentStore')
}

describe('predictCommentStore — getComments', () => {
  it('returns an empty list and hasMore=false when the file does not exist', async () => {
    const store = await loadStore()
    const result = await store.getComments('42', {})
    expect(result).toEqual({ comments: [], hasMore: false })
  })

  it('returns an empty list when the file is unreadable / corrupt', async () => {
    writeFileSync(commentsFile, '{not-json-here')
    const store = await loadStore()
    const result = await store.getComments('42', {})
    expect(result).toEqual({ comments: [], hasMore: false })
  })

  it('returns comments newest-first', async () => {
    const store = await loadStore()
    const author = `0x${'a'.repeat(40)}` as `0x${string}`
    await store.addComment('42', { author, body: 'first', createdAt: 1000 })
    await store.addComment('42', { author, body: 'second', createdAt: 2000 })
    await store.addComment('42', { author, body: 'third', createdAt: 3000 })

    const result = await store.getComments('42', {})
    expect(result.comments.map(c => c.body)).toEqual(['third', 'second', 'first'])
  })

  it('isolates comments by marketId', async () => {
    const store = await loadStore()
    const author = `0x${'b'.repeat(40)}` as `0x${string}`
    await store.addComment('1', { author, body: 'on market 1', createdAt: 1000 })
    await store.addComment('2', { author, body: 'on market 2', createdAt: 2000 })

    const m1 = await store.getComments('1', {})
    const m2 = await store.getComments('2', {})
    expect(m1.comments).toHaveLength(1)
    expect(m1.comments[0].body).toBe('on market 1')
    expect(m2.comments).toHaveLength(1)
    expect(m2.comments[0].body).toBe('on market 2')
  })

  it('paginates via limit + hasMore flag', async () => {
    const store = await loadStore()
    const author = `0x${'c'.repeat(40)}` as `0x${string}`
    for (let i = 0; i < 10; i++) {
      await store.addComment('42', {
        author,
        body: `c${i}`,
        createdAt: 1_000 + i,
      })
    }

    const page1 = await store.getComments('42', { limit: 3 })
    expect(page1.comments).toHaveLength(3)
    expect(page1.hasMore).toBe(true)
    // newest-first: c9, c8, c7
    expect(page1.comments.map(c => c.body)).toEqual(['c9', 'c8', 'c7'])
  })

  it('paginates via before=id cursor', async () => {
    const store = await loadStore()
    const author = `0x${'d'.repeat(40)}` as `0x${string}`
    for (let i = 0; i < 5; i++) {
      await store.addComment('42', {
        author,
        body: `c${i}`,
        createdAt: 1_000 + i,
      })
    }

    const page1 = await store.getComments('42', { limit: 2 })
    expect(page1.comments.map(c => c.body)).toEqual(['c4', 'c3'])
    expect(page1.hasMore).toBe(true)

    const lastId = page1.comments[page1.comments.length - 1].id
    const page2 = await store.getComments('42', { limit: 2, before: lastId })
    expect(page2.comments.map(c => c.body)).toEqual(['c2', 'c1'])
    expect(page2.hasMore).toBe(true)

    const lastId2 = page2.comments[page2.comments.length - 1].id
    const page3 = await store.getComments('42', { limit: 2, before: lastId2 })
    expect(page3.comments.map(c => c.body)).toEqual(['c0'])
    expect(page3.hasMore).toBe(false)
  })
})

describe('predictCommentStore — addComment', () => {
  it('assigns a unique id and returns the stored record', async () => {
    const store = await loadStore()
    const author = `0x${'e'.repeat(40)}` as `0x${string}`
    const a = await store.addComment('42', {
      author,
      body: 'hello',
      createdAt: 1000,
    })
    const b = await store.addComment('42', {
      author,
      body: 'world',
      createdAt: 2000,
    })
    expect(a.id).toBeTruthy()
    expect(b.id).toBeTruthy()
    expect(a.id).not.toBe(b.id)
    expect(a.marketId).toBe('42')
    expect(a.author).toBe(author)
    expect(a.body).toBe('hello')
    expect(a.createdAt).toBe(1000)
  })

  it('persists comments across getComments calls', async () => {
    const store = await loadStore()
    const author = `0x${'f'.repeat(40)}` as `0x${string}`
    await store.addComment('42', { author, body: 'persisted', createdAt: 1000 })

    vi.resetModules()
    const store2 = await loadStore()
    const result = await store2.getComments('42', {})
    expect(result.comments).toHaveLength(1)
    expect(result.comments[0].body).toBe('persisted')
  })

  it('evicts oldest comment when maxPerMarket is exceeded', async () => {
    process.env.PREDICT_COMMENTS_MAX_PER_MARKET = '3'
    vi.resetModules()
    const store = await loadStore()
    const author = `0x${'1'.repeat(40)}` as `0x${string}`

    await store.addComment('42', { author, body: 'a', createdAt: 1000 })
    await store.addComment('42', { author, body: 'b', createdAt: 2000 })
    await store.addComment('42', { author, body: 'c', createdAt: 3000 })
    await store.addComment('42', { author, body: 'd', createdAt: 4000 })

    const result = await store.getComments('42', {})
    expect(result.comments.map(c => c.body)).toEqual(['d', 'c', 'b'])
    delete process.env.PREDICT_COMMENTS_MAX_PER_MARKET
  })
})

describe('predictCommentStore — commentLimits', () => {
  it('exposes the configured limits as constants', async () => {
    const store = await loadStore()
    expect(store.commentLimits.maxBodyChars).toBe(280)
    expect(store.commentLimits.maxPerMarket).toBeGreaterThan(0)
    expect(store.commentLimits.rateWindowMs).toBeGreaterThan(0)
    expect(store.commentLimits.maxPerWindow).toBeGreaterThan(0)
  })
})
