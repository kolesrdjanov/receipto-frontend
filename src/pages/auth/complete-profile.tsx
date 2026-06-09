import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { UserRound, CircleAlert } from 'lucide-react'
import { AuthLayout } from '@/components/layout/auth-layout'
import { CardHead } from '@/components/auth/glass'
import { Field, Alert } from '@/components/glass/glass'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/auth'
import { useUpdateMe } from '@/hooks/users/use-me'
import { getErrorMessage } from '@/lib/api'

export default function CompleteProfile() {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const updateMe = useUpdateMe()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [error, setError] = useState('')

  const from = (location.state as { from?: string })?.from
  const fallback = from || '/dashboard'

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!firstName.trim()) {
      setError(t('auth.completeProfile.firstNameRequired'))
      return
    }
    setError('')
    try {
      await updateMe.mutateAsync({ firstName: firstName.trim(), lastName: lastName.trim() })
      navigate(fallback, { replace: true })
    } catch (err) {
      setError(getErrorMessage(err, t('auth.completeProfile.error')))
    }
  }

  // Guards run after hooks so hook order stays stable.
  if (!user) return <Navigate to="/sign-in" replace />
  if (user.firstName) return <Navigate to={fallback} replace />

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit} className="flex flex-col" noValidate>
        <CardHead badge={UserRound} title={t('auth.completeProfile.title')} subtitle={t('auth.completeProfile.subtitle')} />

        {error && (
          <Alert kind="err" icon={CircleAlert} className="mb-0">
            {error}
          </Alert>
        )}

        <div className="mt-4 flex flex-col gap-3">
          <Field
            label={t('auth.completeProfile.firstName')}
            id="firstName"
            autoComplete="given-name"
            placeholder={t('auth.completeProfile.firstNamePlaceholder')}
            disabled={updateMe.isPending}
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
          <Field
            label={t('auth.completeProfile.lastName')}
            id="lastName"
            autoComplete="family-name"
            placeholder={t('auth.completeProfile.lastNamePlaceholder')}
            disabled={updateMe.isPending}
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>

        <Button
          type="submit"
          variant="brand"
          loading={updateMe.isPending}
          loadingText={t('common.saving')}
          className="mt-5 h-[52px] w-full rounded-full text-base font-semibold"
        >
          {t('auth.completeProfile.submit')}
        </Button>
      </form>
    </AuthLayout>
  )
}
