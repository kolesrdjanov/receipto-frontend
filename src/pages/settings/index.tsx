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
import { useSettingsStore, type Theme, type AccentColor, type Language } from '@/store/settings'
import { useCurrencies, getCurrencyFlag  } from '@/hooks/currencies/use-currencies'
import { Settings as SettingsIcon, Palette, DollarSign, Check, Languages, User as UserIcon, Image as ImageIcon, Trash2, Save } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/auth'
import { useMe, useUpdateMe } from '@/hooks/users/use-me'
import { toast } from 'sonner'
import { useMemo, useState } from 'react'

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

export default function Settings() {
  const { t } = useTranslation()
  const { currency, theme, accentColor, language, setCurrency, setTheme, setAccentColor, setLanguage } = useSettingsStore()
  const { currencies } = useCurrencies()

  const authUser = useAuthStore((s) => s.user)

  const { data: me } = useMe(true)
  const updateMe = useUpdateMe()

  const effectiveUser = me ?? authUser

  const initial = useMemo(
    () => ({
      firstName: effectiveUser?.firstName ?? '',
      lastName: effectiveUser?.lastName ?? '',
      profileImageUrl: effectiveUser?.profileImageUrl ?? null,
      userId: effectiveUser?.id ?? null,
    }),
    [effectiveUser?.firstName, effectiveUser?.lastName, effectiveUser?.profileImageUrl, effectiveUser?.id]
  )

  // Keep a per-user draft without using setState inside an effect (lint rule).
  const [draft, setDraft] = useState<{ firstName: string; lastName: string }>(() => ({
    firstName: initial.firstName,
    lastName: initial.lastName,
  }))

  const profileKey = initial.userId ?? 'no-user'

  const isDirty = draft.firstName !== initial.firstName || draft.lastName !== initial.lastName

  const handleSaveProfile = async () => {
    if (!effectiveUser) return

    try {
      await updateMe.mutateAsync({
        firstName: draft.firstName.trim(),
        lastName: draft.lastName.trim(),
      })
      toast.success(t('settings.profile.saved'))
    } catch (err) {
      toast.error(t('settings.profile.saveError'), {
        description: err instanceof Error ? err.message : 'An error occurred',
      })
    }
  }

  const handleRemoveProfileImage = async () => {
    if (!effectiveUser) return

    try {
      await updateMe.mutateAsync({ removeProfileImage: true })
      toast.success(t('settings.profile.pictureRemoved'))
    } catch (err) {
      toast.error(t('settings.profile.saveError'), {
        description: err instanceof Error ? err.message : 'An error occurred',
      })
    }
  }

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
              <Select value={language} onValueChange={(value: Language) => setLanguage(value)}>
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
              <Select value={currency} onValueChange={(value: string) => setCurrency(value)}>
                <SelectTrigger id="currency" className="w-full sm:w-auto">
                  <SelectValue placeholder={t('settings.currency.label')} />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      <span className="flex items-center gap-2">
                        <span>{getCurrencyFlag(c.icon)}</span>
                        <span>{c.name}</span>
                        <span className="font-mono text-muted-foreground">{c.symbol}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="h-5 w-5" />
              {t('settings.profile.title')}
            </CardTitle>
            <CardDescription>
              {t('settings.profile.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4" key={profileKey}>
            {!effectiveUser ? (
              <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
            ) : (
              <>
                {/* Profile picture (top) */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-0.5">
                    <Label>{t('settings.profile.picture')}</Label>
                    <p className="text-sm text-muted-foreground">{t('settings.profile.pictureHelp')}</p>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    {effectiveUser.profileImageUrl ? (
                      <img
                        src={effectiveUser.profileImageUrl}
                        alt={t('settings.profile.picture')}
                        className="h-20 w-20 sm:h-24 sm:w-24 rounded-full object-cover border"
                      />
                    ) : (
                      <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-muted flex items-center justify-center border">
                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="default"
                        disabled
                        title={t('settings.profile.pictureUploadComingSoon')}
                      >
                        <ImageIcon className="h-4 w-4 mr-2" />
                        {t('settings.profile.upload')}
                      </Button>

                      <Button
                        type="button"
                        variant="destructive"
                        size="default"
                        onClick={handleRemoveProfileImage}
                        disabled={!effectiveUser.profileImageUrl || updateMe.isPending}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {t('settings.profile.remove')}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Names */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">{t('settings.profile.firstName')}</Label>
                    <Input
                      id="firstName"
                      value={draft.firstName}
                      onChange={(e) => setDraft((p) => ({ ...p, firstName: e.target.value }))}
                      autoComplete="given-name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName">{t('settings.profile.lastName')}</Label>
                    <Input
                      id="lastName"
                      value={draft.lastName}
                      onChange={(e) => setDraft((p) => ({ ...p, lastName: e.target.value }))}
                      autoComplete="family-name"
                    />
                  </div>
                </div>

                {/* Email (below names) */}
                <div className="space-y-2">
                  <Label htmlFor="email">{t('settings.profile.email')}</Label>
                  <Input id="email" value={effectiveUser.email} disabled />
                </div>

                <div className="flex justify-end">
                  <Button
                    type="button"
                    onClick={handleSaveProfile}
                    disabled={!isDirty || updateMe.isPending}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {updateMe.isPending ? t('common.saving') : t('common.save')}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
