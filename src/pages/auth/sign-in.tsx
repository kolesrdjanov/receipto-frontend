import { useEffect, useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Mail, MailCheck, CircleAlert, CircleCheck, RotateCcw, Loader2 } from 'lucide-react'
import { AuthLayout } from '@/components/layout/auth-layout'
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button'
import { CardHead, EmailChip } from '@/components/auth/glass'
import { Field, Alert, Divider } from '@/components/glass/glass'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { Button } from '@/components/ui/button'
import { useRequestCode } from '@/hooks/auth/use-request-code'
import { useVerifyCode } from '@/hooks/auth/use-verify-code'
import { getErrorMessage } from '@/lib/api'

const CODE_LENGTH = 6
const RESEND_COOLDOWN = 30

function formatMMSS(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())

export default function SignIn() {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const requestCode = useRequestCode()
  const verifyCode = useVerifyCode()

  const [step, setStep] = useState<'email' | 'code'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [cooldown, setCooldown] = useState(0)
  const [resent, setResent] = useState(false)

  const from = (location.state as { from?: string })?.from

  useEffect(() => {
    if (cooldown <= 0) return
    const id = window.setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000)
    return () => window.clearInterval(id)
  }, [cooldown])

  const sendCode = async () => {
    setError('')
    try {
      await requestCode.mutateAsync(email.trim().toLowerCase())
      return true
    } catch (err) {
      setError(getErrorMessage(err, t('auth.signIn.requestError')))
      return false
    }
  }

  const handleEmailSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!isValidEmail(email)) {
      setError(t('auth.validation.emailInvalid'))
      return
    }
    if (await sendCode()) {
      setStep('code')
      setCode('')
      setResent(false)
      setCooldown(RESEND_COOLDOWN)
    }
  }

  const handleVerify = async (value: string) => {
    if (verifyCode.isPending) return
    setError('')
    try {
      const res = await verifyCode.mutateAsync({ email: email.trim().toLowerCase(), code: value })
      if (res.isNewUser || !res.user.firstName) {
        navigate('/complete-profile', { replace: true, state: { from } })
      } else {
        navigate(from || '/dashboard', { replace: true })
      }
    } catch (err) {
      setError(getErrorMessage(err, t('auth.signIn.invalidCode')))
      setCode('')
    }
  }

  const handleResend = async () => {
    if (cooldown > 0 || requestCode.isPending) return
    setResent(false)
    if (await sendCode()) {
      setResent(true)
      setCode('')
      setCooldown(RESEND_COOLDOWN)
    }
  }

  const backToEmail = () => {
    setStep('email')
    setError('')
    setCode('')
    setResent(false)
  }

  return (
    <AuthLayout>
      {step === 'email' ? (
        <form onSubmit={handleEmailSubmit} className="flex flex-col" data-testid="signin-form" noValidate>
          <CardHead logo title={t('auth.signIn.title')} subtitle={t('auth.signIn.subtitle')} />

          {error && (
            <Alert kind="err" icon={CircleAlert} className="mb-0">
              {error}
            </Alert>
          )}

          <div className="mt-4">
            <GoogleSignInButton onError={setError} />
          </div>

          <Divider label={t('auth.orContinueWith')} />

          <Field
            label={t('auth.signIn.email')}
            icon={Mail}
            id="email"
            type="email"
            autoComplete="email"
            placeholder={t('auth.signIn.emailPlaceholder')}
            disabled={requestCode.isPending}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            data-testid="signin-email-input"
          />

          <Button
            type="submit"
            variant="brand"
            loading={requestCode.isPending}
            loadingText={t('auth.signIn.sending')}
            className="mt-5 h-[52px] w-full rounded-full text-base font-semibold"
            data-testid="signin-submit-button"
          >
            {t('auth.signIn.sendCode')}
          </Button>

          <p className="mt-5 text-center text-[13px] font-medium leading-relaxed text-muted-foreground">
            {t('auth.signIn.passwordlessNote')}
          </p>
        </form>
      ) : (
        <div className="flex flex-col text-center">
          <CardHead badge={MailCheck} title={t('auth.signIn.codeTitle')} subtitle={t('auth.signIn.codeSubtitle')} />

          <div className="-mt-1 mb-1 flex justify-center">
            <EmailChip email={email} onChange={backToEmail} changeLabel={t('auth.signIn.changeEmail')} />
          </div>

          {error && (
            <Alert kind="err" icon={CircleAlert} className="mb-0 mt-4 text-left">
              {error}
            </Alert>
          )}
          {resent && !error && (
            <Alert kind="ok" icon={CircleCheck} className="mb-0 mt-4 text-left">
              {t('auth.signIn.codeResent')}
            </Alert>
          )}

          <div className="mt-5 flex justify-center">
            <InputOTP
              maxLength={CODE_LENGTH}
              value={code}
              onChange={setCode}
              onComplete={handleVerify}
              disabled={verifyCode.isPending}
              autoFocus
            >
              <InputOTPGroup>
                {Array.from({ length: CODE_LENGTH }).map((_, i) => (
                  <InputOTPSlot key={i} index={i} />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>

          <Button
            type="button"
            variant="brand"
            loading={verifyCode.isPending}
            loadingText={t('auth.signIn.verifying')}
            disabled={code.length < CODE_LENGTH}
            onClick={() => handleVerify(code)}
            className="mt-6 h-[52px] w-full rounded-full text-base font-semibold"
          >
            {t('auth.signIn.verify')}
          </Button>

          <Button
            type="button"
            variant="link"
            onClick={handleResend}
            disabled={cooldown > 0 || requestCode.isPending}
            className="mt-4 h-auto gap-1.5 p-0 text-[13px] font-semibold text-muted-foreground no-underline hover:text-foreground hover:no-underline disabled:opacity-60"
          >
            {requestCode.isPending ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                {t('auth.signIn.sending')}
              </>
            ) : cooldown > 0 ? (
              t('auth.signIn.resendCooldown', { time: formatMMSS(cooldown) })
            ) : (
              <>
                <RotateCcw className="size-3.5" />
                {t('auth.signIn.resendCode')}
              </>
            )}
          </Button>

        </div>
      )}
    </AuthLayout>
  )
}
