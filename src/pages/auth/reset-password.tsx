import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AuthLayout } from '@/components/layout/auth-layout'
import { useResetPassword } from '@/hooks/auth/use-reset-password'

export default function ResetPassword() {
  const { t } = useTranslation()
  const { formData, errors, apiError, success, isLoading, token, handleChange, handleSubmit } = useResetPassword()

  if (!token) {
    return (
      <AuthLayout>
        <Card className="w-full max-w-md backdrop-blur-sm bg-card/80 border-border/50 shadow-xl">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold">{t('auth.resetPassword.invalidLink')}</CardTitle>
            <CardDescription>
              {t('auth.resetPassword.invalidLinkMessage')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/forgot-password">
              <Button className="w-full">
                {t('auth.resetPassword.requestNewLink')}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <Card className="w-full max-w-md backdrop-blur-sm bg-card/80 border-border/50 shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">{t('auth.resetPassword.title')}</CardTitle>
          <CardDescription>
            {t('auth.resetPassword.subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="space-y-4">
              <div className="p-4 rounded-md bg-green-500/10 text-green-600 dark:text-green-400 text-sm text-center">
                {t('auth.resetPassword.successMessage')}
              </div>
              <p className="text-center text-sm text-muted-foreground">
                {t('auth.resetPassword.redirecting')}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {apiError && (
                <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                  {apiError}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">{t('auth.resetPassword.password')}</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder={t('auth.resetPassword.passwordPlaceholder')}
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isLoading}
                  required
                  className="bg-background/50"
                />
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t('auth.resetPassword.confirmPassword')}</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  placeholder={t('auth.resetPassword.confirmPasswordPlaceholder')}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={isLoading}
                  required
                  className="bg-background/50"
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? t('auth.resetPassword.submitting') : t('auth.resetPassword.submit')}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                {t('auth.resetPassword.rememberPassword')}{' '}
                <Link to="/sign-in" className="font-medium text-primary hover:underline">
                  {t('auth.resetPassword.signIn')}
                </Link>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </AuthLayout>
  )
}
