import { test, expect } from '@playwright/test'

test.describe('Mobile horizontal overflow (GOO-2860)', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  const routes = [
    { path: '/', name: 'homepage (where /swap redirects)' },
    { path: '/explore', name: 'explore page' },
    { path: '/pool', name: 'pool page' },
    { path: '/faucet', name: 'faucet page' },
  ]

  for (const route of routes) {
    test(`${route.name} should not have horizontal scroll at 375px`, async ({ page }) => {
      await page.goto(route.path)
      // Wait for page to settle and dynamic content to load
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1000) // Additional wait for dynamic content

      // Primary check: body.scrollWidth should not exceed window.innerWidth
      const overflow = await page.evaluate(() => {
        const bodyScrollWidth = document.body.scrollWidth
        const windowWidth = window.innerWidth
        return {
          bodyScrollWidth,
          windowWidth,
          hasOverflow: bodyScrollWidth > windowWidth + 5, // 5px tolerance
          overflowAmount: bodyScrollWidth - windowWidth,
        }
      })

      console.log(`${route.path} overflow check:`, JSON.stringify(overflow))

      // Find offending elements if there's overflow
      if (overflow.hasOverflow) {
        const offenders = await page.evaluate(() => {
          const elements: Array<{ tag: string; id: string; className: string; right: number; width: number }> = []
          const allElements = document.querySelectorAll('*')
          const vw = window.innerWidth

          allElements.forEach((el) => {
            const rect = el.getBoundingClientRect()
            if (rect.right > vw + 5) { // 5px tolerance
              const htmlEl = el as HTMLElement
              elements.push({
                tag: htmlEl.tagName,
                id: htmlEl.id,
                className: htmlEl.className?.toString().slice(0, 120),
                right: Math.round(rect.right),
                width: Math.round(rect.width),
              })
            }
          })
          return elements.slice(0, 10) // top 10 offenders
        })

        console.log(`${route.path} offending elements:`, JSON.stringify(offenders, null, 2))
      }

      expect(
        overflow.hasOverflow,
        `Horizontal overflow on ${route.path}: body.scrollWidth (${overflow.bodyScrollWidth}px) > window.innerWidth (${overflow.windowWidth}px) by ${overflow.overflowAmount}px`
      ).toBe(false)
    })
  }

  // Test that /lend continues to pass (as mentioned it should)
  test('/lend should not have horizontal scroll (should continue to pass)', async ({ page }) => {
    await page.goto('/lend')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    const overflow = await page.evaluate(() => {
      const bodyScrollWidth = document.body.scrollWidth
      const windowWidth = window.innerWidth
      return {
        bodyScrollWidth,
        windowWidth,
        hasOverflow: bodyScrollWidth > windowWidth + 5,
        overflowAmount: bodyScrollWidth - windowWidth,
      }
    })

    console.log('/lend overflow check:', JSON.stringify(overflow))

    expect(
      overflow.hasOverflow,
      `Horizontal overflow on /lend: body.scrollWidth (${overflow.bodyScrollWidth}px) > window.innerWidth (${overflow.windowWidth}px) by ${overflow.overflowAmount}px`
    ).toBe(false)
  })
})