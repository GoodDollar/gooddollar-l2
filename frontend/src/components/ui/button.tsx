import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97]',
  {
    variants: {
      variant: {
        default:
          'bg-goodgreen text-dark font-semibold hover:bg-goodgreen-600 active:bg-goodgreen-700',
        secondary:
          'bg-dark-50 text-foreground hover:bg-dark-100 border border-border',
        outline:
          'border border-goodgreen text-goodgreen bg-transparent hover:bg-goodgreen/10',
        ghost:
          'text-foreground hover:bg-dark-50 hover:text-white',
        destructive:
          'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20',
        link:
          'text-goodgreen underline-offset-4 hover:underline p-0 h-auto',
      },
      size: {
        sm: 'h-8 px-3 text-xs rounded',
        default: 'h-10 px-4 py-2',
        lg: 'h-12 px-6 text-base rounded-lg',
        icon: 'h-10 w-10',
        'icon-sm': 'h-8 w-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

// `asChild` follows the canonical Radix Slot pattern: when true, the
// single child element receives the button's classes / ref / handlers
// instead of being wrapped in a <button>. This is the documented usage
// for callers who need a styled anchor (e.g. `<Button asChild><Link/>`).
// Before this was wired, the prop leaked to the DOM as `aschild=""` and
// callers ended up with an invalid `<button><a/></button>` tree (#0066).
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
