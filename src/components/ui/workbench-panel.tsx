import * as React from "react"

import { cn } from "@/lib/utils"
import { Folio } from "@/components/ui/folio"
import { SurfaceCard } from "@/components/ui/surface-card"

type WorkbenchPanelProps = React.ComponentProps<"div"> & {
  folio?: React.ReactNode
  title: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
}

export function WorkbenchPanel({
  className,
  folio,
  title,
  description,
  actions,
  children,
  ...props
}: WorkbenchPanelProps) {
  return (
    <SurfaceCard className={cn("space-y-5", className)} {...props}>
      <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          {folio ? <Folio>{folio}</Folio> : null}
          <h2 className="text-2xl">{title}</h2>
          {description ? (
            <p className="prose-lab text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
      </div>
      {children}
    </SurfaceCard>
  )
}
