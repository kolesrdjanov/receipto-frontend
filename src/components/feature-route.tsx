import { Navigate } from 'react-router-dom'
import { useFeatureFlags } from '@/hooks/settings/use-feature-flags'

interface FeatureRouteProps {
  feature: 'warranties' | 'itemPricing'
  children: React.ReactNode
}

export function FeatureRoute({ feature, children }: FeatureRouteProps) {
  const { data: flags, isLoading } = useFeatureFlags()

  // Show nothing while loading to avoid flash
  if (isLoading) return null

  // Default to enabled if flags haven't loaded (fail open)
  const enabled = flags?.[feature] ?? true

  if (!enabled) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
