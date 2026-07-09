import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Heart, QrCode, PieChart, ShieldCheck } from 'lucide-react'
import { Logo } from '@/components/ui/logo'
import { LanguageSwitcher } from '@/components/ui/language-switcher'
import { cn } from '@/lib/utils'

interface AuthLayoutProps {
  children: React.ReactNode
  /** Tailwind max-width class for the form card (Sign Up is taller/wider). */
  cardClassName?: string
}

const features = [
  { icon: QrCode, key: 'auth.brandFeature1' },
  { icon: PieChart, key: 'auth.brandFeature2' },
  { icon: ShieldCheck, key: 'auth.brandFeature3' },
] as const

export function AuthLayout({ children, cardClassName }: AuthLayoutProps) {
  const { t } = useTranslation()

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-background lg:flex-row">
      {/* Desktop brand panel — near-black --primary fill (inverts in dark) */}
      <aside className="relative z-10 hidden bg-primary p-11 text-primary-foreground lg:flex lg:w-[54%] lg:flex-col">
        <Logo size="md" onPrimary />

        <div className="mt-auto">
          <h1 className="max-w-[420px] text-[40px] font-extrabold leading-[1.05] tracking-[-0.025em]">
            {t('auth.brandTagline')}
          </h1>
          <ul className="mt-8 flex max-w-[400px] flex-col gap-3.5">
            {features.map((feature) => (
              <li key={feature.key} className="flex items-center gap-3">
                <span className="grid size-[38px] shrink-0 place-items-center rounded-[11px] bg-primary-foreground/10">
                  <feature.icon className="size-[18px]" />
                </span>
                <span className="text-[15px] font-semibold">{t(feature.key)}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-14 text-xs font-medium text-primary-foreground/60">
          &copy; {new Date().getFullYear()} {t('common.appName')}. {t('common.allRightsReserved')}
        </p>
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
          {/* © lives in the brand panel on desktop; keep it here for mobile only */}
          <p className="text-xs font-medium text-muted-foreground/70 lg:hidden">
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
