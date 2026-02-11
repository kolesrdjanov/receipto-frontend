import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore, useIsAdmin } from '@/store/auth'
import { useSettingsStore } from '@/store/settings'
import { useLogout } from '@/hooks/auth/use-logout'
import { useMe } from '@/hooks/users/use-me'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { Menu, X, LayoutDashboard, Receipt, FolderOpen, Users, Shield, Settings, UserCog, MessageCircle, Heart, Compass, Sparkles, Crown, Star, Megaphone, EllipsisVertical, LogOut, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { ContactSupportModal } from '@/components/support/contact-support-modal'
import { AnnouncementDrawer, useAnnouncementIndicator } from '@/components/announcements/announcement-list'
import { OnboardingModal } from '@/components/onboarding/onboarding-modal'
import { RateAppModal } from '@/components/rating/rate-app-modal'
import { normalizeRank, type ReceiptRank } from '@/lib/rank'

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
  { path: '/admin/announcements', labelKey: 'nav.announcements', icon: Megaphone },
]

export function AppLayout({ children }: AppLayoutProps) {
  const { t } = useTranslation()
  const location = useLocation()
  const { user } = useAuthStore()
  const { data: me } = useMe(!!user)
  const logout = useLogout()
  const isAdmin = useIsAdmin()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false)
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false)
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false)
  const [isAnnouncementsOpen, setIsAnnouncementsOpen] = useState(false)
  const { hasAnnouncements } = useAnnouncementIndicator()

  // Desktop sidebar collapsed state (persisted)
  const { sidebarCollapsed, setSidebarCollapsed } = useSettingsStore()

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

  // collapsed = desktop only state
  const collapsed = sidebarCollapsed

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile header */}
      <header className="fixed left-0 right-0 top-0 z-40 flex h-[calc(3.5rem+env(safe-area-inset-top))] items-center justify-between border-b px-4 pt-[env(safe-area-inset-top)] md:hidden sidebar-glass">
        <div className="flex items-center gap-2">
          <Link to={'/dashboard'}>
            <h1 className="text-2xl font-bold text-primary font-display">{t('common.appName')}</h1>
          </Link>
          <button
            onClick={() => setIsAnnouncementsOpen(true)}
            className="relative p-1.5 rounded-md text-muted-foreground hover:text-foreground transition-colors"
            aria-label={t('announcements.title')}
          >
            <Megaphone className="h-4 w-4" />
            {hasAnnouncements && (
              <span className="absolute top-0.5 right-0.5 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            )}
          </button>
        </div>
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
          'fixed left-0 top-0 z-50 h-full sidebar-glass transition-all duration-200 ease-in-out md:translate-x-0',
          // Mobile: full width, slide in/out
          'w-full md:w-64',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          // Desktop collapsed
          collapsed && 'md:w-[4.5rem]'
        )}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex h-full flex-col">
          {/* Logo/Brand */}
          <div className={cn(
            'flex items-center justify-between border-b border-border/50 py-4 pt-[calc(1rem+env(safe-area-inset-top))] md:pt-4',
            collapsed ? 'md:px-2' : 'px-6'
          )}>
            {/* Mobile: always show full logo + announcements */}
            <div className={cn('flex items-center gap-2', collapsed && 'md:hidden')}>
              <Link to={'/dashboard'}>
                <h1 className="text-2xl font-bold text-primary font-display">{t('common.appName')}</h1>
              </Link>
              <button
                onClick={() => setIsAnnouncementsOpen(true)}
                className="relative p-1.5 rounded-md text-muted-foreground hover:text-foreground transition-colors"
                aria-label={t('announcements.title')}
              >
                <Megaphone className="h-4 w-4" />
                {hasAnnouncements && (
                  <span className="absolute top-0.5 right-0.5 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                )}
              </button>
            </div>
            {/* Desktop collapsed: show just "R" logo */}
            {collapsed && (
              <Link to={'/dashboard'} className="hidden md:block relative">
                <span className="text-xl font-bold text-primary font-display">R</span>
                {hasAnnouncements && (
                  <span className="absolute -top-0.5 -right-1.5 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                )}
              </Link>
            )}
            {/* Desktop: collapse/expand toggle */}
            <button
              onClick={() => setSidebarCollapsed(!collapsed)}
              className="hidden md:flex items-center justify-center rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              title={collapsed ? t('nav.expandSidebar') : t('nav.collapseSidebar')}
            >
              {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
            </button>
            {/* Mobile: close button */}
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
          <nav className={cn('flex-1 space-y-1 p-4', collapsed && 'md:px-2')}>
            {mainNavItems.map((item) => {
              const isActive = location.pathname === item.path ||
                (item.path === '/receipts' && location.pathname === '/templates') ||
                (item.path === '/groups' && location.pathname.startsWith('/groups/'))

              return (
                <Link key={item.path} to={item.path} onClick={closeSidebar} title={collapsed ? t(item.labelKey) : undefined}>
                  <div
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all duration-300',
                      isActive
                        ? 'nav-item-glow text-primary-foreground'
                        : 'hover:bg-accent hover:text-accent-foreground',
                      collapsed && 'md:justify-center md:px-0'
                    )}
                  >
                    <item.icon className={cn("h-4 w-4 shrink-0", isActive && "icon-glow")} />
                    <span className={cn(collapsed && 'md:hidden')}>{t(item.labelKey)}</span>
                  </div>
                </Link>
              )
            })}

            {/* Admin Navigation Section */}
            {isAdmin && (
              <>
                <div className="pt-4 pb-2 mt-2 border-t border-border/50">
                  <div className={cn(
                    'px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2',
                    collapsed && 'md:justify-center md:px-0'
                  )}>
                    <div className="h-1 w-1 rounded-full bg-orange-500 shrink-0"></div>
                    <span className={cn(collapsed && 'md:hidden')}>{t('nav.admin')}</span>
                  </div>
                </div>
                {adminNavItems.map((item) => {
                  const isAdminItemActive = location.pathname.startsWith(item.path)

                  return (
                    <Link key={item.path} to={item.path} onClick={closeSidebar} title={collapsed ? t(item.labelKey) : undefined}>
                      <div
                        className={cn(
                          'flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all duration-300',
                          isAdminItemActive
                            ? 'nav-item-glow text-primary-foreground'
                            : 'hover:bg-accent hover:text-accent-foreground',
                          collapsed && 'md:justify-center md:px-0'
                        )}
                      >
                        <item.icon className={cn("h-4 w-4 shrink-0", isAdminItemActive && "icon-glow")} />
                        <span className={cn(collapsed && 'md:hidden')}>{t(item.labelKey)}</span>
                      </div>
                    </Link>
                  )
                })}
              </>
            )}
          </nav>

          {/* User section */}
          <div className={cn(
            'border-t border-border/50 p-4 bg-gradient-to-t from-muted/30 to-transparent',
            collapsed && 'md:p-2'
          )}>
            {/* Expanded user card */}
            <div className={cn('mb-2 flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/30', collapsed && 'md:hidden')}>
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
              <Popover>
                <PopoverTrigger asChild>
                  <button className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors" aria-label="Menu">
                    <EllipsisVertical className="h-4 w-4" />
                  </button>
                </PopoverTrigger>
                <PopoverContent side="top" align="end" className="w-48 p-1">
                  <button
                    className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors"
                    onClick={() => { setIsSupportModalOpen(true) }}
                  >
                    <MessageCircle className="h-4 w-4 text-muted-foreground" />
                    {t('support.contactSupport')}
                  </button>
                  <button
                    className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors"
                    onClick={() => { setIsRatingModalOpen(true) }}
                  >
                    <Star className="h-4 w-4 text-muted-foreground" />
                    {t('rating.rateApp')}
                  </button>
                  <div className="my-1 h-px bg-border" />
                  <button
                    className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                    onClick={logout}
                  >
                    <LogOut className="h-4 w-4" />
                    {t('nav.logout')}
                  </button>
                </PopoverContent>
              </Popover>
            </div>

            {/* Collapsed user section (desktop only) */}
            {collapsed && (
              <div className="hidden md:flex flex-col items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="rounded-lg p-1 hover:bg-muted/50 transition-colors" title={user?.email}>
                      <Avatar
                        firstName={user?.firstName}
                        lastName={user?.lastName}
                        imageUrl={user?.profileImageUrl}
                        size="sm"
                      />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent side="right" align="end" className="w-48 p-1">
                    <button
                      className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors"
                      onClick={() => { setIsSupportModalOpen(true) }}
                    >
                      <MessageCircle className="h-4 w-4 text-muted-foreground" />
                      {t('support.contactSupport')}
                    </button>
                    <button
                      className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors"
                      onClick={() => { setIsRatingModalOpen(true) }}
                    >
                      <Star className="h-4 w-4 text-muted-foreground" />
                      {t('rating.rateApp')}
                    </button>
                    <div className="my-1 h-px bg-border" />
                    <button
                      className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                      onClick={logout}
                    >
                      <LogOut className="h-4 w-4" />
                      {t('nav.logout')}
                    </button>
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {/* Rank, version, support link - hidden when collapsed */}
            <div className={cn(collapsed && 'md:hidden')}>
              <div className={cn('mb-2 rounded-lg border px-3 py-2 text-xs flex items-center justify-between', rankVisual.className)}>
                <span className="font-medium">{t('nav.rank')}</span>
                <span className="inline-flex items-center gap-1.5 font-semibold">
                  <rankVisual.icon className="h-3.5 w-3.5" />
                  {rankName}
                </span>
              </div>
              <div className="text-center text-xs text-muted-foreground">
                {t('nav.version')} {__APP_VERSION__}
              </div>
              <a
                href="https://paypal.me/receipto"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1.5 flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Heart className="h-3 w-3" />
                {t('nav.supportUs')}
              </a>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className={cn(
        'pt-[calc(3.5rem+env(safe-area-inset-top))] md:pt-0 page-bg-gradient min-h-screen transition-[padding] duration-200',
        collapsed ? 'md:pl-[4.5rem]' : 'md:pl-64'
      )}>
        <main className="container mx-auto px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>

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

      {/* Announcements Drawer */}
      <AnnouncementDrawer
        open={isAnnouncementsOpen}
        onOpenChange={setIsAnnouncementsOpen}
      />
    </div>
  )
}
