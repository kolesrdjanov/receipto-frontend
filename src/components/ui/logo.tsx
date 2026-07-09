import { cn } from '@/lib/utils'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  className?: string
}

const sizeConfig = {
  sm: { box: 'size-8', text: 'text-[15px]' },
  md: { box: 'size-10', text: 'text-[17px]' },
  lg: { box: 'size-12', text: 'text-[19px]' },
}

const R_MONOGRAM =
  'M60.06 0L22.12 0L22.12-210.94L114.11-210.94Q188.67-210.94 188.67-152.05L188.67-152.05Q188.67-103.56 136.23-94.78L136.23-94.78L190.72 0L147.95 0L94.92-92.87L60.06-92.87L60.06 0ZM60.06-181.05L60.06-122.90L112.50-122.90Q130.81-122.90 140.70-130.30Q150.59-137.70 150.59-151.76Q150.59-165.82 140.55-173.44Q130.52-181.05 112.06-181.05L112.06-181.05L60.06-181.05Z'

/** Receipto brand mark — charcoal rounded square + white "R" monogram.
 *  Inlined from public/brand/receipto-icon.svg so it scales crisply at nav sizes.
 *  Colors are brand constants: the mark does not invert with the theme.
 *  `onPrimary` renders a token-driven inverse (primary-foreground square + primary
 *  glyph) for surfaces filled with `--primary`, e.g. the auth brand panel. */
export function LogoMark({ className, onPrimary = false }: { className?: string; onPrimary?: boolean }) {
  return (
    <svg viewBox="0 0 512 512" className={cn('shrink-0', className)} aria-hidden>
      <rect width="512" height="512" rx="115.2" fill={onPrimary ? 'var(--primary-foreground)' : '#343434'} />
      <g transform="translate(149.58,361.47)">
        <path d={R_MONOGRAM} fill={onPrimary ? 'var(--primary)' : '#fbfbfb'} />
      </g>
    </svg>
  )
}

export function Logo({ size = 'md', showText = true, className, onPrimary = false }: LogoProps & { onPrimary?: boolean }) {
  const c = sizeConfig[size]
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <LogoMark className={c.box} onPrimary={onPrimary} />
      {showText && (
        <span
          className={cn(
            'font-semibold tracking-[-0.01em]',
            onPrimary ? 'text-primary-foreground' : 'text-foreground',
            c.text,
          )}
        >
          Receipto
        </span>
      )}
    </div>
  )
}
