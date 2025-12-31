import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AuthLayout } from '@/components/layout/auth-layout'
import { useSignIn } from '@/hooks/auth/use-sign-in'

export default function SignIn() {
  const { t } = useTranslation()
  const { email, setEmail, password, setPassword, error, isLoading, handleSubmit } = useSignIn()

  return (
    <AuthLayout>
      <Card className="w-full max-w-md backdrop-blur-sm bg-card/80 border-border/50 shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">{t('auth.signIn.title')}</CardTitle>
          <CardDescription>
            {t('auth.signIn.subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}

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
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t('auth.signIn.password')}</Label>
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
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 rounded border-input"
                  disabled={isLoading}
                />
                <Label htmlFor="remember-me" className="font-normal cursor-pointer text-sm">
                  {t('auth.signIn.rememberMe')}
                </Label>
              </div>

              <Link to="#" className="text-sm font-medium text-primary hover:underline">
                {t('auth.signIn.forgotPassword')}
              </Link>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? t('auth.signIn.submitting') : t('auth.signIn.submit')}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              {t('auth.signIn.noAccount')}{' '}
              <Link to="/sign-up" className="font-medium text-primary hover:underline">
                {t('auth.signIn.signUp')}
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </AuthLayout>
  )
}
