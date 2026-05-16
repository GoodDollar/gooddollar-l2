'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/cn'
import { Button } from './button'

interface EmptyStateProps {
  icon: ReactNode
  title: string
  description?: string
  action?: { label: string; href: string }
  className?: string
}

/**
 * Generic, presentational empty-state primitive used inside section cards
 * (e.g. Portfolio Stocks/Predictions/Perps when the connected wallet has
 * no positions yet). Matches the surrounding visual idiom: gradient icon
 * halo + title + optional description + optional ghost CTA.
 *
 * Renders inside an existing card; do not wrap in another card here.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center py-6 px-4',
        className,
      )}
      data-testid="empty-state"
    >
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-goodgreen/20 to-goodgreen/5 border border-goodgreen/15 flex items-center justify-center text-goodgreen mb-3">
        {icon}
      </div>
      <p className="text-sm font-medium text-white">{title}</p>
      {description && (
        <p className="text-xs text-gray-400 mt-1 max-w-xs">{description}</p>
      )}
      {action && (
        <Link href={action.href} className="mt-3 inline-flex">
          <Button variant="ghost" size="sm">
            {action.label}
          </Button>
        </Link>
      )}
    </div>
  )
}
