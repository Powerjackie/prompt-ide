import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:focus-visible:border-primary dark:focus-visible:ring-0 dark:focus-visible:[box-shadow:0_0_0_1px_rgba(79,246,255,0.34),0_0_0_3px_rgba(79,246,255,0.14),0_0_24px_-8px_rgba(79,246,255,0.96),0_0_34px_-12px_rgba(106,124,255,0.72),0_0_42px_-16px_rgba(255,79,216,0.54)] dark:hover:border-primary/26 dark:hover:[box-shadow:0_0_0_1px_rgba(79,246,255,0.16),0_0_0_3px_rgba(79,246,255,0.05),0_0_18px_-10px_rgba(79,246,255,0.7),0_0_24px_-16px_rgba(255,79,216,0.24)] dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Input }
