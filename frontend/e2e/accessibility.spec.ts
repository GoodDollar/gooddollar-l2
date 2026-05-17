import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const pages = [
  { name: 'Home', path: '/' },
  { name: 'Explore', path: '/explore' },
  { name: 'Perps', path: '/perps' },
  { name: 'Predict', path: '/predict' },
  { name: 'Lend', path: '/lend' },
  { name: 'Stable', path: '/stable' },
  { name: 'Stocks', path: '/stocks' },
  { name: 'Portfolio', path: '/portfolio' },
  { name: 'Governance', path: '/governance' },
  { name: 'Agents', path: '/agents' },
  { name: 'UBI Impact', path: '/ubi-impact' },
  { name: 'Bridge', path: '/bridge' },
  { name: 'Pool', path: '/pool' },
  { name: 'Yield', path: '/yield' },
]

for (const { name, path } of pages) {
  test(`${name} (${path}) — no critical or serious a11y violations`, async ({ page }) => {
    await page.goto(path, { waitUntil: 'networkidle' })
    await page.waitForTimeout(1000)

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()

    const critical = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    )

    if (critical.length > 0) {
      const report = critical.map((v) => ({
        id: v.id,
        impact: v.impact,
        description: v.description,
        nodes: v.nodes.length,
        targets: v.nodes.slice(0, 3).map((n) => n.target.join(' ')),
      }))
      console.log(`\n[${name}] Critical/Serious violations:\n${JSON.stringify(report, null, 2)}`)
    }

    expect(critical, `${name} has ${critical.length} critical/serious a11y violations`).toHaveLength(0)
  })
}
