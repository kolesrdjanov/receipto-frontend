import { useTranslation } from 'react-i18next'
import { AppLayout } from '@/components/layout/app-layout'
import { PageContent } from '@/components/layout/page-content'
import { PageHeader } from '@/components/layout/page-header'
import { PageTransition } from '@/components/ui/animated'
import { AiSettingsCard } from '@/components/admin/ai-settings-card'
import { FeatureFlagsCard } from '@/components/admin/feature-flags-card'

export default function AdminSettings() {
  const { t } = useTranslation()

  return (
    <AppLayout>
      <PageTransition>
        <PageHeader title={t('admin.settings.title')} subtitle={t('admin.settings.subtitle')} />

        <PageContent>
        <div className="mx-auto max-w-[760px] space-y-[18px]">
          <FeatureFlagsCard />
          <AiSettingsCard />
        </div>
        </PageContent>
      </PageTransition>
    </AppLayout>
  )
}
