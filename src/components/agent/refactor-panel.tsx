"use client"

import { useEffect, useMemo, useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import { Bot, CheckSquare, FilePenLine, Puzzle, Sparkles, Variable } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TrajectoryTimeline } from "@/components/agent/trajectory-timeline"
import {
  applyRefactorDraft,
  applyRefactorVariables,
  createModulesFromRefactor,
  runPromptRefactor,
} from "@/app/actions/agent.actions"
import { runPromptEvolutionComparison } from "@/app/actions/benchmark.actions"
import { getHistoryByPromptId } from "@/app/actions/agent-history.actions"
import { addModulesToCollection, getCollections } from "@/app/actions/collection.actions"
import { cn, formatDate } from "@/lib/utils"
import { CollectionFormDialog } from "@/components/collections/collection-form-dialog"
import type { SerializedPrompt } from "@/app/actions/prompt.actions"
import type { AgentTrajectoryStep } from "@/types/agent"
import type { PromptEvolutionComparison } from "@/types/benchmark"
import {
  isPromptRefactorRunOutput,
  type CleanedPromptDraft,
  type PromptRefactorResult,
} from "@/types/refactor"
import type { Collection } from "@/types/collection"

interface RefactorPanelProps {
  promptId?: string
  promptContent: string
  currentDraft?: CleanedPromptDraft | null
  canRun?: boolean
  canApply?: boolean
  refreshKey?: string | number
  compact?: boolean
  onPromptApplied?: (prompt: SerializedPrompt, mode: "draft" | "variables") => void
  onEvolutionComparisonReady?: (comparison: PromptEvolutionComparison | null) => void
  disabledReason?: string
}

