import Link from "next/link"

const pills = [
  {
    label: "Stocks",
    sublabel: "AAPL · TSLA · NVDA",
    href: "/stocks",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
  },
  {
    label: "Perps",
    sublabel: "Up to 50×",
    href: "/perps",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6m6 0h6m-6 0V9a2 2 0 012-2h2a2 2 0 012 2v10m6 0v-4a2 2 0 00-2-2h-2a2 2 0 00-2 2v4" />
      </svg>
    ),
  },
  {
    label: "Lend",
    sublabel: "Earn yield",
    href: "/lend",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V7m0 10v1" />
      </svg>
    ),
  },
]

export function ProductPills() {
  return (
    <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mt-4 mb-6">
      {pills.map((pill) => (
        <Link
          key={pill.label}
          href={pill.href}
          className="group flex items-center gap-2 px-3.5 py-2 rounded-full bg-dark-100/60 border border-gray-700/30 hover:border-goodgreen/40 hover:bg-dark-100/80 transition-all duration-200"
        >
          <span className="text-goodgreen group-hover:text-goodgreen/80 transition-colors">
            {pill.icon}
          </span>
          <span className="text-sm font-medium text-white">{pill.label}</span>
          <span className="text-[11px] text-gray-500 hidden sm:inline">{pill.sublabel}</span>
          <svg className="w-3 h-3 text-gray-500 group-hover:text-goodgreen/70 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      ))}
    </div>
  )
}
