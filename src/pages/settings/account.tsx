import { useTranslation } from 'react-i18next'
import { AppLayout } from '@/components/layout/app-layout'
import { PageToolbar } from '@/components/layout/page-toolbar'
import { PageTransition } from '@/components/ui/animated'
import { SettingsCard } from '@/components/settings/primitives'
import { PasswordField, PasswordStrengthMeter, Alert } from '@/components/glass/glass'
import { GlassDialog } from '@/components/glass/glass-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { KeyRound, AlertTriangle, Trash2, CircleAlert } from 'lucide-react'
import { useChangePassword, useDeleteMyAccount } from '@/hooks/users/use-me'
import { useIsMobile } from '@/hooks/use-mobile'
import { toast } from 'sonner'
import { useState } from 'react'

export default function AccountSettings() {
  const { t } = useTranslation()
  const isMobile = useIsMobile(768)
  const changePassword = useChangePassword()
  const deleteMyAccount = useDeleteMyAccount()

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [passwordError, setPasswordError] = useState<string | null>(null)

  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleChangePassword = async () => {
    setPasswordError(null)

    if (!passwordForm.currentPassword) {
      setPasswordError(t('settings.security.currentPasswordRequired'))
      return
    }
    if (!passwordForm.newPassword) {
      setPasswordError(t('settings.security.newPasswordRequired'))
      return
    }
    if (passwordForm.newPassword.length < 8) {
      setPasswordError(t('settings.security.passwordTooShort'))
      return
    }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(passwordForm.newPassword)) {
      setPasswordError(t('settings.security.passwordRequirements'))
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
    } catch (err) {
      toast.error(t('settings.dangerZone.deleteError'), {
        description: err instanceof Error ? err.message : 'An error occurred',
      })
    }
  }

  const cancelDelete = () => {
    setShowDeleteConfirm(false)
    setDeleteConfirmText('')
  }

  const deleteItems = [
    t('settings.dangerZone.deleteItem1'),
    t('settings.dangerZone.deleteItem2'),
    t('settings.dangerZone.deleteItem3'),
    t('settings.dangerZone.deleteItem4'),
  ]

  const warningBox = (
    <div className="rounded-xl bg-destructive-soft p-4">
      <p className="text-sm font-semibold text-[color:var(--destructive-foreground-on-soft)]">
        {t('settings.dangerZone.deleteAccountWarning')}
      </p>
      <ul className="mt-2 list-inside list-disc space-y-1 text-[13px] text-[color:var(--destructive-foreground-on-soft)]/85">
        {deleteItems.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  )

  return (
    <AppLayout>
      <PageTransition>
        <PageToolbar
          className="md:-mx-8 md:-mt-8 md:mb-6"
          title={t('nav.account')}
          subtitle={t('settings.security.accountPageDescription')}
        />

        {/* Mobile header */}
        <div className="mb-5 md:hidden">
          <h1 className="t-h1 text-[28px]">{t('nav.account')}</h1>
          <p className="t-sm mt-1 text-muted-foreground">{t('settings.security.accountPageDescription')}</p>
        </div>

        <div className="mx-auto max-w-3xl space-y-5">
          {/* Security — password change */}
          <SettingsCard icon={KeyRound} title={t('settings.security.title')} desc={t('settings.security.description')}>
            <div className="space-y-4">
              <PasswordField
                label={t('settings.security.currentPassword')}
                id="currentPassword"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }))}
                autoComplete="current-password"
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <PasswordField
                    label={t('settings.security.newPassword')}
                    id="newPassword"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))}
                    autoComplete="new-password"
                  />
                  <PasswordStrengthMeter value={passwordForm.newPassword} />
                </div>
                <PasswordField
                  label={t('settings.security.confirmPassword')}
                  id="confirmPassword"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                  autoComplete="new-password"
                />
              </div>
              {passwordError && (
                <Alert kind="err" icon={CircleAlert} className="mb-0">
                  {passwordError}
                </Alert>
              )}
              <div className="flex justify-end">
                <Button
                  type="button"
                  onClick={handleChangePassword}
                  disabled={changePassword.isPending || !passwordForm.currentPassword || !passwordForm.newPassword}
                >
                  <KeyRound className="size-4" />
                  {changePassword.isPending ? t('common.saving') : t('settings.security.changePassword')}
                </Button>
              </div>
            </div>
          </SettingsCard>

          {/* Danger zone */}
          <SettingsCard danger icon={AlertTriangle} title={t('settings.dangerZone.title')} desc={t('settings.dangerZone.description')}>
            {warningBox}

            {!isMobile && showDeleteConfirm ? (
              <div className="mt-4 space-y-3 rounded-xl border border-destructive/50 p-4">
                <p className="text-sm font-semibold">{t('settings.dangerZone.confirmPrompt')}</p>
                <Input
                  type="text"
                  placeholder="DELETE"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="font-mono"
                />
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={cancelDelete}>
                    {t('common.cancel')}
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    className="!text-white"
                    onClick={handleDeleteAccount}
                    disabled={deleteConfirmText !== 'DELETE' || deleteMyAccount.isPending}
                  >
                    <Trash2 className="size-4" />
                    {deleteMyAccount.isPending ? t('common.deleting') : t('settings.dangerZone.confirmDelete')}
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                type="button"
                variant="destructive"
                className="mt-4 !text-white"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="size-4" />
                {t('settings.dangerZone.deleteAccount')}
              </Button>
            )}
          </SettingsCard>
        </div>
      </PageTransition>

      {/* Mobile delete confirm — bottom sheet */}
      <GlassDialog
        open={isMobile && showDeleteConfirm}
        onOpenChange={(o) => { if (!o) cancelDelete() }}
        title={t('settings.dangerZone.deleteAccount')}
        description={t('settings.dangerZone.mobileSubtitle')}
        actions={{
          primary: (
            <Button
              type="button"
              variant="destructive"
              className="rounded-xl !text-white"
              onClick={handleDeleteAccount}
              disabled={deleteConfirmText !== 'DELETE' || deleteMyAccount.isPending}
            >
              <Trash2 className="size-4" />
              {deleteMyAccount.isPending ? t('common.deleting') : t('settings.dangerZone.confirmDelete')}
            </Button>
          ),
          secondary: (
            <Button type="button" variant="ghost" className="rounded-xl" onClick={cancelDelete}>
              {t('common.cancel')}
            </Button>
          ),
        }}
      >
        <div className="space-y-4">
          <div className="grid place-items-center">
            <span className="grid size-[60px] place-items-center rounded-[18px] bg-destructive-soft text-destructive">
              <AlertTriangle className="size-[26px]" />
            </span>
          </div>
          {warningBox}
          <div className="space-y-2">
            <p className="text-sm font-semibold">{t('settings.dangerZone.confirmPrompt')}</p>
            <Input
              type="text"
              placeholder="DELETE"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              className="font-mono"
            />
          </div>
        </div>
      </GlassDialog>
    </AppLayout>
  )
}
