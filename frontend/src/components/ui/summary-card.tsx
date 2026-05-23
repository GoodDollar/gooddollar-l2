import { cn } from '@/lib/cn'

interface SummaryCardProps {
  label: string
  value: string
  color?: string
  className?: string
  /** Optional test id forwarded to the value element. */
  valueTestId?: string
  /**
   * When true, render the value in a muted "not available yet" style.
   * Use for connect-wallet placeholder states where a hard `$0` would
   * read as a real zero.
   */
  disabled?: boolean
}

export function SummaryCard({
  label,
  value,
  color,
  className,
  valueTestId,
  disabled = false,
}: SummaryCardProps) {
  return (
    <div
      className={cn(
        'bg-dark-100 rounded-xl sm:rounded-2xl border border-gray-700/20 p-3 sm:p-5',
        className,
      )}
      data-disabled={disabled || undefined}
    >
      <div className="text-[10px] sm:text-xs text-gray-400 mb-0.5 sm:mb-1">{label}</div>
      <div
        className={cn(
          'text-lg sm:text-xl font-bold',
          disabled ? 'text-gray-500' : (color ?? 'text-white'),
        )}
        data-testid={valueTestId}
      >
        {value}
      </div>
    </div>
  )
}
