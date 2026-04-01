"use client"

import { useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { extractPromptVariables, renderPromptTemplate } from "@/lib/prompt-render"

interface PreviewPanelProps {
  content: string
  variables: { name: string; defaultValue: string }[]
}

export function PreviewPanel({ content, variables }: PreviewPanelProps) {
  const rendered = useMemo(() => {
    return renderPromptTemplate(
      content,
      Object.fromEntries(variables.map((variable) => [variable.name, variable.defaultValue || `[${variable.name}]`])),
      (name) => `[${name}]`
    )
  }, [content, variables])

  const varNames = useMemo(() => {
    return extractPromptVariables(content)
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
