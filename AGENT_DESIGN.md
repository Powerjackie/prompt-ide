# Agent Design

## Self-Binding Directive

AI assistants must read this file and `AI_HANDOVER.md` before modifying any agent logic, MiniMax integration, trajectory persistence, benchmark evaluator flow, or analysis contracts.

## Living Document Protocol

This file and `AI_HANDOVER.md` are write-through external memory.

- If the database schema changes, update both documents in the same change.
- If server action patterns change, update both documents in the same change.
- If trajectory or output contracts change, update both documents in the same change.
- If MiniMax is used for a new execution mode, document it here immediately.

## Chosen Engine

- Engine family: **MiniMax-2.7**
- Runtime model ID: `MiniMax-M2.7`
- Client library: `openai`
- Transport mode: OpenAI SDK compatibility layer
- Base URL: `https://api.minimax.chat/v1`
- Environment variable: `MINIMAX_API_KEY`
- Runtime entrypoint: `src/agent/llm-agent.ts`

## Active Execution Modes

### 1. Saved Prompt ReAct Mode

- Server action: `runAgentAnalysis(promptContent, promptId)`
- Persists:
  - `Prompt.agentAnalysis`
  - `AgentHistory.output`
  - `AgentHistory.trajectory`
- UI surfaces:
  - saved prompt detail
  - saved prompt editor

### 2. Stateless Playground ReAct Mode

- Server action: `runStatelessAgentAnalysis(content)`
- Persists: nothing
- Returns:
  - `analysis`
  - `trajectory`
- UI surface:
  - Playground

### 3. Saved Prompt Refactor Mode

- Server action: `runPromptRefactor(promptContent, promptId)`
- Persists:
  - `AgentHistory.output`
  - `AgentHistory.trajectory`
- Uses:
  - `AgentHistory.type = "refactor_proposal"`
- Does not directly write:
  - `Prompt`
  - `PromptVersion`
  - `Module`
- Accept actions:
  - `applyRefactorDraft(promptId, historyId)`
  - `applyRefactorVariables(promptId, historyId)`
  - `createModulesFromRefactor(promptId, historyId, moduleIndexes)`
- Draft and variable acceptance now also return:
  - `latestVersionId`
  - `comparisonVersionId`
- The UI then calls `runPromptEvolutionComparison(...)` automatically.
- UI surfaces:
  - saved prompt detail
  - saved prompt editor

### 4. Benchmark Evaluator Mode

- Server action: `runPromptBenchmark(promptId, promptVersionId?)`
- Persists:
  - `BenchmarkRun`
- Does not write:
  - `Prompt.agentAnalysis`
  - `AgentHistory`
- By default, benchmark execution now reuses the latest saved run for the same `PromptVersion` instead of creating duplicate rows on page reloads or repeat reads.
- Purpose:
  - score a saved `PromptVersion`
  - compare versions through `compareBenchmarkRuns(leftId, rightId)`

## Current Tooling

### `search_prompt_modules`

- Implemented inside `src/agent/llm-agent.ts`
- Backed directly by Prisma `Module` queries
- Searches `title`, `content`, and `tags`
- Returns formatted plain text to the model as tool observation context

## ReAct Trajectory Schema

`AgentHistory.trajectory` must be stored as a JSON string containing an array of steps.

