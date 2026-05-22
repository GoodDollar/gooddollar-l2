import { readFileSync } from 'node:fs'
import path from 'node:path'

import { test, expect, type APIRequestContext } from '@playwright/test'

const FAUCET_PATH = '/api/faucet'
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

async function postFaucet(
  request: APIRequestContext,
  body: string,
  headers: Record<string, string> = { 'content-type': 'application/json' },
) {
  return request.post(FAUCET_PATH, {
    headers,
    data: body,
    failOnStatusCode: false,
  })
}

test.describe('Faucet reliability — page', () => {
  test('renders heading, address input, and claim button', async ({ page }) => {
    await page.goto('/faucet')

    await expect(
      page.getByRole('heading', { name: /testnet faucet/i, level: 1 }),
    ).toBeVisible()

    const addressInput = page.locator('#faucet-addr')
    await expect(addressInput).toBeVisible()
    await expect(addressInput).toHaveAttribute('placeholder', '0x...')

    await expect(
      page.getByRole('button', { name: /claim test tokens/i }),
    ).toBeVisible()
  })

  test('typing a bad address keeps the claim button disabled and shows inline error', async ({
    page,
  }) => {
    await page.goto('/faucet')

    const addressInput = page.locator('#faucet-addr')
    await addressInput.fill('not-an-address')

    const claimButton = page.getByRole('button', { name: /claim test tokens/i })

    // The page disables the button for bad addresses; assert without trying to
    // click (Playwright would otherwise error on a disabled element).
    await expect(claimButton).toBeDisabled()
    await expect(page.getByText(/invalid ethereum address/i)).toBeVisible()
  })

  test('bad address never issues a request to /api/faucet', async ({ page }) => {
    await page.goto('/faucet')

    let faucetCalled = false
    page.on('request', (req) => {
      if (req.method() === 'POST' && req.url().includes(FAUCET_PATH)) {
        faucetCalled = true
      }
    })

    await page.locator('#faucet-addr').fill('not-an-address')
    // Force a click attempt: the disabled button swallows the click but the
    // assertion is "no network call to /api/faucet was made".
    await page
      .getByRole('button', { name: /claim test tokens/i })
      .click({ force: true, trial: false })
      .catch(() => {
        // Disabled buttons throw — that is the desired outcome.
      })

    // Give the page a beat to issue any rogue fetch before asserting.
    await page.waitForTimeout(300)
    expect(faucetCalled).toBe(false)
  })
})

test.describe('Faucet reliability — API regressions', () => {
  test('POST with malformed JSON returns 400 (regression: was 500)', async ({
    request,
  }) => {
    const res = await postFaucet(request, 'not-json')
    expect(res.status()).toBe(400)
    const json = await res.json()
    expect(String(json.error ?? '')).toMatch(/invalid json/i)
  })

  test('POST with empty body returns 400 (regression: was 500)', async ({
    request,
  }) => {
    const res = await postFaucet(request, '')
    expect(res.status()).toBe(400)
    const json = await res.json()
    expect(String(json.error ?? '')).toMatch(/invalid json/i)
  })

  test('POST with empty JSON object returns 400 with invalid-address error', async ({
    request,
  }) => {
    const res = await postFaucet(request, '{}')
    expect(res.status()).toBe(400)
    const json = await res.json()
    expect(String(json.error ?? '')).toMatch(/invalid address/i)
  })

  test('POST with malformed address returns 400', async ({ request }) => {
    const res = await postFaucet(
      request,
      JSON.stringify({ address: 'not-an-address' }),
    )
    expect(res.status()).toBe(400)
    const json = await res.json()
    expect(String(json.error ?? '')).toMatch(/invalid address/i)
  })

  test('POST with burn / null / contract address returns 400 — never 200 or 500', async ({
    request,
  }) => {
    // Burn / null addresses must be rejected at validation time so the faucet
    // never drains tokens to addresses from which they can never be recovered.
    // Previously this test allowed [200, 429, 503] for the zero address,
    // codifying the very drain bug it was supposed to catch.
    const addresses = JSON.parse(
      readFileSync(path.resolve(process.cwd(), '..', 'op-stack', 'addresses.json'), 'utf8'),
    ) as { contracts: Record<string, string> }

    const burnAddresses = [
      ZERO_ADDRESS,
      '0xdEaDdEaDdEaDdEaDdEaDdEaDdEaDdEaDdEaDdEaD',
      '0x000000000000000000000000000000000000dEaD',
      '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF',
      addresses.contracts.GoodDollarToken,
      addresses.contracts.MockWETH,
    ]

    for (const addr of burnAddresses) {
      const res = await postFaucet(request, JSON.stringify({ address: addr }))
      expect(
        res.status(),
        `address ${addr} should be rejected with 400`,
      ).toBe(400)
      const json = await res.json()
      expect(String(json.error ?? '')).toMatch(
        /invalid or unsupported recipient/i,
      )
    }
  })
})

