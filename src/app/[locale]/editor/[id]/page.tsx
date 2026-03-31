"use client"

import { use } from "react"
import { EditorLayout } from "@/components/editor/editor-layout"

export default function EditPromptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return <EditorLayout promptId={id} />
}
