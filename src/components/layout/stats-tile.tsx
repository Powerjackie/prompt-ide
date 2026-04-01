import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface StatsTileProps {
  label: ReactNode
  value: ReactNode
  icon?: ReactNode
  hint?: ReactNode
  className?: string
}

export function StatsTile({ label, value, icon, hint, className }: StatsTileProps) {
  return (
    <div className={cn("metric-tile", className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="metric-tile__value">{value}</div>
          <div className="metric-tile__label">{label}</div>
        </div>
        {icon ? (
          <div className="rounded-2xl border border-primary/15 bg-primary/8 p-3 text-primary">
            {icon}
          </div>
        ) : null}
      </div>
      {hint ? <p className="mt-4 text-sm text-muted-foreground">{hint}</p> : null}
    </div>
  )
}
