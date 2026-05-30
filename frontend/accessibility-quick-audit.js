#!/usr/bin/env node

/**
 * Quick accessibility audit using Playwright + axe-core
 * Generates detailed report for the homepage
 */

import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'
import { writeFileSync } from 'fs'

async function runAccessibilityAudit() {
  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()

  try {
    console.log('🔍 Running accessibility audit on homepage...')

    // Navigate to homepage
    await page.goto('http://localhost:3100')
    await page.waitForLoadState('networkidle')

    // Run comprehensive axe scan
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'])
      .analyze()

    // Generate report
    const report = {
      url: 'http://localhost:3100',
      timestamp: new Date().toISOString(),
      summary: {
        violations: results.violations.length,
        passes: results.passes.length,
        incomplete: results.incomplete.length,
        inapplicable: results.inapplicable.length
      },
      violations: results.violations.map(violation => ({
        id: violation.id,
        description: violation.description,
        impact: violation.impact,
        tags: violation.tags,
        help: violation.help,
        helpUrl: violation.helpUrl,
        nodes: violation.nodes.map(node => ({
          target: node.target,
          html: node.html,
          failureSummary: node.failureSummary
        }))
      }))
    }

    // Save detailed report
    writeFileSync('/home/goodclaw/gooddollar-l2/frontend/accessibility-audit-report.json',
                  JSON.stringify(report, null, 2))

    // Console summary
    console.log('\n📊 Accessibility Audit Results:')
    console.log(`✅ Passes: ${results.passes.length}`)
    console.log(`❌ Violations: ${results.violations.length}`)
    console.log(`⚠️  Incomplete: ${results.incomplete.length}`)
    console.log(`ℹ️  Inapplicable: ${results.inapplicable.length}`)

    if (results.violations.length > 0) {
      console.log('\n🚨 Critical Issues Found:')
      results.violations.forEach((violation, index) => {
        console.log(`\n${index + 1}. ${violation.id} (${violation.impact})`)
        console.log(`   Description: ${violation.description}`)
        console.log(`   Help: ${violation.help}`)
        violation.nodes.forEach((node, nodeIndex) => {
          console.log(`   Target ${nodeIndex + 1}: ${node.target.join(', ')}`)
        })
      })
    } else {
      console.log('\n🎉 No accessibility violations found!')
    }

  } catch (error) {
    console.error('❌ Error during audit:', error.message)
  } finally {
    await browser.close()
  }
}

runAccessibilityAudit()