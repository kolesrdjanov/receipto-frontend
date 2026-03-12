import { type ReactNode } from 'react'
import { motion, useSpring, useTransform, useMotionValue, animate } from 'framer-motion'
import { useEffect } from 'react'

// Page entrance: subtle fade only
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
    >
      {children}
    </motion.div>
  )
}

// No-op wrappers — render children instantly
export function StaggerContainer({
  children,
  className,
}: {
  children: ReactNode
  className?: string
  staggerDelay?: number
}) {
  return <div className={className}>{children}</div>
}

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={className}>{children}</div>
}

// Animated number count-up (functional, not decorative)
export function AnimatedNumber({
  value,
  formatFn,
  className,
}: {
  value: number
  formatFn?: (n: number) => string
  className?: string
}) {
  const motionValue = useMotionValue(0)
  const springValue = useSpring(motionValue, {
    stiffness: 200,
    damping: 30,
    mass: 1,
  })
  const display = useTransform(springValue, (latest) =>
    formatFn ? formatFn(Math.round(latest)) : Math.round(latest).toLocaleString()
  )

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1],
    })
    return () => controls.stop()
  }, [value, motionValue])

  return <motion.span className={className}>{display}</motion.span>
}
