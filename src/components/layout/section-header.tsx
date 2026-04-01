import type { ReactNode } from "react"

interface SectionHeaderProps {
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
}

export function SectionHeader({ title, description, action }: SectionHeaderProps) {
  return (
    <div className="section-header">
      <div className="space-y-1">
        <h2 className="section-header__title">{title}</h2>
        {description ? <p className="section-header__description">{description}</p> : null}
      </div>
      {action ? <div className="page-actions">{action}</div> : null}
    </div>
  )
}
