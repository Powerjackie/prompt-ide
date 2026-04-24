import * as React from "react"

import { cn } from "@/lib/utils"
import { Folio } from "@/components/ui/folio"

type VersionTrailProps = React.ComponentProps<"ol"> & {
  items: Array<React.ReactNode>
}

export function VersionTrail({ className, items, ...props }: VersionTrailProps) {
  return (
    <ol className={cn("flex flex-wrap items-center gap-2", className)} {...props}>
      {items.map((item, index) => (
        <li className="inline-flex items-center gap-2" key={index}>
          {index > 0 ? <span className="text-muted-foreground">/</span> : null}
          <Folio>{item}</Folio>
        </li>
      ))}
    </ol>
  )
}
