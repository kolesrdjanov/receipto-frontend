import { useTranslation } from 'react-i18next'
import { AppLayout } from '@/components/layout/app-layout'
import { PageToolbar } from '@/components/layout/page-toolbar'
import { PageTransition } from '@/components/ui/animated'
import { ThemeSegmented } from '@/components/layout/theme-segmented'
import {
  SettingsCard,
  SettingRow,
  AccentRetired,
  NotifList,
  NotifRow,
} from '@/components/settings/primitives'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CurrencySelect } from '@/components/ui/currency-select'
import { useSettingsStore, type Language } from '@/store/settings'
import { useAuthStore } from '@/store/auth'
import { useMe, useUpdateMe } from '@/hooks/users/use-me'
import { Palette, DollarSign, Languages, Bell, Globe } from 'lucide-react'

const languages: { value: Language; labelKey: string }[] = [
  { value: 'en', labelKey: 'settings.language.en' },
  { value: 'sr', labelKey: 'settings.language.sr' },
]

export default function AppSettings() {
  const { t } = useTranslation()
  const { currency, language, setCurrency, setLanguage } = useSettingsStore()

  const authUser = useAuthStore((s) => s.user)
  const { data: me } = useMe(true)
  const updateMe = useUpdateMe()

  const effectiveUser = me ?? authUser

  return (
    <AppLayout>
      <PageTransition>
        <PageToolbar
          className="md:-mx-8 md:-mt-8 md:mb-6"
          title={t('settings.title')}
          subtitle={t('settings.subtitle')}
        />

        {/* Mobile header */}
        <div className="mb-5 md:hidden">
          <h1 className="t-h1 text-[28px]">{t('settings.title')}</h1>
          <p className="t-sm mt-1 text-muted-foreground">{t('settings.subtitle')}</p>
        </div>

        <div className="mx-auto max-w-3xl space-y-5">
          {/* Appearance */}
          <SettingsCard icon={Palette} title={t('settings.appearance.title')} desc={t('settings.appearance.description')}>
            <SettingRow label={t('settings.appearance.theme')} help={t('settings.appearance.themeHelp')}>
              <ThemeSegmented labeled />
            </SettingRow>
            <div className="my-4 h-px bg-hairline-soft" />
            <AccentRetired />
          </SettingsCard>

          {/* Language */}
          <SettingsCard icon={Languages} title={t('settings.language.title')} desc={t('settings.language.description')}>
            <SettingRow label={t('settings.language.label')} help={t('settings.language.help')} htmlFor="language">
              <Select
                value={language}
                onValueChange={(value: Language) => {
                  setLanguage(value)
                  updateMe.mutate({ preferredLanguage: value })
                }}
              >
                <SelectTrigger id="language" className="w-full sm:w-[200px]">
                  <Globe className="size-4 shrink-0 text-muted-foreground" />
                  <SelectValue placeholder={t('settings.language.label')} />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {t(lang.labelKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </SettingRow>
          </SettingsCard>

          {/* Currency */}
          <SettingsCard icon={DollarSign} title={t('settings.currency.title')} desc={t('settings.currency.description')}>
            <SettingRow label={t('settings.currency.label')} help={t('settings.currency.help')} htmlFor="currency">
              <CurrencySelect
                id="currency"
                value={currency}
                onValueChange={(value: string) => setCurrency(value)}
                placeholder={t('settings.currency.label')}
                triggerClassName="w-full sm:w-[248px]"
                variant="full"
              />
            </SettingRow>
          </SettingsCard>

          {/* Notifications */}
          <SettingsCard icon={Bell} title={t('settings.notifications.title')} desc={t('settings.notifications.description')}>
            <NotifList>
              <NotifRow
                title={t('settings.notifications.rankMilestones')}
                help={t('settings.notifications.rankMilestonesHelp')}
                checked={effectiveUser?.receiptMilestoneEmailsEnabled ?? true}
                onCheckedChange={(checked) => updateMe.mutate({ receiptMilestoneEmailsEnabled: checked })}
                disabled={updateMe.isPending}
              />
              <NotifRow
                title={t('settings.notifications.warrantyReminders')}
                help={t('settings.notifications.warrantyRemindersHelp')}
                checked={effectiveUser?.warrantyReminderEnabled ?? true}
                onCheckedChange={(checked) => updateMe.mutate({ warrantyReminderEnabled: checked })}
                disabled={updateMe.isPending}
              />
              <NotifRow
                title={t('settings.notifications.budgetAlerts')}
                help={t('settings.notifications.budgetAlertsHelp')}
                checked={effectiveUser?.budgetAlertEnabled ?? true}
                onCheckedChange={(checked) => updateMe.mutate({ budgetAlertEnabled: checked })}
                disabled={updateMe.isPending}
              />
            </NotifList>
          </SettingsCard>
        </div>
      </PageTransition>
    </AppLayout>
  )
}
