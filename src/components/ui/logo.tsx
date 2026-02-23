import { cn } from '@/lib/utils'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  className?: string
}

const sizeConfig = {
  sm: { icon: 'h-8 w-8', full: 'h-8' },
  md: { icon: 'h-10 w-10', full: 'h-10' },
  lg: { icon: 'h-12 w-12', full: 'h-12' },
}

export function Logo({ size = 'md', showText = true, className }: LogoProps) {
  const config = sizeConfig[size]

  if (showText) {
    return (
      <div className={cn('flex items-center', className)}>
        <img src="/logo-full.svg" alt="Receipto" className={cn(config.full, 'w-auto')} />
      </div>
    )
  }

  return (
    <div className={cn('flex items-center', className)}>
      <img src="/logo-icon.svg" alt="Receipto" className={cn(config.icon)} />
    </div>
  )
}
