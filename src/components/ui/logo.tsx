import { cn } from '@/lib/utils'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  className?: string
}

const sizeConfig = {
  sm: { container: 'h-8 w-8', text: 'text-lg', gap: 'gap-2' },
  md: { container: 'h-10 w-10', text: 'text-2xl', gap: 'gap-2.5' },
  lg: { container: 'h-12 w-12', text: 'text-3xl', gap: 'gap-3' },
}

function ReceiptIcon({ className }: { className?: string }) {
  return (
      <svg viewBox="0 0 512 512" className={className}>
          <defs>
              <linearGradient id="logo-bg" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#10b981"></stop>
                  <stop offset="100%" stop-color="#06b6d4"></stop>
              </linearGradient>
              <linearGradient id="logo-icon" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#ffffff"></stop>
                  <stop offset="100%" stop-color="#f0fdfa"></stop>
              </linearGradient>
          </defs>
          <rect width="512" height="512" rx="96" fill="url(#logo-bg)"></rect>
          <path d="M156 88h200c13.3 0 24 10.7 24 24v288l-40-24-40 24-44-24-44 24-40-24-40 24V112c0-13.3 10.7-24 24-24z"
                fill="url(#logo-icon)"></path>
          <rect x="188" y="152" width="136" height="20" rx="4" fill="#10b981" opacity="0.3"></rect>
          <rect x="188" y="196" width="100" height="20" rx="4" fill="#10b981" opacity="0.3"></rect>
          <rect x="188" y="240" width="120" height="20" rx="4" fill="#10b981" opacity="0.3"></rect>
          <rect x="188" y="300" width="80" height="24" rx="4" fill="#10b981" opacity="0.4"></rect>
      </svg>
  )
}

export function Logo({size = 'md', showText = true, className}: LogoProps) {
    const config = sizeConfig[size]

    return (
        <div className={cn('flex items-center', config.gap, className)}>
            <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full scale-150"/>
                <ReceiptIcon className={cn(config.container, 'relative')}/>
            </div>
            {showText && (
                <span className={cn(config.text, 'font-bold tracking-tight')}>
          Receipto
        </span>
            )}
        </div>
    )
}
