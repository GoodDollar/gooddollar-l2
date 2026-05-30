import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

// Accessibility audit for all major pages
const pages = [
  { name: 'Homepage', url: '/' },
  { name: 'Explore', url: '/explore' },
  { name: 'Pool', url: '/pool' },
  { name: 'Faucet', url: '/faucet' },
  { name: 'Lend', url: '/lend' },
  { name: 'Portfolio', url: '/portfolio' },
  { name: 'Stocks', url: '/stocks' },
  { name: 'Predict', url: '/predict' }
]

pages.forEach(({ name, url }) => {
  test(`${name} - WCAG AA Compliance`, async ({ page }) => {
    // Navigate to page
    await page.goto(url)

    // Wait for page to load completely
    await page.waitForLoadState('networkidle')

    // Run axe-core accessibility scan
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()

    // Report violations
    if (accessibilityScanResults.violations.length > 0) {
      console.log(`${name} Accessibility Violations:`)
      accessibilityScanResults.violations.forEach((violation) => {
        console.log(`- ${violation.id}: ${violation.description}`)
        violation.nodes.forEach((node) => {
          console.log(`  Target: ${node.target}`)
          console.log(`  HTML: ${node.html.substring(0, 100)}...`)
        })
      })
    }

    // Assert no violations
    expect(accessibilityScanResults.violations).toEqual([])
  })
})

test('Color Contrast - All Text Elements', async ({ page }) => {
  await page.goto('/')
  await page.waitForLoadState('networkidle')

  const contrastResults = await new AxeBuilder({ page })
    .withTags(['wcag2aa'])
    .withRules(['color-contrast'])
    .analyze()

  expect(contrastResults.violations).toEqual([])
})

test('Keyboard Navigation - Focus Management', async ({ page }) => {
  await page.goto('/')
  await page.waitForLoadState('networkidle')

  // Test tab navigation
  await page.keyboard.press('Tab')
  const focusedElement = await page.locator(':focus')
  expect(await focusedElement.count()).toBe(1)

  // Run focus management rules
  const focusResults = await new AxeBuilder({ page })
    .withTags(['wcag2a'])
    .withRules(['focus-order-semantics', 'tabindex'])
    .analyze()

  expect(focusResults.violations).toEqual([])
})

test('ARIA Labels and Roles', async ({ page }) => {
  await page.goto('/')
  await page.waitForLoadState('networkidle')

  const ariaResults = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .withRules(['aria-allowed-attr', 'aria-required-attr', 'aria-valid-attr-value', 'button-name', 'link-name'])
    .analyze()

  expect(ariaResults.violations).toEqual([])
})

test('Images and Media - Alternative Text', async ({ page }) => {
  await page.goto('/')
  await page.waitForLoadState('networkidle')

  const imageResults = await new AxeBuilder({ page })
    .withRules(['image-alt', 'object-alt', 'svg-img-alt'])
    .analyze()

  expect(imageResults.violations).toEqual([])
})