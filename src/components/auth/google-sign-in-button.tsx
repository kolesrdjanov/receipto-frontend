import { useTranslation } from 'react-i18next'
import { useGoogleLogin } from '@react-oauth/google'
import { useGoogleAuth } from '@/hooks/auth/use-google-auth'
import { GoogleGIcon } from '@/components/glass/glass'

interface GoogleSignInButtonProps {
  onError?: (error: string) => void
}

export function GoogleSignInButton({ onError }: GoogleSignInButtonProps) {
  if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) {
    return null
  }

  return <GoogleSignInButtonInner onError={onError} />
}

function GoogleSignInButtonInner({ onError }: GoogleSignInButtonProps) {
  const { t } = useTranslation()
  const { handleGoogleAccessToken, isLoading } = useGoogleAuth()

  const login = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      handleGoogleAccessToken(tokenResponse.access_token)
    },
    onError: () => {
      onError?.(t('auth.googleSignInFailed'))
    },
  })

  return (
    <button
      type="button"
      onClick={() => login()}
      disabled={isLoading}
      className="inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-full border border-border bg-card text-[15px] font-semibold text-foreground shadow-sm transition-colors hover:bg-muted/60 disabled:opacity-60"
    >
      <GoogleGIcon className="size-[18px]" />
      {isLoading ? t('common.loading') : t('auth.continueWithGoogle')}
    </button>
  )
}
