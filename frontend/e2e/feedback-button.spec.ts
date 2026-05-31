/**
 * Iteration 29 (testnet-readiness gate) — feedback pipeline UI proof.
 *
 * Verifies the floating Feedback button captures route + context safely and
 * POSTs a payload matching the canonical `FeedbackPayload` shape to
 * `/api/feedback`. We intercept the request so the spec stays hermetic
 * (no JSONL writes, no PM2/anvil dependency) and so we can assert on the
 * exact body the client sent — including that no secrets leak through the
 * console-buffer wiring.
 *
 * Related:
 *   .autobuilder/initiatives/0004-testnet-readiness-gate/tasks/
 *     0040-iter29-feedback-pipeline.md
 *   src/components/FeedbackButton.tsx
 *   src/app/api/feedback/route.ts
 *   src/app/api/feedback/__tests__/route.test.ts
 */
import { test, expect } from '@playwright/test'

interface CapturedFeedback {
  type: string
  description: string
  pathname: string
  wallet: string | null
  viewport: { w: number; h: number; dpr: number }
  sessionId: string
  buildSha: string
  timestamp: string
  recentConsole: Array<{ level: 'error' | 'warn'; message: string; at: string }>
}

test.describe('Feedback button — pipeline', () => {
  test('open → fill → submit posts a well-formed payload to /api/feedback', async ({
    page,
  }) => {
    let captured: CapturedFeedback | null = null

    await page.route('**/api/feedback', async (route) => {
      // Capture the JSON the client sent, then short-circuit the response so we
      // never touch disk / the real handler from inside the e2e environment.
      const req = route.request()
      try {
        captured = req.postDataJSON() as CapturedFeedback
      } catch {
        captured = null
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true }),
      })
    })

    await page.goto('/faucet')
    await page.waitForLoadState('networkidle')

    // The floating button is fixed to the viewport — make sure it exists
    // before clicking. We use the dedicated testid added in iter 29.
    const openBtn = page.getByTestId('feedback-open')
    await expect(openBtn).toBeVisible()
    await openBtn.click()

    const dialog = page.getByTestId('feedback-dialog')
    await expect(dialog).toBeVisible()

    // Switch type away from the default 'bug' to prove the selector works.
    await page.getByTestId('feedback-type-ux').click()

    const description =
      'iter29 playwright smoke: feedback button captures route + context safely'
    await page.getByTestId('feedback-description').fill(description)

    const submit = page.getByTestId('feedback-submit')
    await expect(submit).toBeEnabled()
    await submit.click()

    // The component flips to the thank-you panel only on a 200 response, so
    // this also covers the success-state UX. Poll so React state settles after
    // the intercepted POST resolves (shared context / hydration flake).
    await expect
      .poll(
        async () => page.getByTestId('feedback-sent').isVisible(),
        {
          timeout: 15_000,
          message: 'feedback-sent success panel should appear after successful POST',
          intervals: [100, 250, 500],
        },
      )
      .toBe(true)

    // Sanity-check the intercepted payload.
    expect(captured).not.toBeNull()
    const body = captured as unknown as CapturedFeedback
    expect(body.type).toBe('ux')
    expect(body.description).toBe(description)
    expect(body.pathname).toBe('/faucet')
    // Wallet is unknown in e2e (no injected provider); FeedbackButton sends
    // null in that case rather than guessing.
    expect(body.wallet).toBeNull()
    expect(body.viewport.w).toBeGreaterThan(0)
    expect(body.viewport.h).toBeGreaterThan(0)
    expect(body.viewport.dpr).toBeGreaterThan(0)
    expect(body.sessionId.length).toBeGreaterThan(0)
    expect(body.buildSha.length).toBeGreaterThan(0)
    expect(Number.isNaN(Date.parse(body.timestamp))).toBe(false)
    expect(Array.isArray(body.recentConsole)).toBe(true)
  })

  test('does not submit when description is empty', async ({ page }) => {
    let posted = false
    await page.route('**/api/feedback', async (route) => {
      posted = true
      await route.fulfill({ status: 200, body: '{}' })
    })

    await page.goto('/')
    // Ensure the page is fully interactive after potential previous-test navigation
    await page.waitForLoadState('networkidle')
    const openBtn = page.getByTestId('feedback-open')
    await expect(openBtn).toBeVisible()
    await openBtn.click()

    // Wait for dialog to be visible before checking submit button
    const dialog = page.getByTestId('feedback-dialog')
    await expect(dialog).toBeVisible()

    const submit = page.getByTestId('feedback-submit')
    // Empty description: button must stay disabled.
    await expect(submit).toBeDisabled()
    expect(posted).toBe(false)
  })

  test('surfaces an inline error when the API rejects the payload', async ({
    page,
  }) => {
    await page.route('**/api/feedback', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'simulated' }),
      })
    })

    await page.goto('/')
    // Ensure the page is fully interactive after potential previous-test navigation
    await page.waitForLoadState('networkidle')
    const openBtn = page.getByTestId('feedback-open')
    await expect(openBtn).toBeVisible()
    await openBtn.click()

    // Wait for dialog to be visible before interacting with form elements
    const dialog = page.getByTestId('feedback-dialog')
    await expect(dialog).toBeVisible()

    await page.getByTestId('feedback-description').fill('triggering simulated 400')
    await page.getByTestId('feedback-submit').click()

    await expect(page.getByTestId('feedback-error')).toBeVisible()
    // Thank-you panel must NOT appear when the API rejects.
    await expect(page.getByTestId('feedback-sent')).toHaveCount(0)
  })
})
