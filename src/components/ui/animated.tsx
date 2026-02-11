import { type ReactNode } from 'react'
import { motion, useSpring, useTransform, useMotionValue, animate } from 'framer-motion'
import { useEffect } from 'react'

// Page entrance: fade + slide up
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {children}
    </motion.div>
  )
}

// Staggered container
export function StaggerContainer({
  children,
  className,
  staggerDelay = 0.06,
}: {
  children: ReactNode
  className?: string
  staggerDelay?: number
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
    >
      {children}
    </motion.div>
  )
}

// Staggered item
export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 16 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] },
        },
      }}
    >
      {children}
    </motion.div>
  )
}

// Animated number count-up
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
    stiffness: 60,
    damping: 20,
    mass: 1,
  })
  const display = useTransform(springValue, (latest) =>
    formatFn ? formatFn(Math.round(latest)) : Math.round(latest).toLocaleString()
  )

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration: 0.8,
      ease: [0.25, 0.1, 0.25, 1],
    })
    return () => controls.stop()
  }, [value, motionValue])

  return <motion.span className={className}>{display}</motion.span>
}
