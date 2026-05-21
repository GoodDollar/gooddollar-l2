import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

describe('stocks route bundle budget tooling', () => {
  it('defines a dedicated stocks bundle check script and wires it into perf checks', () => {
    const scriptPath = join(process.cwd(), 'scripts', 'check-stocks-bundles.mjs')
    expect(existsSync(scriptPath)).toBe(true)

    const scriptBody = readFileSync(scriptPath, 'utf8')
    expect(scriptBody).toContain('/(app)/stocks/page')
    expect(scriptBody).toContain('/(app)/stocks/[ticker]/page')
    expect(scriptBody).toContain('/(app)/stocks/portfolio/page')

    const pkg = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8'))
    expect(pkg.scripts['check:stocks-bundles']).toBeTruthy()
    expect(pkg.scripts['check:perf']).toContain('check:stocks-bundles')
  })
})
