import { useState, useEffect, lazy, Suspense } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore, useIsAdmin } from '@/store/auth'
import { useLogout } from '@/hooks/auth/use-logout'
import { useCreateReceipt } from '@/hooks/receipts/use-receipts'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { Menu, X, LayoutDashboard, Receipt, FolderOpen, Users, Shield, Settings, QrCode, UserCog, MessageCircle, Heart, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'
import type { PfrData } from '@/components/receipts/pfr-entry-modal'
import { ContactSupportModal } from '@/components/support/contact-support-modal'
import { OnboardingModal } from '@/components/onboarding/onboarding-modal'

const QrScanner = lazy(() => import('@/components/receipts/qr-scanner').then(m => ({ default: m.QrScanner })))
const PfrEntryModal = lazy(() => import('@/components/receipts/pfr-entry-modal').then(m => ({ default: m.PfrEntryModal })))

interface AppLayoutProps {
  children: React.ReactNode
}

const mainNavItems = [
  { path: '/dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard },
  { path: '/receipts', labelKey: 'nav.receipts', icon: Receipt },
  { path: '/items', labelKey: 'nav.priceTracker', icon: TrendingUp },
  { path: '/categories', labelKey: 'nav.categories', icon: FolderOpen },
  { path: '/groups', labelKey: 'nav.groups', icon: Users },
  { path: '/warranties', labelKey: 'nav.warranties', icon: Shield },
  { path: '/settings', labelKey: 'nav.settings', icon: Settings },
]

const adminNavItems = [
  { path: '/admin/users', labelKey: 'nav.users', icon: UserCog },
]

export function AppLayout({ children }: AppLayoutProps) {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const logout = useLogout()
  const isAdmin = useIsAdmin()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [isPfrEntryOpen, setIsPfrEntryOpen] = useState(false)
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false)
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false)
  const createReceipt = useCreateReceipt()

  // Show onboarding on first login
  useEffect(() => {
    if (user && localStorage.getItem('receipto-onboarding-completed') !== 'true') {
      setIsOnboardingOpen(true)
    }
  }, [user])

  const closeSidebar = () => setSidebarOpen(false)

  const handleScanQr = () => {
    setIsScannerOpen(true)
  }

  const handleQrScan = async (url: string) => {
    try {
      await createReceipt.mutateAsync({ qrCodeUrl: url })
      toast.success(t('receipts.qrScanner.scanSuccess'), {
        description: t('receipts.qrScanner.scanSuccessDescription'),
      })
      setIsScannerOpen(false)
      // Navigate to receipts page if not already there
      if (location.pathname !== '/receipts') {
        navigate('/receipts')
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'An error occurred'
      toast.error(t('receipts.qrScanner.scanError'), {
        description: errorMessage,
      })
    }
  }

  const handleOcrScan = async (pfrData: PfrData) => {
    // Call API with PFR data to fetch full receipt from fiscal system
    try {
      await createReceipt.mutateAsync({
        pfrData: {
          InvoiceNumberSe: pfrData.InvoiceNumberSe,
          InvoiceCounter: pfrData.InvoiceCounter,
          InvoiceCounterExtension: pfrData.InvoiceCounterExtension,
          TotalAmount: pfrData.TotalAmount,
          SdcDateTime: pfrData.SdcDateTime,
        },
      })
      toast.success(t('receipts.qrScanner.scanSuccess'), {
        description: t('receipts.qrScanner.scanSuccessDescription'),
      })
      setIsPfrEntryOpen(false)
      // Navigate to receipts page
      if (location.pathname !== '/receipts') {
        navigate('/receipts')
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'An error occurred'
      toast.error(t('receipts.qrScanner.scanError'), {
        description: errorMessage,
      })
    }
  }

  return (
    <div className="min-h-dvh bg-background">
      {/* Mobile header */}
      <header className="fixed left-0 right-0 top-0 z-40 flex h-14 items-center justify-between border-b bg-card px-4 pt-[env(safe-area-inset-top)] md:hidden">
        <Link to={'/dashboard'}>
          <h1 className="text-2xl font-bold">{t('common.appName')}</h1>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
          className="[&_svg]:!size-7"
        >
          <Menu />
        </Button>
      </header>

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-full w-64 border-r bg-card transition-transform duration-200 ease-in-out md:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo/Brand */}
          <div className="flex items-center justify-between border-b px-6 py-4 pt-[calc(1rem+env(safe-area-inset-top))] md:pt-4">
            <Link to={'/dashboard'}>
              <h1 className="text-2xl font-bold">{t('common.appName')}</h1>
            </Link>
            {!sidebarOpen && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleScanQr}
                aria-label="Scan QR Code"
                className="[&_svg]:!size-7"
              >
                <QrCode />
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden [&_svg]:!size-7"
              onClick={closeSidebar}
              aria-label="Close menu"
            >
              <X />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2 p-4">
            {mainNavItems.map((item) => {
              // Highlight receipts when on templates page
              const isActive = location.pathname === item.path ||
                (item.path === '/receipts' && location.pathname === '/templates')

              return (
                <Link key={item.path} to={item.path} onClick={closeSidebar}>
                  <div
                    className={cn(
                      'flex items-center gap-3 rounded-md px-3 py-3 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {t(item.labelKey)}
                  </div>
                </Link>
              )
            })}

            {/* Admin Navigation Section */}
            {isAdmin && (
              <>
                <div className="pt-4 pb-2">
                  <div className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {t('nav.admin')}
                  </div>
                </div>
                {adminNavItems.map((item) => (
                  <Link key={item.path} to={item.path} onClick={closeSidebar}>
                    <div
                      className={cn(
                        'flex items-center gap-3 rounded-md px-3 py-3 text-sm font-medium transition-colors',
                        location.pathname === item.path
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-accent hover:text-accent-foreground'
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {t(item.labelKey)}
                    </div>
                  </Link>
                ))}
              </>
            )}
          </nav>

          {/* User section */}
          <div className="border-t p-4">
            <div className="mb-3 flex items-center gap-3 px-3">
              <Avatar
                firstName={user?.firstName}
                lastName={user?.lastName}
                imageUrl={user?.profileImageUrl}
                size="md"
              />
              <div className="flex-1 overflow-hidden text-sm">
                <p className="truncate font-medium">
                  {user?.firstName || user?.lastName
                    ? `${user?.firstName || ''} ${user?.lastName || ''}`.trim()
                    : user?.email}
                </p>
                <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            <Button variant="outline" className="w-full" onClick={logout}>
              {t('nav.logout')}
            </Button>
            <Button
              variant="ghost"
              className="w-full mt-2"
              onClick={() => setIsSupportModalOpen(true)}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              {t('support.contactSupport')}
            </Button>
            <div className="mt-3 text-center text-xs text-muted-foreground">
              {t('nav.version')} {__APP_VERSION__}
            </div>
            <a
              href="https://paypal.me/receipto"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Heart className="h-3 w-3" />
              {t('nav.supportUs')}
            </a>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="pt-[calc(3.5rem+env(safe-area-inset-top))] md:pl-64 md:pt-0">
        <main className="container mx-auto px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>

      {/* QR Scanner */}
      <Suspense fallback={null}>
        <QrScanner
          open={isScannerOpen}
          onOpenChange={setIsScannerOpen}
          onScan={handleQrScan}
        />
      </Suspense>

      {/* PFR Entry Modal */}
      <Suspense fallback={null}>
        <PfrEntryModal
          open={isPfrEntryOpen}
          onOpenChange={setIsPfrEntryOpen}
          onSubmit={handleOcrScan}
        />
      </Suspense>

      {/* Contact Support Modal */}
      <ContactSupportModal
        open={isSupportModalOpen}
        onOpenChange={setIsSupportModalOpen}
      />

      {/* Onboarding Modal */}
      <OnboardingModal
        open={isOnboardingOpen}
        onOpenChange={setIsOnboardingOpen}
      />
    </div>
  )
}
