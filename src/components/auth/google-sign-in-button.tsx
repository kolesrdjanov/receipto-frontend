import { useEffect } from 'react'
import { GoogleLogin } from '@react-oauth/google'
import { useGoogleAuth } from '@/hooks/auth/use-google-auth'

interface GoogleSignInButtonProps {
  onError?: (error: string) => void
}

export function GoogleSignInButton({ onError }: GoogleSignInButtonProps) {
  const { handleGoogleSuccess, handleGoogleError, error } = useGoogleAuth()

  // Bubble errors to parent if callback provided
  useEffect(() => {
    if (error && onError) {
      onError(error)
    }
  }, [error, onError])

  if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) {
    return null
  }

  return (
    <div className="flex justify-center">
      <GoogleLogin
        onSuccess={(response) => {
          if (response.credential) {
            handleGoogleSuccess(response.credential)
          }
        }}
        onError={handleGoogleError}
        theme="outline"
        size="large"
        shape="rectangular"
        text="continue_with"
        logo_alignment="left"
      />
    </div>
  )
}
