import { useState, useEffect, useRef, lazy, Suspense } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore, useIsAdmin } from '@/store/auth'
import { useLogout } from '@/hooks/auth/use-logout'
import { useCreateReceipt } from '@/hooks/receipts/use-receipts'
import { useMe } from '@/hooks/users/use-me'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { Menu, X, LayoutDashboard, Receipt, FolderOpen, Users, Shield, Settings, QrCode, UserCog, MessageCircle, Heart, Compass, Sparkles, Crown, Star } from 'lucide-react'
import { toast } from 'sonner'
import type { PfrData } from '@/components/receipts/pfr-entry-modal'
import { ContactSupportModal } from '@/components/support/contact-support-modal'
import { OnboardingModal } from '@/components/onboarding/onboarding-modal'
import { RateAppModal } from '@/components/rating/rate-app-modal'
import { normalizeRank, type ReceiptRank } from '@/lib/rank'

const QrScanner = lazy(() => import('@/components/receipts/qr-scanner').then(m => ({ default: m.QrScanner })))
const PfrEntryModal = lazy(() => import('@/components/receipts/pfr-entry-modal').then(m => ({ default: m.PfrEntryModal })))

interface AppLayoutProps {
  children: React.ReactNode
}

const mainNavItems = [
  { path: '/dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard },
  { path: '/receipts', labelKey: 'nav.receipts', icon: Receipt },
  { path: '/categories', labelKey: 'nav.categories', icon: FolderOpen },
  { path: '/groups', labelKey: 'nav.groups', icon: Users },
  { path: '/warranties', labelKey: 'nav.warranties', icon: Shield },
  { path: '/settings', labelKey: 'nav.settings', icon: Settings },
]

const adminNavItems = [
  { path: '/admin/users', labelKey: 'nav.users', icon: UserCog },
  { path: '/admin/ratings', labelKey: 'nav.ratings', icon: Star },
]

export function AppLayout({ children }: AppLayoutProps) {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { data: me } = useMe(!!user)
  const logout = useLogout()
  const isAdmin = useIsAdmin()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [isPfrEntryOpen, setIsPfrEntryOpen] = useState(false)
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false)
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false)
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false)
  const createReceipt = useCreateReceipt()

  const receiptCount = me?.receiptCount ?? 0
  const receiptRank = normalizeRank(me?.receiptRank as ReceiptRank | undefined, receiptCount)
  const rankName = receiptRank === 'status_a'
    ? t('settings.profile.rank.names.statusA')
    : receiptRank === 'status_b'
      ? t('settings.profile.rank.names.statusB')
      : receiptRank === 'status_c'
        ? t('settings.profile.rank.names.statusC')
        : t('settings.profile.rank.names.noStatus')
  const rankVisual = receiptRank === 'status_a'
    ? { icon: Crown, className: 'text-amber-400 bg-amber-500/10 border-amber-400/25' }
    : receiptRank === 'status_b'
      ? { icon: Sparkles, className: 'text-blue-400 bg-blue-500/10 border-blue-400/25' }
      : receiptRank === 'status_c'
        ? { icon: Compass, className: 'text-emerald-400 bg-emerald-500/10 border-emerald-400/25' }
        : { icon: Compass, className: 'text-muted-foreground bg-muted/40 border-border' }

  // Show onboarding on first login
  useEffect(() => {
    if (user && localStorage.getItem('receipto-onboarding-completed') !== 'true') {
      setIsOnboardingOpen(true)
    }
  }, [user])

  const closeSidebar = () => setSidebarOpen(false)

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [sidebarOpen])

  // Swipe left to close sidebar on mobile
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return
    const deltaX = e.changedTouches[0].clientX - touchStartX.current
    const deltaY = e.changedTouches[0].clientY - touchStartY.current
    if (deltaX < -50 && Math.abs(deltaY) < Math.abs(deltaX)) {
      closeSidebar()
    }
    touchStartX.current = null
    touchStartY.current = null
  }

  const handleScanQr = () => {
    setIsScannerOpen(true)
  }

  const handleQrScan = async (url: string) => {
    try {
      await createReceipt.mutateAsync({ qrCodeUrl: url })
      toast.success(t('receipts.qrScanner.scanSuccess'), {
        description: t('receipts.qrScanner.scanSuccessDescription'),
        action: {
          label: t('nav.receipts'),
          onClick: () => navigate('/receipts'),
        },
      })
      setIsScannerOpen(false)
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
        action: {
          label: t('nav.receipts'),
          onClick: () => navigate('/receipts'),
        },
      })
      setIsPfrEntryOpen(false)
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'An error occurred'
      toast.error(t('receipts.qrScanner.scanError'), {
        description: errorMessage,
      })
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile header */}
      <header className="fixed left-0 right-0 top-0 z-40 flex h-[calc(3.5rem+env(safe-area-inset-top))] items-center justify-between border-b px-4 pt-[env(safe-area-inset-top)] md:hidden sidebar-glass">
        <Link to={'/dashboard'}>
          <h1 className="text-2xl font-bold text-primary">{t('common.appName')}</h1>
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
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-full w-64 sidebar-glass transition-transform duration-200 ease-in-out md:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex h-full flex-col">
          {/* Logo/Brand */}
          <div className="flex items-center justify-between border-b border-border/50 px-6 py-4 pt-[calc(1rem+env(safe-area-inset-top))] md:pt-4">
            <Link to={'/dashboard'}>
              <h1 className="text-2xl font-bold text-primary">{t('common.appName')}</h1>
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
              // Highlight navigation items when on sub-pages
              const isActive = location.pathname === item.path ||
                (item.path === '/receipts' && location.pathname === '/templates') ||
                (item.path === '/groups' && location.pathname.startsWith('/groups/'))

              return (
                <Link key={item.path} to={item.path} onClick={closeSidebar}>
                  <div
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all duration-300',
                      isActive
                        ? 'nav-item-glow text-white'
                        : 'hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    <item.icon className={cn("h-4 w-4", isActive && "icon-glow")} />
                    {t(item.labelKey)}
                  </div>
                </Link>
              )
            })}

            {/* Admin Navigation Section */}
            {isAdmin && (
              <>
                <div className="pt-4 pb-2 mt-2 border-t border-border/50">
                  <div className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <div className="h-1 w-1 rounded-full bg-orange-500"></div>
                    {t('nav.admin')}
                  </div>
                </div>
                {adminNavItems.map((item) => {
                  const isAdminItemActive = location.pathname.startsWith(item.path)

                  return (
                    <Link key={item.path} to={item.path} onClick={closeSidebar}>
                      <div
                        className={cn(
                          'flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all duration-300',
                          isAdminItemActive
                            ? 'nav-item-glow text-white'
                            : 'hover:bg-accent hover:text-accent-foreground'
                        )}
                      >
                        <item.icon className={cn("h-4 w-4", isAdminItemActive && "icon-glow")} />
                        {t(item.labelKey)}
                      </div>
                    </Link>
                  )
                })}
              </>
            )}
          </nav>

          {/* User section */}
          <div className="border-t border-border/50 p-4 bg-gradient-to-t from-muted/30 to-transparent">
            <div className="mb-3 flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/30">
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
            <div className={cn('mb-3 rounded-lg border px-3 py-2 text-xs flex items-center justify-between', rankVisual.className)}>
              <span className="font-medium">{t('nav.rank')}</span>
              <span className="inline-flex items-center gap-1.5 font-semibold">
                <rankVisual.icon className="h-3.5 w-3.5" />
                {rankName}
              </span>
            </div>
            <Button variant="outline" className="w-full hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 transition-all duration-300" onClick={logout}>
              {t('nav.logout')}
            </Button>
            <Button
              variant="ghost"
              className="w-full mt-2"
              onClick={() => setIsRatingModalOpen(true)}
            >
              <Star className="h-4 w-4" />
              {t('rating.rateApp')}
            </Button>
            <Button
              variant="ghost"
              className="w-full mt-2"
              onClick={() => setIsSupportModalOpen(true)}
            >
              <MessageCircle className="h-4 w-4" />
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
      <div className="pt-[calc(3.5rem+env(safe-area-inset-top))] md:pl-64 md:pt-0 page-bg-gradient min-h-screen">
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

      {/* Rate App Modal */}
      <RateAppModal
        open={isRatingModalOpen}
        onOpenChange={setIsRatingModalOpen}
      />

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
