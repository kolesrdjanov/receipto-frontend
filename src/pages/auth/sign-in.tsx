import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Mail, Lock, CircleAlert, MailWarning } from 'lucide-react'
import { AuthLayout } from '@/components/layout/auth-layout'
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button'
import { CardHead } from '@/components/auth/glass'
import { Field, PasswordField, Alert, Divider, Checkbox, GradientButton } from '@/components/glass/glass'
import { useSignIn } from '@/hooks/auth/use-sign-in'

export default function SignIn() {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const { email, setEmail, password, setPassword, error, setError, isLoading, emailNotVerified, handleSubmit } =
    useSignIn()
  const [rememberMe, setRememberMe] = useState(true)

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit} className="flex flex-col" data-testid="signin-form" noValidate>
        <CardHead logo title={t('auth.signIn.title')} subtitle={t('auth.signIn.subtitle')} />

        {error &&
          (emailNotVerified ? (
            <Alert kind="warn" icon={MailWarning}>
              {error}{' '}
              <button
                type="button"
                className="font-bold underline underline-offset-2"
                onClick={() => navigate('/check-email', { state: { email } })}
              >
                {t('auth.signIn.resendVerification')}
              </button>
            </Alert>
          ) : (
            <Alert kind="err" icon={CircleAlert} className="mb-0">
              {error}
            </Alert>
          ))}

        <div className="mt-4">
          <GoogleSignInButton onError={setError} />
        </div>

        <Divider label={t('auth.orContinueWith')} />

        <div className="flex flex-col gap-3">
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
            disabled={isLoading}
            data-testid="signin-email-input"
          />
          <PasswordField
            label={t('auth.signIn.password')}
            icon={Lock}
            id="password"
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            invalid={!!error && !emailNotVerified}
            data-testid="signin-password-input"
          />
        </div>

        <div className="mt-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Checkbox id="remember" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
            <label htmlFor="remember" className="cursor-pointer text-[13px] font-medium text-muted-foreground">
              {t('auth.signIn.rememberMe')}
            </label>
          </div>
          <Link
            to="/forgot-password"
            className="text-[13px] font-semibold text-muted-foreground hover:underline"
            data-testid="signin-forgot-password-link"
          >
            {t('auth.signIn.forgotPassword')}
          </Link>
        </div>

        <GradientButton
          type="submit"
          loading={isLoading}
          loadingText={t('auth.signIn.submitting')}
          className="mt-5"
          data-testid="signin-submit-button"
        >
          {t('auth.signIn.submit')}
        </GradientButton>

        <p className="mt-5 text-center text-[13px] font-medium text-muted-foreground">
          {t('auth.signIn.noAccount')}{' '}
          <Link to="/sign-up" state={location.state} className="font-semibold text-primary hover:underline" data-testid="signin-signup-link">
            {t('auth.signIn.signUp')}
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
