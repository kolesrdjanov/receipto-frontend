import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AuthLayout } from '@/components/layout/auth-layout'
import { useForgotPassword } from '@/hooks/auth/use-forgot-password'

export default function ForgotPassword() {
  const { t } = useTranslation()
  const { email, setEmail, error, success, isLoading, handleSubmit } = useForgotPassword()

  return (
    <AuthLayout>
      <Card className="w-full max-w-md border-0 shadow-none">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">{t('auth.forgotPassword.title')}</CardTitle>
          <CardDescription>
            {t('auth.forgotPassword.subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="space-y-4">
              <div className="p-4 rounded-md bg-green-500/10 text-green-600 dark:text-green-400 text-sm text-center">
                {t('auth.forgotPassword.successMessage')}
              </div>
              <p className="text-center text-sm text-muted-foreground">
                <Link to="/sign-in" className="font-medium text-primary hover:underline">
                  {t('auth.forgotPassword.backToSignIn')}
                </Link>
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">{t('auth.forgotPassword.email')}</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder={t('auth.forgotPassword.emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                  className="bg-background/50"
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? t('auth.forgotPassword.submitting') : t('auth.forgotPassword.submit')}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                {t('auth.forgotPassword.rememberPassword')}{' '}
                <Link to="/sign-in" className="font-medium text-primary hover:underline">
                  {t('auth.forgotPassword.signIn')}
                </Link>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </AuthLayout>
  )
}
