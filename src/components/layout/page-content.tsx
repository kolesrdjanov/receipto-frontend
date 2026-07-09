import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * Capped, centered page-content container (handoff: content `max-width: ~1180px`,
 * 28px gutters). The {@link PageToolbar} band above it spans the FULL app width —
 * only the content below is capped. Mobile spacing (px-4, safe-area top, tab-bar
 * bottom clearance) lives on the layout's <main>; this adds the desktop gutters.
 * Pages with a tighter design cap (Settings 1000, Categories 880…) keep their own
 * narrower container inside this one.
 */
export function PageContent({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('mx-auto w-full max-w-[1180px] md:px-7 md:pb-8', className)}>{children}</div>
}
