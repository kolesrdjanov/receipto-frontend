import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Trash2, ChevronDown, ChevronUp, UserPlus, ShoppingCart, Users, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { KpiCard } from './kpi-card'
import {
  useAnalyticsPromos,
  useAnalyticsPromoAnalysis,
  useDeletePromo,
  useAnalyticsChains,
  type AnalyticsFilters,
} from '@/hooks/admin/use-analytics'
import { PromoCampaignModal } from './promo-campaign-modal'

interface PromosTabProps {
  filters: AnalyticsFilters
}

export function PromosTab({ filters }: PromosTabProps) {
  const { t } = useTranslation()
  const [showModal, setShowModal] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const { data: promos, isLoading } = useAnalyticsPromos()
  const { data: chains } = useAnalyticsChains(filters)
  const deletePromo = useDeletePromo()

  const chainNames = chains?.map((c) => c.chainName) || []

  const getStatus = (start: string, end: string) => {
    const now = new Date().toISOString().split('T')[0]
    if (now < start) return 'upcoming'
    if (now > end) return 'ended'
    return 'active'
  }

  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    upcoming: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    ended: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4" />
          {t('analytics.createCampaign')}
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8"></TableHead>
            <TableHead>{t('analytics.campaignName')}</TableHead>
            <TableHead>{t('analytics.chain')}</TableHead>
            <TableHead>{t('analytics.promoDates')}</TableHead>
            <TableHead>{t('analytics.status')}</TableHead>
            <TableHead className="text-right"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">{t('common.loading')}</TableCell></TableRow>
          ) : !promos?.length ? (
            <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">{t('analytics.noPromos')}</TableCell></TableRow>
          ) : (
            promos.map((promo) => {
              const status = getStatus(promo.startDate, promo.endDate)
              return (
                <PromoRow
                  key={promo.id}
                  promo={promo}
                  status={status}
                  statusColor={statusColors[status]}
                  isExpanded={expandedId === promo.id}
                  onToggle={() => setExpandedId(expandedId === promo.id ? null : promo.id)}
                  onDelete={() => {
                    if (confirm(t('analytics.confirmDelete'))) {
                      deletePromo.mutate(promo.id)
                    }
                  }}
                />
              )
            })
          )}
        </TableBody>
      </Table>

      <PromoCampaignModal isOpen={showModal} onClose={() => setShowModal(false)} chains={chainNames} />
    </div>
  )
}

function PromoRow({ promo, status, statusColor, isExpanded, onToggle, onDelete }: any) {
  const { t } = useTranslation()
  const { data: analysis } = useAnalyticsPromoAnalysis(isExpanded ? promo.id : '')

  const Icon = isExpanded ? ChevronUp : ChevronDown

  return (
    <>
      <TableRow className="cursor-pointer" onClick={onToggle}>
        <TableCell><Icon className="h-4 w-4 text-muted-foreground" /></TableCell>
        <TableCell className="font-medium">{promo.name}</TableCell>
        <TableCell>{promo.chainName}</TableCell>
        <TableCell>{promo.startDate} — {promo.endDate}</TableCell>
        <TableCell>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor}`}>{t(`analytics.${status}`)}</span>
        </TableCell>
        <TableCell className="text-right">
          <button onClick={(e) => { e.stopPropagation(); onDelete() }} className="text-muted-foreground hover:text-destructive">
            <Trash2 className="h-4 w-4" />
          </button>
        </TableCell>
      </TableRow>
      {isExpanded && analysis && (
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={6} className="bg-muted/20">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KpiCard
                label={t('analytics.transactions')}
                value={analysis.promo?.transactions || 0}
                previousValue={analysis.baseline?.transactions}
                icon={ShoppingCart}
              />
              <KpiCard
                label={t('analytics.users')}
                value={analysis.promo?.uniqueUsers || 0}
                previousValue={analysis.baseline?.uniqueUsers}
                icon={Users}
              />
              <KpiCard
                label={t('analytics.revenue')}
                value={Number(analysis.promo?.totalRevenue) || 0}
                previousValue={Number(analysis.baseline?.totalRevenue) || undefined}
                icon={DollarSign}
                format="currency"
              />
              <KpiCard
                label={t('analytics.newCustomers')}
                value={analysis.newCustomers}
                icon={UserPlus}
              />
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  )
}
