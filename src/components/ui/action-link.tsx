import Link from "next/link"
import * as React from "react"

import { cn } from "@/lib/utils"

type ActionLinkProps = React.ComponentProps<typeof Link> & {
  variant?: "primary" | "ghost" | "danger"
}

const variantClass = {
  primary:
    "border-[var(--verdigris-deep)] bg-[var(--verdigris)] text-[var(--ivory)] hover:bg-[var(--verdigris-deep)]",
  ghost:
    "border-border bg-card text-foreground hover:border-[var(--verdigris)] hover:text-[var(--verdigris-deep)]",
  danger:
    "border-border bg-card text-[var(--vermillion)] hover:border-[var(--vermillion)]",
}

export function ActionLink({
  className,
  variant = "ghost",
  ...props
}: ActionLinkProps) {
  return (
    <Link
      className={cn(
        "ui-body inline-flex h-8 items-center justify-center gap-2 rounded-[var(--radius-sm)] border px-3 font-medium no-underline transition-colors",
        variantClass[variant],
        className
      )}
      data-variant={variant === "primary" ? "primary" : undefined}
      {...props}
    />
  )
}
