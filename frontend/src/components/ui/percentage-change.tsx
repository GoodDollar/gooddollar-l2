'use client'

import { forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'

const percentageChangeVariants = cva(
  'inline-flex items-center gap-1 font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'text-foreground',
        positive: 'text-green-400',
        negative: 'text-red-400',
        muted: 'text-muted-foreground',
        subtle: 'text-muted-foreground',
      },
      size: {
        xs: 'text-xs',
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-lg',
      },
      showIcon: {
        true: '',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'sm',
      showIcon: true,
    },
  }
)

interface PercentageChangeProps extends VariantProps<typeof percentageChangeVariants> {
  /**
   * Percentage value. Pass `null` (or `undefined`) when the upstream data
   * source did not return a value — the component renders a neutral
   * placeholder ("—") with a tooltip instead of `0.00%`, so users aren't
   * misled about a token having literally zero movement.
   */
  value: number | null | undefined
  decimals?: number
  showSign?: boolean
  className?: string
  /** Tooltip shown when value is null/undefined. */
  unavailableLabel?: string
}

/**
 * Standardized percentage change component for financial data.
 *
 * Features:
 * - Automatic positive/negative styling and icons
 * - Configurable decimal precision
 * - Optional +/- sign display
 * - Consistent with design system
 * - Triangle icons for visual clarity
 * - Null-safe: renders "—" when value is null/undefined (data unavailable)
 *
 * Used across: GoodSwap, GoodStocks, GoodPredict, GoodPerps
 */
const PercentageChange = forwardRef<HTMLSpanElement, PercentageChangeProps>(
  ({
    value,
    decimals = 2,
    showSign = false,
    showIcon = true,
    variant,
    size,
    className,
    unavailableLabel = 'Data unavailable',
    ...props
  }, ref) => {
    // Unavailable (null/undefined) — render neutral placeholder with tooltip.
    if (value === null || value === undefined) {
      return (
        <span
          ref={ref}
          className={cn(
            percentageChangeVariants({ variant: 'muted', size, showIcon: false }),
            className,
          )}
          title={unavailableLabel}
          aria-label={unavailableLabel}
          {...props}
        >
          —
        </span>
      )
    }

    // Auto-detect positive/negative variant if not specified
    const isPositive = value > 0
    const isNegative = value < 0
    const finalVariant = variant || (isPositive ? 'positive' : isNegative ? 'negative' : 'muted')

    const formattedValue = Math.abs(value).toFixed(decimals)
    const sign = showSign && value !== 0 ? (isPositive ? '+' : '-') : ''

    const TriangleIcon = ({ direction }: { direction: 'up' | 'down' }) => (
      <svg
        className="w-2.5 h-2.5"
        fill="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        {direction === 'up' ? (
          <path d="M12 5l8 14H4L12 5z" />
        ) : (
          <path d="M12 19L4 5h16L12 19z" />
        )}
      </svg>
    )

    return (
      <span
        ref={ref}
        className={cn(percentageChangeVariants({ variant: finalVariant, size, showIcon }), className)}
        {...props}
      >
        {showIcon && value !== 0 && (
          <TriangleIcon direction={isPositive ? 'up' : 'down'} />
        )}
        <span>
          {sign}
          {formattedValue}%
        </span>
      </span>
    )
  }
)

PercentageChange.displayName = 'PercentageChange'

export { PercentageChange, percentageChangeVariants }
export type { PercentageChangeProps }