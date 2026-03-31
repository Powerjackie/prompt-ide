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

### 3. Benchmark Evaluator Mode

- Server action: `runPromptBenchmark(promptId, promptVersionId?)`
- Persists:
  - `BenchmarkRun`
- Does not write:
  - `Prompt.agentAnalysis`
  - `AgentHistory`
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
- Saved prompt surfaces hydrate from persisted `AgentHistory`.
- Playground uses stateless in-memory MiniMax results.
- The public trace default is:
  - `thought` and `action` visible directly
  - `observation` preview visible directly
  - raw observation payload collapsed behind details

## Versioning & Evaluation Boundaries

- `Prompt` is the current working copy.
- `PromptVersion` is the immutable historical source of truth.
- `BenchmarkRun` must always reference a specific `PromptVersion`.
- Restoring a historical version creates a new `PromptVersion`; it does not mutate the old snapshot.
- Benchmark data must never be stuffed into `AgentHistory.output`.

## Current Next Step

The next agent-adjacent milestone is `Agent-Assisted Refactor`.

Expected outputs:

- extracted reusable modules
- suggested variable slots
- cleaned prompt draft

Persistence rule:

- exploratory refactor proposals can reuse `AgentHistory`
- only accepted changes should write back into `Module` or create new `PromptVersion` rows
