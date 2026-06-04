import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore, useIsAdmin } from '@/store/auth'
import { useMe } from '@/hooks/users/use-me'
import { useLogout } from '@/hooks/auth/use-logout'
import { useFeatureFlags } from '@/hooks/settings/use-feature-flags'
import { normalizeRank, type ReceiptRank } from '@/lib/rank'
import { Avatar } from '@/components/ui/avatar'
import { LanguageSwitcher } from '@/components/ui/language-switcher'
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
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  LayoutDashboard,
  Receipt,
  Repeat,
  Tag,
  TrendingUp,
  Users,
  Shield,
  CreditCard,
  Settings,
  SlidersHorizontal,
  EllipsisVertical,
  LogOut,
  MessageCircle,
  Star,
  Megaphone,
  Compass,
  Sparkles,
  ChevronRight,
  Crown,
  KeyRound,
  User,
  X,
  Sun,
  Moon,
  Monitor,
  SunMoon,
  type LucideIcon,
} from 'lucide-react'
import { useSettingsStore, type Theme } from '@/store/settings'
import { cn } from '@/lib/utils'

interface AppSidebarProps {
  onOpenSupportModal: () => void
  onOpenRatingModal: () => void
  onOpenAnnouncements: () => void
  hasAnnouncements: boolean
}

// Nav item — calm neutral at rest, accent-aware soft tint when active. The sidebar is
// deliberately gradient-free (brand gradient lives only on the logo + the mobile FAB).
const navItem = cn(
  'h-11 gap-3 rounded-xl px-3 text-[14px] font-semibold text-fg-2 [&>svg]:size-[19px] [&>svg]:text-muted-foreground',
  'hover:bg-bg-subtle hover:text-foreground',
  'group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:!size-12 group-data-[collapsible=icon]:!justify-center group-data-[collapsible=icon]:!rounded-xl group-data-[collapsible=icon]:!p-0',
)
const navItemActive =
  'bg-primary-soft text-primary [&>svg]:text-primary hover:bg-primary-soft hover:text-primary'

const groupLabel = 'px-3 text-[11px] font-bold uppercase tracking-[0.07em] text-fg-faint'

type NavDef = {
  to: string
  icon: LucideIcon
  labelKey: string
  flag?: string
  match: (p: string) => boolean
}

const MONEY: NavDef[] = [
  { to: '/dashboard', icon: LayoutDashboard, labelKey: 'nav.dashboard', match: (p) => p === '/dashboard' },
  { to: '/receipts', icon: Receipt, labelKey: 'nav.receipts', match: (p) => p === '/receipts' || p === '/templates' },
  { to: '/recurring', icon: Repeat, labelKey: 'nav.recurring', flag: 'recurringExpenses', match: (p) => p === '/recurring' },
  { to: '/categories', icon: Tag, labelKey: 'nav.categories', match: (p) => p === '/categories' },
  { to: '/items', icon: TrendingUp, labelKey: 'nav.priceTracker', flag: 'itemPricing', match: (p) => p.startsWith('/items') },
]

const WALLET: NavDef[] = [
  { to: '/groups', icon: Users, labelKey: 'nav.groups', match: (p) => p === '/groups' || p.startsWith('/groups/') },
  { to: '/warranties', icon: Shield, labelKey: 'nav.warranties', flag: 'warranties', match: (p) => p === '/warranties' },
  { to: '/loyalty-cards', icon: CreditCard, labelKey: 'nav.loyaltyCards', flag: 'loyaltyCards', match: (p) => p === '/loyalty-cards' },
]

const ADMIN_SUB: { to: string; labelKey: string; match: (p: string) => boolean }[] = [
  { to: '/admin/users', labelKey: 'nav.users', match: (p) => p === '/admin/users' || p.startsWith('/admin/users/') },
  { to: '/admin/settings', labelKey: 'nav.appSettings', match: (p) => p === '/admin/settings' },
  { to: '/admin/ratings', labelKey: 'nav.ratings', match: (p) => p === '/admin/ratings' },
  { to: '/admin/announcements', labelKey: 'nav.announcements', match: (p) => p === '/admin/announcements' },
]

