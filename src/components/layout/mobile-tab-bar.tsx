import { NavLink, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LayoutDashboard, Receipt, Users, MoreHorizontal, Plus, type LucideIcon } from 'lucide-react'
import { useSidebar } from '@/components/ui/sidebar'
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

/** Global mobile bottom navigation: Home · Expenses · gradient FAB · Groups · More. */
export function MobileTabBar() {
  const { t } = useTranslation()
  const { setOpenMobile } = useSidebar()
  const navigate = useNavigate()

  // Chunk 4 wires this to open the Add/Scan action sheet on Expenses. Until then, route there.
  const onFab = () => navigate('/receipts')

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/85 [backdrop-filter:blur(20px)] [-webkit-backdrop-filter:blur(20px)] md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex w-full items-center justify-around px-3 pb-1.5 pt-2" style={{ minHeight: 68 }}>
        <Tab to="/dashboard" icon={LayoutDashboard} label={t('nav.home')} />
        <Tab to="/receipts" icon={Receipt} label={t('nav.receipts')} />
        <button
          type="button"
          onClick={onFab}
          aria-label={t('nav.scanReceipt')}
          className="btn-brand -mt-6 grid size-[52px] shrink-0 place-items-center rounded-full text-white"
        >
          <Plus className="size-[26px]" strokeWidth={2.4} />
        </button>
        <Tab to="/groups" icon={Users} label={t('nav.groupsShort')} />
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
