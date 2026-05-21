import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

describe('stocks detail progressive loading', () => {
  it('defers non-critical detail modules behind dynamic imports', () => {
    const pagePath = join(process.cwd(), 'src', 'app', '(app)', 'stocks', '[ticker]', 'page.tsx')
    const src = readFileSync(pagePath, 'utf8')

    expect(src).toContain('const DeferredAnalystOutlookCard = dynamic(')
    expect(src).toContain('const DeferredNewsEventsPanel = dynamic(')
    expect(src).toContain('const DeferredRelatedMoversPanel = dynamic(')
  })
})
