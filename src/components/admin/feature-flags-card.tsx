import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useAppSettings, useUpdateAppSettings } from '@/hooks/admin/use-app-settings'
import { queryKeys } from '@/lib/query-keys'
import { ToggleLeft, Shield, TrendingUp, PiggyBank, Loader2, CalendarClock } from 'lucide-react'

export function FeatureFlagsCard() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { data: settings, isLoading } = useAppSettings()
  const updateSettings = useUpdateAppSettings()

  const warrantiesEnabled = settings?.feature_warranties?.value ?? true
  const itemPricingEnabled = settings?.feature_item_pricing?.value ?? true
  const savingsEnabled = settings?.feature_savings?.value ?? true
  const recurringEnabled = settings?.feature_recurring_expenses?.value ?? true

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

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ToggleLeft className="h-5 w-5 text-primary" />
          {t('admin.settings.featureFlags')}
        </CardTitle>
        <CardDescription>
          {t('admin.settings.featureFlagsDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Shield className="h-4 w-4 text-blue-500" />
              {t('admin.settings.featureWarranties')}
            </Label>
            <p className="text-xs text-muted-foreground">
              {t('admin.settings.featureWarrantiesDescription')}
            </p>
          </div>
          <Switch
            checked={warrantiesEnabled}
            onCheckedChange={(checked) => handleToggle('feature_warranties', checked)}
            disabled={updateSettings.isPending}
          />
        </div>

        <div className="h-px bg-border" />

        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <TrendingUp className="h-4 w-4 text-green-500" />
              {t('admin.settings.featureItemPricing')}
            </Label>
            <p className="text-xs text-muted-foreground">
              {t('admin.settings.featureItemPricingDescription')}
            </p>
          </div>
          <Switch
            checked={itemPricingEnabled}
            onCheckedChange={(checked) => handleToggle('feature_item_pricing', checked)}
            disabled={updateSettings.isPending}
          />
        </div>

        <div className="h-px bg-border" />

        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <PiggyBank className="h-4 w-4 text-purple-500" />
              {t('admin.settings.featureSavings')}
            </Label>
            <p className="text-xs text-muted-foreground">
              {t('admin.settings.featureSavingsDescription')}
            </p>
          </div>
          <Switch
            checked={savingsEnabled}
            onCheckedChange={(checked) => handleToggle('feature_savings', checked)}
            disabled={updateSettings.isPending}
          />
        </div>

        <div className="h-px bg-border" />

        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <CalendarClock className="h-4 w-4 text-indigo-500" />
              {t('admin.settings.featureRecurringExpenses')}
            </Label>
            <p className="text-xs text-muted-foreground">
              {t('admin.settings.featureRecurringExpensesDescription')}
            </p>
          </div>
          <Switch
            checked={recurringEnabled}
            onCheckedChange={(checked) => handleToggle('feature_recurring_expenses', checked)}
            disabled={updateSettings.isPending}
          />
        </div>
      </CardContent>
    </Card>
  )
}
