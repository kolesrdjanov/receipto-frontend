import { useTranslation } from 'react-i18next'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useSettingsStore, type Theme, type AccentColor, type Language } from '@/store/settings'
import { CurrencySelect } from '@/components/ui/currency-select'
import { Settings as SettingsIcon, Palette, DollarSign, Check, Languages, Bell } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth'
import { useMe, useUpdateMe } from '@/hooks/users/use-me'

const themes: { value: Theme; labelKey: string }[] = [
  { value: 'light', labelKey: 'settings.appearance.light' },
  { value: 'dark', labelKey: 'settings.appearance.dark' },
  { value: 'system', labelKey: 'settings.appearance.system' },
]

const accentColors: { value: AccentColor; labelKey: string; color: string }[] = [
  { value: 'zinc', labelKey: 'settings.accentColor.zinc', color: 'bg-zinc-600' },
  { value: 'blue', labelKey: 'settings.accentColor.blue', color: 'bg-blue-500' },
  { value: 'green', labelKey: 'settings.accentColor.green', color: 'bg-green-500' },
  { value: 'purple', labelKey: 'settings.accentColor.purple', color: 'bg-purple-500' },
  { value: 'orange', labelKey: 'settings.accentColor.orange', color: 'bg-orange-500' },
  { value: 'rose', labelKey: 'settings.accentColor.rose', color: 'bg-rose-500' },
]

const languages: { value: Language; labelKey: string }[] = [
  { value: 'en', labelKey: 'settings.language.en' },
  { value: 'sr', labelKey: 'settings.language.sr' },
]

export default function AppSettings() {
  const { t } = useTranslation()
  const { currency, theme, accentColor, language, setCurrency, setTheme, setAccentColor, setLanguage } = useSettingsStore()

  const authUser = useAuthStore((s) => s.user)
  const { data: me } = useMe(true)
  const updateMe = useUpdateMe()

  const effectiveUser = me ?? authUser
  const receiptMilestoneEmailsEnabled = effectiveUser?.receiptMilestoneEmailsEnabled ?? true

  return (
    <AppLayout>
      <div className="mb-6 sm:mb-8">
        <h2 className="text-2xl font-bold tracking-tight mb-1 sm:text-3xl sm:mb-2 flex items-center gap-2">
          <SettingsIcon className="h-6 w-6 sm:h-8 sm:w-8" />
          {t('settings.title')}
        </h2>
        <p className="text-sm text-muted-foreground sm:text-base">
          {t('settings.subtitle')}
        </p>
      </div>

      <div className="grid gap-6">
        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              {t('settings.appearance.title')}
            </CardTitle>
            <CardDescription>
              {t('settings.appearance.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="space-y-0.5">
                <Label htmlFor="theme">{t('settings.appearance.theme')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('settings.appearance.themeHelp')}
                </p>
              </div>
              <Select value={theme} onValueChange={(value: Theme) => setTheme(value)}>
                <SelectTrigger id="theme" className="w-full sm:w-[180px]">
                  <SelectValue placeholder={t('settings.appearance.theme')} />
                </SelectTrigger>
                <SelectContent>
                  {themes.map((themeOption) => (
                    <SelectItem key={themeOption.value} value={themeOption.value}>
                      {t(themeOption.labelKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <div className="space-y-0.5">
                <Label>{t('settings.accentColor.title')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('settings.accentColor.description')}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {accentColors.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setAccentColor(c.value)}
                    className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center transition-all',
                      c.color,
                      accentColor === c.value
                        ? 'ring-2 ring-offset-2 ring-offset-background ring-foreground scale-110'
                        : 'hover:scale-101'
                    )}
                    title={t(c.labelKey)}
                  >
                    {accentColor === c.value && (
                      <Check className="h-5 w-5 text-white" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Language */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Languages className="h-5 w-5" />
              {t('settings.language.title')}
            </CardTitle>
            <CardDescription>
              {t('settings.language.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="space-y-0.5">
                <Label htmlFor="language">{t('settings.language.label')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('settings.language.help')}
                </p>
              </div>
              <Select value={language} onValueChange={(value: Language) => {
                setLanguage(value)
                updateMe.mutate({ preferredLanguage: value })
              }}>
                <SelectTrigger id="language" className="w-full sm:w-[180px]">
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
            </div>
          </CardContent>
        </Card>

        {/* Currency */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              {t('settings.currency.title')}
            </CardTitle>
            <CardDescription>
              {t('settings.currency.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="space-y-0.5">
                <Label htmlFor="currency">{t('settings.currency.label')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('settings.currency.help')}
                </p>
              </div>
              <CurrencySelect
                id="currency"
                value={currency}
                onValueChange={(value: string) => setCurrency(value)}
                placeholder={t('settings.currency.label')}
                triggerClassName="w-full sm:w-auto"
                variant="full"
              />
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              {t('settings.notifications.title')}
            </CardTitle>
            <CardDescription>
              {t('settings.notifications.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('settings.notifications.rankMilestones')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('settings.notifications.rankMilestonesHelp')}
                </p>
              </div>
              <Switch
                checked={receiptMilestoneEmailsEnabled}
                onCheckedChange={(checked) => updateMe.mutate({ receiptMilestoneEmailsEnabled: checked })}
              />
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t('settings.notifications.warrantyReminders')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('settings.notifications.warrantyRemindersHelp')}
                  </p>
                </div>
                <Switch
                  checked={effectiveUser?.warrantyReminderEnabled ?? true}
                  onCheckedChange={(checked) => updateMe.mutate({ warrantyReminderEnabled: checked })}
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t('settings.notifications.budgetAlerts')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('settings.notifications.budgetAlertsHelp')}
                  </p>
                </div>
                <Switch
                  checked={effectiveUser?.budgetAlertEnabled ?? true}
                  onCheckedChange={(checked) => updateMe.mutate({ budgetAlertEnabled: checked })}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
