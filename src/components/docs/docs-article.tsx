import type { ReactNode } from "react"
import { DocsBreadcrumb } from "@/components/docs/docs-breadcrumb"
import { DocsToc } from "@/components/docs/docs-toc"
import type { DocsHeading } from "@/components/docs/docs-navigation"
import { cn } from "@/lib/utils"

interface DocsArticleProps {
  headings: DocsHeading[]
  children: ReactNode
  className?: string
}

const DOCS_PROSE_CLASSNAME =
  "max-w-3xl space-y-6 [&_h1]:font-heading [&_h1]:text-4xl [&_h1]:font-semibold [&_h1]:tracking-tight [&_h1]:text-foreground [&_h2]:scroll-mt-24 [&_h2]:border-t [&_h2]:border-border/60 [&_h2]:pt-6 [&_h2]:font-heading [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-foreground [&_h3]:scroll-mt-24 [&_h3]:font-heading [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:tracking-tight [&_h3]:text-foreground [&_p]:text-sm [&_p]:leading-7 [&_p]:text-muted-foreground sm:[&_p]:text-base [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-6 [&_li]:pl-1 [&_a]:text-primary [&_a]:underline-offset-4 hover:[&_a]:underline [&_code]:rounded-md [&_code]:bg-muted/70 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.92em] [&_code]:text-foreground [&_pre]:overflow-x-auto [&_pre]:rounded-[1.4rem] [&_pre]:border [&_pre]:border-border/70 [&_pre]:bg-background/85 [&_pre]:p-4 [&_pre]:text-sm [&_pre]:shadow-[0_18px_46px_-34px_rgba(15,23,42,0.34)] [&_blockquote]:rounded-[1.25rem] [&_blockquote]:border-l-4 [&_blockquote]:border-primary/30 [&_blockquote]:bg-primary/6 [&_blockquote]:px-5 [&_blockquote]:py-4 [&_blockquote]:text-foreground dark:[&_pre]:border-primary/16 dark:[&_pre]:bg-[linear-gradient(180deg,rgba(9,12,20,0.82),rgba(17,22,37,0.96))]"

export function DocsArticle({ headings, children, className }: DocsArticleProps) {
  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_220px] xl:items-start">
      <div className="min-w-0 space-y-5">
        <DocsBreadcrumb />
        <article className={cn(DOCS_PROSE_CLASSNAME, className)}>{children}</article>
      </div>
      <DocsToc headings={headings} />
    </div>
  )
}
