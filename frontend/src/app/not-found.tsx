import Link from 'next/link'

const SECTIONS = [
  { href: '/', label: 'Swap' },
  { href: '/stocks', label: 'Stocks' },
  { href: '/perps', label: 'Perps' },
  { href: '/lend', label: 'Lend' },
  { href: '/yield', label: 'Yield' },
  { href: '/explore', label: 'Explore' },
  { href: '/portfolio', label: 'Portfolio' },
  { href: '/status', label: 'Status' },
]

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-20 h-20 rounded-full bg-dark-50 border border-gray-700/30 flex items-center justify-center mb-6">
        <span className="text-4xl">🔍</span>
      </div>

      <h1 className="text-5xl font-bold text-white mb-3">404</h1>
      <p className="text-lg text-gray-400 mb-2">Page Not Found</p>
      <p className="text-sm text-gray-500 max-w-xs mb-8">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>

      <Link
        href="/"
        className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-goodgreen px-6 text-base font-semibold text-dark transition-colors hover:bg-goodgreen-600 active:bg-goodgreen-700"
      >
        Back to Swap
      </Link>

      <div className="mt-6 flex flex-col items-center gap-2">
        <span className="text-xs text-gray-500">Or try:</span>
        <div className="flex flex-wrap justify-center gap-2">
          {SECTIONS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="rounded-full bg-dark-50 border border-gray-700/30 px-3 py-1 text-xs text-gray-300 hover:text-white hover:border-gray-500 transition-colors"
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
