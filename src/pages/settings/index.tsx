import { useTranslation } from 'react-i18next'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Avatar } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useSettingsStore, type Theme, type AccentColor, type Language } from '@/store/settings'
import { useCurrencies, getCurrencyFlag  } from '@/hooks/currencies/use-currencies'
import { Settings as SettingsIcon, Palette, DollarSign, Check, Languages, User as UserIcon, Image as ImageIcon, Trash2, Save, Bell, KeyRound, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/auth'
import { useMe, useUpdateMe, useUploadProfileImage, useChangePassword, useDeleteMyAccount } from '@/hooks/users/use-me'
import { toast } from 'sonner'
import { useMemo, useState, useRef } from 'react'

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
  const uploadProfileImage = useUploadProfileImage()
  const changePassword = useChangePassword()
  const deleteMyAccount = useDeleteMyAccount()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [passwordError, setPasswordError] = useState<string | null>(null)

  // Delete account state
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

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

  const handleFileSelect = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic']
    if (!validTypes.includes(file.type)) {
      toast.error(t('settings.profile.invalidFileType'))
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('settings.profile.fileTooLarge'))
      return
    }

    try {
      await uploadProfileImage.mutateAsync(file)
      toast.success(t('settings.profile.pictureUploaded'))
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (err) {
      toast.error(t('settings.profile.uploadError'), {
        description: err instanceof Error ? err.message : 'An error occurred',
      })
    }
  }

  const handleChangePassword = async () => {
    setPasswordError(null)

    // Validate
    if (!passwordForm.currentPassword) {
      setPasswordError(t('settings.security.currentPasswordRequired'))
      return
    }
    if (!passwordForm.newPassword) {
      setPasswordError(t('settings.security.newPasswordRequired'))
      return
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordError(t('settings.security.passwordTooShort'))
      return
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError(t('settings.security.passwordsDoNotMatch'))
      return
    }

    try {
      await changePassword.mutateAsync({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      })
      toast.success(t('settings.security.passwordChanged'))
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      const message = err instanceof Error ? err.message : t('settings.security.changePasswordError')
      setPasswordError(message)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return

    try {
      await deleteMyAccount.mutateAsync()
      toast.success(t('settings.dangerZone.accountDeleted'))
      // User will be logged out automatically by the hook
    } catch (err) {
      toast.error(t('settings.dangerZone.deleteError'), {
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
                    <Avatar
                      firstName={effectiveUser.firstName}
                      lastName={effectiveUser.lastName}
                      imageUrl={effectiveUser.profileImageUrl}
                      size="2xl"
                      className=""
                    />

                    <div className="flex gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp,image/heic"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="default"
                        onClick={handleFileSelect}
                        disabled={uploadProfileImage.isPending}
                      >
                        <ImageIcon className="h-4 w-4" />
                        {uploadProfileImage.isPending ? t('common.uploading') : t('settings.profile.upload')}
                      </Button>

                      <Button
                        type="button"
                        variant="destructive"
                        size="default"
                        onClick={handleRemoveProfileImage}
                        disabled={!effectiveUser.profileImageUrl || updateMe.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
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
                    <Save className="h-4 w-4" />
                    {updateMe.isPending ? t('common.saving') : t('common.save')}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Security - Password Change */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5" />
              {t('settings.security.title')}
            </CardTitle>
            <CardDescription>
              {t('settings.security.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">{t('settings.security.currentPassword')}</Label>
              <Input
                id="currentPassword"
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }))}
                autoComplete="current-password"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="newPassword">{t('settings.security.newPassword')}</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))}
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t('settings.security.confirmPassword')}</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                  autoComplete="new-password"
                />
              </div>
            </div>
            {passwordError && (
              <p className="text-sm text-destructive">{passwordError}</p>
            )}
            <div className="flex justify-end">
              <Button
                type="button"
                onClick={handleChangePassword}
                disabled={changePassword.isPending || !passwordForm.currentPassword || !passwordForm.newPassword}
              >
                <KeyRound className="h-4 w-4" />
                {changePassword.isPending ? t('common.saving') : t('settings.security.changePassword')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone - Delete Account */}
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              {t('settings.dangerZone.title')}
            </CardTitle>
            <CardDescription>
              {t('settings.dangerZone.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-destructive/10 p-4 space-y-3">
              <p className="text-sm font-medium text-destructive">
                {t('settings.dangerZone.deleteAccountWarning')}
              </p>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                <li>{t('settings.dangerZone.deleteItem1')}</li>
                <li>{t('settings.dangerZone.deleteItem2')}</li>
                <li>{t('settings.dangerZone.deleteItem3')}</li>
                <li>{t('settings.dangerZone.deleteItem4')}</li>
              </ul>
            </div>

            {!showDeleteConfirm ? (
              <Button
                type="button"
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="h-4 w-4" />
                {t('settings.dangerZone.deleteAccount')}
              </Button>
            ) : (
              <div className="space-y-3 p-4 border border-destructive rounded-lg">
                <p className="text-sm font-medium">
                  {t('settings.dangerZone.confirmPrompt')}
                </p>
                <Input
                  type="text"
                  placeholder="DELETE"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="font-mono"
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowDeleteConfirm(false)
                      setDeleteConfirmText('')
                    }}
                  >
                    {t('common.cancel')}
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDeleteAccount}
                    disabled={deleteConfirmText !== 'DELETE' || deleteMyAccount.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                    {deleteMyAccount.isPending ? t('common.deleting') : t('settings.dangerZone.confirmDelete')}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
