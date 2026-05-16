import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Header } from '../Header'

vi.mock('../WalletButton', () => ({
  WalletButton: () => <button>Connect Wallet</button>,
}))

vi.mock('../ActivityButton', () => ({
  ActivityButton: () => <button aria-label="Recent activity">Activity</button>,
}))

vi.mock('next/link', () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}))

describe('Header', () => {
  it('renders logo and brand name', () => {
    render(<Header />)
    expect(screen.getByText('GoodDollar')).toBeInTheDocument()
    expect(screen.getByText('G$')).toBeInTheDocument()
  })

  it('renders desktop nav links', () => {
    render(<Header />)
    expect(screen.getByText('Swap')).toBeInTheDocument()
    expect(screen.getByText('Explore')).toBeInTheDocument()
    const poolLinks = screen.getAllByText('Pool')
    expect(poolLinks.length).toBeGreaterThanOrEqual(1)
    const bridgeLinks = screen.getAllByText('Bridge')
    expect(bridgeLinks.length).toBeGreaterThanOrEqual(1)
    const lendLinks = screen.getAllByText('Lend')
    expect(lendLinks.length).toBeGreaterThanOrEqual(1)
    const stableLinks = screen.getAllByText('Stable')
    expect(stableLinks.length).toBeGreaterThanOrEqual(1)
  })

  it('renders Pool and Bridge as links to their pages', () => {
    render(<Header />)
    const poolLink = screen.getAllByText('Pool').find(el => el.closest('a'))
    expect(poolLink?.closest('a')).toHaveAttribute('href', '/pool')
    const bridgeLink = screen.getAllByText('Bridge').find(el => el.closest('a'))
    expect(bridgeLink?.closest('a')).toHaveAttribute('href', '/bridge')
  })

  it('renders hamburger button for mobile', () => {
    render(<Header />)
    const hamburger = screen.getByLabelText('Open menu')
    expect(hamburger).toBeInTheDocument()
  })

  it('opens mobile menu on hamburger click', () => {
    render(<Header />)
    const hamburger = screen.getByLabelText('Open menu')
    fireEvent.click(hamburger)

    const mobileNav = screen.getByTestId('mobile-nav')
    expect(mobileNav).toBeInTheDocument()
    expect(mobileNav.textContent).toContain('Swap')
    expect(mobileNav.textContent).toContain('Pool')
    expect(mobileNav.textContent).toContain('Bridge')
  })

  it('closes mobile menu on close button click', () => {
    render(<Header />)
    fireEvent.click(screen.getByLabelText('Open menu'))
    expect(screen.getByTestId('mobile-nav')).toBeInTheDocument()

    fireEvent.click(screen.getByLabelText('Close menu'))
    expect(screen.queryByTestId('mobile-nav')).not.toBeInTheDocument()
  })

  it('closes mobile menu on Escape key', () => {
    render(<Header />)
    fireEvent.click(screen.getByLabelText('Open menu'))
    expect(screen.getByTestId('mobile-nav')).toBeInTheDocument()

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByTestId('mobile-nav')).not.toBeInTheDocument()
  })

  it('Pool and Bridge in desktop nav show Soon badges', () => {
    render(<Header />)
    const desktopNav = document.querySelector('nav.hidden.\\32 xl\\:flex')!
    const soonBadges = desktopNav.querySelectorAll('[data-testid="soon-badge"]')
    expect(soonBadges.length).toBe(2)
  })

  it('does NOT include the "Tests" link in the desktop inline nav', () => {
    // The "Tests" link is for the internal Foundry test dashboard.
    // It should NOT clutter the primary product nav at desktop widths.
    // It remains available via the mobile menu and the direct /test-dashboard URL.
    render(<Header />)
    const desktopNav = document.querySelector('nav.hidden.\\32 xl\\:flex')!
    expect(desktopNav.textContent).not.toContain('Tests')
  })

  describe('Tests link in mobile menu (gated by NEXT_PUBLIC_SHOW_DEV_NAV)', () => {
    // Internal QA dashboard link is hidden in production. Devs/QA can opt in
    // with NEXT_PUBLIC_SHOW_DEV_NAV=1 in .env.local. The /test-dashboard
    // route itself stays reachable via direct URL either way. See task 0070.
    const original = process.env.NEXT_PUBLIC_SHOW_DEV_NAV

    afterEach(() => {
      if (original === undefined) delete process.env.NEXT_PUBLIC_SHOW_DEV_NAV
      else process.env.NEXT_PUBLIC_SHOW_DEV_NAV = original
    })

    it('hides the "Tests" link in the mobile menu by default (flag unset)', () => {
      delete process.env.NEXT_PUBLIC_SHOW_DEV_NAV
      render(<Header />)
      fireEvent.click(screen.getByLabelText('Open menu'))
      const mobileNav = screen.getByTestId('mobile-nav')
      const links = mobileNav.querySelectorAll('a')
      const hrefs = Array.from(links).map(l => l.getAttribute('href'))
      expect(hrefs).not.toContain('/test-dashboard')
      expect(mobileNav.textContent).not.toMatch(/\bTests\b/)
    })

    it('hides the "Tests" link in the mobile menu when flag !== "1"', () => {
      process.env.NEXT_PUBLIC_SHOW_DEV_NAV = '0'
      render(<Header />)
      fireEvent.click(screen.getByLabelText('Open menu'))
      const mobileNav = screen.getByTestId('mobile-nav')
      const hrefs = Array.from(mobileNav.querySelectorAll('a')).map(l => l.getAttribute('href'))
      expect(hrefs).not.toContain('/test-dashboard')
    })

    it('shows the "Tests" link in the mobile menu when flag === "1"', () => {
      process.env.NEXT_PUBLIC_SHOW_DEV_NAV = '1'
      render(<Header />)
      fireEvent.click(screen.getByLabelText('Open menu'))
      const mobileNav = screen.getByTestId('mobile-nav')
      expect(mobileNav.textContent).toContain('Tests')
      const hrefs = Array.from(mobileNav.querySelectorAll('a')).map(l => l.getAttribute('href'))
      expect(hrefs).toContain('/test-dashboard')
    })
  })

  it('uses 2xl breakpoint for desktop nav (not sm/lg/xl) to avoid clipping WalletButton at 1280px', () => {
    // Regression test: with 14+ nav links, the inline desktop nav does not fit
    // inside a 1280px viewport (the xl breakpoint). The desktop nav must
    // therefore only appear at 2xl (1536px+); below that, the mobile menu is used.
    render(<Header />)
    const desktopNav = document.querySelector('nav.hidden.\\32 xl\\:flex')
    expect(desktopNav).not.toBeNull()
    // The sm:flex, lg:flex, and xl:flex versions must NOT exist anymore.
    const oldSmNav = document.querySelector('nav.hidden.sm\\:flex')
    expect(oldSmNav).toBeNull()
    const oldLgNav = document.querySelector('nav.hidden.lg\\:flex')
    expect(oldLgNav).toBeNull()
    const oldXlNav = document.querySelector('nav.hidden.xl\\:flex')
    expect(oldXlNav).toBeNull()
  })

  it('hamburger button is hidden at 2xl breakpoint (matching mobile menu visibility)', () => {
    render(<Header />)
    const hamburger = screen.getByLabelText('Open menu')
    expect(hamburger.className).toMatch(/\b2xl:hidden\b/)
    expect(hamburger.className).not.toMatch(/\bsm:hidden\b/)
    expect(hamburger.className).not.toMatch(/\blg:hidden\b/)
    // Note: "2xl:hidden" contains "xl:hidden" as substring, so we can't use a
    // negated regex with \b. Instead we explicitly checked the positive match above.
  })

  it('Pool and Bridge in mobile menu show Coming Soon badges', () => {
    render(<Header />)
    fireEvent.click(screen.getByLabelText('Open menu'))

    const mobileNav = screen.getByTestId('mobile-nav')
    expect(mobileNav.textContent).toContain('Coming Soon')
  })

  it('has Pool and Bridge as navigable links in mobile menu', () => {
    render(<Header />)
    fireEvent.click(screen.getByLabelText('Open menu'))

    const mobileNav = screen.getByTestId('mobile-nav')
    const links = mobileNav.querySelectorAll('a')
    const hrefs = Array.from(links).map(l => l.getAttribute('href'))
    expect(hrefs).toContain('/pool')
    expect(hrefs).toContain('/bridge')
  })

  it('has Lend and Stable as navigable links', () => {
    render(<Header />)
    const allLinks = document.querySelectorAll('a')
    const hrefs = Array.from(allLinks).map(l => l.getAttribute('href'))
    expect(hrefs).toContain('/lend')
    expect(hrefs).toContain('/stable')
  })

  it('has Lend and Stable in mobile menu', () => {
    render(<Header />)
    fireEvent.click(screen.getByLabelText('Open menu'))
    const mobileNav = screen.getByTestId('mobile-nav')
    expect(mobileNav.textContent).toContain('Lend')
    expect(mobileNav.textContent).toContain('Stable')
  })
})
