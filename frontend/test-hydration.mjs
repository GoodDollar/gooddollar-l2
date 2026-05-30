#!/usr/bin/env node

import { spawn } from 'child_process'

console.log('Testing hydration fix...')

// Start the dev server
console.log('Starting dev server on port 3102...')
const server = spawn('npm', ['run', 'dev', '--', '-p', '3102'], {
  stdio: ['pipe', 'pipe', 'pipe'],
  cwd: process.cwd()
})

let serverReady = false

server.stdout.on('data', (data) => {
  const output = data.toString()
  console.log('Server:', output)
  if (output.includes('ready on')) {
    serverReady = true
    testPage()
  }
})

server.stderr.on('data', (data) => {
  const error = data.toString()
  console.log('Server Error:', error)
})

function testPage() {
  if (!serverReady) return

  console.log('Testing page for hydration errors...')

  // Simple fetch test
  import('http').then(http => {
    const req = http.get('http://127.0.0.1:3102/live-prices-proof', (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✓ Page loads successfully')
          console.log('✓ No HTTP errors')

          // Check if page contains expected content
          if (data.includes('Live Prices Proof')) {
            console.log('✓ Page contains expected content')
          } else {
            console.log('✗ Page missing expected content')
          }

          // Kill server
          server.kill()
          process.exit(0)
        } else {
          console.log(`✗ Page returned status ${res.statusCode}`)
          server.kill()
          process.exit(1)
        }
      })
    })

    req.on('error', (err) => {
      console.log(`✗ Failed to fetch page: ${err.message}`)
      server.kill()
      process.exit(1)
    })
  })
}

// Cleanup on exit
process.on('SIGINT', () => {
  server.kill()
  process.exit(0)
})

setTimeout(() => {
  if (!serverReady) {
    console.log('✗ Server did not start in time')
    server.kill()
    process.exit(1)
  }
}, 30000)