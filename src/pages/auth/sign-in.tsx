import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AuthLayout } from '@/components/layout/auth-layout'
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button'
import { useSignIn } from '@/hooks/auth/use-sign-in'

export default function SignIn() {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const { email, setEmail, password, setPassword, error, setError, isLoading, emailNotVerified, handleSubmit } = useSignIn()

  return (
    <AuthLayout>
      <Card className="w-full max-w-md border-0 shadow-none" data-testid="signin-card">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold" data-testid="signin-title">{t('auth.signIn.title')}</CardTitle>
          <CardDescription data-testid="signin-subtitle">
            {t('auth.signIn.subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" data-testid="signin-form" noValidate>
            {error && (
              <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm" data-testid="signin-error">
                {error}
                {emailNotVerified && (
                  <button
                    type="button"
                    className="mt-1.5 block w-full text-center font-medium text-primary hover:underline"
                    onClick={() => navigate('/check-email', { state: { email } })}
                  >
                    {t('auth.signIn.resendVerification')}
                  </button>
                )}
              </div>
            )}

            <GoogleSignInButton onError={setError} />

            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  {t('auth.orContinueWith')}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t('auth.signIn.email')}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder={t('auth.signIn.emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
                className="bg-background/50"
                data-testid="signin-email-input"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center">
                <Label htmlFor="password">{t('auth.signIn.password')}</Label>
                <Link to="/forgot-password" className="ml-auto text-sm underline-offset-4 hover:underline" data-testid="signin-forgot-password-link">
                  {t('auth.signIn.forgotPassword')}
                </Link>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
                className="bg-background/50"
                data-testid="signin-password-input"
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading} data-testid="signin-submit-button">
              {isLoading ? t('auth.signIn.submitting') : t('auth.signIn.submit')}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              {t('auth.signIn.noAccount')}{' '}
              <Link to="/sign-up" state={location.state} className="font-medium text-primary hover:underline" data-testid="signin-signup-link">
                {t('auth.signIn.signUp')}
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </AuthLayout>
  )
}
