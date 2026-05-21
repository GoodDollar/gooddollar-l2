import { describe, it, expect } from 'vitest'
import registry from '@/lib/tests/e2eRegistry.json'

describe('E2E registry completeness', () => {
  const ids = registry.apps.map((a: { id: string }) => a.id)

  it('includes an analytics entry', () => {
    expect(ids).toContain('analytics')
    const entry = registry.apps.find((a: { id: string }) => a.id === 'analytics')
    expect(entry?.route).toBe('/analytics')
  })

  it('includes an invite entry', () => {
    expect(ids).toContain('invite')
    const entry = registry.apps.find((a: { id: string }) => a.id === 'invite')
    expect(entry?.route).toBe('/invite')
  })

  it('has at least 28 entries', () => {
    expect(registry.apps.length).toBeGreaterThanOrEqual(28)
  })

  it('every entry has required fields', () => {
    for (const app of registry.apps) {
      expect(app).toHaveProperty('id')
      expect(app).toHaveProperty('route')
      expect(app).toHaveProperty('titlePattern')
      expect(app).toHaveProperty('mustContain')
      expect(Array.isArray(app.mustContain)).toBe(true)
      expect(app.mustContain.length).toBeGreaterThan(0)
    }
  })

  it('has no duplicate ids', () => {
    const unique = new Set(ids)
    expect(unique.size).toBe(ids.length)
  })
})
