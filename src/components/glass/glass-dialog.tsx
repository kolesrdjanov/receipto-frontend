import { type ReactNode } from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'

const SHEET_EASE: [number, number, number, number] = [0.2, 0.8, 0.2, 1]

/** Standardized footer actions. Desktop: right-aligned (destructive far-left). Mobile:
 *  full-width stacked big buttons (primary → secondary → destructive). */
export interface GlassDialogActions {
  primary?: ReactNode
  secondary?: ReactNode
  destructive?: ReactNode
}

export interface GlassDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Accessible label. Rendered as the visible heading unless `header` is supplied. */
  title: string
  /** Visible sub-line under the title (default header only). */
  description?: ReactNode
  /** Replaces the default title/description block (a sr-only title is still emitted). */
  header?: ReactNode
  /** Scrollable body. */
  children?: ReactNode
  /** Standardized footer actions (preferred — auto-lays-out per breakpoint). */
  actions?: GlassDialogActions
  /** Raw pinned footer (legacy escape hatch; prefer `actions`). */
  footer?: ReactNode
  /** Desktop modal width in px (mobile is always full-width). */
  desktopWidth?: number
  /** Top-right close button on desktop. */
  showClose?: boolean
  /** Tap on the dim scrim closes the dialog. */
  dismissibleOnOverlay?: boolean
  className?: string
  bodyClassName?: string
}

/**
 * Responsive glass overlay shell — a centered frosted modal on desktop (≥ md) and a
 * slide-up bottom sheet on mobile. Composes Radix Dialog primitives directly (scrim,
 * focus trap, Esc, portal) + Framer Motion, mirroring the onboarding sheet. Honors
 * `prefers-reduced-motion`. Header / body (scrolls) / footer (pinned) are laid out in a
 * flex column capped to the viewport.
 *
 * Mobile sheet is an opaque **white** surface (not the frosted desktop glass); tapping its
 * grab handle dismisses it (with a little bounce). Footer `actions` stack full-width.
 * Desktop stays frosted glass with right-aligned actions.
 */
export function GlassDialog({
  open,
  onOpenChange,
  title,
  description,
  header,
  children,
  actions,
  footer,
  desktopWidth = 480,
  showClose = true,
  dismissibleOnOverlay = true,
  className,
  bodyClassName,
}: GlassDialogProps) {
  const isMobile = useIsMobile(768)
  const reduce = useReducedMotion()

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <DialogPrimitive.Portal forceMount>
            <DialogPrimitive.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-50 bg-[oklch(0_0_0/0.45)] backdrop-blur-[5px] dark:bg-[oklch(0_0_0/0.55)]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduce ? 0 : 0.2 }}
                onClick={dismissibleOnOverlay ? () => onOpenChange(false) : undefined}
              />
            </DialogPrimitive.Overlay>
            <DialogPrimitive.Content
              asChild
              forceMount
              aria-describedby={undefined}
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
              <div
                className={cn(
                  'pointer-events-none fixed inset-0 z-50 flex',
                  isMobile ? 'items-end justify-center' : 'items-center justify-center p-4',
                )}
              >
                <motion.div
                  key={isMobile ? 'sheet' : 'modal'}
                  className={cn(
                    'pointer-events-auto relative flex flex-col overflow-hidden',
                    isMobile
                      ? 'max-h-[92vh] w-full rounded-t-[28px] border-t border-border bg-card shadow-[0_-10px_44px_oklch(0_0_0/0.18)] dark:shadow-[0_-10px_44px_oklch(0_0_0/0.6)]'
                      : 'glass-card max-h-[88vh]',
                    className,
                  )}
                  style={isMobile ? { width: '100%' } : { width: desktopWidth, maxWidth: 'calc(100% - 2rem)' }}
                  initial={
                    reduce
                      ? { opacity: 0 }
                      : isMobile
                        ? { y: '100%' }
                        : { opacity: 0, scale: 0.96, y: 8 }
                  }
                  animate={isMobile ? { y: 0 } : { opacity: 1, scale: 1, y: 0 }}
                  exit={
                    reduce
                      ? { opacity: 0 }
                      : isMobile
                        ? { y: '100%' }
                        : { opacity: 0, scale: 0.96, y: 8 }
                  }
                  transition={{
                    duration: reduce ? 0 : isMobile ? 0.3 : 0.2,
                    ease: isMobile ? SHEET_EASE : 'easeOut',
                  }}
                >
                  {isMobile && (
                    <motion.button
                      type="button"
                      aria-label="Close"
                      onClick={() => onOpenChange(false)}
                      whileTap={{ scale: 0.82 }}
                      className="mx-auto mb-1 mt-3 flex h-6 w-full max-w-[140px] shrink-0 items-center justify-center"
                    >
                      <span className="h-[5px] w-9 rounded-full bg-border" />
                    </motion.button>
                  )}

                  {!isMobile && showClose && (
                    <button
                      type="button"
                      onClick={() => onOpenChange(false)}
                      aria-label="Close"
                      className="absolute right-4 top-4 z-10 grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-bg-subtle hover:text-foreground"
                    >
                      <X className="size-[18px]" />
                    </button>
                  )}

                  {/* Header */}
                  <div className={cn('shrink-0 px-6', isMobile ? 'pt-2' : 'pt-6', showClose && !isMobile && 'pr-12')}>
                    {header ?? (
                      <>
                        <DialogPrimitive.Title className="t-h3">{title}</DialogPrimitive.Title>
                        {description && (
                          <p className="t-sm mt-1 text-muted-foreground">{description}</p>
                        )}
                      </>
                    )}
                    {header && (
                      <DialogPrimitive.Title className="sr-only">{title}</DialogPrimitive.Title>
                    )}
                  </div>

                  {/* Body (scrolls) */}
                  {children != null && (
                    <div className={cn('min-h-0 flex-1 overflow-y-auto px-6 py-5 mt-4', bodyClassName)}>
                      {children}
                    </div>
                  )}

                  {/* Footer (pinned) */}
                  {(actions || footer) && (
                    <div
                      className={cn(
                        'shrink-0 border-t border-hairline-soft px-6 pt-4',
                        isMobile ? 'pb-[calc(18px+env(safe-area-inset-bottom))]' : 'pb-6',
                      )}
                    >
                      {actions ? (
                        isMobile ? (
                          <div className="flex flex-col gap-2 [&_button]:h-12 [&_button]:w-full [&_button]:rounded-xl [&_button]:text-[15px]">
                            {actions.primary}
                            {actions.secondary}
                            {actions.destructive}
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            {actions.destructive && <div className="mr-auto">{actions.destructive}</div>}
                            {actions.secondary}
                            {actions.primary}
                          </div>
                        )
                      ) : (
                        footer
                      )}
                    </div>
                  )}
                </motion.div>
              </div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  )
}
