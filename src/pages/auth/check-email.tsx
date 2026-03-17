import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Mail, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AuthLayout } from '@/components/layout/auth-layout'
import { api } from '@/lib/api'

export default function CheckEmail() {
  const { t } = useTranslation()
  const location = useLocation()
  const email = (location.state as { email?: string })?.email || ''
  const [isResending, setIsResending] = useState(false)
  const [resent, setResent] = useState(false)
  const [error, setError] = useState('')

  const handleResend = async () => {
    if (!email || isResending) return
    setIsResending(true)
    setError('')
    setResent(false)

    try {
      await api.post('/auth/resend-verification', { email }, { requiresAuth: false })
      setResent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.checkEmail.resendFailed'))
    } finally {
      setIsResending(false)
    }
  }

  return (
    <AuthLayout>
      <Card className="w-full max-w-md border-0 shadow-none">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">{t('auth.checkEmail.title')}</CardTitle>
          <CardDescription>
            {t('auth.checkEmail.subtitle')}
          </CardDescription>
          {email && (
            <p className="text-sm font-medium text-foreground">{email}</p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-sm text-muted-foreground">
            {t('auth.checkEmail.instruction')}
          </p>

          {error && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm text-center">
              {error}
            </div>
          )}

          {resent && (
            <div className="p-3 rounded-md bg-green-500/10 text-green-600 dark:text-green-400 text-sm text-center">
              {t('auth.checkEmail.resent')}
            </div>
          )}

          {email && (
            <Button
              variant="outline"
              className="w-full"
              onClick={handleResend}
              disabled={isResending || resent}
            >
              {isResending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  {t('auth.checkEmail.resending')}
                </>
              ) : (
                t('auth.checkEmail.resend')
              )}
            </Button>
          )}

          <p className="text-center text-sm text-muted-foreground">
            <Link to="/sign-in" className="font-medium text-primary hover:underline">
              {t('auth.checkEmail.backToSignIn')}
            </Link>
          </p>
        </CardContent>
      </Card>
    </AuthLayout>
  )
}
