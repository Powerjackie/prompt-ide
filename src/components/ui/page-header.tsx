import * as React from "react"

import { cn } from "@/lib/utils"
import { Eyebrow } from "@/components/ui/eyebrow"

type PageHeaderProps = React.ComponentProps<"header"> & {
  eyebrow?: React.ReactNode
  title: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
}

export function PageHeader({
  className,
  eyebrow,
  title,
  description,
  actions,
  ...props
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "mb-8 flex flex-col gap-5 border-b border-border pb-6 md:flex-row md:items-end md:justify-between",
        className
      )}
      {...props}
    >
      <div className="min-w-0 space-y-3">
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        <h1 className="max-w-4xl text-balance">{title}</h1>
        {description ? (
          <p className="prose-lab text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </header>
  )
}
