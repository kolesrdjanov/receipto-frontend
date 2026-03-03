import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Trash2, ChevronDown, ChevronUp, ArrowUpRight, ArrowDownRight, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
        <Button size="sm" onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4 mr-1" />
          {t('analytics.createCampaign')}
        </Button>
      </div>

      <div className="rounded-lg border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-medium w-8"></th>
                <th className="text-left p-3 font-medium">{t('analytics.campaignName')}</th>
                <th className="text-left p-3 font-medium">{t('analytics.chain')}</th>
                <th className="text-left p-3 font-medium">{t('analytics.promoDates')}</th>
                <th className="text-left p-3 font-medium">{t('analytics.status')}</th>
                <th className="text-right p-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">{t('common.loading')}</td></tr>
              ) : !promos?.length ? (
                <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">{t('analytics.noPromos')}</td></tr>
              ) : (
                promos.map((promo) => {
                  const status = getStatus(promo.startDate, promo.endDate)
                  const isExpanded = expandedId === promo.id
                  const Icon = isExpanded ? ChevronUp : ChevronDown
                  return (
                    <PromoRow
                      key={promo.id}
                      promo={promo}
                      status={status}
                      statusColor={statusColors[status]}
                      isExpanded={isExpanded}
                      onToggle={() => setExpandedId(isExpanded ? null : promo.id)}
                      onDelete={() => {
                        if (confirm(t('analytics.confirmDelete'))) {
                          deletePromo.mutate(promo.id)
                        }
                      }}
                      Icon={Icon}
                    />
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <PromoCampaignModal isOpen={showModal} onClose={() => setShowModal(false)} chains={chainNames} />
    </div>
  )
}

function PromoRow({ promo, status, statusColor, isExpanded, onToggle, onDelete, Icon }: any) {
  const { t } = useTranslation()
  const { data: analysis } = useAnalyticsPromoAnalysis(isExpanded ? promo.id : '')

  const pctChange = (promo_val: number, baseline_val: number) => {
    if (!baseline_val) return null
    return ((promo_val - baseline_val) / baseline_val * 100).toFixed(1)
  }

  return (
    <>
      <tr className="border-b hover:bg-muted/30 cursor-pointer" onClick={onToggle}>
        <td className="p-3"><Icon className="h-4 w-4 text-muted-foreground" /></td>
        <td className="p-3 font-medium">{promo.name}</td>
        <td className="p-3">{promo.chainName}</td>
        <td className="p-3">{promo.startDate} — {promo.endDate}</td>
        <td className="p-3">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor}`}>{t(`analytics.${status}`)}</span>
        </td>
        <td className="p-3 text-right">
          <button onClick={(e) => { e.stopPropagation(); onDelete() }} className="text-muted-foreground hover:text-destructive">
            <Trash2 className="h-4 w-4" />
          </button>
        </td>
      </tr>
      {isExpanded && analysis && (
        <tr>
          <td colSpan={6} className="p-4 bg-muted/20">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard
                label={t('analytics.transactions')}
                baseline={analysis.baseline?.transactions}
                promo={analysis.promo?.transactions}
                pctChange={pctChange(analysis.promo?.transactions || 0, analysis.baseline?.transactions || 0)}
              />
              <MetricCard
                label={t('analytics.users')}
                baseline={analysis.baseline?.uniqueUsers}
                promo={analysis.promo?.uniqueUsers}
                pctChange={pctChange(analysis.promo?.uniqueUsers || 0, analysis.baseline?.uniqueUsers || 0)}
              />
              <MetricCard
                label={t('analytics.revenue')}
                baseline={analysis.baseline?.totalRevenue ? Number(analysis.baseline.totalRevenue).toLocaleString() : '0'}
                promo={analysis.promo?.totalRevenue ? Number(analysis.promo.totalRevenue).toLocaleString() : '0'}
                pctChange={pctChange(Number(analysis.promo?.totalRevenue) || 0, Number(analysis.baseline?.totalRevenue) || 0)}
              />
              <div className="rounded-lg border bg-card p-3">
                <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                  <UserPlus className="h-3.5 w-3.5" />
                  <span className="text-xs font-medium">{t('analytics.newCustomers')}</span>
                </div>
                <div className="text-xl font-bold">{analysis.newCustomers}</div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

function MetricCard({ label, baseline, promo, pctChange }: { label: string; baseline: any; promo: any; pctChange: string | null }) {
  const { t } = useTranslation()
  const isPositive = pctChange && Number(pctChange) > 0
  const ChangeIcon = isPositive ? ArrowUpRight : ArrowDownRight

  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="text-xs font-medium text-muted-foreground mb-1">{label}</div>
      <div className="text-xl font-bold">{promo ?? 0}</div>
      <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
        <span>{t('analytics.baseline')}: {baseline ?? 0}</span>
        {pctChange && (
          <span className={`flex items-center ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            <ChangeIcon className="h-3 w-3" />{pctChange}%
          </span>
        )}
      </div>
    </div>
  )
}
