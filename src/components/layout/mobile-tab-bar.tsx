import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard,
  Receipt,
  Shield,
  CreditCard,
  Users,
  MoreVertical,
  Plus,
  type LucideIcon,
} from 'lucide-react'
import { useSidebar } from '@/components/ui/sidebar'
import { useFabStore } from '@/store/fab'
import { useFeatureFlags } from '@/hooks/settings/use-feature-flags'
import { cn } from '@/lib/utils'

function Tab({ to, icon: Icon, label }: { to: string; icon: LucideIcon; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'flex flex-1 flex-col items-center gap-1 rounded-lg py-1.5 text-[10.5px] font-semibold transition-colors',
          'outline-none focus-visible:ring-2 focus-visible:ring-ring',
          isActive ? 'text-foreground' : 'text-fg-faint',
        )
      }
    >
      <Icon className="size-[22px]" aria-hidden="true" />
      {label}
    </NavLink>
  )
}

interface MobileTabBarProps {
  /** Fallback FAB action when no page has registered one (opens the Add/Scan sheet). */
  onOpenAddSheet: () => void
}

/**
 * Global mobile bottom navigation: Home · Expenses · primary FAB · Warranties · More.
 * The Warranties slot falls back to the next available Wallet destination when that
 * feature is disabled. The FAB defers to a page-registered action (e.g. Recurring/Expenses
 * open their own Add sheet) and otherwise opens the global Add/Scan sheet.
 */
export function MobileTabBar({ onOpenAddSheet }: MobileTabBarProps) {
  const { t } = useTranslation()
  const { setOpenMobile } = useSidebar()
  const fabAction = useFabStore((s) => s.action)
  const { data: featureFlags } = useFeatureFlags()
  const isEnabled = (flag: string) => featureFlags?.[flag as keyof typeof featureFlags] ?? true

  const onFab = () => (fabAction ? fabAction() : onOpenAddSheet())

  // 4th slot: Warranties, falling back through the Wallet group when flag-gated off.
  const wallet = isEnabled('warranties')
    ? { to: '/warranties', icon: Shield, label: t('nav.warranties') }
    : isEnabled('loyaltyCards')
      ? { to: '/loyalty-cards', icon: CreditCard, label: t('nav.loyaltyCards') }
      : { to: '/groups', icon: Users, label: t('nav.groupsShort') }

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex w-full items-center justify-around px-2.5 pb-1.5 pt-2" style={{ minHeight: 72 }}>
        <Tab to="/dashboard" icon={LayoutDashboard} label={t('nav.home')} />
        <Tab to="/receipts" icon={Receipt} label={t('nav.receipts')} />
        <Button
          type="button"
          variant="default"
          onClick={onFab}
          aria-label={t('fab.title')}
          className="-mt-[24px] grid size-[50px] shrink-0 place-items-center rounded-full p-0 shadow-glass-2 [&_svg]:size-[24px]"
        >
          <Plus strokeWidth={2.2} />
        </Button>
        <Tab to={wallet.to} icon={wallet.icon} label={wallet.label} />
        <button
          type="button"
          onClick={() => setOpenMobile(true)}
          aria-label={t('nav.more')}
          className="flex flex-1 flex-col items-center gap-1 rounded-lg py-1.5 text-[10.5px] font-semibold text-fg-faint outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
        >
          <MoreVertical className="size-[22px]" aria-hidden="true" />
          {t('nav.more')}
        </button>
      </div>
    </nav>
  )
}
