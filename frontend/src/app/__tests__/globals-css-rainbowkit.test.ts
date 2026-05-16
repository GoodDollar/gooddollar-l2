import fs from 'node:fs'
import path from 'node:path'
import { describe, it, expect } from 'vitest'

/**
 * Regression guard for task 0043.
 *
 * RainbowKit injects an unstyled `<div data-rk="">` wrapper around its children.
 * Inside our `<PageTransition>` flex container (`align-items: center`) it
 * collapses to its intrinsic content width, which shrinks every page wrapped by
 * `WalletProviders` (the entire `(app)` route group) and the landing page (via
 * `LandingSwapCard`). The fix is a global CSS rule in `globals.css` that forces
 * the wrapper to fill its parent and behave as a column flex container so
 * page-level `max-w-5xl` containers work as intended.
 *
 * If this test fails, the layout fix has been removed or broken — check
 * `frontend/src/app/globals.css` for the `[data-rk]` rule.
 */
describe('globals.css — RainbowKit data-rk wrapper fix', () => {
  const cssPath = path.resolve(__dirname, '../globals.css')
  const css = fs.readFileSync(cssPath, 'utf8')

  // Strip comments so we don't get false positives from documentation comments
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '')

  it('contains a [data-rk] selector rule', () => {
    expect(stripped).toMatch(/\[data-rk\]\s*\{/)
  })

  it('forces the data-rk wrapper to fill the available width', () => {
    // Extract just the [data-rk] block
    const match = stripped.match(/\[data-rk\]\s*\{([^}]*)\}/)
    expect(match).not.toBeNull()
    const block = match![1]
    expect(block).toMatch(/width\s*:\s*100%/)
  })

  it('makes the data-rk wrapper a column flex container that grows', () => {
    const match = stripped.match(/\[data-rk\]\s*\{([^}]*)\}/)
    expect(match).not.toBeNull()
    const block = match![1]
    expect(block).toMatch(/display\s*:\s*flex/)
    expect(block).toMatch(/flex-direction\s*:\s*column/)
    // `flex: 1 1 auto` allows the wrapper to grow inside the parent flex column
    // (which is `flex-1 flex flex-col items-center` in the root `<main>`).
    expect(block).toMatch(/flex\s*:\s*1\s+1\s+auto/)
  })
})
