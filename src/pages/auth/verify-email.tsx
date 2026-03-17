import { useState, useEffect } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AuthLayout } from '@/components/layout/auth-layout'
import { api } from '@/lib/api'

export default function VerifyEmail() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying')
  const [errorMessage, setErrorMessage] = useState('')

  // Resend form state
  const [email, setEmail] = useState('')
  const [isResending, setIsResending] = useState(false)
  const [resent, setResent] = useState(false)

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setErrorMessage(t('auth.verifyEmail.failedMessage'))
      return
    }

    const verify = async () => {
      try {
        await api.post('/auth/verify-email', { token }, { requiresAuth: false })
        setStatus('success')
        // Redirect to sign-in after 2 seconds
        setTimeout(() => navigate('/sign-in', { replace: true }), 2000)
      } catch (err) {
        setStatus('error')
        setErrorMessage(err instanceof Error ? err.message : t('auth.verifyEmail.failedMessage'))
      }
    }

    verify()
  }, [token, navigate, t])

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || isResending) return
    setIsResending(true)
    setResent(false)

    try {
      await api.post('/auth/resend-verification', { email }, { requiresAuth: false })
      setResent(true)
    } catch {
      // Silent — same response regardless
      setResent(true)
    } finally {
      setIsResending(false)
    }
  }

  return (
    <AuthLayout>
      <Card className="w-full max-w-md border-0 shadow-none">
        <CardHeader className="space-y-1 text-center">
          {status === 'verifying' && (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              </div>
              <CardTitle className="text-2xl font-bold">{t('auth.verifyEmail.title')}</CardTitle>
              <CardDescription>{t('auth.verifyEmail.verifying')}</CardDescription>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <CardTitle className="text-2xl font-bold">{t('auth.verifyEmail.success')}</CardTitle>
              <CardDescription>{t('auth.verifyEmail.redirecting')}</CardDescription>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                <XCircle className="h-8 w-8 text-destructive" />
              </div>
              <CardTitle className="text-2xl font-bold">{t('auth.verifyEmail.failed')}</CardTitle>
              <CardDescription>{errorMessage}</CardDescription>
            </>
          )}
        </CardHeader>

        {status === 'error' && (
          <CardContent className="space-y-4">
            <form onSubmit={handleResend} className="space-y-3">
              <p className="text-sm text-muted-foreground text-center">
                {t('auth.verifyEmail.resendDescription')}
              </p>
              <div className="space-y-2">
                <Label htmlFor="email">{t('auth.signIn.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t('auth.signIn.emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isResending}
                  className="bg-background/50"
                />
              </div>

              {resent && (
                <div className="p-3 rounded-md bg-green-500/10 text-green-600 dark:text-green-400 text-sm text-center">
                  {t('auth.checkEmail.resent')}
                </div>
              )}

              <Button type="submit" variant="outline" className="w-full" disabled={isResending || !email}>
                {isResending ? t('auth.checkEmail.resending') : t('auth.verifyEmail.resendLink')}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              <Link to="/sign-in" className="font-medium text-primary hover:underline">
                {t('auth.checkEmail.backToSignIn')}
              </Link>
            </p>
          </CardContent>
        )}
      </Card>
    </AuthLayout>
  )
}
