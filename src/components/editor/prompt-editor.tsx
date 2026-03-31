"use client"

import { useRef, useCallback } from "react"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

interface PromptEditorProps {
  value: string
  onChange: (value: string) => void
  cursorRef?: React.MutableRefObject<HTMLTextAreaElement | null>
  className?: string
}

const VAR_PATTERN = /\{\{(\w+)\}\}/g

export function PromptEditor({ value, onChange, cursorRef, className }: PromptEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const setRefs = useCallback(
    (el: HTMLTextAreaElement | null) => {
      (textareaRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = el
      if (cursorRef) cursorRef.current = el
    },
    [cursorRef]
  )

  // Build highlighted overlay
  const highlighted = value.split(VAR_PATTERN).map((part, i) => {
    if (i % 2 === 1) {
      return (
        <span key={i} className="text-transparent bg-blue-500/20 rounded-sm">
          {"{{" + part + "}}"}
        </span>
      )
    }
    return <span key={i} className="text-transparent">{part}</span>
  })

  return (
    <div className={cn("relative", className)}>
      {/* Highlight overlay */}
      <div
        className="absolute inset-0 pointer-events-none px-2.5 py-2 text-sm font-mono whitespace-pre-wrap break-words overflow-hidden"
        aria-hidden
      >
        {highlighted}
      </div>
      {/* Actual textarea */}
      <Textarea
        ref={setRefs}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Write your prompt here... Use {{variable}} for dynamic values."
        className="font-mono text-sm min-h-[300px] resize-y bg-transparent relative z-10"
        spellCheck={false}
      />
    </div>
  )
}

/** Extract variable names from prompt content */
export function extractVariables(content: string): string[] {
  const matches = content.matchAll(VAR_PATTERN)
  const names = new Set<string>()
  for (const m of matches) names.add(m[1])
  return Array.from(names)
}
