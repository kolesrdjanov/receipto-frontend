import { useTranslation } from 'react-i18next'
import { Mail, KeyRound, CircleAlert, CircleCheck, RotateCcw } from 'lucide-react'
import { AuthLayout } from '@/components/layout/auth-layout'
import { CardHead, BackLink } from '@/components/auth/glass'
import { Field, Alert, GradientButton, SecondaryButton } from '@/components/glass/glass'
import { useForgotPassword } from '@/hooks/auth/use-forgot-password'

export default function ForgotPassword() {
  const { t } = useTranslation()
  const { email, setEmail, error, success, isLoading, handleSubmit } = useForgotPassword()

  return (
    <AuthLayout>
      <CardHead badge={KeyRound} title={t('auth.forgotPassword.title')} subtitle={t('auth.forgotPassword.subtitle')} />

      {success ? (
        <div className="flex flex-col">
          <Alert kind="ok" icon={CircleCheck} className="mb-4">
            {t('auth.forgotPassword.successMessage')}
          </Alert>
          <form onSubmit={handleSubmit}>
            <SecondaryButton type="submit" disabled={isLoading}>
              <RotateCcw className="size-4" />
              {t('auth.forgotPassword.resend')}
            </SecondaryButton>
          </form>
          <div className="mt-5 text-center">
            <BackLink>{t('auth.forgotPassword.backToSignIn')}</BackLink>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col" noValidate>
          {error && (
            <Alert kind="err" icon={CircleAlert}>
              {error}
            </Alert>
          )}

          <Field
            label={t('auth.forgotPassword.email')}
            icon={Mail}
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder={t('auth.forgotPassword.emailPlaceholder')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />

          <GradientButton
            type="submit"
            loading={isLoading}
            loadingText={t('auth.forgotPassword.submitting')}
            className="mt-[18px]"
          >
            {t('auth.forgotPassword.submit')}
          </GradientButton>

          <div className="mt-5 text-center">
            <BackLink>{t('auth.forgotPassword.backToSignIn')}</BackLink>
          </div>
        </form>
      )}
    </AuthLayout>
  )
}
