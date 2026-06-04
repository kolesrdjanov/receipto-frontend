import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  LayoutDashboard,
  Receipt,
  Shield,
  CreditCard,
  Users,
  MoreHorizontal,
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
          'flex flex-1 flex-col items-center gap-1 py-1.5 text-[10.5px] font-semibold transition-colors',
          isActive ? 'text-primary' : 'text-fg-faint',
        )
      }
    >
      <Icon className="size-[22px]" />
      {label}
    </NavLink>
  )
}

interface MobileTabBarProps {
  /** Fallback FAB action when no page has registered one (opens the Add/Scan sheet). */
  onOpenAddSheet: () => void
}

/**
 * Global mobile bottom navigation: Home · Expenses · gradient FAB · Warranties · More.
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
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/88 [backdrop-filter:blur(20px)_saturate(1.4)] [-webkit-backdrop-filter:blur(20px)_saturate(1.4)] md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex w-full items-center justify-around px-2.5 pb-1.5 pt-2" style={{ minHeight: 72 }}>
        <Tab to="/dashboard" icon={LayoutDashboard} label={t('nav.home')} />
        <Tab to="/receipts" icon={Receipt} label={t('nav.receipts')} />
        <button
          type="button"
          onClick={onFab}
          aria-label={t('fab.title')}
          className="btn-brand -mt-[26px] grid size-[54px] shrink-0 place-items-center rounded-full text-white"
        >
          <Plus className="size-[26px]" strokeWidth={2.4} />
        </button>
        <Tab to={wallet.to} icon={wallet.icon} label={wallet.label} />
        <button
          type="button"
          onClick={() => setOpenMobile(true)}
          className="flex flex-1 flex-col items-center gap-1 py-1.5 text-[10.5px] font-semibold text-fg-faint transition-colors"
        >
          <MoreHorizontal className="size-[22px]" />
          {t('nav.more')}
        </button>
      </div>
    </nav>
  )
}
