import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAppSettings, useUpdateAppSettings } from '@/hooks/admin/use-app-settings'
import { queryKeys } from '@/lib/query-keys'
import { ToggleLeft, Shield, TrendingUp, Loader2, CalendarClock, CreditCard } from 'lucide-react'
import { AdminCard, AdminCardHead, FeatureSwitchRow } from '@/components/admin/primitives'

export function FeatureFlagsCard() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { data: settings, isLoading } = useAppSettings()
  const updateSettings = useUpdateAppSettings()

  const warrantiesEnabled = settings?.feature_warranties?.value ?? true
  const itemPricingEnabled = settings?.feature_item_pricing?.value ?? true
  const recurringEnabled = settings?.feature_recurring_expenses?.value ?? true
  const loyaltyCardsEnabled = settings?.feature_loyalty_cards?.value ?? true

  const handleToggle = (key: string, value: boolean) => {
    updateSettings.mutate({ [key]: value }, {
      onSuccess: () => {
        toast.success(t('admin.settings.updated'))
        queryClient.invalidateQueries({ queryKey: queryKeys.settings.features() })
      },
      onError: () => {
        toast.error(t('common.error'))
      },
    })
  }

  return (
    <AdminCard>
      <AdminCardHead
        icon={ToggleLeft}
        title={t('admin.settings.featureFlags')}
        desc={t('admin.settings.featureFlagsDescription')}
      />
      <div className="mt-3 px-5 pb-5 sm:px-[22px]">
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="divide-y divide-hairline-soft">
            <FeatureSwitchRow
              icon={Shield}
              tone="info"
              title={t('admin.settings.featureWarranties')}
              desc={t('admin.settings.featureWarrantiesDescription')}
              checked={warrantiesEnabled}
              onCheckedChange={(checked) => handleToggle('feature_warranties', checked)}
              disabled={updateSettings.isPending}
            />
            <FeatureSwitchRow
              icon={TrendingUp}
              tone="success"
              title={t('admin.settings.featureItemPricing')}
              desc={t('admin.settings.featureItemPricingDescription')}
              checked={itemPricingEnabled}
              onCheckedChange={(checked) => handleToggle('feature_item_pricing', checked)}
              disabled={updateSettings.isPending}
            />
            <FeatureSwitchRow
              icon={CalendarClock}
              tone="violet"
              title={t('admin.settings.featureRecurringExpenses')}
              desc={t('admin.settings.featureRecurringExpensesDescription')}
              checked={recurringEnabled}
              onCheckedChange={(checked) => handleToggle('feature_recurring_expenses', checked)}
              disabled={updateSettings.isPending}
            />
            <FeatureSwitchRow
              icon={CreditCard}
              tone="warn"
              title={t('admin.settings.featureLoyaltyCards')}
              desc={t('admin.settings.featureLoyaltyCardsDescription')}
              checked={loyaltyCardsEnabled}
              onCheckedChange={(checked) => handleToggle('feature_loyalty_cards', checked)}
              disabled={updateSettings.isPending}
            />
          </div>
        )}
      </div>
    </AdminCard>
  )
}
