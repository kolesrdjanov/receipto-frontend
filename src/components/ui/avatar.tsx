import { cn } from '@/lib/utils'

interface AvatarProps {
  firstName?: string | null
  lastName?: string | null
  imageUrl?: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  className?: string
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-xl',
  '2xl': 'h-24 w-24 text-xl'
}

function getInitials(firstName?: string | null, lastName?: string | null): string {
  if (!firstName && !lastName) return '?'

  const firstInitial = firstName?.trim()[0]?.toUpperCase() || ''
  const lastInitial = lastName?.trim()[0]?.toUpperCase() || ''

  if (firstInitial && lastInitial) {
    return `${firstInitial}${lastInitial}`
  }

  return firstInitial || lastInitial || '?'
}

export function Avatar({
  firstName,
  lastName,
  imageUrl,
  size = 'md',
  className
}: AvatarProps) {
  const initials = getInitials(firstName, lastName)

  if (imageUrl) {
    return (
      <div className={cn('relative overflow-hidden rounded-full', sizeClasses[size], className)}>
        <img
          src={imageUrl}
          alt={`${firstName || ''} ${lastName || ''}`.trim() || 'User avatar'}
          className="h-full w-full object-cover"
        />
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground',
        sizeClasses[size],
        className
      )}
    >
      {initials}
    </div>
  )
}

