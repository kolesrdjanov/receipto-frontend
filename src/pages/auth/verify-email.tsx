import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Mail, MailCheck, CircleCheck, Link2Off, Loader2 } from 'lucide-react'
import { AuthLayout } from '@/components/layout/auth-layout'
import { BackLink } from '@/components/auth/glass'
import { Field, Badge, Alert, SecondaryButton } from '@/components/glass/glass'
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
      // Silent — same response regardless (prevents email enumeration)
      setResent(true)
    } finally {
      setIsResending(false)
    }
  }

  if (status === 'verifying') {
    return (
      <AuthLayout>
        <div className="text-center">
          <div className="mx-auto mb-[18px] grid size-[60px] place-items-center rounded-[18px] bg-[var(--primary-soft)] text-primary shadow-sm">
            <Loader2 className="size-[26px] animate-spin" />
          </div>
          <h1 className="text-[27px] font-bold leading-[1.1] tracking-[-0.022em] text-foreground">
            {t('auth.verifyEmail.title')}
          </h1>
          <p className="mt-1.5 text-[15px] text-muted-foreground">{t('auth.verifyEmail.verifying')}</p>
        </div>
      </AuthLayout>
    )
  }

  if (status === 'success') {
    return (
      <AuthLayout>
        <div className="text-center">
          <Badge icon={CircleCheck} kind="ok" />
          <h1 className="text-[27px] font-bold leading-[1.1] tracking-[-0.022em] text-foreground">
            {t('auth.verifyEmail.success')}
          </h1>
          <div className="mt-3 flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            <span className="text-[15px]">{t('auth.verifyEmail.redirecting')}</span>
          </div>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div className="text-center">
        <Badge icon={Link2Off} kind="danger" />
        <h1 className="text-[27px] font-bold leading-[1.1] tracking-[-0.022em] text-foreground">
          {t('auth.verifyEmail.failed')}
        </h1>
        <p className="mt-1.5 text-[15px] leading-relaxed text-muted-foreground">{errorMessage}</p>
      </div>

      <form onSubmit={handleResend} className="mt-5 flex flex-col" noValidate>
        <p className="mb-3 text-center text-[13px] font-medium text-muted-foreground">
          {t('auth.verifyEmail.resendDescription')}
        </p>

        <Field
          label={t('auth.signIn.email')}
          icon={Mail}
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder={t('auth.signIn.emailPlaceholder')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isResending}
        />

        {resent && (
          <Alert kind="ok" icon={CircleCheck} className="mb-0 mt-4 text-left">
            {t('auth.checkEmail.resent')}
          </Alert>
        )}

        <SecondaryButton type="submit" disabled={isResending || !email} className="mt-[18px]">
          {isResending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              {t('auth.checkEmail.resending')}
            </>
          ) : (
            <>
              <MailCheck className="size-4" />
              {t('auth.verifyEmail.resendLink')}
            </>
          )}
        </SecondaryButton>

        <div className="mt-5 text-center">
          <BackLink>{t('auth.checkEmail.backToSignIn')}</BackLink>
        </div>
      </form>
    </AuthLayout>
  )
}
