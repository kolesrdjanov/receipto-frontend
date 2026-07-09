import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  // Luma: flat controls, 10px radius (`rounded-lg` = --radius). Borders/fills do the
  // work — no drop shadows on buttons. `pill` stays `rounded-full`.
  // Don't re-add a radius utility at call sites — it's the default now.
  // Label weight is 400 by owner decision (deviates from the handoff's 14/500) —
  // don't re-add font-medium/font-semibold at call sites.
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-normal transition-[opacity,background-color,color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 disabled:pointer-events-none disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // primary — near-black (light) / near-white (dark), hover fades
        default: "bg-primary text-primary-foreground hover:opacity-88",
        destructive:
          "bg-destructive text-white hover:opacity-90",
        // outline — card surface + hairline, hover fills subtle
        outline:
          "border border-border bg-card text-foreground hover:bg-subtle",
        secondary:
          "bg-subtle text-foreground hover:opacity-88",
        ghost: "text-foreground hover:bg-subtle",
        link: "text-foreground underline-offset-4 hover:underline",
        // ── Legacy variants retained for API compatibility ──
        // `brand` / `brand-violet` — retired gradient CTAs, now alias primary
        brand: "bg-primary text-primary-foreground hover:opacity-88",
        "brand-violet": "bg-primary text-primary-foreground hover:opacity-88",
        // `glass` — neutral bordered pill (secondary actions, toolbars) = outline look
        glass:
          "border border-border bg-card text-foreground hover:bg-subtle",
        // `destructive-soft` — soft red action (logout, soft delete)
        "destructive-soft":
          "bg-destructive-soft text-[color:var(--destructive-foreground-on-soft)] hover:opacity-90",
      },
      size: {
        default: "h-9 px-3.5",
        sm: "h-8 px-3 text-[13px]",
        lg: "h-11 px-5 text-[15px]",
        // Icon button: 44x44 true touch target (WCAG 2.5.5 / Apple HIG).
        icon: "size-11",
        // Dense icon button (toolbars / table rows): 36px visual, >=44px hit area
        // via a centered pseudo-element.
        "icon-sm":
          "size-9 relative after:absolute after:left-1/2 after:top-1/2 after:size-11 after:-translate-x-1/2 after:-translate-y-1/2 after:content-['']",
        // Rounded-full action pill.
        pill: "h-9 rounded-full px-3.5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  /** Show a leading spinner and disable the button while an action is in flight. */
  loading?: boolean
  /** Optional label to show in place of children while loading. */
  loadingText?: string
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      loadingText,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={asChild ? undefined : disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {!asChild && loading ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            {loadingText ?? children}
          </>
        ) : (
          children
        )}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
