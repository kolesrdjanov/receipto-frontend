import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { MailCheck, RotateCcw, CircleAlert, CircleCheck, Loader2 } from 'lucide-react'
import { AuthLayout } from '@/components/layout/auth-layout'
import { AuthBadge, AuthAlert, EmailChip, SecondaryButton, BackLink } from '@/components/auth/glass'
import { api } from '@/lib/api'

const RESEND_COOLDOWN = 60

function formatMMSS(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function CheckEmail() {
  const { t } = useTranslation()
  const location = useLocation()
  const email = (location.state as { email?: string })?.email || ''
  const [isResending, setIsResending] = useState(false)
  const [resent, setResent] = useState(false)
  const [error, setError] = useState('')
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return
    const id = window.setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000)
    return () => window.clearInterval(id)
  }, [cooldown])

  const handleResend = async () => {
    if (!email || isResending || cooldown > 0) return
    setIsResending(true)
    setError('')
    setResent(false)

    try {
      await api.post('/auth/resend-verification', { email }, { requiresAuth: false })
      setResent(true)
      setCooldown(RESEND_COOLDOWN)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.checkEmail.resendFailed'))
    } finally {
      setIsResending(false)
    }
  }

  return (
    <AuthLayout>
      <div className="text-center">
        <AuthBadge icon={MailCheck} />
        <h1 className="text-[27px] font-bold leading-[1.1] tracking-[-0.022em] text-foreground">
          {t('auth.checkEmail.title')}
        </h1>
        <p className="mt-1.5 text-[15px] text-muted-foreground">{t('auth.checkEmail.subtitle')}</p>
        {email && <EmailChip email={email} />}

        <p className="mt-4 text-[13px] font-medium leading-relaxed text-muted-foreground">
          {t('auth.checkEmail.instruction')}
        </p>

        {error && (
          <AuthAlert kind="err" icon={CircleAlert} className="mb-0 mt-4 text-left">
            {error}
          </AuthAlert>
        )}

        {resent && (
          <AuthAlert kind="ok" icon={CircleCheck} className="mb-0 mt-4 text-left">
            {t('auth.checkEmail.resent')}
          </AuthAlert>
        )}

        {email && (
          <SecondaryButton
            type="button"
            onClick={handleResend}
            disabled={isResending || cooldown > 0}
            className="mt-[22px]"
          >
            {isResending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {t('auth.checkEmail.resending')}
              </>
            ) : cooldown > 0 ? (
              t('auth.checkEmail.resendCooldown', { time: formatMMSS(cooldown) })
            ) : (
              <>
                <RotateCcw className="size-4" />
                {t('auth.checkEmail.resend')}
              </>
            )}
          </SecondaryButton>
        )}

        <div className="mt-5">
          <BackLink>{t('auth.checkEmail.backToSignIn')}</BackLink>
        </div>
      </div>
    </AuthLayout>
  )
}
