import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface PageHeaderProps {
  eyebrow?: ReactNode
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  children?: ReactNode
  className?: string
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  children,
  className,
}: PageHeaderProps) {
  return (
    <section className={cn("page-header dark:shadow-none", className)}>
      <div className="page-header__top">
        <div className="space-y-3">
          {eyebrow ? <div className="page-header__eyebrow">{eyebrow}</div> : null}
          <div className="space-y-2">
            <h1 className="page-header__title">{title}</h1>
            {description ? <p className="page-header__description">{description}</p> : null}
          </div>
        </div>
        {actions ? <div className="page-actions">{actions}</div> : null}
      </div>
      {children}
    </section>
  )
}
