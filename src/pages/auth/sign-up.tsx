import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AuthLayout } from '@/components/layout/auth-layout'
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button'
import { useSignUp } from '@/hooks/auth/use-sign-up'

export default function SignUp() {
  const { t } = useTranslation()
  const location = useLocation()
  const { formData, errors, apiError, setApiError, isLoading, handleChange, handleSubmit } = useSignUp()

  return (
    <AuthLayout>
      <Card className="w-full max-w-md border-0 shadow-none" data-testid="signup-card">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold" data-testid="signup-title">{t('auth.signUp.title')}</CardTitle>
          <CardDescription data-testid="signup-subtitle">
            {t('auth.signUp.subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" data-testid="signup-form" noValidate>
            {apiError && (
              <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm" data-testid="signup-error">
                {apiError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">{t('auth.signUp.firstName')}</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  type="text"
                  autoComplete="given-name"
                  placeholder={t('auth.signUp.firstNamePlaceholder')}
                  value={formData.firstName}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="bg-background/50"
                  data-testid="signup-firstname-input"
                />
                {errors.firstName && <p className="text-xs text-destructive" data-testid="signup-firstname-error">{errors.firstName}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">{t('auth.signUp.lastName')}</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  type="text"
                  autoComplete="family-name"
                  placeholder={t('auth.signUp.lastNamePlaceholder')}
                  value={formData.lastName}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="bg-background/50"
                  data-testid="signup-lastname-input"
                />
                {errors.lastName && <p className="text-xs text-destructive" data-testid="signup-lastname-error">{errors.lastName}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t('auth.signUp.email')}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder={t('auth.signUp.emailPlaceholder')}
                value={formData.email}
                onChange={handleChange}
                disabled={isLoading}
                className="bg-background/50"
                data-testid="signup-email-input"
              />
              {errors.email && <p className="text-xs text-destructive" data-testid="signup-email-error">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t('auth.signUp.password')}</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
                className="bg-background/50"
                data-testid="signup-password-input"
              />
              {errors.password && <p className="text-xs text-destructive" data-testid="signup-password-error">{errors.password}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t('auth.signUp.confirmPassword')}</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={isLoading}
                className="bg-background/50"
                data-testid="signup-confirm-password-input"
              />
              {errors.confirmPassword && (
                <p className="text-xs text-destructive" data-testid="signup-confirm-password-error">{errors.confirmPassword}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-start space-x-2 pt-2">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  checked={formData.terms}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="h-4 w-4 rounded border-input mt-0.5"
                  data-testid="signup-terms-checkbox"
                />
                <Label htmlFor="terms" className="font-normal cursor-pointer text-sm leading-tight">
                  {t('auth.signUp.agreeToTerms')}{' '}
                  <a href="https://receipto.io/terms" target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline" data-testid="signup-terms-link">
                    {t('auth.signUp.termsOfService')}
                  </a>{' '}
                  {t('auth.signUp.and')}{' '}
                  <a href="https://receipto.io/privacy" target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline" data-testid="signup-privacy-link">
                    {t('auth.signUp.privacyPolicy')}
                  </a>
                </Label>
              </div>
              {errors.terms && <p className="text-xs text-destructive" data-testid="signup-terms-error">{errors.terms}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading} data-testid="signup-submit-button">
              {isLoading ? t('auth.signUp.submitting') : t('auth.signUp.submit')}
            </Button>

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

            <GoogleSignInButton onError={setApiError} />

            <p className="text-center text-sm text-muted-foreground">
              {t('auth.signUp.hasAccount')}{' '}
              <Link to="/sign-in" state={location.state} className="font-medium text-primary hover:underline" data-testid="signup-signin-link">
                {t('auth.signUp.signIn')}
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </AuthLayout>
  )
}
