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

  test('POST with valid-format address returns 200, 429, or 503 — never 500', async ({
    request,
  }) => {
    const res = await postFaucet(
      request,
      JSON.stringify({ address: ZERO_ADDRESS }),
    )

    // The faucet is allowed to be drained (503), rate-limited (429), or to
    // succeed (200). What it must NOT do is leak a generic 500.
    expect(res.status()).not.toBe(500)
    expect([200, 429, 503]).toContain(res.status())
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
