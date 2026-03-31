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
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar'
import {
  LayoutDashboard,
  Receipt,
  Repeat,
  Tag,
  TrendingUp,
  Users,
  Shield,
  PiggyBank,
  CreditCard,
  Settings,
  SlidersHorizontal,
  EllipsisVertical,
  LogOut,
  Heart,
  MessageCircle,
  Star,
  Megaphone,
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

// Active state: subtle primary tint + primary text
const activeClass = 'bg-primary/[0.08] text-primary font-semibold hover:bg-primary/[0.12] hover:text-primary'

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
  const { setOpenMobile } = useSidebar()

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
    ? { icon: Crown, className: 'text-amber-500' }
    : receiptRank === 'status_b'
      ? { icon: Sparkles, className: 'text-blue-500' }
      : receiptRank === 'status_c'
        ? { icon: Compass, className: 'text-emerald-500' }
        : { icon: Compass, className: 'text-muted-foreground' }

  const path = location.pathname
  const isFeatureEnabled = (flag: string) => featureFlags?.[flag as keyof typeof featureFlags] ?? true

  const userName = user?.firstName || user?.lastName
    ? `${user?.firstName || ''} ${user?.lastName || ''}`.trim()
    : user?.email

  const RankIcon = rankVisual.icon

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
                  <span className="truncate text-xs text-sidebar-foreground/50">{t('nav.version')} {__APP_VERSION__}</span>
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
        {/* Overview */}
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={path === '/dashboard'}
                tooltip={t('nav.dashboard')}
                className={path === '/dashboard' ? activeClass : ''}
              >
                <Link to="/dashboard" onClick={closeMobile}>
                  <LayoutDashboard />
                  <span>{t('nav.dashboard')}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* Expenses */}
        <SidebarGroup>
          <SidebarGroupLabel>{t('nav.expenses')}</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={path === '/receipts' || path === '/templates'}
                tooltip={t('nav.receipts')}
                className={path === '/receipts' || path === '/templates' ? activeClass : ''}
              >
                <Link to="/receipts" onClick={closeMobile}>
                  <Receipt />
                  <span>{t('nav.receipts')}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {isFeatureEnabled('recurringExpenses') && (
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={path === '/recurring'}
                  tooltip={t('nav.recurring')}
                  className={path === '/recurring' ? activeClass : ''}
                >
                  <Link to="/recurring" onClick={closeMobile}>
                    <Repeat />
                    <span>{t('nav.recurring')}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}

            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={path === '/categories'}
                tooltip={t('nav.categories')}
                className={path === '/categories' ? activeClass : ''}
              >
                <Link to="/categories" onClick={closeMobile}>
                  <Tag />
                  <span>{t('nav.categories')}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {isFeatureEnabled('itemPricing') && (
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={path.startsWith('/items')}
                  tooltip={t('nav.priceTracker')}
                  className={path.startsWith('/items') ? activeClass : ''}
                >
                  <Link to="/items" onClick={closeMobile}>
                    <TrendingUp />
                    <span>{t('nav.priceTracker')}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
          </SidebarMenu>
        </SidebarGroup>

        {/* Manage */}
        <SidebarGroup>
          <SidebarGroupLabel>{t('nav.manage')}</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={path === '/groups' || path.startsWith('/groups/')}
                tooltip={t('nav.groups')}
                className={path === '/groups' || path.startsWith('/groups/') ? activeClass : ''}
              >
                <Link to="/groups" onClick={closeMobile}>
                  <Users />
                  <span>{t('nav.groups')}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {isFeatureEnabled('warranties') && (
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={path === '/warranties'}
                  tooltip={t('nav.warranties')}
                  className={path === '/warranties' ? activeClass : ''}
                >
                  <Link to="/warranties" onClick={closeMobile}>
                    <Shield />
                    <span>{t('nav.warranties')}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}

            {isFeatureEnabled('savings') && (
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={path === '/savings' || path.startsWith('/savings/')}
                  tooltip={t('nav.savings')}
                  className={path === '/savings' || path.startsWith('/savings/') ? activeClass : ''}
                >
                  <Link to="/savings" onClick={closeMobile}>
                    <PiggyBank />
                    <span>{t('nav.savings')}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}

            {isFeatureEnabled('loyaltyCards') && (
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={path === '/loyalty-cards'}
                  tooltip={t('nav.loyaltyCards')}
                  className={path === '/loyalty-cards' ? activeClass : ''}
                >
                  <Link to="/loyalty-cards" onClick={closeMobile}>
                    <CreditCard />
                    <span>{t('nav.loyaltyCards')}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Settings & Admin */}
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={path.startsWith('/settings')}
                tooltip={t('nav.settings')}
                className={path.startsWith('/settings') ? activeClass : ''}
              >
                <Link to="/settings/app" onClick={closeMobile}>
                  <Settings />
                  <span>{t('nav.settings')}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {isAdmin && (
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={path.startsWith('/admin')}
                  tooltip={t('nav.admin')}
                  className={path.startsWith('/admin') ? activeClass : ''}
                >
                  <Link to="/admin/users" onClick={closeMobile}>
                    <SlidersHorizontal />
                    <span>{t('nav.admin')}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
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
                    <span className="truncate font-semibold">{userName}</span>
                    <span className="truncate text-xs text-sidebar-foreground/50 flex items-center gap-1">
                      <RankIcon className={`h-3 w-3 shrink-0 ${rankVisual.className}`} />
                      {rankName}
                    </span>
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
