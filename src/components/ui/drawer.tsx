import * as React from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './button'

interface DrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

export function Drawer({ open, onOpenChange, children }: DrawerProps) {
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [open])

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-50 bg-black/80 transition-opacity',
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={() => onOpenChange(false)}
      />

      {/* Drawer */}
      <div
        className={cn(
          'fixed right-0 top-0 z-50 h-full w-full md:w-1/3 bg-background shadow-lg transition-transform duration-300 ease-in-out flex flex-col',
          open ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {children}
      </div>
    </>
  )
}

interface DrawerHeaderProps {
  children: React.ReactNode
  onClose: () => void
}

export function DrawerHeader({ children, onClose }: DrawerHeaderProps) {
  return (
    <div className="flex items-center justify-between p-6 pt-[max(1.5rem,env(safe-area-inset-top))] border-b">
      <div className="flex-1">{children}</div>
      <Button variant="ghost" size="sm" onClick={onClose}>
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}

interface DrawerTitleProps {
  children: React.ReactNode
  className?: string
}

export function DrawerTitle({ children, className }: DrawerTitleProps) {
  return (
    <h2 className={cn('text-lg font-semibold', className)}>{children}</h2>
  )
}

interface DrawerContentProps {
  children: React.ReactNode
  className?: string
}

export function DrawerContent({ children, className }: DrawerContentProps) {
  return (
    <div className={cn('flex-1 overflow-y-auto p-6', className)}>
      {children}
    </div>
  )
}

