import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

const Switch = React.forwardRef<
  React.ComponentRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      // Luma: 40×23 track, 18px white knob with a symmetric 2.5px inset both ends
      // (off knob-left 2.5 → on knob-left 19.5, so knob-right = 37.5 = 2.5 from the
      // 40px edge). No border — it shifted the knob flush to the right when on.
      "peer inline-flex h-[23px] w-10 shrink-0 cursor-pointer items-center rounded-full p-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-border-strong",
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block size-[18px] translate-x-[2.5px] rounded-full bg-white shadow-sm ring-0 transition-transform data-[state=checked]:translate-x-[19.5px]"
      )}
    />
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
