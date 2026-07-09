import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("skeleton-shimmer rounded-[6px] bg-subtle", className)}
      {...props}
    />
  )
}

export { Skeleton }
