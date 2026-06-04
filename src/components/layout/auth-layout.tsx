import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Heart, QrCode, PieChart, ShieldCheck, TrendingDown, ShoppingCart } from 'lucide-react'
import { Logo } from '@/components/ui/logo'
import { LanguageSwitcher } from '@/components/ui/language-switcher'
import { BrandWash } from '@/components/glass/glass'
import { cn } from '@/lib/utils'

interface AuthLayoutProps {
  children: React.ReactNode
  /** Tailwind max-width class for the glass card (Sign Up is taller/wider). */
  cardClassName?: string
}

const features = [
  { icon: QrCode, key: 'auth.brandFeature1' },
  { icon: PieChart, key: 'auth.brandFeature2' },
  { icon: ShieldCheck, key: 'auth.brandFeature3' },
] as const

/* Decorative floating mini-dashboard for the desktop brand panel */
function MiniDashboard() {
  return (
    <div aria-hidden className="pointer-events-none absolute right-10 top-1/2 hidden -translate-y-1/2 xl:block">
      <div className="flex w-[258px] flex-col gap-3.5">
        <div className="glass-card -rotate-3 p-[18px]">
          <div className="mb-2.5 flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-muted-foreground">This month</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-[11.5px] font-semibold text-emerald-600 dark:text-emerald-400">
              <TrendingDown className="size-3" /> 12%
            </span>
          </div>
          <div className="text-[34px] font-extrabold leading-none tracking-tight">
            €1,284<span className="text-muted-foreground">.50</span>
          </div>
          <div className="mt-3.5 h-[7px] overflow-hidden rounded-full bg-muted">
            <div className="bg-brand-gradient h-full" style={{ width: '64%' }} />
          </div>
          <div className="mt-2 text-[12px] font-medium text-muted-foreground">€1,284 of €2,000 budget · 32 receipts</div>
        </div>
        <div className="glass-card flex translate-x-7 rotate-2 items-center gap-3 px-3.5 py-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-[11px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <ShoppingCart className="size-4" />
          </span>
          <div className="flex-1">
            <div className="text-[14px] font-semibold text-foreground">Maxi</div>
            <div className="text-[11.5px] font-medium text-muted-foreground">Groceries · QR scanned</div>
          </div>
          <div className="text-[15px] font-bold">€48.20</div>
        </div>
      </div>
    </div>
  )
}

export function AuthLayout({ children, cardClassName }: AuthLayoutProps) {
  const { t } = useTranslation()

  return (
    <div className="auth-emerald relative flex min-h-dvh flex-col overflow-hidden bg-background lg:flex-row">
      <BrandWash />

      {/* Desktop brand panel */}
      <aside className="relative z-10 hidden border-r border-border p-11 lg:flex lg:w-[54%] lg:flex-col lg:overflow-hidden">
        <div className="flex items-center justify-between">
          <Logo size="md" />
        </div>

        <div className="mt-auto">
          <h1 className="max-w-[420px] text-[40px] font-extrabold leading-[1.05] tracking-[-0.025em] text-foreground">
            {t('auth.brandTagline')}
          </h1>
          <ul className="mt-7 flex max-w-[400px] flex-col gap-3">
            {features.map((feature) => (
              <li key={feature.key} className="flex items-center gap-3">
                <span className="grid size-[38px] shrink-0 place-items-center rounded-[11px] border border-border bg-card text-primary shadow-sm">
                  <feature.icon className="size-[18px]" />
                </span>
                <span className="text-[15px] font-semibold text-foreground">{t(feature.key)}</span>
              </li>
            ))}
          </ul>
        </div>

        <MiniDashboard />
      </aside>

      {/* Form side */}
      <div className="relative z-10 flex flex-1 flex-col">
        {/* Mobile chrome (edge-to-edge, behind the status bar) */}
        <div className="flex items-center justify-between px-5 pt-[max(2rem,env(safe-area-inset-top))] lg:hidden">
          <Logo size="sm" />
          <LanguageSwitcher syncBackend={false} />
        </div>

        {/* Desktop language switcher */}
        <div className="hidden items-center justify-end p-8 lg:flex">
          <LanguageSwitcher syncBackend={false} />
        </div>

        <main className="flex flex-1 items-center justify-center px-4 py-5 sm:px-6 lg:px-11 lg:py-2">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
            className={cn('glass-card w-full p-7 sm:p-8', cardClassName ?? 'max-w-[400px]')}
          >
            {children}
          </motion.div>
        </main>

        <footer className="px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 text-center lg:p-6">
          <p className="text-xs font-medium text-muted-foreground/70">
            &copy; {new Date().getFullYear()} {t('common.appName')}. {t('common.allRightsReserved')}
          </p>
          <a
            href="https://paypal.me/receipto"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground/70 transition-colors hover:text-foreground"
          >
            <Heart className="size-3" />
            {t('nav.supportUs')}
          </a>
        </footer>
      </div>
    </div>
  )
}
