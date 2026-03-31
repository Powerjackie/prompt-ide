"use client"

import { useMemo } from "react"
import { Badge } from "@/components/ui/badge"

interface PreviewPanelProps {
  content: string
  variables: { name: string; defaultValue: string }[]
}

const VAR_PATTERN = /\{\{(\w+)\}\}/g

export function PreviewPanel({ content, variables }: PreviewPanelProps) {
  const rendered = useMemo(() => {
    const varMap = new Map(variables.map((v) => [v.name, v.defaultValue || `[${v.name}]`]))
    return content.replace(VAR_PATTERN, (_, name) => varMap.get(name) ?? `[${name}]`)
  }, [content, variables])

  const varNames = useMemo(() => {
    const names = new Set<string>()
    for (const m of content.matchAll(VAR_PATTERN)) names.add(m[1])
    return Array.from(names)
  }, [content])

  if (!content) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        Start writing to see a preview.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {varNames.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <span className="text-xs text-muted-foreground mr-1">Variables:</span>
          {varNames.map((v) => (
            <Badge key={v} variant="outline" className="text-[10px] font-mono">
              {`{{${v}}}`}
            </Badge>
          ))}
        </div>
      )}
      <div className="bg-muted/50 rounded-md p-4">
        <pre className="whitespace-pre-wrap font-mono text-sm">{rendered}</pre>
      </div>
      <div className="text-xs text-muted-foreground">
        {content.length} characters &middot; ~{Math.ceil(content.split(/\s+/).length)} words
      </div>
    </div>
  )
}
