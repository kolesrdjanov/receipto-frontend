import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/store/auth'
import { useLogout } from '@/hooks/auth/use-logout'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Menu, X, LayoutDashboard, Receipt, FolderOpen, Users, Shield, Settings } from 'lucide-react'

interface AppLayoutProps {
  children: React.ReactNode
}

const navItems = [
  { path: '/dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard },
  { path: '/receipts', labelKey: 'nav.receipts', icon: Receipt },
  { path: '/categories', labelKey: 'nav.categories', icon: FolderOpen },
  { path: '/groups', labelKey: 'nav.groups', icon: Users },
  { path: '/warranties', labelKey: 'nav.warranties', icon: Shield },
  { path: '/settings', labelKey: 'nav.settings', icon: Settings },
]

export function AppLayout({ children }: AppLayoutProps) {
  const { t } = useTranslation()
  const location = useLocation()
  const { user } = useAuthStore()
  const logout = useLogout()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const closeSidebar = () => setSidebarOpen(false)

  return (
    <div className="min-h-dvh bg-background">
      {/* Mobile header */}
      <header className="fixed left-0 right-0 top-0 z-40 flex h-14 items-center justify-between border-b bg-card px-4 md:hidden">
        <h1 className="text-xl font-bold">{t('common.appName')}</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6" />
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
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={closeSidebar}
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            {navItems.map((item) => (
              <Link key={item.path} to={item.path} onClick={closeSidebar}>
                <div
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
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
          </nav>

          {/* User section */}
          <div className="border-t p-4">
            <div className="mb-2 px-3 text-sm">
              <p className="font-medium">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <Button variant="outline" className="w-full" onClick={logout}>
              {t('nav.logout')}
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="pt-14 md:pl-64 md:pt-0">
        <main className="container mx-auto px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  )
}
