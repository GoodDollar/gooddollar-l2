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
  default: ({ href, children, className, prefetch }: { href: string; children: React.ReactNode; className?: string; prefetch?: boolean }) => (
    <a href={href} className={className} data-prefetch={String(prefetch)}>{children}</a>
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
    expect(screen.getAllByText('Swap').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Explore').length).toBeGreaterThanOrEqual(1)
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

  it('shows condensed nav at lg breakpoint with core links and More dropdown', () => {
    render(<Header />)
    const condensedNav = document.querySelector('[data-testid="condensed-nav"]')
    expect(condensedNav).not.toBeNull()
    expect(condensedNav!.className).toContain('lg:flex')
    expect(condensedNav!.className).toContain('2xl:hidden')
    expect(condensedNav!.textContent).toContain('Swap')
    expect(condensedNav!.textContent).toContain('Stocks')
    expect(condensedNav!.textContent).toContain('Perps')
    expect(condensedNav!.textContent).toContain('Predict')
    expect(condensedNav!.textContent).toContain('Lend')
    expect(condensedNav!.textContent).toContain('More')
  })

  it('keeps full expanded nav at 2xl breakpoint', () => {
    render(<Header />)
    const fullNav = document.querySelector('nav.hidden.\\32 xl\\:flex')
    expect(fullNav).not.toBeNull()
  })

  it('hamburger button is hidden at lg breakpoint (condensed nav visible)', () => {
    render(<Header />)
    const hamburger = screen.getByLabelText('Open menu')
    expect(hamburger.className).toMatch(/\blg:hidden\b/)
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

  it('has Faucet and Testnet Guide links in desktop nav', () => {
    render(<Header />)
    const desktopNav = document.querySelector('nav.hidden.\\32 xl\\:flex')!
    expect(desktopNav.textContent).toContain('Faucet')
    expect(desktopNav.textContent).toContain('Guide')
  })

  it('has Faucet and Testnet Guide links in mobile menu', () => {
    render(<Header />)
    fireEvent.click(screen.getByLabelText('Open menu'))
    const mobileNav = screen.getByTestId('mobile-nav')
    const hrefs = Array.from(mobileNav.querySelectorAll('a')).map(l => l.getAttribute('href'))
    expect(hrefs).toContain('/faucet')
    expect(hrefs).toContain('/testnet-guide')
  })

  it('disables Link prefetch for header navigation links', () => {
    render(<Header />)
    const stockNav = document.querySelector('a[href="/stocks"]')
    const perpsNav = document.querySelector('a[href="/perps"]')
    expect(stockNav).toHaveAttribute('data-prefetch', 'false')
    expect(perpsNav).toHaveAttribute('data-prefetch', 'false')
  })

  describe('Analytics nav entry (#0079)', () => {
    it('renders an Analytics link in the full primary nav (2xl)', () => {
      render(<Header />)
      const fullNav = document.querySelector('nav.hidden.\\32 xl\\:flex')!
      const link = fullNav.querySelector('a[href="/analytics"]')
      expect(link).not.toBeNull()
      expect(link!.textContent).toBe('Analytics')
    })

    it('renders an Analytics link in the condensed primary nav (lg–2xl)', () => {
      render(<Header />)
      const condensed = document.querySelector('[data-testid="condensed-nav"]')!
      const analyticsLinks = condensed.querySelectorAll('a[href="/analytics"]')
      // One in the top row + one inside the "More" dropdown for parity
      // with the existing Explore / Pool / Bridge / Stable / Yield /
      // Govern / Agents / UBI / Activity siblings.
      expect(analyticsLinks.length).toBeGreaterThanOrEqual(2)
    })

    it('renders an Analytics link in the mobile drawer', () => {
      render(<Header />)
      fireEvent.click(screen.getByLabelText('Open menu'))
      const mobileNav = screen.getByTestId('mobile-nav')
      const links = mobileNav.querySelectorAll('a')
      const hrefs = Array.from(links).map((l) => l.getAttribute('href'))
      expect(hrefs).toContain('/analytics')
      expect(mobileNav.textContent).toContain('Analytics')
    })

    it('disables Link prefetch on the Analytics link (matches sibling pattern)', () => {
      render(<Header />)
      const analytics = document.querySelector('a[href="/analytics"]')
      expect(analytics).not.toBeNull()
      expect(analytics).toHaveAttribute('data-prefetch', 'false')
    })
  })
})

describe('Header Analytics active-state on /analytics sub-routes (#0079)', () => {
  afterEach(() => {
    vi.doUnmock('next/navigation')
    vi.resetModules()
  })

  async function renderWithPathname(pathname: string) {
    vi.resetModules()
    vi.doMock('next/navigation', () => ({ usePathname: () => pathname }))
    vi.doMock('../WalletButton', () => ({
      WalletButton: () => <button>Connect Wallet</button>,
    }))
    vi.doMock('../ActivityButton', () => ({
      ActivityButton: () => <button aria-label="Recent activity">Activity</button>,
    }))
    vi.doMock('next/link', () => ({
      default: ({
        href,
        children,
        className,
        prefetch,
        ...rest
      }: {
        href: string
        children: React.ReactNode
        className?: string
        prefetch?: boolean
        [k: string]: unknown
      }) => (
        <a
          href={href}
          className={className}
          data-prefetch={String(prefetch)}
          {...rest}
        >
          {children}
        </a>
      ),
    }))
    const { Header: FreshHeader } = (await import('../Header')) as {
      Header: typeof import('../Header').Header
    }
    return render(<FreshHeader />)
  }

  it('marks Analytics with aria-current="page" on /analytics', async () => {
    await renderWithPathname('/analytics')
    const analyticsAnchors = Array.from(
      document.querySelectorAll('a[href="/analytics"]'),
    )
    expect(analyticsAnchors.length).toBeGreaterThan(0)
    const active = analyticsAnchors.filter(
      (a) => a.getAttribute('aria-current') === 'page',
    )
    expect(active.length).toBeGreaterThan(0)
  })

  it('marks Analytics with aria-current="page" on /analytics/hedge/proof/latest (sub-route active)', async () => {
    await renderWithPathname('/analytics/hedge/proof/latest')
    const analyticsAnchors = Array.from(
      document.querySelectorAll('a[href="/analytics"]'),
    )
    const active = analyticsAnchors.filter(
      (a) => a.getAttribute('aria-current') === 'page',
    )
    expect(active.length).toBeGreaterThan(0)
  })

  it('does NOT mark Analytics with aria-current="page" on /stocks', async () => {
    await renderWithPathname('/stocks')
    const analyticsAnchors = Array.from(
      document.querySelectorAll('a[href="/analytics"]'),
    )
    const active = analyticsAnchors.filter(
      (a) => a.getAttribute('aria-current') === 'page',
    )
    expect(active.length).toBe(0)
  })
})

describe('Header a11y landmarks', () => {
  it('labels every nav with a unique aria-label (closed mobile menu)', () => {
    render(<Header />)
    const navs = screen.getAllByRole('navigation')
    const labels = navs.map(n => n.getAttribute('aria-label'))
    // every nav must have a non-empty aria-label
    expect(labels.every(l => l && l.length > 0)).toBe(true)
    // all labels must be unique
    expect(new Set(labels).size).toBe(labels.length)
  })

  it('labels every nav with a unique aria-label (open mobile menu)', () => {
    render(<Header />)
    fireEvent.click(screen.getByLabelText('Open menu'))
    const navs = screen.getAllByRole('navigation')
    const labels = navs.map(n => n.getAttribute('aria-label'))
    expect(labels.every(l => l && l.length > 0)).toBe(true)
    expect(new Set(labels).size).toBe(labels.length)
  })

  it('keeps data-testid="condensed-nav" on the condensed nav with an aria-label', () => {
    render(<Header />)
    const condensed = screen.getByTestId('condensed-nav')
    expect(condensed.tagName.toLowerCase()).toBe('nav')
    expect(condensed.getAttribute('aria-label')).toBeTruthy()
  })
})
