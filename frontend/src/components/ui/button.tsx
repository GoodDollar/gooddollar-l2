import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97]',
  {
    variants: {
      variant: {
        default:
          'bg-goodgreen text-etoro-afterhours shadow-[0_0_24px_rgba(19,198,54,0.20)] hover:bg-goodgreen-600 active:bg-goodgreen-700',
        secondary:
          'border border-white/10 bg-white/[0.045] text-etoro-intelligence hover:border-white/20 hover:bg-white/[0.075]',
        outline:
          'border border-goodgreen/70 text-goodgreen bg-transparent hover:bg-goodgreen/10',
        ghost:
          'text-etoro-intelligence hover:bg-white/[0.07] hover:text-white',
        destructive:
          'bg-etoro-red/10 text-red-300 border border-etoro-red/30 hover:bg-etoro-red/20',
        link:
          'text-goodgreen underline-offset-4 hover:underline p-0 h-auto rounded-none',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        default: 'h-10 px-4 py-2',
        lg: 'h-12 px-6 text-base',
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

// Combines two refs into one so the parent's forwarded ref and the child's
// own ref both receive the rendered DOM node when `asChild` is used.
function mergeRefs<T>(
  ...refs: Array<React.Ref<T> | undefined>
): React.RefCallback<T> {
  return (node) => {
    for (const ref of refs) {
      if (!ref) continue
      if (typeof ref === 'function') ref(node)
      else (ref as React.MutableRefObject<T | null>).current = node
    }
  }
}

// `asChild` lets a caller render its own element (e.g. `<Link/>`) with the
// button's variant classes applied, instead of being wrapped in a `<button>`.
// We implement it inline with `cloneElement` rather than importing Radix's
// `Slot` so `button.tsx` does not pin a `@radix-ui/react-slot` chunk; the
// Turbopack dev server evicts that factory whenever new routes are added,
// which used to crash every page with a stale-module-factory error (#0083).
// Before this prop was wired the original implementation also leaked
// `aschild=""` to the DOM and produced nested `<button><a/></button>` trees
// (#0066) — both of those regressions are guarded by the tests in
// `__tests__/button.test.tsx`.
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, children, ...props }, ref) => {
    const variantClassName = cn(buttonVariants({ variant, size, className }))

    if (asChild) {
      const child = React.Children.only(children) as React.ReactElement<{
        className?: string
        ref?: React.Ref<HTMLElement>
      }>
      const childProps = child.props
      const childRef = (child as unknown as { ref?: React.Ref<HTMLElement> }).ref
      return React.cloneElement(child, {
        ...props,
        ...childProps,
        className: cn(variantClassName, childProps.className),
        ref: mergeRefs(ref as React.Ref<HTMLElement>, childRef),
      } as React.HTMLAttributes<HTMLElement> & { ref: React.Ref<HTMLElement> })
    }

    return (
      <button
        type={props.type ?? 'button'}
        className={variantClassName}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