```json
[
  {
    "step": 1,
    "phase": "thought",
    "content": "Need reusable context before finalizing the analysis.",
    "tool": null,
    "input": null,
    "data": null,
    "timestamp": "2026-03-31T12:00:00.000Z"
  },
  {
    "step": 2,
    "phase": "action",
    "content": "Requested reusable prompt modules using the query \"english speaking coach daily practice\".",
    "tool": "search_prompt_modules",
    "input": {
      "query": "english speaking coach daily practice",
      "promptId": "prompt_123",
      "iteration": 1
    },
    "data": null,
    "timestamp": "2026-03-31T12:00:01.000Z"
  },
  {
    "step": 3,
    "phase": "observation",
    "content": "Result 1\nID: module_1\nTitle: Speaking Coach Role\nType: role\nTags: english, coaching\nContent: You are a high-accountability speaking coach...",
    "tool": null,
    "input": null,
    "data": {
      "query": "english speaking coach daily practice",
      "moduleCount": 1,
      "moduleCandidates": [
        {
          "type": "role",
          "content": "You are a high-accountability speaking coach..."
        }
      ],
      "resultPreview": "Result 1 ID: module_1 Title: Speaking Coach Role..."
    },
    "timestamp": "2026-03-31T12:00:02.000Z"
  },
  {
    "step": 4,
    "phase": "thought",
    "content": "Finalized analysis with suggested title \"Intensive English Speaking Improvement Plan\" and risk \"low\".",
    "tool": null,
    "input": null,
    "data": null,
    "timestamp": "2026-03-31T12:00:03.000Z"
  }
]
```

### Step Fields

- `step`: integer sequence number
- `phase`: `"thought" | "action" | "observation"`
- `content`: human-readable step text
- `tool`: nullable tool identifier
- `input`: nullable structured tool input
- `data`: nullable structured observation payload
- `timestamp`: ISO timestamp

## Saved Analysis Output Schema

`AgentHistory.output` must be a JSON string with a `result` object matching `AgentAnalysisResult`.

```json
{
  "result": {
    "suggestedTitle": "Prompt Review",
    "suggestedDescription": "MiniMax generated a module-aware prompt analysis.",
    "suggestedCategory": "general",
    "suggestedTags": ["minimax", "react"],
    "suggestedModel": "universal",
    "suggestedStatus": "inbox",
    "riskLevel": "low",
    "confidence": 0.82,
    "extractedVariables": [],
    "duplicateCandidates": [],
    "moduleCandidates": [],
    "normalizedContent": null,
    "reviewRequired": false,
    "summaryParts": [
      {
        "key": "summaryCategory",
        "params": {
          "category": "general"
        }
      }
    ],
    "reasons": [],
    "matchedRules": [
      "agent:minimax-2.7-react",
      "agent:tool:search_prompt_modules"
    ],
    "analysisVersion": "minimax-2.7-react-v1",
    "analyzedAt": "2026-03-31T12:00:03.000Z"
  },
  "meta": {
    "engine": "MiniMax-M2.7",
    "provider": "minimax",
    "transport": "openai-compat",
    "runType": "react_trajectory"
  }
}
```

## Refactor Proposal Output Schema

`AgentHistory.output` stores refactor proposals as a separate payload family keyed by `meta.runType = "refactor_proposal"`.

```json
{
  "result": {
    "summary": "MiniMax cleaned the draft, suggested reusable variables, and extracted two module candidates.",
    "cleanedPromptDraft": {
      "title": "Intensive English Speaking Coach",
      "description": "A clearer production-ready draft for a one-month speaking plan.",
      "content": "You are an English speaking coach...\n\nGoals:\n1. ...",
      "tags": ["english", "coaching", "refactor"]
    },
    "suggestedVariables": [
      {
        "name": "current_level",
        "description": "The learner's current spoken English level.",
        "defaultValue": "intermediate"
      }
    ],
    "extractedModules": [
      {
        "title": "Speaking Coach Role",
        "type": "role",
        "content": "You are a high-accountability English speaking coach...",
        "tags": ["english", "coach"],
        "rationale": "This role definition can be reused across multiple learning prompts."
      }
    ],
    "analysisVersion": "minimax-2.7-refactor-v1",
    "generatedAt": "2026-03-31T12:10:00.000Z"
  },
  "meta": {
    "engine": "MiniMax-M2.7",
    "provider": "minimax",
    "transport": "openai-compat",
    "runType": "refactor_proposal"
  }
}
```

### Refactor Acceptance Rules

- `applyRefactorDraft` updates only:
  - `title`
  - `description`
  - `content`
  - `tags`
- `applyRefactorVariables` updates only:
  - `Prompt.variables`