test.describe('Faucet reliability — 500 response sanitization (iter33 task 0046)', () => {
  // The catch-all 500 branch of /api/faucet used to echo the raw viem error
  // message back to the client, leaking the operator EOA, viem version, RPC
  // URL, and calldata. Task 0046 introduced a sanitization helper. The
  // helper-level negative assertions live in the Vitest unit test at
  // `frontend/src/app/api/faucet/__tests__/sanitize.test.ts` (Playwright
  // can't transpile the TS source on the fly). At the E2E layer we pin
  // the integration shape:
  //   1. Live API — if a 500 is returned, the response body is sanitized
  //      and carries an 8-hex `errorId`.
  //   2. PM2 logs — the most recent success line uses the redacted address
  //      form (0xXXXX…YYYY) rather than the full recipient.

  test('POST /api/faucet 500 response (if any) is sanitized and includes errorId', async ({
    request,
  }) => {
    // Probe with a valid-format, unsupported-but-not-burn address so we
    // exercise either the rate limiter, capacity guard, or real claim path
    // — never the address guard. Possible outcomes:
    //   200 — success (claim went through), sanitization not exercised
    //   400 — guard rejected the address (sanitization not exercised)
    //   429 — rate limited (sanitization not exercised)
    //   503 — capacity issue (sanitization not exercised)
    //   500 — catch-all — MUST be sanitized + carry an errorId
    //
    // We never want a 500 to leak viem internals. If the deployment happens
    // not to return 500 during this run, the test passes trivially — its
    // purpose is to catch a regression where the response shape leaks.
    const res = await postFaucet(
      request,
      JSON.stringify({
        address: '0xa1b2c3d4a1b2c3d4a1b2c3d4a1b2c3d4a1b2c3d4',
      }),
    )

    expect(
      [200, 400, 429, 500, 503],
      `unexpected faucet status: ${res.status()}`,
    ).toContain(res.status())

    if (res.status() === 500) {
      const json = await res.json()
      const errStr = String(json.error ?? '')
      expect(errStr).toMatch(/please try again later/i)
      expect(errStr).not.toMatch(/viem/i)
      expect(errStr).not.toMatch(/version/i)
      expect(errStr).not.toMatch(/from:/i)
      expect(errStr).not.toMatch(/0x[0-9a-fA-F]{40}/)
      expect(String(json.errorId ?? '')).toMatch(/^[0-9a-f]{8}$/)
    }
  })

  test('most recent PM2 faucet success log line uses redacted recipient form', async () => {
    // Best-effort check: assert that the latest line of the form
    //   [faucet] Real claim for <addr> → 0x...
    // uses the redacted "0xXXXX…YYYY" form rather than a full 0x[hex]{40}.
    // Older pre-build lines may still contain full addresses; we only check
    // the most recent one because that reflects the deployed code.
    const { readFileSync, existsSync, statSync } = await import('node:fs')
    const path = await import('node:path')

    const candidates = [
      path.join(process.env.HOME ?? '', '.pm2/logs/goodswap-out.log'),
      path.join(
        process.env.HOME ?? '',
        '.pm2/logs/goodswap-frontend-out.log',
      ),
    ]
    const logPath = candidates.find((p) => p && existsSync(p))
    test.skip(!logPath, 'No PM2 log file present (CI environment)')

    // Only read the tail to avoid pulling many MB into memory.
    const stat = statSync(logPath!)
    const readFrom = Math.max(0, stat.size - 64 * 1024) // last 64 KB
    const fd = (await import('node:fs')).openSync(logPath!, 'r')
    const buf = Buffer.alloc(stat.size - readFrom)
    ;(await import('node:fs')).readSync(fd, buf, 0, buf.length, readFrom)
    ;(await import('node:fs')).closeSync(fd)
    const tail = buf.toString('utf8').split('\n')

    const successLines = tail.filter((l) =>
      l.includes('[faucet] Real claim for'),
    )
    if (successLines.length === 0) {
      test.skip(true, 'No faucet success lines in the last 64 KB of PM2 log')
    }

    const latest = successLines[successLines.length - 1]
    const match = latest.match(/Real claim for (\S+)/)
    expect(
      match,
      `Could not extract recipient token from latest faucet log line: ${latest}`,
    ).not.toBeNull()
    const recipient = match![1]

    // The redacted form is 0xXXXX…YYYY where '…' is U+2026 (horizontal
    // ellipsis). A full 40-hex address in this slot is the regression
    // we are guarding against.
    expect(
      recipient,
      `Latest PM2 faucet success line leaks full recipient address:\n${latest}`,
    ).not.toMatch(/^0x[0-9a-fA-F]{40}$/)
    expect(recipient).toMatch(/^0x[0-9a-fA-F]{4}\u2026[0-9a-fA-F]{4}$/)
  })
})

