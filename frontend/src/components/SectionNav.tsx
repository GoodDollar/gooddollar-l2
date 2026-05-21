'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ScrollStrip } from './ScrollStrip'

interface Tab {
  label: string
  href: string
  match: (pathname: string) => boolean
  prefetch?: boolean
}

interface SectionNavProps {
  tabs: Tab[]
}

export function SectionNav({ tabs }: SectionNavProps) {
  const pathname = usePathname()

  return (
    <div className="w-full max-w-5xl mx-auto mb-6">
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
              prefetch={tab.prefetch ?? false}
              className={`shrink-0 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${
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