- Both draft and variable acceptance reuse the existing prompt update flow, so they:
  - create a new `PromptVersion`
  - clear stale `Prompt.agentAnalysis`
  - set `needsReanalysis = true`
- `createModulesFromRefactor` only creates the selected module suggestions.
- The client never sends mutable proposal payloads back to the server for acceptance; it only sends `promptId`, `historyId`, and optional `moduleIndexes`.

## Benchmark Evaluator Output Schema

`BenchmarkRun.rawOutput` stores the raw MiniMax evaluator JSON, while normalized benchmark fields are broken out into scalar columns.

Expected evaluator JSON:

```json
{
  "overallScore": 84,
  "clarityScore": 86,
  "reusabilityScore": 80,
  "controllabilityScore": 85,
  "deploymentReadinessScore": 83,
  "summary": "This prompt is strong and close to production-ready.",
  "improvementSuggestions": [
    "Add stricter output formatting requirements.",
    "Parameterize learner level and daily time budget."
  ],
  "recommendedForProduction": true
}
```

### Benchmark Dimensions

- `clarity`
- `reusability`
- `controllability`
- `deploymentReadiness`
- `overallScore`

## XUI Integration

- `AnalysisPanel` renders the current `AgentAnalysisResult`.
- `TrajectoryTimeline` renders the latest available trajectory.
- Saved prompt surfaces now expose a mode switch:
  - `Analysis`
  - `Refactor`
- Saved prompt surfaces hydrate from persisted `AgentHistory`.
- Playground uses stateless in-memory MiniMax results.
- The public trace default is:
  - `thought` and `action` visible directly
  - `observation` preview visible directly
  - raw observation payload collapsed behind details
- `RefactorPanel` renders:
  - `summary`
  - draft-vs-current field diff
  - `cleanedPromptDraft`
  - `suggestedVariables`
  - `extractedModules`
  - the refactor trajectory
  - post-create quick add of newly created modules into an existing collection
- If no collection exists yet, the same refactor flow can open the collection form dialog and add the created modules immediately after creation.
- The collection creation dialog can be seeded from the refactor proposal:
  - title: cleaned draft title + `Toolkit`
  - description: refactor summary
  - type: `toolkit`
- `BenchmarkPanel` can receive the latest refactor-triggered `PromptEvolutionComparison` from the parent prompt detail surface and display it inline.
- `getLatestPromptEvolutionComparison(promptId, strategy)` is now read-only: it rebuilds the compare view after a refresh only if the necessary `BenchmarkRun` rows already exist, and it must not silently create new benchmark rows during ordinary page loads.
- The benchmark UI can switch between `baseline` and `previous_version` evolution strategies without changing the persistence model.

## Versioning & Evaluation Boundaries

- `Prompt` is the current working copy.
- `PromptVersion` is the immutable historical source of truth.
- `PromptVersion.isBaseline` marks the user-chosen benchmark baseline for one prompt.
- `BenchmarkRun` must always reference a specific `PromptVersion`.
- Restoring a historical version creates a new `PromptVersion`; it does not mutate the old snapshot.
- Saving or restoring does not move the baseline automatically.
- Benchmark data must never be stuffed into `AgentHistory.output`.

## Prompt Evolution Comparison

- Wrapper action: `runPromptEvolutionComparison(promptId, candidateVersionId, comparisonVersionId)`
- Purpose:
  - ensure both involved `PromptVersion` rows have benchmark runs
  - return a normalized delta summary for immediate UI feedback
- Comparison target policy:
  - use the baseline version if one exists
  - otherwise use the previous version
- Current UI surface:
  - `RefactorPanel`

## Current Next Step

The current agent and skill feature set is now considered milestone-complete for this product stage.

The active engineering priority is no longer feature expansion. It is:

- stabilize the current prompt and skill loops
- preserve clean seeded sample data
- keep smoke coverage green
- hold the current schema and action contracts steady while preparing deployment

The next milestone is not a new agent mode. It is **containerization and deployment hardening**.

That means the next significant implementation work should center on:

- production Docker packaging
- runtime health checks
- SQLite persistence in a containerized environment
- reverse proxy and VPS deployment guidance

