import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore, useIsAdmin } from '@/store/auth'
import { useMe } from '@/hooks/users/use-me'
import { useLogout } from '@/hooks/auth/use-logout'
import { useFeatureFlags } from '@/hooks/settings/use-feature-flags'
import { normalizeRank, type ReceiptRank } from '@/lib/rank'
import { Avatar } from '@/components/ui/avatar'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  LayoutDashboard,
  Receipt,
  Users,
  PiggyBank,
  CreditCard,
  Shield,
  Settings,
  Star,
  Megaphone,
  SlidersHorizontal,
  ChevronRight,
  EllipsisVertical,
  LogOut,
  Heart,
  MessageCircle,
  Compass,
  Sparkles,
  Crown,
} from 'lucide-react'

interface AppSidebarProps {
  onOpenSupportModal: () => void
  onOpenRatingModal: () => void
  onOpenAnnouncements: () => void
  hasAnnouncements: boolean
}

export function AppSidebar({
  onOpenSupportModal,
  onOpenRatingModal,
  onOpenAnnouncements,
  hasAnnouncements,
}: AppSidebarProps) {
  const { t } = useTranslation()
  const location = useLocation()
  const { user } = useAuthStore()
  const { data: me } = useMe(!!user)
  const isAdmin = useIsAdmin()
  const logout = useLogout()
  const { data: featureFlags } = useFeatureFlags()
  const { setOpenMobile, state } = useSidebar()
  const isCollapsed = state === 'collapsed'

  const closeMobile = () => setOpenMobile(false)

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

  // Route matching helpers
  const path = location.pathname
  const isExpensesSection = path === '/receipts' || path === '/templates' || path === '/recurring' || path === '/categories' || path.startsWith('/items')
  const isSettingsSection = path.startsWith('/settings')
  const isAdminSection = path.startsWith('/admin')

  const isFeatureEnabled = (flag: string) => featureFlags?.[flag as keyof typeof featureFlags] ?? true

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/dashboard" onClick={closeMobile}>
                <div className="flex aspect-square size-8 items-center justify-center">
                  <img src="/logo-icon.svg" alt="" className="size-8" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <img src="/logo-text.svg" alt="Receipto" className="h-5 w-auto" />
                  <span className="truncate text-xs text-sidebar-foreground/60">{t('nav.version')} {__APP_VERSION__}</span>
                </div>
                {hasAnnouncements && (
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      onOpenAnnouncements()
                    }}
                    className="relative p-1 rounded-md text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors"
                    aria-label={t('announcements.title')}
                  >
                    <Megaphone className="h-4 w-4" />
                    <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                  </button>
                )}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t('nav.dashboard')}</SidebarGroupLabel>
          <SidebarMenu>
            {/* Dashboard - standalone */}
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={path === '/dashboard'}
                tooltip={t('nav.dashboard')}
                className={path === '/dashboard' ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground' : ''}
              >
                <Link to="/dashboard" onClick={closeMobile}>
                  <LayoutDashboard />
                  <span>{t('nav.dashboard')}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {/* Expenses - collapsible (link when icon-collapsed) */}
            {isCollapsed ? (
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip={t('nav.expenses')} isActive={isExpensesSection}>
                  <Link to="/receipts" onClick={closeMobile}>
                    <Receipt />
                    <span>{t('nav.expenses')}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ) : (
            <Collapsible asChild defaultOpen={isExpensesSection} className="group/collapsible">
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton tooltip={t('nav.expenses')}>
                    <Receipt />
                    <span>{t('nav.expenses')}</span>
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        asChild
                        isActive={path === '/receipts' || path === '/templates'}
                        className={path === '/receipts' || path === '/templates' ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground' : ''}
                      >
                        <Link to="/receipts" onClick={closeMobile}>
                          <span>{t('nav.receipts')}</span>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    {isFeatureEnabled('recurringExpenses') && (
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          asChild
                          isActive={path === '/recurring'}
                          className={path === '/recurring' ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground' : ''}
                        >
                          <Link to="/recurring" onClick={closeMobile}>
                            <span>{t('nav.recurring')}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    )}
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        asChild
                        isActive={path === '/categories'}
                        className={path === '/categories' ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground' : ''}
                      >
                        <Link to="/categories" onClick={closeMobile}>
                          <span>{t('nav.categories')}</span>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    {isFeatureEnabled('itemPricing') && (
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          asChild
                          isActive={path.startsWith('/items')}
                          className={path.startsWith('/items') ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground' : ''}
                        >
                          <Link to="/items" onClick={closeMobile}>
                            <span>{t('nav.priceTracker')}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    )}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
            )}

            {/* Group Spending - standalone */}
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={path === '/groups' || path.startsWith('/groups/')}
                tooltip={t('nav.groups')}
                className={path === '/groups' || path.startsWith('/groups/') ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground' : ''}
              >
                <Link to="/groups" onClick={closeMobile}>
                  <Users />
                  <span>{t('nav.groups')}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {/* Savings - standalone (if enabled) */}
            {isFeatureEnabled('savings') && (
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={path === '/savings' || path.startsWith('/savings/')}
                  tooltip={t('nav.savings')}
                  className={path === '/savings' || path.startsWith('/savings/') ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground' : ''}
                >
                  <Link to="/savings" onClick={closeMobile}>
                    <PiggyBank />
                    <span>{t('nav.savings')}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}

            {/* Loyalty Cards - standalone (if enabled) */}
            {isFeatureEnabled('loyaltyCards') && (
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={path === '/loyalty-cards'}
                  tooltip={t('nav.loyaltyCards')}
                  className={path === '/loyalty-cards' ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground' : ''}
                >
                  <Link to="/loyalty-cards" onClick={closeMobile}>
                    <CreditCard />
                    <span>{t('nav.loyaltyCards')}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}

            {/* Warranties - standalone (if enabled) */}
            {isFeatureEnabled('warranties') && (
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={path === '/warranties'}
                  tooltip={t('nav.warranties')}
                  className={path === '/warranties' ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground' : ''}
                >
                  <Link to="/warranties" onClick={closeMobile}>
                    <Shield />
                    <span>{t('nav.warranties')}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
          </SidebarMenu>
        </SidebarGroup>

        {/* Settings group */}
        <SidebarGroup>
          <SidebarGroupLabel>{t('nav.settings')}</SidebarGroupLabel>
          <SidebarMenu>
            {isCollapsed ? (
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip={t('nav.settings')} isActive={isSettingsSection}>
                  <Link to="/settings/app" onClick={closeMobile}>
                    <Settings />
                    <span>{t('nav.settings')}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ) : (
            <Collapsible asChild defaultOpen={isSettingsSection} className="group/collapsible">
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton tooltip={t('nav.settings')}>
                    <Settings />
                    <span>{t('nav.settings')}</span>
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        asChild
                        isActive={path === '/settings/app'}
                        className={path === '/settings/app' ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground' : ''}
                      >
                        <Link to="/settings/app" onClick={closeMobile}>
                          <span>{t('nav.appSettings')}</span>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        asChild
                        isActive={path === '/settings/profile'}
                        className={path === '/settings/profile' ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground' : ''}
                      >
                        <Link to="/settings/profile" onClick={closeMobile}>
                          <span>{t('nav.profile')}</span>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        asChild
                        isActive={path === '/settings/account'}
                        className={path === '/settings/account' ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground' : ''}
                      >
                        <Link to="/settings/account" onClick={closeMobile}>
                          <span>{t('nav.account')}</span>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
            )}
          </SidebarMenu>
        </SidebarGroup>

        {/* Admin group */}
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>{t('nav.admin')}</SidebarGroupLabel>
            <SidebarMenu>
              {isCollapsed ? (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip={t('nav.admin')} isActive={isAdminSection}>
                    <Link to="/admin/users" onClick={closeMobile}>
                      <SlidersHorizontal />
                      <span>{t('nav.admin')}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ) : (
              <Collapsible asChild defaultOpen={isAdminSection} className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip={t('nav.admin')}>
                      <SlidersHorizontal />
                      <span>{t('nav.admin')}</span>
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          asChild
                          isActive={path.startsWith('/admin/users')}
                          className={path.startsWith('/admin/users') ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground' : ''}
                        >
                          <Link to="/admin/users" onClick={closeMobile}>
                            <span>{t('nav.users')}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          asChild
                          isActive={path === '/admin/ratings'}
                          className={path === '/admin/ratings' ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground' : ''}
                        >
                          <Link to="/admin/ratings" onClick={closeMobile}>
                            <span>{t('nav.ratings')}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          asChild
                          isActive={path === '/admin/announcements'}
                          className={path === '/admin/announcements' ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground' : ''}
                        >
                          <Link to="/admin/announcements" onClick={closeMobile}>
                            <span>{t('nav.announcements')}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          asChild
                          isActive={path === '/admin/settings'}
                          className={path === '/admin/settings' ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground' : ''}
                        >
                          <Link to="/admin/settings" onClick={closeMobile}>
                            <span>{t('nav.appSettings')}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          asChild
                          isActive={path === '/admin/analytics'}
                          className={path === '/admin/analytics' ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground' : ''}
                        >
                          <Link to="/admin/analytics" onClick={closeMobile}>
                            <span>{t('nav.analytics')}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
              )}
            </SidebarMenu>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          {/* Rank badge */}
          <SidebarMenuItem>
            <div className="rounded-lg border px-3 py-2 text-xs flex items-center justify-between group-data-[collapsible=icon]:hidden mx-1">
              <span className={`inline-flex items-center gap-1.5 font-semibold ${rankVisual.className} px-2 py-0.5 rounded-md border`}>
                <rankVisual.icon className="h-3.5 w-3.5" />
                {rankName}
              </span>
            </div>
          </SidebarMenuItem>

          {/* User section */}
          <SidebarMenuItem>
            <Popover>
              <PopoverTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar
                    firstName={user?.firstName}
                    lastName={user?.lastName}
                    imageUrl={user?.profileImageUrl}
                    size="sm"
                  />
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {user?.firstName || user?.lastName
                        ? `${user?.firstName || ''} ${user?.lastName || ''}`.trim()
                        : user?.email}
                    </span>
                    <span className="truncate text-xs text-sidebar-foreground/60">{user?.email}</span>
                  </div>
                  <EllipsisVertical className="ml-auto size-4" />
                </SidebarMenuButton>
              </PopoverTrigger>
              <PopoverContent
                side="top"
                align="end"
                className="w-52 p-1"
              >
                <button
                  className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors"
                  onClick={() => { onOpenSupportModal(); closeMobile() }}
                >
                  <MessageCircle className="h-4 w-4 text-muted-foreground" />
                  {t('support.contactSupport')}
                </button>
                <button
                  className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors"
                  onClick={() => { onOpenRatingModal(); closeMobile() }}
                >
                  <Star className="h-4 w-4 text-muted-foreground" />
                  {t('rating.rateApp')}
                </button>
                <div className="my-1 h-px bg-border" />
                <a
                  href="https://paypal.me/receipto"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors"
                >
                  <Heart className="h-4 w-4 text-muted-foreground" />
                  {t('nav.supportUs')}
                </a>
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
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
