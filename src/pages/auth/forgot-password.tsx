import { useTranslation } from 'react-i18next'
import { Mail, KeyRound, CircleAlert, CircleCheck, RotateCcw } from 'lucide-react'
import { AuthLayout } from '@/components/layout/auth-layout'
import { CardHead, BackLink } from '@/components/auth/glass'
import { Field, Alert } from '@/components/glass/glass'
import { Button } from '@/components/ui/button'
import { useForgotPassword } from '@/hooks/auth/use-forgot-password'

export default function ForgotPassword() {
  const { t } = useTranslation()
  const { register, errors, error, success, isLoading, handleSubmit } = useForgotPassword()

  return (
    <AuthLayout>
      <CardHead badge={KeyRound} title={t('auth.forgotPassword.title')} subtitle={t('auth.forgotPassword.subtitle')} />

      {success ? (
        <div className="flex flex-col">
          <Alert kind="ok" icon={CircleCheck} className="mb-4">
            {t('auth.forgotPassword.successMessage')}
          </Alert>
          <form onSubmit={handleSubmit}>
            <Button
              type="submit"
              variant="glass"
              disabled={isLoading}
              className="h-12 w-full rounded-full text-[15px] font-semibold text-foreground"
            >
              <RotateCcw className="size-4" />
              {t('auth.forgotPassword.resend')}
            </Button>
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
            type="email"
            autoComplete="email"
            placeholder={t('auth.forgotPassword.emailPlaceholder')}
            disabled={isLoading}
            error={errors.email?.message}
            {...register('email')}
          />

          <Button
            type="submit"
            variant="brand"
            loading={isLoading}
            loadingText={t('auth.forgotPassword.submitting')}
            className="mt-[18px] h-[52px] w-full rounded-full text-base font-semibold"
          >
            {t('auth.forgotPassword.submit')}
          </Button>

          <div className="mt-5 text-center">
            <BackLink>{t('auth.forgotPassword.backToSignIn')}</BackLink>
          </div>
        </form>
      )}
    </AuthLayout>
  )
}
