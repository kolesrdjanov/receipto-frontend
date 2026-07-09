import { cn } from '@/lib/utils'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  className?: string
}

const sizeConfig = {
  sm: { box: 'size-8 rounded-[9px]', glyph: 'size-[18px]', text: 'text-[15px]' },
  md: { box: 'size-10 rounded-xl', glyph: 'size-[22px]', text: 'text-[17px]' },
  lg: { box: 'size-12 rounded-2xl', glyph: 'size-[26px]', text: 'text-[19px]' },
}

/** Luma receipt mark — a near-black rounded square with a white receipt glyph.
 *  Monochrome by design (the old gradient asset is retired). */
export function LogoMark({ className, glyphClassName }: { className?: string; glyphClassName?: string }) {
  return (
    <span className={cn('grid shrink-0 place-items-center bg-primary text-primary-foreground', className)}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={glyphClassName}
        aria-hidden
      >
        <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
        <path d="M8 8h8" />
        <path d="M8 12h8" />
        <path d="M8 16h5" />
      </svg>
    </span>
  )
}

export function Logo({ size = 'md', showText = true, className }: LogoProps) {
  const c = sizeConfig[size]
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <LogoMark className={c.box} glyphClassName={c.glyph} />
      {showText && (
        <span className={cn('font-semibold tracking-[-0.01em] text-foreground', c.text)}>Receipto</span>
      )}
    </div>
  )
}
