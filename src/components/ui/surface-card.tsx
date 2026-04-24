import * as React from "react"

import { cn } from "@/lib/utils"

type SurfaceCardProps = React.ComponentProps<"div"> & {
  interactive?: boolean
  inset?: boolean
}

export function SurfaceCard({
  className,
  interactive = false,
  inset = false,
  ...props
}: SurfaceCardProps) {
  return (
    <div
      className={cn(
        inset ? "lab-inset" : "lab-card",
        "rounded-[var(--radius-md)] p-5",
        className
      )}
      data-interactive={interactive ? "true" : undefined}
      {...props}
    />
  )
}
