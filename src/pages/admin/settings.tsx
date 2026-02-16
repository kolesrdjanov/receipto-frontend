import { useTranslation } from 'react-i18next'
import { AppLayout } from '@/components/layout/app-layout'
import { AiSettingsCard } from '@/components/admin/ai-settings-card'

export default function AdminSettings() {
  const { t } = useTranslation()

  return (
    <AppLayout>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-1 sm:text-3xl sm:mb-2">
            {t('admin.settings.title')}
          </h2>
          <p className="text-sm text-muted-foreground sm:text-base">
            {t('admin.settings.subtitle')}
          </p>
        </div>
      </div>

      <div className="max-w-2xl space-y-6">
        <AiSettingsCard />
      </div>
    </AppLayout>
  )
}
