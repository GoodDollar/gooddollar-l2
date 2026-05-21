'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ScrollStrip } from './ScrollStrip'

interface Tab {
  label: string
  href: string
  match: (pathname: string) => boolean
}

interface SectionNavProps {
  tabs: Tab[]
  mobileCompact?: boolean
}

export function SectionNav({ tabs, mobileCompact = false }: SectionNavProps) {
  const pathname = usePathname()
  const tabSpacingClass = mobileCompact
    ? 'px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm'
    : 'px-4 py-2.5 text-sm'

  return (
    <div className={`w-full max-w-5xl mx-auto ${mobileCompact ? 'mb-4 sm:mb-6' : 'mb-6'}`}>
      <ScrollStrip
        wrapperClassName="border-b border-gray-700/20"
        className="flex gap-1"
        ariaLabel="Section navigation"
      >
        {tabs.map(tab => {
          const active = tab.match(pathname)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              prefetch={false}
              className={`shrink-0 ${tabSpacingClass} font-medium transition-colors border-b-2 ${
                active
                  ? 'text-white border-goodgreen'
                  : 'text-gray-400 border-transparent hover:text-white hover:border-gray-600'
              }`}
            >
              {tab.label}
            </Link>
          )
        })}
      </ScrollStrip>
    </div>
  )
}
