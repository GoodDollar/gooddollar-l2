'use client'

import { useState } from 'react'
import { DEVNET_RPC_URL, DEVNET_CHAIN_ID, DEVNET_EXPLORER_URL } from '@/lib/devnet'
import { AddNetworkButton } from '@/components/AddNetworkButton'
import { GITHUB_LINKS } from '@/lib/links'

const TOC = [
  { id: 'prerequisites', label: 'Prerequisites' },
  { id: 'add-network', label: 'Add GoodChain Testnet' },
  { id: 'get-tokens', label: 'Get Test G$' },
  { id: 'for-developers', label: 'For Developers' },
  { id: 'scenario-1', label: 'Scenario 1: First Swap' },
  { id: 'scenario-2', label: 'Scenario 2: Perps Position' },
  { id: 'scenario-3', label: 'Scenario 3: Prediction Market' },
  { id: 'scenario-4', label: 'Scenario 4: Lend & Borrow' },
  { id: 'scenario-5', label: 'Scenario 5: Mint gUSD' },
  { id: 'troubleshooting', label: 'Troubleshooting' },
  { id: 'feedback', label: 'Feedback' },
] as const

function CopyableCommand({ label, cmd }: { label: string; cmd: string }) {
  const [copied, setCopied] = useState(false)
  async function onCopy() {
    try {
      await navigator.clipboard.writeText(cmd)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard access denied (e.g. HTTP context). Silent — the
      // command is still visible/selectable in the <pre>.
    }
  }
  return (
    <div className="bg-dark-50 border border-white/10 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 bg-white/[0.02]">
        <span className="text-xs text-gray-400 font-medium">{label}</span>
        <button
          type="button"
          onClick={onCopy}
          aria-label={`Copy command: ${label}`}
          data-testid="copyable-command-copy"
          className="text-xs text-accent hover:text-white transition-colors px-2 py-0.5 rounded border border-accent/30 hover:bg-accent/10"
        >
          {copied ? 'Copied ✓' : 'Copy'}
        </button>
      </div>
      <pre className="px-3 py-3 text-xs text-gray-200 font-mono overflow-x-auto whitespace-pre-wrap break-all">
        {cmd}
      </pre>
    </div>
  )
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block bg-accent/20 text-accent text-xs font-semibold px-2 py-0.5 rounded-full">
      {children}
    </span>
  )
}

function StepList({ steps }: { steps: string[] }) {
  return (
    <ol className="list-decimal list-inside space-y-2 text-gray-300 ml-2">
      {steps.map((s, i) => (
        <li key={i} className="leading-relaxed">{s}</li>
      ))}
    </ol>
  )
}

function VerifyBox({ items }: { items: string[] }) {
  return (
    <div className="bg-accent/5 border border-accent/20 rounded-lg p-4 mt-3">
      <p className="text-accent text-sm font-semibold mb-2">✓ What to verify</p>
      <ul className="list-disc list-inside space-y-1 text-gray-400 text-sm">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  )
}

function ExpectedBox({ items }: { items: string[] }) {
  return (
    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-4 mt-3">
      <p className="text-emerald-400 text-sm font-semibold mb-2">Expected outcome</p>
      <ul className="list-disc list-inside space-y-1 text-gray-400 text-sm">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  )
}