/** Light / Dark / System segmented control — wired to the settings store. */
function ThemeSegmented() {
  const { t } = useTranslation()
  const theme = useSettingsStore((s) => s.theme)
  const setTheme = useSettingsStore((s) => s.setTheme)
  const opts: { value: Theme; icon: LucideIcon; label: string }[] = [
    { value: 'light', icon: Sun, label: t('settings.appearance.light') },
    { value: 'dark', icon: Moon, label: t('settings.appearance.dark') },
    { value: 'system', icon: Monitor, label: t('settings.appearance.system') },
  ]
  return (
    <span
      role="group"
      aria-label={t('settings.appearance.theme')}
      className="inline-flex shrink-0 gap-0.5 rounded-full border border-hairline-soft bg-bg-subtle p-[3px]"
    >
      {opts.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          type="button"
          title={label}
          aria-pressed={theme === value}
          onClick={() => setTheme(value)}
          className={cn(
            'grid h-[26px] w-7 place-items-center rounded-full transition-colors',
            theme === value
              ? 'bg-card text-foreground shadow-glass-1'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <Icon className="size-3.5" />
        </button>
      ))}
    </span>
  )
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
  const { setOpenMobile, state, isMobile } = useSidebar()

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
  const RankIcon = rankVisual.icon

  const path = location.pathname
  const isFeatureEnabled = (flag: string) => featureFlags?.[flag as keyof typeof featureFlags] ?? true

  const userName = user?.firstName || user?.lastName
    ? `${user?.firstName || ''} ${user?.lastName || ''}`.trim()
    : user?.email

  const renderItem = (item: NavDef) => {
    if (item.flag && !isFeatureEnabled(item.flag)) return null
    const active = item.match(path)
    const Icon = item.icon
    return (
      <SidebarMenuItem key={item.to}>
        <SidebarMenuButton
          asChild
          isActive={active}
          tooltip={t(item.labelKey)}
          className={cn(navItem, active && navItemActive)}
        >
          <Link to={item.to} onClick={closeMobile}>
            <Icon />
            <span>{t(item.labelKey)}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    )
  }

  const footChip =
    'flex items-center gap-2.5 rounded-xl border border-hairline-soft bg-card px-3 py-2.5 text-[13.5px] font-semibold text-fg-2 transition-colors hover:bg-bg-subtle'
  const popRow =
    'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13.5px] font-semibold text-foreground transition-colors hover:bg-bg-subtle'

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="gap-0 p-0">
        {/* Brand: logo + wordmark + version · announcements megaphone (+ close on mobile) */}
        <div className="flex items-center gap-2.5 px-3.5 pb-1 pt-3.5 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <Link
            to="/dashboard"
            onClick={closeMobile}
            className="flex min-w-0 flex-1 items-center gap-2.5 group-data-[collapsible=icon]:flex-none"
            aria-label={t('common.appName')}
          >
            <img src="/logo-icon.svg" alt="" className="size-[30px] shrink-0" />
            <span className="flex min-w-0 flex-col gap-1 group-data-[collapsible=icon]:hidden">
              <img src="/logo-text.svg" alt={t('common.appName')} className="h-[18px] w-auto" />
              <span className="truncate text-[11px] font-semibold leading-none text-fg-faint">
                {t('nav.version')} {__APP_VERSION__}
              </span>
            </span>
          </Link>
          <div className="flex items-center gap-1 group-data-[collapsible=icon]:hidden">
            <button
              type="button"
              onClick={onOpenAnnouncements}
              aria-label={t('announcements.title')}
              className="relative grid size-[34px] shrink-0 place-items-center rounded-[10px] text-muted-foreground transition-colors hover:bg-bg-subtle hover:text-foreground"
            >
              <Megaphone className="size-[17px]" />
              {hasAnnouncements && (
                <span className="absolute right-2 top-[7px] size-[7px] animate-pulse rounded-full bg-destructive ring-2 ring-sidebar" />
              )}
            </button>
            {isMobile && (
              <button
                type="button"
                onClick={closeMobile}
                aria-label="Close"
                className="grid size-[34px] shrink-0 place-items-center rounded-[10px] text-fg-2 transition-colors hover:bg-bg-subtle"
              >
                <X className="size-5" />
              </button>
            )}
          </div>
        </div>

        {/* Language switcher — full-width pill (expanded) / globe (rail). Desktop only;
            on mobile the language toggle lives in the top app header. */}
        <div className="hidden px-3.5 pb-1 pt-1.5 md:block group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          {state === 'collapsed' ? <LanguageSwitcher compact /> : <LanguageSwitcher pill fullWidth />}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-1.5">
        {/* Money */}
        <SidebarGroup className="gap-1">
          <SidebarGroupLabel className={groupLabel}>{t('nav.money')}</SidebarGroupLabel>
          <SidebarMenu>{MONEY.map(renderItem)}</SidebarMenu>
        </SidebarGroup>

        {/* Wallet */}
        <SidebarGroup className="gap-1">
          <SidebarGroupLabel className={groupLabel}>{t('nav.wallet')}</SidebarGroupLabel>
          <SidebarMenu>{WALLET.map(renderItem)}</SidebarMenu>
        </SidebarGroup>

        <SidebarSeparator className="bg-hairline-soft" />

        {/* Settings & Admin */}
        <SidebarGroup className="gap-1">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={path.startsWith('/settings')}
                tooltip={t('nav.settings')}
                className={cn(navItem, path.startsWith('/settings') && navItemActive)}
              >
                <Link to="/settings/app" onClick={closeMobile}>
                  <Settings />
                  <span>{t('nav.settings')}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {isAdmin && (
              <Collapsible defaultOpen={path.startsWith('/admin')} className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      tooltip={t('nav.admin')}
                      isActive={path.startsWith('/admin')}
                      className={cn(navItem, path.startsWith('/admin') && navItemActive)}
                    >
                      <SlidersHorizontal />
                      <span>{t('nav.admin')}</span>
                      <ChevronRight className="ml-auto !size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 group-data-[collapsible=icon]:hidden" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub className="mx-3.5 border-hairline-soft">
                      {ADMIN_SUB.map((sub) => {
                        const active = sub.match(path)
                        return (
                          <SidebarMenuSubItem key={sub.to}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={active}
                              className="h-9 gap-2.5 text-[13.5px] font-medium text-muted-foreground data-[active=true]:bg-transparent data-[active=true]:font-bold data-[active=true]:text-primary [&[data-active=true]_.subdot]:bg-primary"
                            >
                              <Link to={sub.to} onClick={closeMobile}>
                                <span className="subdot size-[5px] shrink-0 rounded-full bg-fg-faint" />
                                <span>{t(sub.labelKey)}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        )
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            )}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-0">
        {isMobile ? (
          /* Mobile drawer footer — everything inline (no popover). */
          <div className="flex flex-col gap-3 border-t border-hairline-soft px-4 pb-2 pt-3.5">
            <div className="flex items-center gap-3">
              <Avatar
                firstName={user?.firstName}
                lastName={user?.lastName}
                imageUrl={user?.profileImageUrl}
                size="sm"
              />
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-[13.5px] font-bold">{userName}</span>
                <span className="flex items-center gap-1 text-[11.5px] font-semibold text-muted-foreground">
                  <RankIcon className={cn('size-3 shrink-0', rankVisual.className)} />
                  {rankName}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Link to="/settings/profile" onClick={closeMobile} className={footChip}>
                <User className="size-4 shrink-0 text-muted-foreground" />
                {t('nav.profile')}
              </Link>
              <Link to="/settings/account" onClick={closeMobile} className={footChip}>
                <KeyRound className="size-4 shrink-0 text-muted-foreground" />
                {t('nav.account')}
              </Link>
              <button
                type="button"
                onClick={() => { onOpenSupportModal(); closeMobile() }}
                className={cn(footChip, 'col-span-2')}
              >
                <MessageCircle className="size-4 shrink-0 text-muted-foreground" />
                {t('support.contactSupport')}
              </button>
            </div>
            <div className="flex items-center gap-2.5 rounded-xl border border-hairline-soft px-3 py-2.5">
              <SunMoon className="size-4 shrink-0 text-muted-foreground" />
              <span className="flex-1 text-[13.5px] font-semibold">{t('settings.appearance.theme')}</span>
              <ThemeSegmented />
            </div>
            <button
              type="button"
              onClick={logout}
              className="flex h-[46px] items-center justify-center gap-2 rounded-xl bg-destructive-soft text-[14.5px] font-bold text-destructive transition-colors hover:bg-destructive/15"
            >
              <LogOut className="size-[17px]" />
              {t('nav.logout')}
            </button>
          </div>
        ) : (
          /* Desktop footer — user block triggers the profile popover. */
          <SidebarMenu className="p-2">
            <SidebarMenuItem>
              <Popover>
                <PopoverTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="rounded-xl data-[state=open]:bg-bg-subtle"
                  >
                    <Avatar
                      firstName={user?.firstName}
                      lastName={user?.lastName}
                      imageUrl={user?.profileImageUrl}
                      size="sm"
                    />
                    <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                      <span className="truncate font-bold">{userName}</span>
                      <span className="flex items-center gap-1 truncate text-xs font-semibold text-muted-foreground">
                        <RankIcon className={cn('h-3 w-3 shrink-0', rankVisual.className)} />
                        {rankName}
                      </span>
                    </div>
                    <EllipsisVertical className="ml-auto size-4 text-muted-foreground group-data-[collapsible=icon]:hidden" />
                  </SidebarMenuButton>
                </PopoverTrigger>
                <PopoverContent side="top" align="end" className="w-56 p-1.5">
                  <Link to="/settings/profile" className={popRow} onClick={closeMobile}>
                    <User className="size-4 shrink-0 text-muted-foreground" />
                    {t('nav.profile')}
                  </Link>
                  <Link to="/settings/account" className={popRow} onClick={closeMobile}>
                    <KeyRound className="size-4 shrink-0 text-muted-foreground" />
                    {t('nav.account')}
                  </Link>
                  <button
                    type="button"
                    className={popRow}
                    onClick={() => { onOpenSupportModal(); closeMobile() }}
                  >
                    <MessageCircle className="size-4 shrink-0 text-muted-foreground" />
                    {t('support.contactSupport')}
                  </button>
                  <button
                    type="button"
                    className={popRow}
                    onClick={() => { onOpenRatingModal(); closeMobile() }}
                  >
                    <Star className="size-4 shrink-0 text-muted-foreground" />
                    {t('rating.rateApp')}
                  </button>
                  <div className="my-1.5 h-px bg-hairline-soft" />
                  <div className="flex items-center gap-2.5 px-3 py-2">
                    <SunMoon className="size-4 shrink-0 text-muted-foreground" />
                    <span className="flex-1 text-[13.5px] font-semibold">{t('settings.appearance.theme')}</span>
                    <ThemeSegmented />
                  </div>
                  <div className="my-1.5 h-px bg-hairline-soft" />
                  <button
                    type="button"
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13.5px] font-semibold text-destructive transition-colors hover:bg-destructive/10"
                    onClick={logout}
                  >
                    <LogOut className="size-4 shrink-0" />
                    {t('nav.logout')}
                  </button>
                </PopoverContent>
              </Popover>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
