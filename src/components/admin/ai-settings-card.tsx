import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useAppSettings, useUpdateAppSettings } from '@/hooks/admin/use-app-settings'
import { Bot, Sparkles, Loader2, TrendingUp } from 'lucide-react'
import { AdminCard, AdminCardHead, FeatureSwitchRow } from '@/components/admin/primitives'

export function AiSettingsCard() {
  const { t } = useTranslation()
  const { data: settings, isLoading } = useAppSettings()
  const updateSettings = useUpdateAppSettings()

  const aiCoachEnabled = settings?.ai_coach_enabled?.value ?? true
  const aiCategorizationEnabled = settings?.ai_categorization_enabled?.value ?? true
  const aiItemsEnabled = settings?.ai_items_enabled?.value ?? true

  const handleToggle = (key: string, value: boolean) => {
    updateSettings.mutate({ [key]: value }, {
      onSuccess: () => {
        toast.success(t('admin.settings.updated'))
      },
      onError: () => {
        toast.error(t('common.error'))
      },
    })
  }

  return (
    <AdminCard>
      <AdminCardHead
        icon={Bot}
        title={t('admin.settings.aiFeatures')}
        desc={t('admin.settings.aiDescription')}
      />
      <div className="mt-3 px-5 pb-5 sm:px-[22px]">
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="divide-y divide-hairline-soft">
            <FeatureSwitchRow
              icon={Sparkles}
              tone="warn"
              title={t('admin.settings.aiCoach')}
              desc={t('admin.settings.aiCoachDescription')}
              checked={aiCoachEnabled}
              onCheckedChange={(checked) => handleToggle('ai_coach_enabled', checked)}
              disabled={updateSettings.isPending}
            />
            <FeatureSwitchRow
              icon={Bot}
              tone="info"
              title={t('admin.settings.aiCategorization')}
              desc={t('admin.settings.aiCategorizationDescription')}
              checked={aiCategorizationEnabled}
              onCheckedChange={(checked) => handleToggle('ai_categorization_enabled', checked)}
              disabled={updateSettings.isPending}
            />
            <FeatureSwitchRow
              icon={TrendingUp}
              tone="success"
              title={t('admin.settings.aiItems')}
              desc={t('admin.settings.aiItemsDescription')}
              checked={aiItemsEnabled}
              onCheckedChange={(checked) => handleToggle('ai_items_enabled', checked)}
              disabled={updateSettings.isPending}
            />
          </div>
        )}
      </div>
    </AdminCard>
  )
}
