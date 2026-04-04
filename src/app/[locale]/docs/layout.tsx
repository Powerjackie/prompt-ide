import type { ReactNode } from "react"
import { DocsSidebar } from "@/components/docs/docs-sidebar"

export default function DocsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="lg:hidden">
        <DocsSidebar mobile />
      </div>
      <div className="grid gap-6 lg:grid-cols-[248px_minmax(0,1fr)] xl:gap-8">
        <aside className="hidden lg:block">
          <DocsSidebar />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  )
}