export function RefactorPanel({
  promptId,
  promptContent,
  currentDraft,
  canRun = true,
  canApply = true,
  refreshKey,
  compact = false,
  onPromptApplied,
  onEvolutionComparisonReady,
  disabledReason,
}: RefactorPanelProps) {
  const locale = useLocale() as "zh" | "en"
  const t = useTranslations("agent.refactor")
  const [proposal, setProposal] = useState<PromptRefactorResult | null>(null)
  const [trajectory, setTrajectory] = useState<AgentTrajectoryStep[] | null>(null)
  const [historyId, setHistoryId] = useState<string | null>(null)
  const [loading, setLoading] = useState(Boolean(promptId))
  const [running, setRunning] = useState(false)
  const [applyingDraft, setApplyingDraft] = useState(false)
  const [applyingVariables, setApplyingVariables] = useState(false)
  const [creatingModules, setCreatingModules] = useState(false)
  const [selectedModuleIndexes, setSelectedModuleIndexes] = useState<number[]>([])
  const [evolutionComparison, setEvolutionComparison] = useState<PromptEvolutionComparison | null>(
    null
  )
  const [comparingEvolution, setComparingEvolution] = useState(false)
  const [createdModules, setCreatedModules] = useState<{ id: string; title: string }[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [selectedCollectionId, setSelectedCollectionId] = useState("")
  const [loadingCollections, setLoadingCollections] = useState(false)
  const [addingToCollection, setAddingToCollection] = useState(false)
  const [collectionDialogOpen, setCollectionDialogOpen] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadLatestProposal() {
      if (!promptId) {
        setProposal(null)
        setTrajectory(null)
        setHistoryId(null)
        setLoading(false)
        return
      }

      setLoading(true)
      const result = await getHistoryByPromptId(promptId, "refactor_proposal")
      if (cancelled) return

      if (result.success) {
        const latest = result.data[0]
        if (latest && isPromptRefactorRunOutput(latest.output)) {
          setProposal(latest.output.result)
          setTrajectory(latest.trajectory)
          setHistoryId(latest.id)
        } else {
          setProposal(null)
          setTrajectory(null)
          setHistoryId(null)
        }
      } else {
        setProposal(null)
        setTrajectory(null)
        setHistoryId(null)
        toast.error(result.error)
      }

      setSelectedModuleIndexes([])
      setEvolutionComparison(null)
      onEvolutionComparisonReady?.(null)
      setCreatedModules([])
      setCollections([])
      setSelectedCollectionId("")
      setLoading(false)
    }

    void loadLatestProposal()

    return () => {
      cancelled = true
    }
  }, [onEvolutionComparisonReady, promptId, refreshKey])

  const hasSelectedModules = selectedModuleIndexes.length > 0
  const canRunNow = Boolean(promptId) && Boolean(promptContent.trim()) && canRun
  const canApplyNow = Boolean(promptId) && Boolean(historyId) && canApply
  const hasCreatedModules = createdModules.length > 0

  const moduleSelectionSummary = useMemo(() => {
    if (!proposal) return t("modules.none")
    if (proposal.extractedModules.length === 0) return t("modules.none")
    if (selectedModuleIndexes.length === 0) return t("modules.selectHint")
    return t("modules.selectedCount", { count: selectedModuleIndexes.length })
  }, [proposal, selectedModuleIndexes.length, t])

  const diffEntries = useMemo(() => {
    if (!proposal || !currentDraft) return []

    const fields: (keyof CleanedPromptDraft)[] = ["title", "description", "tags", "content"]

    return fields
      .filter((field) => JSON.stringify(currentDraft[field]) !== JSON.stringify(proposal.cleanedPromptDraft[field]))
      .map((field) => ({
        field,
        currentValue: Array.isArray(currentDraft[field])
          ? currentDraft[field].length > 0
            ? currentDraft[field].join(", ")
            : "-"
          : currentDraft[field] || "-",
        proposalValue: Array.isArray(proposal.cleanedPromptDraft[field])
          ? proposal.cleanedPromptDraft[field].length > 0
            ? proposal.cleanedPromptDraft[field].join(", ")
            : "-"
          : proposal.cleanedPromptDraft[field] || "-",
      }))
  }, [currentDraft, proposal])

  const suggestedCollectionDraft = useMemo(() => {
    if (!proposal) return null

    const baseTitle = proposal.cleanedPromptDraft.title.trim() || "Refactor Pack"

    return {
      title: `${baseTitle} Toolkit`,
      description: proposal.summary,
      type: "toolkit" as const,
    }
  }, [proposal])

  const loadCollections = async () => {
    setLoadingCollections(true)
    const result = await getCollections()
    if (result.success) {
      setCollections(result.data)
      setSelectedCollectionId((current) => {
        if (current && result.data.some((collection) => collection.id === current)) {
          return current
        }
        return result.data[0]?.id ?? ""
      })
    } else {
      toast.error(result.error)
    }
    setLoadingCollections(false)
  }

  const toggleModuleSelection = (index: number, checked: boolean) => {
    setSelectedModuleIndexes((current) => {
      if (checked) {
        return Array.from(new Set([...current, index])).sort((left, right) => left - right)
      }

      return current.filter((value) => value !== index)
    })
  }

  const handleRunEvolutionComparison = async (
    nextPromptId: string,
    latestVersionId: string | null,
    comparisonVersionId: string | null
  ) => {
    if (!latestVersionId || !comparisonVersionId) {
      setEvolutionComparison(null)
      onEvolutionComparisonReady?.(null)
      return
    }

    setComparingEvolution(true)
    const result = await runPromptEvolutionComparison(
      nextPromptId,
      latestVersionId,
      comparisonVersionId,
      locale
    )
    if (result.success) {
      setEvolutionComparison(result.data)
      onEvolutionComparisonReady?.(result.data)
      toast.success(t("evolution.ready"))
    } else {
      toast.error(result.error)
      setEvolutionComparison(null)
      onEvolutionComparisonReady?.(null)
    }
    setComparingEvolution(false)
  }

  const handleRun = async () => {
    if (!promptId || !promptContent.trim()) {
      toast.error(t("saveFirst"))
      return
    }
    if (!canRun) {
      toast.error(disabledReason ?? t("saveFirst"))
      return
    }

    setRunning(true)
    setEvolutionComparison(null)
    onEvolutionComparisonReady?.(null)
    const result = await runPromptRefactor(promptContent, promptId, locale)
    if (result.success) {
      setProposal(result.data.proposal)
      setTrajectory(result.data.trajectory)
      setHistoryId(result.data.historyId)
      setSelectedModuleIndexes([])
      toast.success(t("runComplete"))
    } else {
      toast.error(result.error)
    }
    setRunning(false)
  }

  const handleApplyDraft = async () => {
    if (!promptId || !historyId) return
    if (!canApply) {
      toast.error(t("saveFirst"))
      return
    }

    setApplyingDraft(true)
    const result = await applyRefactorDraft(promptId, historyId)
    if (result.success) {
      onPromptApplied?.(result.data.prompt, "draft")
      toast.success(t("draftApplied"))
      await handleRunEvolutionComparison(
        promptId,
        result.data.latestVersionId,
        result.data.comparisonVersionId
      )
    } else {
      toast.error(result.error)
    }
    setApplyingDraft(false)
  }

  const handleApplyVariables = async () => {
    if (!promptId || !historyId) return
    if (!canApply) {
      toast.error(t("saveFirst"))
      return
    }

    setApplyingVariables(true)
    const result = await applyRefactorVariables(promptId, historyId)
    if (result.success) {
      onPromptApplied?.(result.data.prompt, "variables")
      toast.success(t("variablesApplied"))
      await handleRunEvolutionComparison(
        promptId,
        result.data.latestVersionId,
        result.data.comparisonVersionId
      )
    } else {
      toast.error(result.error)
    }
    setApplyingVariables(false)
  }

  const handleCreateModules = async () => {
    if (!promptId || !historyId) return
    if (!hasSelectedModules) {
      toast.error(t("modules.selectHint"))
      return
    }

    setCreatingModules(true)
    const result = await createModulesFromRefactor(promptId, historyId, selectedModuleIndexes)
    if (result.success) {
      toast.success(t("modules.created", { count: result.data.createdCount }))
      setSelectedModuleIndexes([])
      setCreatedModules(result.data.modules)
      await loadCollections()
    } else {
      toast.error(result.error)
    }
    setCreatingModules(false)
  }

  const handleAddModulesToCollection = async () => {
    await addCreatedModulesToCollection(selectedCollectionId)
  }

  const handleCollectionCreated = async (collection: Collection) => {
    setCollections((current) => {
      if (current.some((item) => item.id === collection.id)) {
        return current
      }
      return [collection, ...current]
    })
    setSelectedCollectionId(collection.id)
    await addCreatedModulesToCollection(collection.id, true)
  }

  const addCreatedModulesToCollection = async (
    collectionId: string,
    createdJustNow = false
  ) => {
    if (!hasCreatedModules || !collectionId) {
      toast.error(t("modules.quickAdd.selectCollection"))
      return
    }

    setAddingToCollection(true)
    const result = await addModulesToCollection(
      collectionId,
      createdModules.map((module) => module.id)
    )
    if (result.success) {
      toast.success(
        createdJustNow
          ? t("modules.quickAdd.createdAndAdded", { count: result.data.addedCount })
          : result.data.skippedCount > 0
            ? t("modules.quickAdd.addedWithSkipped", {
                added: result.data.addedCount,
                skipped: result.data.skippedCount,
              })
            : t("modules.quickAdd.added", { count: result.data.addedCount })
      )
    } else {
      toast.error(result.error)
    }
    setAddingToCollection(false)
  }

  return (
    <div className={cn("space-y-4", compact && "space-y-3")}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-primary" />
            <h3 className="font-medium">{t("title")}</h3>
          </div>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>
        <Button onClick={handleRun} disabled={running || !canRunNow}>
          <Sparkles className="mr-1 h-4 w-4" />
          {running ? t("running") : proposal ? t("rerun") : t("run")}
        </Button>
      </div>

      {!promptId || !canRun ? (
        <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          {disabledReason ?? t("saveFirst")}
        </div>
      ) : null}

      {proposal ? (
        <div className="space-y-4">
          <div className="rounded-lg border p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{proposal.analysisVersion}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {t("generatedAt", { date: formatDate(proposal.generatedAt) })}
                  </span>
                </div>
                <p className="mt-2 text-sm text-foreground">{proposal.summary}</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <div className="mb-3 flex items-center gap-2">
              <FilePenLine className="h-4 w-4 text-primary" />
              <div>
                <div className="font-medium">{t("diff.title")}</div>
                <p className="text-sm text-muted-foreground">{t("diff.description")}</p>
              </div>
            </div>

            {diffEntries.length > 0 ? (
              <div className="space-y-3">
                {diffEntries.map((entry) => (
                  <div key={entry.field} className="rounded-md border bg-muted/20 p-3">
                    <div className="mb-2 text-sm font-medium">
                      {t(`draft.fields.${entry.field}`)}
                    </div>
                    <div className="grid gap-3 lg:grid-cols-2">
                      <div>
                        <div className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
                          {t("diff.current")}
                        </div>
                        <pre className="whitespace-pre-wrap rounded-md bg-background p-3 text-xs">
                          {entry.currentValue}
                        </pre>
                      </div>
                      <div>
                        <div className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
                          {t("diff.proposed")}
                        </div>
                        <pre className="whitespace-pre-wrap rounded-md bg-background p-3 text-xs">
                          {entry.proposalValue}
                        </pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t("diff.noChanges")}</p>
            )}
          </div>

          <div className="rounded-lg border p-4">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <FilePenLine className="h-4 w-4 text-primary" />
                <div>
                  <div className="font-medium">{t("draft.title")}</div>
                  <p className="text-sm text-muted-foreground">{t("draft.description")}</p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={handleApplyDraft}
                disabled={applyingDraft || !canApplyNow}
              >
                {applyingDraft ? t("draft.applying") : t("draft.apply")}
              </Button>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  {t("draft.fields.title")}
                </div>
                <div className="mt-1 font-medium">{proposal.cleanedPromptDraft.title}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  {t("draft.fields.description")}
                </div>
                <p className="mt-1 text-muted-foreground">
                  {proposal.cleanedPromptDraft.description}
                </p>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  {t("draft.fields.tags")}
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {proposal.cleanedPromptDraft.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  {t("draft.fields.content")}
                </div>
                <pre className="mt-2 max-h-64 overflow-y-auto whitespace-pre-wrap rounded-md bg-muted/30 p-3 text-xs">
                  {proposal.cleanedPromptDraft.content}
                </pre>
              </div>
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <Variable className="h-4 w-4 text-primary" />
                <div>
                  <div className="font-medium">{t("variables.title")}</div>
                  <p className="text-sm text-muted-foreground">{t("variables.description")}</p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={handleApplyVariables}
                disabled={applyingVariables || !canApplyNow}
              >
                {applyingVariables ? t("variables.applying") : t("variables.apply")}
              </Button>
            </div>

            {proposal.suggestedVariables.length > 0 ? (
              <div className="space-y-2">
                {proposal.suggestedVariables.map((variable) => (
                  <div
                    key={variable.name}
                    className="rounded-md border bg-muted/20 px-3 py-2 text-sm"
                  >
                    <div className="font-mono text-xs">{`{{${variable.name}}}`}</div>
                    <div className="mt-1 text-muted-foreground">
                      {variable.description || t("variables.noDescription")}
                    </div>
                    {variable.defaultValue ? (
                      <div className="mt-1 text-xs text-muted-foreground">
                        {t("variables.defaultValue", { value: variable.defaultValue })}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t("variables.empty")}</p>
            )}
          </div>

          <div className="rounded-lg border p-4">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <Puzzle className="h-4 w-4 text-primary" />
                <div>
                  <div className="font-medium">{t("modules.title")}</div>
                  <p className="text-sm text-muted-foreground">{t("modules.description")}</p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={handleCreateModules}
                disabled={creatingModules || !hasSelectedModules}
              >
                <CheckSquare className="mr-1 h-4 w-4" />
                {creatingModules ? t("modules.creating") : t("modules.create")}
              </Button>
            </div>

            {proposal.extractedModules.length > 0 ? (
              <div className="space-y-2">
                {proposal.extractedModules.map((module, index) => {
                  const checked = selectedModuleIndexes.includes(index)

                  return (
                    <label
                      key={`${module.title}-${index}`}
                      className={cn(
                        "flex gap-3 rounded-md border p-3 transition-colors",
                        checked && "border-primary bg-primary/5"
                      )}
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(value) => toggleModuleSelection(index, Boolean(value))}
                      />
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">{module.title}</span>
                          <Badge variant="secondary">{module.type}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{module.rationale}</p>
                        {module.tags.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {module.tags.map((tag) => (
                              <Badge key={tag} variant="outline">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        ) : null}
                        <pre className="max-h-40 overflow-y-auto whitespace-pre-wrap rounded-md bg-muted/30 p-3 text-xs">
                          {module.content}
                        </pre>
                      </div>
                    </label>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t("modules.none")}</p>
            )}

            <p className="mt-3 text-xs text-muted-foreground">{moduleSelectionSummary}</p>
          </div>

          {hasCreatedModules ? (
            <div className="rounded-lg border p-4">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium">{t("modules.quickAdd.title")}</div>
                  <p className="text-sm text-muted-foreground">
                    {t("modules.quickAdd.description")}
                  </p>
                </div>
                <Badge variant="secondary">
                  {t("modules.quickAdd.createdCount", { count: createdModules.length })}
                </Badge>
              </div>

              <div className="mb-3 flex flex-wrap gap-1.5">
                {createdModules.map((module) => (
                  <Badge key={module.id} variant="outline">
                    {module.title}
                  </Badge>
                ))}
              </div>

              {loadingCollections ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <span>{t("modules.quickAdd.loadingCollections")}</span>
                </div>
              ) : collections.length > 0 ? (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <div className="text-sm text-muted-foreground">
                      {t("modules.quickAdd.collectionLabel")}
                    </div>
                    <Select
                      value={selectedCollectionId}
                      onValueChange={(value) => setSelectedCollectionId(value ?? "")}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t("modules.quickAdd.collectionPlaceholder")} />
                      </SelectTrigger>
                      <SelectContent>
                        {collections.map((collection) => (
                          <SelectItem key={collection.id} value={collection.id}>
                            {collection.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    variant="outline"
                    onClick={handleAddModulesToCollection}
                    disabled={addingToCollection || !selectedCollectionId}
                  >
                    {addingToCollection
                      ? t("modules.quickAdd.adding")
                      : t("modules.quickAdd.addAction")}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setCollectionDialogOpen(true)}
                    disabled={addingToCollection}
                  >
                    {t("modules.quickAdd.createCollectionAction")}
                  </Button>
                </div>
              ) : (
                <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                  <p>{t("modules.quickAdd.noCollections")}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Button
                      variant="ghost"
                      className="px-0"
                      onClick={() => setCollectionDialogOpen(true)}
                    >
                      {t("modules.quickAdd.createCollectionAction")}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : null}

          <div className="rounded-lg border p-4">
            <div className="mb-3">
              <div className="font-medium">{t("evolution.title")}</div>
              <p className="text-sm text-muted-foreground">{t("evolution.description")}</p>
            </div>

            {comparingEvolution ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <span>{t("evolution.comparing")}</span>
              </div>
            ) : evolutionComparison ? (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">
                    {evolutionComparison.strategy === "baseline"
                      ? t("evolution.strategyBaseline")
                      : t("evolution.strategyPrevious")}
                  </Badge>
                  <Badge
                    variant={
                      evolutionComparison.recommendedForProduction ? "default" : "secondary"
                    }
                  >
                    {evolutionComparison.recommendedForProduction
                      ? t("evolution.recommended")
                      : t("evolution.iterate")}
                  </Badge>
                </div>

                <p className="text-sm text-muted-foreground">{evolutionComparison.summary}</p>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                  {Object.entries(evolutionComparison.deltas).map(([key, value]) => (
                    <div key={key} className="rounded-md border bg-muted/20 p-3">
                      <div className="text-xs uppercase tracking-wide text-muted-foreground">
                        {t(`evolution.scores.${key}`)}
                      </div>
                      <div
                        className={cn(
                          "mt-2 text-lg font-semibold tabular-nums",
                          value > 0 && "text-green-600",
                          value < 0 && "text-red-600"
                        )}
                      >
                        {value > 0 ? "+" : ""}
                        {value}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-md bg-muted/20 p-3">
                    <div className="text-sm font-medium">{t("evolution.comparisonRun")}</div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {t("evolution.versionLabel", {
                        version: evolutionComparison.comparison.promptVersionNumber,
                      })}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {evolutionComparison.comparison.summary}
                    </div>
                  </div>
                  <div className="rounded-md bg-muted/20 p-3">
                    <div className="text-sm font-medium">{t("evolution.candidateRun")}</div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {t("evolution.versionLabel", {
                        version: evolutionComparison.candidate.promptVersionNumber,
                      })}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {evolutionComparison.candidate.summary}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t("evolution.empty")}</p>
            )}
          </div>

          <TrajectoryTimeline trajectory={trajectory} loading={loading} />
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          {loading ? t("loading") : t("empty")}
        </div>
      )}
      <CollectionFormDialog
        open={collectionDialogOpen}
        onOpenChange={setCollectionDialogOpen}
        initialDraft={suggestedCollectionDraft}
        onSaved={(collection) => {
          void handleCollectionCreated(collection)
        }}
      />
    </div>
  )
}
