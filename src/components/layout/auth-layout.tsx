import { useTranslation } from 'react-i18next'
import { Heart, QrCode, PieChart, Shield } from 'lucide-react'
import { Logo } from '@/components/ui/logo'
import { PageTransition } from '@/components/ui/animated'

interface AuthLayoutProps {
  children: React.ReactNode
}

const features = [
  { icon: QrCode, key: 'auth.brandFeature1' },
  { icon: PieChart, key: 'auth.brandFeature2' },
  { icon: Shield, key: 'auth.brandFeature3' },
] as const

export function AuthLayout({ children }: AuthLayoutProps) {
  const { t } = useTranslation()

  return (
    <div className="min-h-dvh flex flex-col lg:flex-row">
      {/* Mobile branded header */}
      <div className="lg:hidden bg-gradient-to-r from-primary to-primary/80 px-6 py-4">
        <Logo size="sm" className="text-primary-foreground [&_span]:text-primary-foreground" />
      </div>

      {/* Form side */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Desktop logo */}
        <header className="hidden lg:block p-8">
          <Logo size="md" />
        </header>

        {/* Centered form content */}
        <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
          <div className="w-full max-w-md">
            <PageTransition>
              {children}
            </PageTransition>
          </div>
        </main>

        {/* Footer */}
        <footer className="p-4 lg:p-6 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} {t('common.appName')}. {t('common.allRightsReserved')}</p>
          <a
            href="https://paypal.me/receipto"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
          >
            <Heart className="h-3 w-3" />
            {t('nav.supportUs')}
          </a>
        </footer>
      </div>

      {/* Branded panel (desktop only) */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[540px] relative overflow-hidden bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground flex-col items-center justify-center p-12">
        {/* Decorative orbs */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-white/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3" />

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        {/* Content */}
        <div className="relative z-10 text-center space-y-8">
          <Logo size="lg" className="justify-center text-primary-foreground [&_span]:text-primary-foreground" />

          <p className="text-xl font-medium text-primary-foreground/90">
            {t('auth.brandTagline')}
          </p>

          <div className="space-y-4 text-left">
            {features.map((feature) => (
              <div key={feature.key} className="flex items-center gap-3">
                <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-white/15 flex items-center justify-center">
                  <feature.icon className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium text-primary-foreground/85">
                  {t(feature.key)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
