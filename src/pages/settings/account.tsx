import { useTranslation } from 'react-i18next'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { KeyRound, AlertTriangle, Trash2 } from 'lucide-react'
import { useChangePassword, useDeleteMyAccount } from '@/hooks/users/use-me'
import { toast } from 'sonner'
import { useState } from 'react'

export default function AccountSettings() {
  const { t } = useTranslation()
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
          <KeyRound className="h-6 w-6 sm:h-8 sm:w-8" />
          {t('nav.account')}
        </h2>
        <p className="text-sm text-muted-foreground sm:text-base">
          {t('settings.security.description')}
        </p>
      </div>

      <div className="grid gap-6">
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
                className="!text-white"
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
