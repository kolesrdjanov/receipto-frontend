import { Receipt } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  className?: string
}

const sizeConfig = {
  sm: { icon: 'h-6 w-6', text: 'text-lg', gap: 'gap-1.5' },
  md: { icon: 'h-8 w-8', text: 'text-2xl', gap: 'gap-2' },
  lg: { icon: 'h-10 w-10', text: 'text-3xl', gap: 'gap-2.5' },
}

export function Logo({ size = 'md', showText = true, className }: LogoProps) {
  const config = sizeConfig[size]

  return (
    <div className={cn('flex items-center', config.gap, className)}>
      <div className="relative">
        <div className="absolute inset-0 bg-primary/20 blur-lg rounded-full" />
        <div className="relative bg-gradient-to-br from-primary to-primary/80 p-2 rounded-xl shadow-lg">
          <Receipt className={cn(config.icon, 'text-primary-foreground')} />
        </div>
      </div>
      {showText && (
        <span className={cn(config.text, 'font-bold tracking-tight')}>
          Receipto
        </span>
      )}
    </div>
  )
}
