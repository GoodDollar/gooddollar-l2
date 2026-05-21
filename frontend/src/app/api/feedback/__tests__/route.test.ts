// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'
import { mkdtempSync, readFileSync, rmSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { NextRequest } from 'next/server'

let tempDir: string
let logFile: string

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), 'feedback-route-test-'))
  logFile = join(tempDir, 'feedback.jsonl')
  process.env.FEEDBACK_LOG_FILE = logFile
  // Disable rate limiter so we can issue many calls in tests without coupling
  // to the global token-bucket state across describe blocks.
  process.env.RATE_LIMIT_ENABLED = 'false'
})

afterEach(() => {
  delete process.env.FEEDBACK_LOG_FILE
  delete process.env.RATE_LIMIT_ENABLED
  rmSync(tempDir, { recursive: true, force: true })
})

async function loadHandler() {
  const mod = await import('../route')
  return mod.POST
}

function makeRequest(body: BodyInit | null, headers: Record<string, string> = {}) {
  return new NextRequest('http://localhost/api/feedback', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body,
  }) as unknown as NextRequest
}

function basePayload(overrides: Record<string, unknown> = {}) {
  return {
    type: 'bug',
    description: 'something is broken on the swap page',
    pathname: '/swap',
    wallet: '0x0000000000000000000000000000000000000001',
    viewport: { w: 1280, h: 720, dpr: 2 },
    sessionId: 'sid_test_0001',
    buildSha: 'abc1234',
    timestamp: new Date().toISOString(),
    recentConsole: [],
    ...overrides,
  }
}

