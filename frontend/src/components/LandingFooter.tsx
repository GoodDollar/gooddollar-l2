const links = [
  { label: 'Docs', href: 'https://docs.gooddollar.org' },
  { label: 'GitHub', href: 'https://github.com/GoodDollar' },
  { label: 'Community', href: 'https://community.gooddollar.org' },
]

export function LandingFooter() {
  return (
    <footer className="w-full max-w-5xl mx-auto mt-auto pt-8 mb-4 px-4">
      <div className="border-t border-white/[0.08] pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-xs text-etoro-intelligence/45">
          Powered by GoodDollar L2
        </p>
        <nav aria-label="Footer" className="flex items-center gap-4">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-etoro-intelligence/45 hover:text-etoro-intelligence transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  )
}
