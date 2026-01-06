import { useState, lazy, Suspense } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore, useIsAdmin } from '@/store/auth'
import { useLogout } from '@/hooks/auth/use-logout'
import { useCreateReceipt } from '@/hooks/receipts/use-receipts'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { Menu, X, LayoutDashboard, Receipt, FolderOpen, Users, Shield, Settings, QrCode, UserCog } from 'lucide-react'
import { toast } from 'sonner'

const QrScanner = lazy(() => import('@/components/receipts/qr-scanner').then(m => ({ default: m.QrScanner })))

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
  const createReceipt = useCreateReceipt()

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

  return (
    <div className="min-h-dvh bg-background">
      {/* Mobile header */}
      <header className="fixed left-0 right-0 top-0 z-40 flex h-14 items-center justify-between border-b bg-card px-4 md:hidden">
        <h1 className="text-xl font-bold">{t('common.appName')}</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleScanQr}
          aria-label="Scan QR Code"
          className="[&_svg]:!size-7"
        >
          <QrCode />
        </Button>
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
          <div className="flex items-center justify-between border-b px-6 py-4">
            <h1 className="text-2xl font-bold">{t('common.appName')}</h1>
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
            {mainNavItems.map((item) => (
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
            <div className="mt-3 text-center text-xs text-muted-foreground">
              {t('nav.version')} {__APP_VERSION__}
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="pt-14 md:pl-64 md:pt-0">
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
    </div>
  )
}
