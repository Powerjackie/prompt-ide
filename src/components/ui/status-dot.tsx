import * as React from "react"

import { cn } from "@/lib/utils"

const statusTone = {
  draft: "bg-[var(--ink-soft)]",
  active: "bg-[var(--verdigris)]",
  production: "bg-[var(--verdigris)]",
  archived: "bg-[var(--ink-muted)]",
  inbox: "bg-[var(--amber-rule)]",
  warning: "bg-[var(--vermillion)]",
}

type StatusDotProps = React.ComponentProps<"span"> & {
  tone?: keyof typeof statusTone
}

export function StatusDot({
  className,
  tone = "active",
  children,
  ...props
}: StatusDotProps) {
  return (
    <span
      className={cn(
        "ui-body inline-flex items-center gap-2 text-muted-foreground",
        className
      )}
      {...props}
    >
      <span
        aria-hidden="true"
        className={cn("size-2 rounded-full", statusTone[tone])}
      />
      {children}
    </span>
  )
}