function readLines(): Array<Record<string, unknown>> {
  if (!existsSync(logFile)) return []
  return readFileSync(logFile, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((l) => JSON.parse(l) as Record<string, unknown>)
}

describe('POST /api/feedback — boundary errors', () => {
  it('returns 400 for empty body', async () => {
    const POST = await loadHandler()
    const res = await POST(makeRequest(''))
    expect(res.status).toBe(400)
  })

  it('returns 400 for malformed JSON', async () => {
    const POST = await loadHandler()
    const res = await POST(makeRequest('not-json'))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toMatch(/invalid json/i)
  })

  it('returns 413 when body exceeds size cap', async () => {
    const POST = await loadHandler()
    // Pad with a long string. Cap is 16 KiB.
    const huge = 'x'.repeat(17 * 1024)
    const res = await POST(makeRequest(JSON.stringify({ pad: huge })))
    expect(res.status).toBe(413)
  })
})

describe('POST /api/feedback — schema validation', () => {
  it('rejects invalid feedback type', async () => {
    const POST = await loadHandler()
    const res = await POST(makeRequest(JSON.stringify(basePayload({ type: 'spam' }))))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toMatch(/type/i)
  })

  it('rejects missing description', async () => {
    const POST = await loadHandler()
    const res = await POST(makeRequest(JSON.stringify(basePayload({ description: '   ' }))))
    expect(res.status).toBe(400)
  })

  it('rejects oversized description', async () => {
    const POST = await loadHandler()
    const res = await POST(
      makeRequest(JSON.stringify(basePayload({ description: 'a'.repeat(2_001) }))),
    )
    expect(res.status).toBe(400)
  })

  it('rejects pathname not starting with /', async () => {
    const POST = await loadHandler()
    const res = await POST(makeRequest(JSON.stringify(basePayload({ pathname: 'swap' }))))
    expect(res.status).toBe(400)
  })

  it('rejects malformed wallet', async () => {
    const POST = await loadHandler()
    const res = await POST(makeRequest(JSON.stringify(basePayload({ wallet: '0xabc' }))))
    expect(res.status).toBe(400)
  })

  it('accepts wallet=null', async () => {
    const POST = await loadHandler()
    const res = await POST(makeRequest(JSON.stringify(basePayload({ wallet: null }))))
    expect(res.status).toBe(200)
  })

  it('rejects bad viewport', async () => {
    const POST = await loadHandler()
    const res = await POST(
      makeRequest(JSON.stringify(basePayload({ viewport: { w: 'wide', h: 1, dpr: 1 } }))),
    )
    expect(res.status).toBe(400)
  })

  it('rejects malformed recentConsole entries', async () => {
    const POST = await loadHandler()
    const res = await POST(
      makeRequest(
        JSON.stringify(
          basePayload({
            recentConsole: [{ level: 'info', message: 'x', at: new Date().toISOString() }],
          }),
        ),
      ),
    )
    expect(res.status).toBe(400)
  })

  it('rejects too many console entries', async () => {
    const POST = await loadHandler()
    const entries = Array.from({ length: 21 }, () => ({
      level: 'error',
      message: 'boom',
      at: new Date().toISOString(),
    }))
    const res = await POST(makeRequest(JSON.stringify(basePayload({ recentConsole: entries }))))
    expect(res.status).toBe(400)
  })
})

describe('POST /api/feedback — persistence + redaction', () => {
  it('appends a single JSONL line per successful submission', async () => {
    const POST = await loadHandler()
    const res = await POST(makeRequest(JSON.stringify(basePayload())))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.ok).toBe(true)

    const lines = readLines()
    expect(lines).toHaveLength(1)
    const rec = lines[0]
    expect(rec.type).toBe('bug')
    expect(rec.pathname).toBe('/swap')
    expect(typeof rec.receivedAt).toBe('string')
    expect(typeof rec.ip).toBe('string')
  })

  it('appends additional lines without truncating the file', async () => {
    const POST = await loadHandler()
    await POST(makeRequest(JSON.stringify(basePayload({ description: 'first' }))))
    await POST(makeRequest(JSON.stringify(basePayload({ description: 'second' }))))
    const lines = readLines()
    expect(lines).toHaveLength(2)
    expect(lines[0].description).toBe('first')
    expect(lines[1].description).toBe('second')
  })

  it('redacts private keys, mnemonics, JWTs, bearer tokens, emails', async () => {
    const POST = await loadHandler()
    const privKey = '0x' + 'a'.repeat(64)
    const mnemonic =
      'aaa bbb ccc ddd eee fff ggg hhh iii jjj kkk lll'
    const jwt = 'eyJabc.eyJdef.signaturehere1234'
    const desc = `
      private key: ${privKey}
      mnemonic: ${mnemonic}
      jwt: ${jwt}
      Authorization: Bearer SECRET_BEARER_TOKEN_123
      contact me at user@example.com
      password=hunter2
    `
    const res = await POST(makeRequest(JSON.stringify(basePayload({ description: desc }))))
    expect(res.status).toBe(200)
    const [rec] = readLines()
    const persisted = rec.description as string
    expect(persisted).not.toContain('aaaaaaaaaaaaaaaaaaaaaaaaaa')
    expect(persisted).not.toContain('aaa bbb ccc ddd')
    expect(persisted).not.toContain('eyJabc.eyJdef')
    expect(persisted).not.toContain('SECRET_BEARER_TOKEN_123')
    expect(persisted).not.toContain('user@example.com')
    expect(persisted).not.toContain('hunter2')
    expect(persisted).toMatch(/\[REDACTED\]/)
  })

  it('preserves the connected wallet address (public identifier)', async () => {
    const POST = await loadHandler()
    const wallet = '0x0123456789abcdef0123456789abcdef01234567'
    const res = await POST(makeRequest(JSON.stringify(basePayload({ wallet }))))
    expect(res.status).toBe(200)
    const [rec] = readLines()
    expect(rec.wallet).toBe(wallet)
  })

  it('records the requester IP from x-forwarded-for', async () => {
    const POST = await loadHandler()
    const res = await POST(
      makeRequest(JSON.stringify(basePayload()), { 'x-forwarded-for': '203.0.113.7' }),
    )
    expect(res.status).toBe(200)
    const [rec] = readLines()
    expect(rec.ip).toBe('203.0.113.7')
  })
})
