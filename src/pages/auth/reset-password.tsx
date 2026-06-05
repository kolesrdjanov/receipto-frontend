import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Lock, LockKeyhole, Link2Off, CircleCheck, CircleAlert, Loader2 } from 'lucide-react'
import { AuthLayout } from '@/components/layout/auth-layout'
import { CardHead, BackLink } from '@/components/auth/glass'
import { PasswordField, PasswordStrengthMeter, Alert, Badge } from '@/components/glass/glass'
import { Button } from '@/components/ui/button'
import { useResetPassword } from '@/hooks/auth/use-reset-password'

export default function ResetPassword() {
  const { t } = useTranslation()
  const { register, watch, errors, apiError, success, isLoading, token, handleSubmit } = useResetPassword()

  if (!token) {
    return (
      <AuthLayout>
        <CardHead
          badge={Link2Off}
          badgeKind="danger"
          title={t('auth.resetPassword.invalidLink')}
          subtitle={t('auth.resetPassword.invalidLinkMessage')}
        />
        <Button asChild variant="brand" className="h-[52px] w-full rounded-full text-base font-semibold">
          <Link to="/forgot-password">{t('auth.resetPassword.requestNewLink')}</Link>
        </Button>
        <div className="mt-5 text-center">
          <BackLink>{t('auth.forgotPassword.backToSignIn')}</BackLink>
        </div>
      </AuthLayout>
    )
  }

  if (success) {
    return (
      <AuthLayout>
        <div className="text-center">
          <Badge icon={CircleCheck} kind="ok" />
          <h1 className="text-[27px] font-bold leading-[1.1] tracking-[-0.022em] text-foreground">
            {t('auth.resetPassword.successMessage')}
          </h1>
          <div className="mt-3 flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            <span className="text-[15px]">{t('auth.resetPassword.redirecting')}</span>
          </div>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <CardHead badge={LockKeyhole} title={t('auth.resetPassword.title')} subtitle={t('auth.resetPassword.subtitle')} />

      <form onSubmit={handleSubmit} className="flex flex-col" noValidate>
        {apiError && (
          <Alert kind="err" icon={CircleAlert}>
            {apiError}
          </Alert>
        )}

        <div className="flex flex-col gap-3">
          <div>
            <PasswordField
              label={t('auth.resetPassword.password')}
              icon={Lock}
              id="password"
              autoComplete="new-password"
              placeholder={t('auth.resetPassword.passwordPlaceholder')}
              disabled={isLoading}
              error={errors.password?.message}
              {...register('password')}
            />
            <PasswordStrengthMeter value={watch('password')} />
          </div>

          <PasswordField
            label={t('auth.resetPassword.confirmPassword')}
            icon={LockKeyhole}
            id="confirmPassword"
            autoComplete="new-password"
            placeholder={t('auth.resetPassword.confirmPasswordPlaceholder')}
            disabled={isLoading}
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />
        </div>

        <Button
          type="submit"
          variant="brand"
          loading={isLoading}
          loadingText={t('auth.resetPassword.submitting')}
          className="mt-5 h-[52px] w-full rounded-full text-base font-semibold"
        >
          {t('auth.resetPassword.submit')}
        </Button>

        <p className="mt-5 text-center text-[13px] font-medium text-muted-foreground">
          {t('auth.resetPassword.rememberPassword')}{' '}
          <Link to="/sign-in" className="font-semibold text-primary hover:underline">
            {t('auth.resetPassword.signIn')}
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
