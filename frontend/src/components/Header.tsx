'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Menu, X, ChevronDown } from 'lucide-react'
import { WalletButton } from './WalletButton'
import { WalletButtonConnected } from './WalletButtonConnected'
import { useWalletReady } from '@/lib/WalletReadyContext'
import { ActivityButton } from './ActivityButton'
import { ThemeToggle } from './ThemeToggle'

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const walletReady = useWalletReady()
  const isSwap = pathname === '/'
  const isExplore = pathname === '/explore'
  const isPool = pathname === '/pool'
  const isBridge = pathname === '/bridge'
  const isStable = pathname?.startsWith('/stable')
  const isStocks = pathname?.startsWith('/stocks')
  const isPredict = pathname?.startsWith('/predict')
  const isPerps = pathname?.startsWith('/perps')
  const isLend = pathname?.startsWith('/lend')
  const isYield = pathname?.startsWith('/yield')
  const isGovernance = pathname?.startsWith('/governance')
  const isUBIImpact = pathname?.startsWith('/ubi-impact')
  const isAgents = pathname?.startsWith('/agents')
  const isActivity = pathname?.startsWith('/activity')
  // `/analytics` and any descendant route (e.g. `/analytics/hedge/proof/*`)
  // light up the same nav entry so a user on a sub-route still sees the
  // active section (#0079). Mirrors the existing `isStocks` pattern.
  const isAnalytics = pathname?.startsWith('/analytics')
  const isTestDashboard = pathname?.startsWith('/test-dashboard')
  const isTestnetGuide = pathname?.startsWith('/testnet-guide')
  const isFaucet = pathname?.startsWith('/faucet')
  const isInvite = pathname?.startsWith('/invite')
  const isPortfolio = pathname === '/portfolio'
  const isProof = pathname?.startsWith('/live-prices-proof') || pathname?.startsWith('/proof')
  // Internal QA dashboard link is hidden in production. Devs/QA can enable
  // it locally with NEXT_PUBLIC_SHOW_DEV_NAV=1. The /test-dashboard route
  // itself remains reachable via direct URL. See task 0070.
  const showDevNav = process.env.NEXT_PUBLIC_SHOW_DEV_NAV === '1'

  useEffect(() => {
    if (!mobileMenuOpen) return

    document.body.style.overflow = 'hidden'

    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setMobileMenuOpen(false)
    }
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handleEscape)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [mobileMenuOpen])

  return (
    <header className="w-full border-b border-white/[0.08] bg-etoro-afterhours/85 shadow-[0_8px_32px_rgba(0,0,0,0.22)] backdrop-blur-xl relative z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 h-16">
        <div className="flex min-w-0 items-center gap-2">
          <div className="w-8 h-8 shrink-0 rounded-full bg-goodgreen flex items-center justify-center font-bold text-etoro-afterhours text-sm shadow-[0_0_20px_rgba(19,198,54,0.25)]">
            G$
          </div>
          <span className="hidden sm:inline text-lg font-semibold tracking-[-0.02em] text-etoro-intelligence">GoodDollar</span>
        </div>

        <nav aria-label="Primary" className="hidden 2xl:flex items-center gap-5 text-sm text-etoro-intelligence/60">
          <Link prefetch={false} href="/" className={isSwap ? 'text-white font-medium' : 'hover:text-white transition-colors'}>Swap</Link>
          <Link prefetch={false} href="/explore" className={isExplore ? 'text-white font-medium' : 'hover:text-white transition-colors'}>Explore</Link>
          <Link prefetch={false} href="/pool" className={`flex items-center gap-1.5 ${isPool ? 'text-white font-medium' : 'hover:text-white transition-colors'}`}>
            Pool
            <span data-testid="soon-badge" className="px-1.5 py-0.5 text-[10px] font-medium bg-orange-500/20 text-orange-400 rounded border border-orange-500/30">
              Soon
            </span>
          </Link>
          <Link prefetch={false} href="/bridge" className={`flex items-center gap-1.5 ${isBridge ? 'text-white font-medium' : 'hover:text-white transition-colors'}`}>
            Bridge
            <span data-testid="soon-badge" className="px-1.5 py-0.5 text-[10px] font-medium bg-orange-500/20 text-orange-400 rounded border border-orange-500/30">
              Soon
            </span>
          </Link>
          <Link prefetch={false} href="/stocks" className={isStocks ? 'text-white font-medium' : 'hover:text-white transition-colors'}>Stocks</Link>
          <Link prefetch={false} href="/predict" className={isPredict ? 'text-white font-medium' : 'hover:text-white transition-colors'}>Predict</Link>
          <Link prefetch={false} href="/perps" className={isPerps ? 'text-white font-medium' : 'hover:text-white transition-colors'}>Perps</Link>
          <Link prefetch={false} href="/lend" className={isLend ? 'text-white font-medium' : 'hover:text-white transition-colors'}>Lend</Link>
          <Link prefetch={false} href="/stable" className={isStable ? 'text-white font-medium' : 'hover:text-white transition-colors'}>Stable</Link>
          <Link prefetch={false} href="/yield" className={isYield ? 'text-white font-medium' : 'hover:text-white transition-colors'}>Yield</Link>
          <Link prefetch={false} href="/governance" className={isGovernance ? 'text-white font-medium' : 'hover:text-white transition-colors'}>Govern</Link>
          <Link prefetch={false} href="/agents" className={isAgents ? 'text-white font-medium' : 'hover:text-white transition-colors'}>Agents</Link>
          <Link prefetch={false} href="/ubi-impact" className={isUBIImpact ? 'text-goodgreen font-medium' : 'text-goodgreen/60 hover:text-goodgreen transition-colors'}>UBI</Link>
          <Link prefetch={false} href="/activity" className={isActivity ? 'text-goodgreen font-medium' : 'text-goodgreen/60 hover:text-goodgreen transition-colors'}>
            <span className="flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-goodgreen animate-pulse" />
              Activity
            </span>
          </Link>
          <Link
            prefetch={false}
            href="/analytics"
            aria-current={isAnalytics ? 'page' : undefined}
            className={isAnalytics ? 'text-white font-medium' : 'hover:text-white transition-colors'}
          >
            Analytics
          </Link>
          <span className="w-px h-4 bg-white/10" />
          <Link prefetch={false} href="/faucet" className={isFaucet ? 'text-accent font-medium' : 'text-accent/60 hover:text-accent transition-colors'}>Faucet</Link>
          <Link prefetch={false} href="/testnet-guide" className={isTestnetGuide ? 'text-accent font-medium' : 'text-accent/60 hover:text-accent transition-colors'}>Guide</Link>
          <Link prefetch={false} href="/live-prices-proof" className={isProof ? 'text-accent font-medium' : 'text-accent/60 hover:text-accent transition-colors'} data-testid="nav-proof">Proof</Link>
          <Link prefetch={false} href="/invite" className={isInvite ? 'text-accent font-medium' : 'text-accent/60 hover:text-accent transition-colors'}>Invite</Link>
        </nav>

        <nav data-testid="condensed-nav" aria-label="Primary condensed" className="hidden lg:flex 2xl:hidden items-center gap-3 text-sm text-etoro-intelligence/60">
          <Link prefetch={false} href="/" className={isSwap ? 'text-white font-medium' : 'hover:text-white transition-colors'}>Swap</Link>
          <Link prefetch={false} href="/stocks" className={isStocks ? 'text-white font-medium' : 'hover:text-white transition-colors'}>Stocks</Link>
          <Link prefetch={false} href="/perps" className={isPerps ? 'text-white font-medium' : 'hover:text-white transition-colors'}>Perps</Link>
          <Link prefetch={false} href="/predict" className={isPredict ? 'text-white font-medium' : 'hover:text-white transition-colors'}>Predict</Link>
          <Link prefetch={false} href="/lend" className={isLend ? 'text-white font-medium' : 'hover:text-white transition-colors'}>Lend</Link>
          <Link
            prefetch={false}
            href="/analytics"
            aria-current={isAnalytics ? 'page' : undefined}
            className={isAnalytics ? 'text-white font-medium' : 'hover:text-white transition-colors'}
          >
            Analytics
          </Link>
          <details className="relative group">
            <summary className="list-none cursor-pointer flex items-center gap-1 hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-goodgreen/50 focus-visible:outline-none rounded-md px-1">
              More
              <ChevronDown className="w-3.5 h-3.5 transition-transform group-open:rotate-180" />
            </summary>
            <div className="absolute right-0 top-full mt-3 w-48 rounded-2xl border border-white/[0.10] bg-etoro-carbon/95 shadow-xl shadow-black/30 backdrop-blur-xl p-2 z-50">
              <Link prefetch={false} href="/explore" className={`block px-3 py-2 rounded-lg ${isExplore ? 'text-white bg-dark-50/50 font-medium' : 'text-gray-400 hover:text-white hover:bg-dark-50/50'}`}>Explore</Link>
              <Link prefetch={false} href="/pool" className={`flex items-center justify-between px-3 py-2 rounded-lg ${isPool ? 'text-white bg-dark-50/50 font-medium' : 'text-gray-400 hover:text-white hover:bg-dark-50/50'}`}>
                Pool
                <span className="text-[10px] text-orange-400">Soon</span>
              </Link>
              <Link prefetch={false} href="/bridge" className={`flex items-center justify-between px-3 py-2 rounded-lg ${isBridge ? 'text-white bg-dark-50/50 font-medium' : 'text-gray-400 hover:text-white hover:bg-dark-50/50'}`}>
                Bridge
                <span className="text-[10px] text-orange-400">Soon</span>
              </Link>
              <Link prefetch={false} href="/stable" className={`block px-3 py-2 rounded-lg ${isStable ? 'text-white bg-dark-50/50 font-medium' : 'text-gray-400 hover:text-white hover:bg-dark-50/50'}`}>Stable</Link>
              <Link prefetch={false} href="/yield" className={`block px-3 py-2 rounded-lg ${isYield ? 'text-white bg-dark-50/50 font-medium' : 'text-gray-400 hover:text-white hover:bg-dark-50/50'}`}>Yield</Link>
              <Link prefetch={false} href="/governance" className={`block px-3 py-2 rounded-lg ${isGovernance ? 'text-white bg-dark-50/50 font-medium' : 'text-gray-400 hover:text-white hover:bg-dark-50/50'}`}>Govern</Link>
              <Link prefetch={false} href="/agents" className={`block px-3 py-2 rounded-lg ${isAgents ? 'text-white bg-dark-50/50 font-medium' : 'text-gray-400 hover:text-white hover:bg-dark-50/50'}`}>Agents</Link>
              <Link prefetch={false} href="/ubi-impact" className={`block px-3 py-2 rounded-lg ${isUBIImpact ? 'text-goodgreen bg-dark-50/50 font-medium' : 'text-goodgreen/70 hover:text-goodgreen hover:bg-dark-50/50'}`}>UBI</Link>
              <Link prefetch={false} href="/activity" className={`block px-3 py-2 rounded-lg ${isActivity ? 'text-goodgreen bg-dark-50/50 font-medium' : 'text-goodgreen/70 hover:text-goodgreen hover:bg-dark-50/50'}`}>Activity</Link>
              <Link
                prefetch={false}
                href="/analytics"
                aria-current={isAnalytics ? 'page' : undefined}
                className={`block px-3 py-2 rounded-lg ${isAnalytics ? 'text-white bg-dark-50/50 font-medium' : 'text-gray-400 hover:text-white hover:bg-dark-50/50'}`}
              >
                Analytics
              </Link>
              <div className="border-t border-dark-50/50 my-1" />
              <Link prefetch={false} href="/faucet" className={`block px-3 py-2 rounded-lg ${isFaucet ? 'text-accent bg-accent/10 font-medium' : 'text-accent/70 hover:text-accent hover:bg-dark-50/50'}`}>Faucet</Link>
              <Link prefetch={false} href="/testnet-guide" className={`block px-3 py-2 rounded-lg ${isTestnetGuide ? 'text-accent bg-accent/10 font-medium' : 'text-accent/70 hover:text-accent hover:bg-dark-50/50'}`}>Guide</Link>
              <Link prefetch={false} href="/live-prices-proof" className={`block px-3 py-2 rounded-lg ${isProof ? 'text-accent bg-accent/10 font-medium' : 'text-accent/70 hover:text-accent hover:bg-dark-50/50'}`}>Proof</Link>
              <Link prefetch={false} href="/invite" className={`block px-3 py-2 rounded-lg ${isInvite ? 'text-accent bg-accent/10 font-medium' : 'text-accent/70 hover:text-accent hover:bg-dark-50/50'}`}>Invite</Link>
            </div>
          </details>
        </nav>

        <div className="flex items-center gap-2">
          <Link prefetch={false} href="/portfolio"
            aria-label="Portfolio"
            className={`p-2 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-goodgreen/50 focus-visible:outline-none ${isPortfolio ? 'text-white bg-dark-50' : 'text-gray-400 hover:text-white hover:bg-dark-50'}`}
          >
            <LayoutDashboard className="w-5 h-5" />
          </Link>
          <ThemeToggle />
          <ActivityButton />
          <button
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMobileMenuOpen(o => !o)}
            className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-dark-50 transition-colors focus-visible:ring-2 focus-visible:ring-goodgreen/50 focus-visible:outline-none"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
          {walletReady ? <WalletButtonConnected /> : <WalletButton />}
        </div>
      </div>

      {mobileMenuOpen && (
        <>
        <div
          className="fixed left-0 right-0 bottom-0 top-16 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
        <div
          ref={menuRef}
          data-testid="mobile-nav"
          className="lg:hidden border-t border-white/[0.08] bg-etoro-carbon/95 backdrop-blur-xl relative z-50"
        >
          <nav aria-label="Mobile" className="flex flex-col px-4 py-3 gap-1">
            <Link prefetch={false} href="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg ${isSwap ? 'text-white font-medium bg-dark-50/50' : 'text-gray-400 hover:text-white'}`}
            >
              Swap
            </Link>
            <Link prefetch={false} href="/explore"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg ${isExplore ? 'text-white font-medium bg-dark-50/50' : 'text-gray-400 hover:text-white'}`}
            >
              Explore
            </Link>
            <Link prefetch={false} href="/pool"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg ${isPool ? 'text-white font-medium bg-dark-50/50' : 'text-gray-400 hover:text-white'}`}
            >
              Pool
              <span data-testid="soon-badge" className="px-1.5 py-0.5 text-[10px] font-medium bg-orange-500/20 text-orange-400 rounded border border-orange-500/30">
                Coming Soon
              </span>
            </Link>
            <Link prefetch={false} href="/bridge"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg ${isBridge ? 'text-white font-medium bg-dark-50/50' : 'text-gray-400 hover:text-white'}`}
            >
              Bridge
              <span data-testid="soon-badge" className="px-1.5 py-0.5 text-[10px] font-medium bg-orange-500/20 text-orange-400 rounded border border-orange-500/30">
                Coming Soon
              </span>
            </Link>
            <Link prefetch={false} href="/stocks"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg ${isStocks ? 'text-white font-medium bg-dark-50/50' : 'text-gray-400 hover:text-white'}`}
            >
              Stocks
            </Link>
            <Link prefetch={false} href="/predict"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg ${isPredict ? 'text-white font-medium bg-dark-50/50' : 'text-gray-400 hover:text-white'}`}
            >
              Predict
            </Link>
            <Link prefetch={false} href="/perps"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg ${isPerps ? 'text-white font-medium bg-dark-50/50' : 'text-gray-400 hover:text-white'}`}
            >
              Perps
            </Link>
            <Link prefetch={false} href="/lend"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg ${isLend ? 'text-white font-medium bg-dark-50/50' : 'text-gray-400 hover:text-white'}`}
            >
              Lend
            </Link>
            <Link prefetch={false} href="/stable"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg ${isStable ? 'text-white font-medium bg-dark-50/50' : 'text-gray-400 hover:text-white'}`}
            >
              Stable
            </Link>
            <Link prefetch={false} href="/yield"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg ${isYield ? 'text-white font-medium bg-dark-50/50' : 'text-gray-400 hover:text-white'}`}
            >
              Yield
            </Link>
            <Link prefetch={false} href="/governance"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg ${isGovernance ? 'text-white font-medium bg-dark-50/50' : 'text-gray-400 hover:text-white'}`}
            >
              Govern
            </Link>
            <Link prefetch={false} href="/agents"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg ${isAgents ? 'text-white font-medium bg-dark-50/50' : 'text-gray-400 hover:text-white'}`}
            >
              🤖 Agents
            </Link>
            <Link prefetch={false} href="/ubi-impact"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg ${isUBIImpact ? 'text-goodgreen font-medium bg-dark-50/50' : 'text-goodgreen/60 hover:text-goodgreen'}`}
            >
              🌍 UBI Impact
            </Link>
            <Link prefetch={false} href="/activity"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg ${isActivity ? 'text-goodgreen font-medium bg-dark-50/50' : 'text-goodgreen/60 hover:text-goodgreen'}`}
            >
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-goodgreen animate-pulse" />
                Activity
              </span>
            </Link>
            <Link prefetch={false} href="/analytics"
              onClick={() => setMobileMenuOpen(false)}
              aria-current={isAnalytics ? 'page' : undefined}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg ${isAnalytics ? 'text-white font-medium bg-dark-50/50' : 'text-gray-400 hover:text-white'}`}
            >
              Analytics
            </Link>
            {showDevNav && (
              <Link prefetch={false} href="/test-dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg ${isTestDashboard ? 'text-white font-medium bg-dark-50/50' : 'text-gray-400 hover:text-white'}`}
              >
                Tests
              </Link>
            )}
            <div className="border-t border-dark-50/50 my-1" />
            <p className="px-3 pt-1 pb-0.5 text-[10px] uppercase tracking-wider text-accent/60 font-semibold">Testnet</p>
            <Link prefetch={false} href="/faucet"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg ${isFaucet ? 'text-accent font-medium bg-accent/10' : 'text-accent/70 hover:text-accent'}`}
            >
              🚰 Faucet
            </Link>
            <Link prefetch={false} href="/testnet-guide"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg ${isTestnetGuide ? 'text-accent font-medium bg-accent/10' : 'text-accent/70 hover:text-accent'}`}
            >
              📖 Testnet Guide
            </Link>
            <Link prefetch={false} href="/live-prices-proof"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg ${isProof ? 'text-accent font-medium bg-accent/10' : 'text-accent/70 hover:text-accent'}`}
            >
              📈 Proof
            </Link>
            <Link prefetch={false} href="/invite"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg ${isInvite ? 'text-accent font-medium bg-accent/10' : 'text-accent/70 hover:text-accent'}`}
            >
              ✉️ Invite Testers
            </Link>
            <div className="border-t border-dark-50/50 my-1" />
            <Link prefetch={false} href="/portfolio"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg ${isPortfolio ? 'text-white font-medium bg-dark-50/50' : 'text-gray-400 hover:text-white'}`}
            >
              Portfolio
            </Link>
          </nav>
        </div>
        </>
      )}
    </header>
  )
}
