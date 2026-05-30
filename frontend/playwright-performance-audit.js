#!/usr/bin/env node

/**
 * Performance audit using Playwright
 * Measures Core Web Vitals and other performance metrics
 */

import { chromium } from 'playwright'
import { writeFileSync } from 'fs'

async function runPerformanceAudit() {
  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()

  const results = {}

  try {
    console.log('⚡ Running performance audit...')

    // Test homepage
    await testPagePerformance(page, 'Homepage', 'http://localhost:3100', results)

    // Test key pages
    await testPagePerformance(page, 'Explore', 'http://localhost:3100/explore', results)
    await testPagePerformance(page, 'Pool', 'http://localhost:3100/pool', results)
    await testPagePerformance(page, 'Faucet', 'http://localhost:3100/faucet', results)

    // Generate report
    const report = {
      timestamp: new Date().toISOString(),
      pages: results,
      summary: generateSummary(results)
    }

    writeFileSync('/home/goodclaw/gooddollar-l2/frontend/performance-audit-report.json',
                  JSON.stringify(report, null, 2))

    // Console summary
    console.log('\n📊 Performance Audit Results:')
    Object.entries(results).forEach(([pageName, metrics]) => {
      console.log(`\n${pageName}:`)
      console.log(`  📏 Load Time: ${metrics.loadTime}ms`)
      console.log(`  🖼️  First Paint: ${metrics.firstPaint}ms`)
      console.log(`  📝 First Contentful Paint: ${metrics.firstContentfulPaint}ms`)
      console.log(`  🎯 Largest Contentful Paint: ${metrics.largestContentfulPaint}ms`)
      console.log(`  ⚡ Time to Interactive: ${metrics.timeToInteractive}ms`)
      console.log(`  📦 Network Requests: ${metrics.networkRequests}`)
    })

    console.log('\n💡 Performance Score Summary:')
    console.log(report.summary)

  } catch (error) {
    console.error('❌ Error during audit:', error.message)
  } finally {
    await browser.close()
  }
}

async function testPagePerformance(page, pageName, url, results) {
  console.log(`Testing ${pageName}...`)

  const startTime = Date.now()

  // Navigate and wait for load
  await page.goto(url, { waitUntil: 'networkidle' })

  const loadTime = Date.now() - startTime

  // Get performance metrics
  const metrics = await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0]
    const paint = performance.getEntriesByType('paint')

    return {
      loadTime: navigation?.loadEventEnd - navigation?.navigationStart || 0,
      domContentLoaded: navigation?.domContentLoadedEventEnd - navigation?.navigationStart || 0,
      firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
      firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
      networkRequests: performance.getEntriesByType('resource').length
    }
  })

  // Get Largest Contentful Paint (LCP) via PerformanceObserver
  const lcpMetric = await page.evaluate(() => {
    return new Promise((resolve) => {
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1]
          resolve(lastEntry?.startTime || 0)
        })
        observer.observe({ entryTypes: ['largest-contentful-paint'] })

        // Timeout after 3 seconds
        setTimeout(() => resolve(0), 3000)
      } else {
        resolve(0)
      }
    })
  })

  // Estimate Time to Interactive (simplified)
  const ttiEstimate = Math.max(metrics.domContentLoaded, metrics.firstContentfulPaint) + 500

  results[pageName] = {
    loadTime: Math.round(loadTime),
    domContentLoaded: Math.round(metrics.domContentLoaded),
    firstPaint: Math.round(metrics.firstPaint),
    firstContentfulPaint: Math.round(metrics.firstContentfulPaint),
    largestContentfulPaint: Math.round(lcpMetric),
    timeToInteractive: Math.round(ttiEstimate),
    networkRequests: metrics.networkRequests
  }
}

function generateSummary(results) {
  const pages = Object.values(results)
  const avgLoadTime = pages.reduce((sum, p) => sum + p.loadTime, 0) / pages.length
  const avgFCP = pages.reduce((sum, p) => sum + p.firstContentfulPaint, 0) / pages.length
  const avgLCP = pages.reduce((sum, p) => sum + p.largestContentfulPaint, 0) / pages.length

  let score = 100

  // Scoring based on Core Web Vitals thresholds
  if (avgFCP > 1800) score -= 20  // Good FCP: < 1.8s
  if (avgLCP > 2500) score -= 30  // Good LCP: < 2.5s
  if (avgLoadTime > 3000) score -= 25  // Good Load Time: < 3s

  return {
    overallScore: Math.max(0, score),
    averageLoadTime: Math.round(avgLoadTime),
    averageFirstContentfulPaint: Math.round(avgFCP),
    averageLargestContentfulPaint: Math.round(avgLCP),
    grade: score >= 90 ? '🟢 Excellent' : score >= 70 ? '🟡 Good' : '🔴 Needs Improvement'
  }
}

runPerformanceAudit()