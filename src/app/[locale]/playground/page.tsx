"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { FlaskConical, Bot } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { AnalysisPanel } from "@/components/agent/analysis-panel"
import { runStatelessAgentAnalysis } from "@/app/actions/agent.actions"
import type { AgentAnalysisResult, AgentTrajectoryStep } from "@/types/agent"
import { toast } from "sonner"

export default function PlaygroundPage() {
  const t = useTranslations("playground")
  const ta = useTranslations("agent")
  const [content, setContent] = useState("")
  const [analysis, setAnalysis] = useState<AgentAnalysisResult | null>(null)
  const [trajectory, setTrajectory] = useState<AgentTrajectoryStep[] | null>(null)
  const [analyzing, setAnalyzing] = useState(false)

  const handleAnalyze = async () => {
    if (!content.trim()) return

    setAnalyzing(true)

    const result = await runStatelessAgentAnalysis(content)
    if (result.success) {
      setAnalysis(result.data.analysis)
      setTrajectory(result.data.trajectory)
    } else {
      toast.error(result.error)
    }

    setAnalyzing(false)
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-2">
        <FlaskConical className="h-6 w-6" />
        <h1 className="text-2xl font-bold">{t("title")}</h1>
      </div>
      <p className="text-muted-foreground text-sm">
        {t("description")}
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input */}
        <div className="space-y-3">
          <Label>{t("promptContent")}</Label>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t("placeholder")}
            className="min-h-[300px] font-mono text-sm"
          />
          <Button onClick={handleAnalyze} disabled={analyzing || !content.trim()}>
            <Bot className="h-4 w-4 mr-1" />
            {analyzing ? ta("analyzing") : t("analyze")}
          </Button>
        </div>

        {/* Results */}
        <div>
          <Label className="mb-3 block">{t("results")}</Label>
          <div className="border rounded-lg p-4">
            <AnalysisPanel
              analysis={analysis}
              trajectory={trajectory}
              analyzing={analyzing}
              analyzingLabel={ta("analyzingWithEngine", { engine: "MiniMax-2.7" })}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
