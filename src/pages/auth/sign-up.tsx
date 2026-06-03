import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Mail, Lock, LockKeyhole, User, CircleAlert } from 'lucide-react'
import { AuthLayout } from '@/components/layout/auth-layout'
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button'
import { CardHead } from '@/components/auth/glass'
import {
  Field,
  PasswordField,
  PasswordStrengthMeter,
  Alert,
  Divider,
  Checkbox,
  GradientButton,
} from '@/components/glass/glass'
import { useSignUp } from '@/hooks/auth/use-sign-up'

export default function SignUp() {
  const { t } = useTranslation()
  const location = useLocation()
  const { formData, errors, apiError, setApiError, isLoading, handleChange, handleSubmit } = useSignUp()

  return (
    <AuthLayout cardClassName="max-w-[440px]">
      <form onSubmit={handleSubmit} className="flex flex-col" data-testid="signup-form" noValidate>
        <CardHead logo title={t('auth.signUp.title')} subtitle={t('auth.signUp.subtitle')} />

        {apiError && (
          <Alert kind="err" icon={CircleAlert} className="mb-0">
            {apiError}
          </Alert>
        )}

        <div className="mt-4">
          <GoogleSignInButton onError={setApiError} />
        </div>

        <Divider label={t('auth.orContinueWith')} />

        <div className="flex flex-col gap-3">
          <div className="flex gap-3">
            <Field
              label={t('auth.signUp.firstName')}
              icon={User}
              id="firstName"
              name="firstName"
              autoComplete="given-name"
              placeholder={t('auth.signUp.firstNamePlaceholder')}
              value={formData.firstName}
              onChange={handleChange}
              disabled={isLoading}
              error={errors.firstName}
              data-testid="signup-firstname-input"
            />
            <Field
              label={t('auth.signUp.lastName')}
              id="lastName"
              name="lastName"
              autoComplete="family-name"
              placeholder={t('auth.signUp.lastNamePlaceholder')}
              value={formData.lastName}
              onChange={handleChange}
              disabled={isLoading}
              error={errors.lastName}
              data-testid="signup-lastname-input"
            />
          </div>

          <Field
            label={t('auth.signUp.email')}
            icon={Mail}
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder={t('auth.signUp.emailPlaceholder')}
            value={formData.email}
            onChange={handleChange}
            disabled={isLoading}
            error={errors.email}
            data-testid="signup-email-input"
          />

          <div>
            <PasswordField
              label={t('auth.signUp.password')}
              icon={Lock}
              id="password"
              name="password"
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange}
              disabled={isLoading}
              error={errors.password}
              data-testid="signup-password-input"
            />
            <PasswordStrengthMeter value={formData.password} />
          </div>

          <PasswordField
            label={t('auth.signUp.confirmPassword')}
            icon={LockKeyhole}
            id="confirmPassword"
            name="confirmPassword"
            autoComplete="new-password"
            value={formData.confirmPassword}
            onChange={handleChange}
            disabled={isLoading}
            error={errors.confirmPassword}
            data-testid="signup-confirm-password-input"
          />
        </div>

        <div className="mt-4">
          <div className="flex items-start gap-2.5">
            <Checkbox
              id="terms"
              name="terms"
              checked={formData.terms}
              onChange={handleChange}
              disabled={isLoading}
              className="mt-0.5"
              data-testid="signup-terms-checkbox"
            />
            <span className="text-[13px] font-medium leading-relaxed text-muted-foreground">
              {t('auth.signUp.agreeToTerms')}{' '}
              <a
                href="https://receipto.io/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-primary hover:underline"
                data-testid="signup-terms-link"
              >
                {t('auth.signUp.termsOfService')}
              </a>{' '}
              {t('auth.signUp.and')}{' '}
              <a
                href="https://receipto.io/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-primary hover:underline"
                data-testid="signup-privacy-link"
              >
                {t('auth.signUp.privacyPolicy')}
              </a>
            </span>
          </div>
          {errors.terms && (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-destructive" data-testid="signup-terms-error">
              <CircleAlert className="size-3.5 shrink-0" />
              {errors.terms}
            </p>
          )}
        </div>

        <GradientButton
          type="submit"
          loading={isLoading}
          loadingText={t('auth.signUp.submitting')}
          className="mt-4"
          data-testid="signup-submit-button"
        >
          {t('auth.signUp.submit')}
        </GradientButton>

        <p className="mt-5 text-center text-[13px] font-medium text-muted-foreground">
          {t('auth.signUp.hasAccount')}{' '}
          <Link to="/sign-in" state={location.state} className="font-semibold text-primary hover:underline" data-testid="signup-signin-link">
            {t('auth.signUp.signIn')}
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