## Skill Layer MVP

- `Skill` is now a lightweight capability shell, not a new prompt type.
- Skills reuse the existing persistence boundaries:
  - `Prompt` remains the working copy
  - `Collection` remains the reusable pack container
  - `BenchmarkRun` remains tied to prompt versions
- A skill currently adds:
  - `goal`
  - `entryPromptId`
  - optional `collectionId`
  - `recommendedModel`
  - `inputSchema`
  - `outputSchema`
  - `notes`
- Skills do not yet introduce:
  - multi-step execution graphs
  - tool-routing orchestration
  - team or marketplace semantics
- The current UI flow is:
  - create from a saved prompt
  - optionally attach a collection
  - inspect the latest benchmark of the entry prompt
  - maintain simple input/output contracts
- Skills now also expose a `run` surface:
  - merge user-provided input fields with entry prompt variable defaults
  - render a concrete prompt instance
  - run stateless MiniMax analysis on the rendered prompt
- Skill run state is now persisted through existing `Setting` storage:
  - `saveRecentSkillRunValues(skillId, values)`
  - `saveSkillRunPreset(skillId, name, values)`
  - `deleteSkillRunPreset(skillId, presetId)`
  - `saveSkillRunRecord(skillId, values, renderedPrompt, analysis)`
  - `getSkillRunContext(id)` hydrates both recent values and preset lists
- The same state bucket also stores recent run summaries so the runner can surface the latest stateless executions without adding a dedicated execution table.
- `getSkillById(id)` now surfaces recent run summaries too, so the skill detail page can show operational context without forcing the user into the run screen first.
- Recent run cards in the skill runner are now replayable:
  - reload the stored input values back into the runner form
  - save a stored run directly into the preset list without retyping values
  - rerun the stored rendered prompt immediately through stateless MiniMax analysis
- Skill detail recent-run cards can now deep-link into `/skills/[id]/run?run=<id>` so the runner hydrates the chosen run's inputs when it opens.
- Recent run cards on both the skill detail page and the runner can now copy the stored rendered prompt directly, which supports manual prompt reuse without entering the runner workflow.
- Skill detail now aggregates baseline, latest benchmark, and latest recent-run validation into a single capability-health summary so the Skill layer reads more like an operational dashboard than a static schema page.
- Skill run now surfaces the same capability-health context inline, so execution happens with visible awareness of baseline readiness, benchmark signal, and recent validation state.
- Skill list cards now consume a server-derived `health` summary from `getSkills()`, so capability readiness is visible before opening a specific skill.
- The skills index now treats that soft health state as a management primitive:
  - `ready` / `watch` / `setup` can be used as direct list filters
  - the list can be sorted by derived health priority or by recent updates
  - filtered empty states preserve the interpretation that the skill layer is an operational dashboard, not just a static catalog
- The skills index is now URL-synced:
  - `health=all|ready|watch|setup`
  - `sort=health|updated|production`
  so list state survives refresh, deep-linking, and browser back/forward navigation.
- `production` sort is computed from the existing health summary and prefers:
  - `ready` over `watch` over `setup`
  - benchmark recommendation
  - benchmark score
  - recent validation-run timestamp
  - prompt update recency
- The skills index now adds two more management cues on top of the same health summary:
  - overview cards that double as filter controls for `all / ready / watch / setup`
  - a priority queue that explains *why* a capability still needs attention (`needsBaseline`, `needsBenchmark`, `needsValidation`, `needsIteration`)
- The priority queue is now wired to direct remediation targets:
  - `needsBaseline` opens the entry prompt versions section
  - `needsBenchmark` opens the entry prompt benchmark section
  - `needsValidation` opens the skill runner
  - `needsIteration` opens the entry prompt agent section
- The current soft health contract is derived, not persisted, and is based on:
  - latest benchmark recommendation
  - baseline presence
  - most recent validation-run risk signal
- This run surface is intentionally lightweight:
  - no new execution table
  - no skill-specific benchmark model
  - no separate agent trajectory persistence
