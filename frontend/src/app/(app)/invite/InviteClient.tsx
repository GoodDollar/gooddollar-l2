'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'

const TEMPLATE_TEXT = `🟢 You're invited to test GoodDollar L2 — The Good Chain

GoodDollar L2 is a DeFi chain where every transaction funds Universal Basic Income for real people.

We're looking for alpha testers to try the testnet and help us find bugs before launch.

What you'll do:
• Swap tokens on GoodSwap
• Open leveraged positions on GoodPerps
• Create or trade prediction markets
• Supply & borrow on GoodLend
• Mint stablecoins on GoodStable
• Give feedback to shape the product

Getting started:
1. Read the Testnet Guide → {{GUIDE_URL}}
2. Claim free test tokens from the Faucet → {{FAUCET_URL}}
3. Try the 5 guided test scenarios in the guide
4. Use the 💬 Feedback button in the app to report bugs or ideas

App: {{APP_URL}}

Every bug you find helps make UBI more robust. Thank you! 💚`

function getFilledTemplate() {
  const base =
    typeof window !== 'undefined' ? window.location.origin : 'https://goodswap.goodclaw.org'
  return TEMPLATE_TEXT.replace('{{GUIDE_URL}}', `${base}/testnet-guide`)
    .replace('{{FAUCET_URL}}', `${base}/faucet`)
    .replace('{{APP_URL}}', base)
}

export default function InviteClient() {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(getFilledTemplate())
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = getFilledTemplate()
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }, [])

  const filled = getFilledTemplate()

  return (
    <div className="min-h-screen px-4 py-12 max-w-2xl mx-auto">
      <div className="text-center mb-10">
        <span className="inline-block bg-accent/20 text-accent text-xs font-semibold px-3 py-1 rounded-full mb-4">
          Alpha Tester Program
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
          Invite Testers to GoodDollar L2
        </h1>
        <p className="text-gray-400 max-w-md mx-auto">
          Copy the invitation below and share it with your community — Discord, Telegram, email, or anywhere.
        </p>
      </div>

      <div className="rounded-2xl border border-dark-50 bg-dark-100/60 backdrop-blur overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-dark-50/50">
          <span className="text-sm font-medium text-gray-300">Invitation Template</span>
          <button
            onClick={handleCopy}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              copied
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-accent/20 text-accent border border-accent/30 hover:bg-accent/30'
            }`}
          >
            {copied ? '✓ Copied!' : '📋 Copy Invitation'}
          </button>
        </div>

        <pre className="px-5 py-4 text-sm text-gray-300 whitespace-pre-wrap leading-relaxed font-mono overflow-x-auto">
          {filled}
        </pre>
      </div>

      <div className="mt-8 grid sm:grid-cols-3 gap-4">
        <Link
          href="/testnet-guide"
          className="rounded-xl border border-dark-50 bg-dark-100/40 p-4 hover:border-accent/40 transition-colors group"
        >
          <div className="text-2xl mb-2">📖</div>
          <h3 className="text-white font-medium text-sm group-hover:text-accent transition-colors">
            Testnet Guide
          </h3>
          <p className="text-gray-500 text-xs mt-1">
            Full walkthrough with 5 test scenarios
          </p>
        </Link>
        <Link
          href="/faucet"
          className="rounded-xl border border-dark-50 bg-dark-100/40 p-4 hover:border-accent/40 transition-colors group"
        >
          <div className="text-2xl mb-2">🚰</div>
          <h3 className="text-white font-medium text-sm group-hover:text-accent transition-colors">
            Faucet
          </h3>
          <p className="text-gray-500 text-xs mt-1">
            Claim free G$ and WETH for testing
          </p>
        </Link>
        <Link
          href="/"
          className="rounded-xl border border-dark-50 bg-dark-100/40 p-4 hover:border-accent/40 transition-colors group"
        >
          <div className="text-2xl mb-2">💱</div>
          <h3 className="text-white font-medium text-sm group-hover:text-accent transition-colors">
            Start Trading
          </h3>
          <p className="text-gray-500 text-xs mt-1">
            Swap, perps, predict, lend & more
          </p>
        </Link>
      </div>

      <div className="mt-10 rounded-xl border border-dark-50 bg-dark-100/40 p-6">
        <h2 className="text-lg font-semibold text-white mb-3">Sharing Tips</h2>
        <ul className="space-y-2 text-sm text-gray-400">
          <li className="flex items-start gap-2">
            <span className="text-accent mt-0.5">•</span>
            <span>Post in your crypto Discord/Telegram channels with a personal note about why you&apos;re testing</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-accent mt-0.5">•</span>
            <span>Tag testers who are active in DeFi — they&apos;ll find the most bugs</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-accent mt-0.5">•</span>
            <span>Remind testers to use the 💬 Feedback button — every report helps</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-accent mt-0.5">•</span>
            <span>Link directly to the Testnet Guide so new testers can self-onboard</span>
          </li>
        </ul>
      </div>
    </div>
  )
}
