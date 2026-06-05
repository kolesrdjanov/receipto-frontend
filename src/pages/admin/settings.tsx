import { useTranslation } from 'react-i18next'
import { AppLayout } from '@/components/layout/app-layout'
import { PageToolbar } from '@/components/layout/page-toolbar'
import { PageTransition } from '@/components/ui/animated'
import { AiSettingsCard } from '@/components/admin/ai-settings-card'
import { FeatureFlagsCard } from '@/components/admin/feature-flags-card'

export default function AdminSettings() {
  const { t } = useTranslation()

  return (
    <AppLayout>
      <PageTransition>
        <PageToolbar
          className="md:-mx-8 md:-mt-8 md:mb-6"
          title={t('admin.settings.title')}
          subtitle={t('admin.settings.subtitle')}
        />

        <div className="mb-5 md:hidden">
          <h1 className="t-h1 text-[28px]">{t('admin.settings.title')}</h1>
          <p className="t-sm mt-1 text-muted-foreground">{t('admin.settings.subtitle')}</p>
        </div>

        <div className="mx-auto max-w-[760px] space-y-[18px]">
          <FeatureFlagsCard />
          <AiSettingsCard />
        </div>
      </PageTransition>
    </AppLayout>
  )
}
