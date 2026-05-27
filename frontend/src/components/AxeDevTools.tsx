'use client'

import { useEffect } from 'react'

/**
 * Initializes @axe-core/react in development to log WCAG violations to the console.
 * Rendered in layout.tsx — no-ops in production.
 */
export function AxeDevTools() {
  useEffect(() => {
    // Skip axe-core during E2E tests: axe violations are logged via
    // console.error which triggers the Next.js dev error overlay and
    // causes false positive nextjs-portal failures. Dedicated accessibility
    // coverage lives in e2e/accessibility.spec.ts.
    if (
      process.env.NODE_ENV !== 'production' &&
      process.env.NEXT_PUBLIC_E2E !== '1'
    ) {
      import('@axe-core/react').then(axe => {
        const React = require('react')
        const ReactDOM = require('react-dom')
        axe.default(React, ReactDOM, 1000)
      })
    }
  }, [])

  return null
}
