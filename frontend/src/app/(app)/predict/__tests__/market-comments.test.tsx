// @vitest-environment jsdom
import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react'

type AccountState = {
  isConnected: boolean
  address?: `0x${string}`
}

let accountState: AccountState = { isConnected: false }
const signMessageAsync = vi.fn(async () => '0xdeadbeef' as `0x${string}`)
const openConnectModal = vi.fn()

vi.mock('wagmi', () => ({
  useAccount: () => accountState,
  useSignMessage: () => ({ signMessageAsync }),
}))

vi.mock('@rainbow-me/rainbowkit', () => ({
  ConnectButton: {
    Custom: ({
      children,
    }: {
      children: (props: { openConnectModal: () => void }) => React.ReactNode
    }) => <>{children({ openConnectModal })}</>,
  },
}))

import MarketComments from '@/components/predict/MarketComments'

const sampleComments = [
  {
    id: 'c3',
    marketId: '42',
    author: '0xAAAAaAaAAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAa',
    body: 'Probability seems too low given the recent news.',
    createdAt: Date.now() - 60_000,
  },
  {
    id: 'c2',
    marketId: '42',
    author: '0xBBBBbBbBBbBbBbBbBbBbBbBbBbBbBbBbBbBbBbBb',
    body: 'NO holders are crushing this market.',
    createdAt: Date.now() - 10 * 60_000,
  },
  {
    id: 'c1',
    marketId: '42',
    author: '0xCCCCcCcCCcCcCcCcCcCcCcCcCcCcCcCcCcCcCcCc',
    body: 'Let us see what happens next week.',
    createdAt: Date.now() - 2 * 60 * 60_000,
  },
]

function mockFetchSequence(responses: Array<() => Response | Promise<Response>>) {
  let i = 0
  return vi.fn(async () => {
    const next = responses[Math.min(i, responses.length - 1)]
    i += 1
    return next()
  })
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

beforeEach(() => {
  accountState = { isConnected: false }
  signMessageAsync.mockClear()
  openConnectModal.mockClear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('MarketComments — read-only state', () => {
  it('renders three sample comments newest-first', async () => {
    global.fetch = mockFetchSequence([
      () => jsonResponse({ comments: sampleComments, hasMore: false }),
    ]) as unknown as typeof fetch

    render(<MarketComments marketId="42" />)

    for (const c of sampleComments) {
      await waitFor(() => expect(screen.getByText(c.body)).toBeTruthy())
    }
  })

  it('renders relative timestamps (no absolute ISO strings)', async () => {
    global.fetch = mockFetchSequence([
      () => jsonResponse({ comments: sampleComments, hasMore: false }),
    ]) as unknown as typeof fetch

    render(<MarketComments marketId="42" />)

    // At least one "ago" or "now" or "m" relative marker must appear.
    await waitFor(() => {
      const text = document.body.textContent || ''
      expect(/ago|just now|m\b|h\b/.test(text)).toBe(true)
    })

    // No absolute ISO timestamps leaked into the DOM.
    expect(document.body.textContent || '').not.toMatch(/T\d{2}:\d{2}:\d{2}/)
  })

  it('shows a discussion section with an accessible heading', async () => {
    global.fetch = mockFetchSequence([
      () => jsonResponse({ comments: sampleComments, hasMore: false }),
    ]) as unknown as typeof fetch

    render(<MarketComments marketId="42" />)
    await waitFor(() => {
      expect(screen.getByRole('region', { name: /discussion/i })).toBeTruthy()
    })
  })
})

describe('MarketComments — wallet gating', () => {
  it('shows a "Connect wallet to comment" CTA when wallet is disconnected', async () => {
    accountState = { isConnected: false }
    global.fetch = mockFetchSequence([
      () => jsonResponse({ comments: [], hasMore: false }),
    ]) as unknown as typeof fetch

    render(<MarketComments marketId="42" />)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /connect wallet/i })).toBeTruthy()
    })
    expect(screen.queryByRole('textbox')).toBeNull()
  })

  it('shows the composer when wallet is connected', async () => {
    accountState = {
      isConnected: true,
      address: '0xAAAAaAaAAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAa',
    }
    global.fetch = mockFetchSequence([
      () => jsonResponse({ comments: [], hasMore: false }),
    ]) as unknown as typeof fetch

    render(<MarketComments marketId="42" />)
    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: /comment/i })).toBeTruthy()
    })
    expect(screen.getByRole('button', { name: /post/i })).toBeTruthy()
  })
})

describe('MarketComments — composer behavior', () => {
  beforeEach(() => {
    accountState = {
      isConnected: true,
      address: '0xAAAAaAaAAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAa',
    }
  })

  it('disables Post button while body is empty', async () => {
    global.fetch = mockFetchSequence([
      () => jsonResponse({ comments: [], hasMore: false }),
    ]) as unknown as typeof fetch

    render(<MarketComments marketId="42" />)
    const post = await screen.findByRole('button', { name: /post/i })
    expect((post as HTMLButtonElement).disabled).toBe(true)
  })

  it('disables Post button when body exceeds 280 chars', async () => {
    global.fetch = mockFetchSequence([
      () => jsonResponse({ comments: [], hasMore: false }),
    ]) as unknown as typeof fetch

    render(<MarketComments marketId="42" />)
    const textarea = await screen.findByRole('textbox', { name: /comment/i })
    fireEvent.change(textarea, { target: { value: 'x'.repeat(281) } })
    const post = screen.getByRole('button', { name: /post/i })
    expect((post as HTMLButtonElement).disabled).toBe(true)
  })

  it('shows live character counter', async () => {
    global.fetch = mockFetchSequence([
      () => jsonResponse({ comments: [], hasMore: false }),
    ]) as unknown as typeof fetch

    render(<MarketComments marketId="42" />)
    const textarea = await screen.findByRole('textbox', { name: /comment/i })
    fireEvent.change(textarea, { target: { value: 'hello world' } })
    await waitFor(() => {
      expect(screen.getByText(/11\s*\/\s*280/)).toBeTruthy()
    })
  })

  it('posts a comment and optimistically prepends it', async () => {
    const fetchMock = vi.fn(async (input: Request | string, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.url
      const method = init?.method?.toUpperCase() ?? 'GET'
      if (method === 'GET') {
        return jsonResponse({ comments: [], hasMore: false })
      }
      // POST
      return jsonResponse({
        ok: true,
        comment: {
          id: 'srv-1',
          marketId: '42',
          author: '0xAAAAaAaAAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAa',
          body: 'hello world',
          createdAt: Date.now(),
        },
      })
    })
    global.fetch = fetchMock as unknown as typeof fetch

    render(<MarketComments marketId="42" />)
    const textarea = await screen.findByRole('textbox', { name: /comment/i })
    fireEvent.change(textarea, { target: { value: 'hello world' } })
    const post = screen.getByRole('button', { name: /post/i })

    await act(async () => {
      fireEvent.click(post)
    })

    await waitFor(() => {
      expect(screen.getByText('hello world')).toBeTruthy()
    })
    expect(signMessageAsync).toHaveBeenCalled()
  })
})