function NetworkTable() {
  const rows: Array<[string, string]> = [
    ['Network Name', 'GoodChain Testnet'],
    ['RPC URL', DEVNET_RPC_URL],
    ['Chain ID', String(DEVNET_CHAIN_ID)],
    ['Currency', 'G$ (GoodDollar)'],
    ['Explorer', DEVNET_EXPLORER_URL],
  ]
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border border-white/10 rounded-lg overflow-hidden">
        <tbody>
          {rows.map(([k, v]) => (
            <tr key={k} className="border-b border-white/5">
              <td className="px-4 py-2 text-gray-400 font-medium bg-white/[0.02]">{k}</td>
              <td className="px-4 py-2 text-white font-mono text-sm">{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ScenarioCard({
  id,
  number,
  title,
  goal,
  steps,
  expected,
  verify,
  extra,
}: {
  id: string
  number: number
  title: string
  goal: string
  steps: string[]
  expected: string[]
  verify: string[]
  extra?: React.ReactNode
}) {
  const [open, setOpen] = useState(true)
  return (
    <section id={id} className="scroll-mt-20">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 text-left group"
      >
        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/20 text-accent text-sm font-bold flex items-center justify-center">
          {number}
        </span>
        <h3 className="text-xl font-bold text-white group-hover:text-accent transition-colors">
          {title}
        </h3>
        <span className="ml-auto text-gray-500 text-sm">{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <div className="ml-11 mt-3 space-y-4">
          <p className="text-gray-400 italic">{goal}</p>
          <div>
            <p className="text-sm text-gray-500 uppercase tracking-wide mb-2 font-semibold">Steps</p>
            <StepList steps={steps} />
          </div>
          <ExpectedBox items={expected} />
          <VerifyBox items={verify} />
          {extra}
        </div>
      )}
    </section>
  )
}

export default function TestnetGuidePage() {
  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="border-b border-white/10 bg-dark-50/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Badge>Alpha Testnet</Badge>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mt-3">
            GoodDollar L2 Testnet Guide
          </h1>
          <p className="text-gray-400 mt-2 max-w-2xl">
            Everything you need to connect, get test tokens, and try all 6 DeFi protocols.
            Follow the 5 guided scenarios below to explore the full platform.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-8 flex flex-col lg:flex-row gap-8">
        {/* Table of Contents — sticky sidebar on desktop */}
        <nav className="lg:w-56 flex-shrink-0">
          <div className="lg:sticky lg:top-20 bg-dark-50 rounded-xl p-4 space-y-1">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-2">Contents</p>
            {TOC.map(({ id, label }) => (
              <a
                key={id}
                href={`#${id}`}
                className="block text-sm text-gray-400 hover:text-accent py-1 transition-colors"
              >
                {label}
              </a>
            ))}
          </div>
        </nav>

        {/* Main content */}
        <main className="flex-1 space-y-12">
          {/* Prerequisites */}
          <section id="prerequisites" className="scroll-mt-20">
            <h2 className="text-2xl font-bold text-white mb-4">Prerequisites</h2>
            <ul className="list-disc list-inside text-gray-300 space-y-2">
              <li><strong>MetaMask</strong> (or any EVM-compatible wallet)</li>
              <li>A desktop browser (Chrome, Firefox, or Brave recommended)</li>
            </ul>
          </section>

          {/* Add Network */}
          <section id="add-network" className="scroll-mt-20">
            <h2 className="text-2xl font-bold text-white mb-4">1. Add GoodChain Testnet</h2>
            <div className="mb-5" data-testid="add-network-button-container">
              <AddNetworkButton
                successCta={{ label: 'Open Faucet →', href: '/faucet' }}
              />
              <p className="text-xs text-gray-500 mt-2">
                One click adds the network to MetaMask (or any EIP-1193 wallet)
                using the canonical values below.
              </p>
            </div>
            <NetworkTable />
            <div className="mt-4">
              <p className="text-sm text-gray-500 uppercase tracking-wide mb-2 font-semibold">
                Or add it manually
              </p>
              <StepList steps={[
                'Open MetaMask → Settings → Networks → Add Network',
                'Enter the network details from the table above',
                'Click Save — the network appears in your network selector',
              ]} />
            </div>
          </section>

          {/* Get Tokens */}
          <section id="get-tokens" className="scroll-mt-20">
            <h2 className="text-2xl font-bold text-white mb-4">2. Get Test G$</h2>
            <p className="text-gray-300 mb-3">
              Visit the <strong className="text-accent">Faucet</strong> page to claim free test tokens:
            </p>
            <StepList steps={[
              'Navigate to the Faucet page in the app',
              'Connect your wallet',
              'Click "Claim Test Tokens"',
              'You\'ll receive 10,000 G$ and 1 WETH',
            ]} />
          </section>

          {/* For Developers (iter 14) */}
          <section id="for-developers" className="scroll-mt-20">
            <h2 className="text-2xl font-bold text-white mb-4">For developers</h2>
            <p className="text-gray-300 mb-4">
              Verify the public RPC and look up canonical addresses without leaving the docs.
              Everything below points to the same registry the frontend uses at runtime.
            </p>
            <CopyableCommand
              label="Test the public RPC"
              cmd={`curl -sX POST ${DEVNET_RPC_URL} -H 'content-type: application/json' -d '{"jsonrpc":"2.0","method":"eth_blockNumber","id":1}'`}
            />
            <ul className="list-disc list-inside text-gray-300 space-y-2 mt-4">
              <li>
                Canonical contract addresses:{' '}
                <a
                  className="text-accent underline hover:text-white"
                  href={GITHUB_LINKS.addressesJson}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="dev-link-addresses"
                >
                  op-stack/addresses.json →
                </a>{' '}
                <span className="text-xs text-gray-500">
                  (single source of truth for the frontend, backend, and cast scripts)
                </span>
              </li>
              <li>
                System architecture &amp; protocol topology:{' '}
                <a
                  className="text-accent underline hover:text-white"
                  href={GITHUB_LINKS.architectureDoc}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="dev-link-architecture"
                >
                  docs/ARCHITECTURE.md →
                </a>
              </li>
              <li>
                GitHub-facing testnet entry point:{' '}
                <a
                  className="text-accent underline hover:text-white"
                  href={GITHUB_LINKS.testnetReadme}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="dev-link-testnet-readme"
                >
                  docs/TESTNET_README.md →
                </a>
              </li>
            </ul>
          </section>

          {/* Divider */}
          <div className="border-t border-white/10 pt-4">
            <h2 className="text-2xl font-bold text-white">Guided Test Scenarios</h2>
            <p className="text-gray-400 mt-1">Follow these 5 scenarios to test every protocol.</p>
          </div>

          {/* Scenario 1 */}
          <ScenarioCard
            id="scenario-1"
            number={1}
            title="First Swap (WETH → G$)"
            goal="Execute your first token swap on GoodSwap."
            steps={[
              'Navigate to Swap (top nav)',
              'Select WETH as the input token',
              'Enter 0.1 WETH',
              'Select G$ as the output token',
              'Click Swap and confirm in MetaMask',
            ]}
            expected={[
              'Your WETH balance decreases by 0.1',
              'Your G$ balance increases (amount shown in preview)',
              'A success toast appears with the transaction hash',
              'UBI fee counter on the UBI Impact page increments',
            ]}
            verify={[
              'Check the transaction on the explorer',
              'Verify the UBI fee was routed (33% of swap fee → UBI)',
            ]}
          />

          {/* Scenario 2 */}
          <ScenarioCard
            id="scenario-2"
            number={2}
            title="Open a Perps Position (Long BTC)"
            goal="Deposit margin and open a leveraged BTC long position."
            steps={[
              'Navigate to Perps',
              'Click Deposit Margin',
              'Enter 1000 G$ and confirm',
              'Select the BTC/USD market',
              'Choose Long, set leverage to 2x',
              'Enter position size: 500 G$',
              'Click Open Position and confirm',
            ]}
            expected={[
              'Margin account shows 1000 G$ deposited',
              'An open position appears: BTC Long, 2x leverage, 500 G$ size',
              'Entry price matches the current oracle price',
              'Funding rate is displayed',
            ]}
            verify={[
              'Position details match your inputs',
              'Wait 1 minute — verify funding accrues',
              'Close the position and verify PnL calculation',
            ]}
          />

          {/* Scenario 3 */}
          <ScenarioCard
            id="scenario-3"
            number={3}
            title="Create a Prediction Market"
            goal="Create a binary prediction market and place a bet."
            steps={[
              'Navigate to Predict',
              'Click Create Market',
              'Enter question: "Will ETH be above $4000 by end of month?"',
              'Set end date to 7 days from now',
              'Deposit 100 G$ as initial collateral',
              'Confirm market creation',
            ]}
            expected={[
              'A new market card appears on the Predict page',
              'Market shows your question, end date, and initial odds (50/50)',
            ]}
            verify={[
              'G$ balance decreased by 100',
              'Choose YES on the market and bet 50 G$',
              'Market odds shift from 50/50 after your bet',
            ]}
          />

          {/* Scenario 4 */}
          <ScenarioCard
            id="scenario-4"
            number={4}
            title="Supply to GoodLend & Borrow"
            goal="Supply G$ to earn interest, then borrow WETH against your collateral."
            steps={[
              'Navigate to Lend',
              'Click Supply on the G$ market',
              'Enter 5000 G$ and confirm',
              'You receive gGD tokens (receipt tokens)',
              'Click Borrow on the WETH market',
              'Enter 0.1 WETH and confirm',
            ]}
            expected={[
              'Supply appears in dashboard with APY (e.g., 3.8%)',
              'WETH borrow appears with borrow APY',
              'Health factor shown (should be > 1.5)',
            ]}
            verify={[
              'gGD token balance matches your supply',
              'Borrow limit reflects your collateral value',
              'After 1 block, interest accrues on supply and borrow',
            ]}
          />

          {/* Scenario 5 */}
          <ScenarioCard
            id="scenario-5"
            number={5}
            title="Mint GoodStable (gUSD)"
            goal="Deposit collateral and mint the stablecoin gUSD."
            steps={[
              'Navigate to Stable',
              'Click Mint gUSD',
              'Select WETH as collateral',
              'Enter 0.5 WETH',
              'Review the mint amount (~750 gUSD at 150% ratio)',
              'Click Mint and confirm',
            ]}
            expected={[
              'WETH balance decreases by 0.5',
              'gUSD balance increases',
              'A vault position shows your collateral ratio (≥ 150%)',
            ]}
            verify={[
              'Vault details page shows correct collateral and debt',
              'Try repaying some gUSD to reduce your debt',
              'Collateral ratio updates in real time',
            ]}
          />

          {/* Troubleshooting */}
          <section id="troubleshooting" className="scroll-mt-20">
            <h2 className="text-2xl font-bold text-white mb-4">Troubleshooting</h2>
            <div className="space-y-4">
              {[
                {
                  q: '"Transaction reverted" error',
                  a: 'Ensure you have enough G$ for the transaction + gas. Check token approvals are set. Try refreshing and reconnecting.',
                },
                {
                  q: 'Wallet not connecting',
                  a: 'Verify you\'re on GoodChain Testnet (chain ID 42069). Try disconnecting and reconnecting. Clear MetaMask cache: Settings → Advanced → Reset Account.',
                },
                {
                  q: 'Prices showing $0 or stale',
                  a: 'The oracle keeper may be syncing — wait 30 seconds and refresh. Check the Status page to verify oracle services are running.',
                },
                {
                  q: '"Insufficient balance" error',
                  a: 'Visit the Faucet page to claim more test tokens. Some protocols require approval transactions first.',
                },
              ].map(({ q, a }) => (
                <div key={q} className="bg-dark-50 rounded-lg p-4">
                  <p className="text-white font-medium">{q}</p>
                  <p className="text-gray-400 text-sm mt-1">{a}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Feedback */}
          <section id="feedback" className="scroll-mt-20">
            <h2 className="text-2xl font-bold text-white mb-4">Feedback</h2>
            <p className="text-gray-300">
              Found a bug or have a suggestion? Use the{' '}
              <strong className="text-accent">Feedback</strong> button in the bottom-right corner
              of every page, or{' '}
              <a
                className="text-accent underline hover:text-white"
                href={GITHUB_LINKS.newTestnetIssue}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="feedback-github-link"
              >
                open an issue on GitHub →
              </a>
              .
            </p>
            <p className="text-gray-400 text-sm mt-3">
              Thank you for testing GoodDollar L2! Your feedback directly shapes the protocol.
            </p>
          </section>
        </main>
      </div>
    </div>
  )
}