test.describe('Faucet reliability — opt-in real claim', () => {
  // Real on-chain claim only runs when an operator opts in. CI must not burn
  // faucet funds on every push.
  test.skip(
    process.env.FAUCET_E2E_REAL_CLAIM !== '1',
    'Set FAUCET_E2E_REAL_CLAIM=1 to run the real on-chain claim test.',
  )

  test('fresh address claim returns 200 and credits G$ on chain', async ({
    request,
  }) => {
    test.setTimeout(60_000)

    const { generatePrivateKey, privateKeyToAccount } = await import(
      'viem/accounts'
    )
    const { createPublicClient, http, parseEther } = await import('viem')
    const { CONTRACTS, DEVNET_RPC_URL } = await import(
      '../src/lib/devnet'
    )

    const account = privateKeyToAccount(generatePrivateKey())
    const expectedAmount = parseEther(
      process.env.FAUCET_GDT_AMOUNT ?? '10000',
    )

    const res = await request.post(FAUCET_PATH, {
      headers: { 'content-type': 'application/json' },
      data: JSON.stringify({ address: account.address }),
      failOnStatusCode: false,
    })

    expect(res.status()).toBe(200)
    const json = await res.json()
    const txHashes: string[] = Array.isArray(json.txHashes)
      ? json.txHashes
      : json.txHash
        ? [json.txHash]
        : []
    expect(txHashes.length).toBeGreaterThan(0)

    const publicClient = createPublicClient({
      transport: http(process.env.FAUCET_RPC_URL ?? DEVNET_RPC_URL),
    })

    // Wait for the last tx (G$ transfer) to land before reading balance.
    for (const hash of txHashes) {
      await publicClient.waitForTransactionReceipt({
        hash: hash as `0x${string}`,
        timeout: 30_000,
      })
    }

    const balance = (await publicClient.readContract({
      address: CONTRACTS.GoodDollarToken,
      abi: [
        {
          type: 'function',
          name: 'balanceOf',
          stateMutability: 'view',
          inputs: [{ name: 'account', type: 'address' }],
          outputs: [{ name: '', type: 'uint256' }],
        },
      ],
      functionName: 'balanceOf',
      args: [account.address],
    })) as bigint

    expect(balance).toBe(expectedAmount)
  })
})
