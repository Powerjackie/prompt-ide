# AI Handover

## Project Identity

Self-Hosted Personal Prompt IDE.

The product is now explicitly positioned as a private prompt R&D workbench for an individual user, not a public prompt marketplace or social platform.

## Product Direction

- Focus: versioning, benchmarking, reuse, and iterative prompt improvement
- Not in scope: marketplace, public prompt gallery, social feed, payments, team permissions
- Current milestone status:
  - `PromptVersion` history is live
  - `BenchmarkRun` scorecards are live
  - `Collections` / prompt packs are live
  - Next stretch milestone is `Agent-Assisted Refactor`

## Tech Stack

- Next.js 16.2.1
- React 19
- Prisma 7
- SQLite via `@prisma/adapter-libsql`
- `next-intl`
- TypeScript
- Zustand for client-only UI state
- OpenAI SDK compatibility client for MiniMax

## Architecture Rules

1. All business data flows through Prisma-backed Next.js Server Actions.
2. `localStorage` is completely eradicated for business persistence.
3. Zustand is restricted to ephemeral UI state only.
4. The locale-aware app lives under `src/app/[locale]/`.
5. `zh` is the default locale and `en` is also supported.
6. Saved prompt analysis uses the MiniMax-backed ReAct agent in `src/agent/llm-agent.ts`.
7. The legacy rule-based analyzer has been fully removed.

### Persistence Boundaries

- `Prompt`: current working copy
- `PromptVersion`: immutable prompt snapshots
- `AgentHistory`: reasoning traces and serialized agent runs
- `BenchmarkRun`: MiniMax evaluator scorecards
- `Collection` + `CollectionItem`: reusable solution packs
- `Setting`: serialized app settings

### Write-Through Protocol

If you change schema, server action patterns, or agent contracts, you must update this file and `AGENT_DESIGN.md` in the same change.

## Security

The app is globally protected through cookie-based auth in `src/middleware.ts`.

### Mechanism

- Login page: `src/app/[locale]/login/page.tsx`
- Auth server action: `src/app/actions/auth.actions.ts`
- Guard: `src/middleware.ts`
- Secret source: `.env` `ADMIN_PASSWORD`

### Auth Flow

1. A user visits any protected route.
2. `src/middleware.ts` checks `auth_token` before handing off to `next-intl`.
3. `/login`, localized login routes, static assets, and API paths are exempt.
4. If the cookie is missing or invalid, the user is redirected to `/<locale>/login`.
5. `loginAction` compares the submitted password with `process.env.ADMIN_PASSWORD`.
6. On success it sets an HTTP-only `auth_token` cookie derived from `ADMIN_PASSWORD`.

## Database Schema Snapshot

The Prisma schema now defines eight models.

### `Prompt`

- Current editable working copy for a prompt
- JSON-string fields: `tags`, `variables`, `agentAnalysis`
- Relations:
  - one-to-many `versions`
  - one-to-many `benchmarkRuns`
  - one-to-many `agentHistory`
  - one-to-many `collectionItems`

### `PromptVersion`

- Immutable snapshot table created on every prompt save and restore
- Fields:
  - `promptId`
  - `versionNumber`
  - `changeSummary`
  - snapshot payload: `title`, `description`, `content`, `status`, `source`, `model`, `category`, `tags`, `notes`, `variables`
  - `createdAt`
- Unique key: `[promptId, versionNumber]`

### `Module`

- Reusable prompt building blocks
- JSON-string field: `tags`
- Relation: one-to-many `collectionItems`

### `BenchmarkRun`

- MiniMax evaluator output for one prompt version
- Fields:
  - `promptId`
  - `promptVersionId`
  - `evaluator`
  - `input`
  - `summary`
  - `overallScore`
  - `clarityScore`
  - `reusabilityScore`
  - `controllabilityScore`
  - `deploymentReadinessScore`
  - `improvementSuggestions`
  - `recommendedForProduction`
  - `rawOutput`
  - `createdAt`

### `Collection`

- Top-level reusable pack container
- Supported `type` values:
  - `workflow`
  - `toolkit`
  - `learning`

### `CollectionItem`

- Ordered membership table for collections
- Supports two item types:
  - `prompt`
  - `module`
- Stores `position` for stable list ordering

### `AgentHistory`

- Durable reasoning log for MiniMax runs
- Fields:
  - `promptId`
  - `type`
  - `input`
  - `output`
  - `trajectory`
  - `createdAt`
- Current MiniMax runs use `type: "react_trajectory"`

### `Setting`

- Key/value settings table
- `value` stores serialized JSON

## Major Data Flows

### Prompt Save -> Version Snapshot

Source files:

- `src/app/actions/prompt.actions.ts`
- `src/app/actions/prompt-version.actions.ts`
- `src/lib/prompt-version.ts`

Behavior:

1. `Prompt` is created or updated.
2. The snapshot payload is serialized.
3. A new `PromptVersion` row is created automatically.
4. If snapshot fields changed, stale `Prompt.agentAnalysis` is cleared and `needsReanalysis` is set to `true`.

### Prompt Restore -> New Current Working Copy

Source file:

- `src/app/actions/prompt-version.actions.ts`

Behavior:

1. A historical `PromptVersion` is selected.
2. `Prompt` is updated from that snapshot.
3. A fresh `PromptVersion` is created with summary `Restored from vN`.
4. Old analysis metadata is cleared so the restored prompt requires a new agent run.

### Saved Prompt Analysis

Source files:

- `src/agent/llm-agent.ts`
- `src/app/actions/agent.actions.ts`
- `src/app/actions/agent-history.actions.ts`

Behavior:

1. UI calls `runAgentAnalysis(content, promptId)`.
2. MiniMax executes the ReAct loop.
3. `Prompt.agentAnalysis` is updated.
4. `AgentHistory` receives `output` and `trajectory`.
5. UI updates immediately from the returned `analysis` and `trajectory`.

### Playground Analysis

Source file:

- `src/app/actions/agent.actions.ts`

Behavior:

1. UI calls `runStatelessAgentAnalysis(content)`.
2. MiniMax returns `analysis` and `trajectory`.
3. No `Prompt`, `PromptVersion`, `BenchmarkRun`, or `AgentHistory` rows are written.

### Benchmark Scorecard

Source files:

- `src/agent/llm-agent.ts`
- `src/app/actions/benchmark.actions.ts`

Behavior:

1. UI selects the latest saved `PromptVersion`.
2. `runPromptBenchmark(promptId, promptVersionId)` calls MiniMax as a dedicated evaluator.
3. Scores are persisted in `BenchmarkRun`.
4. Comparison uses `compareBenchmarkRuns(leftId, rightId)`.

### Collections / Packs

Source files:

- `src/app/actions/collection.actions.ts`
- `src/app/[locale]/collections/page.tsx`
- `src/app/[locale]/collections/[id]/page.tsx`

Behavior:

1. User creates a `Collection`.
2. User adds ordered `CollectionItem` rows for prompts or modules.
3. Collections become reusable personal solution packs.

## UI Wiring

### Prompt Detail

- `src/app/[locale]/prompts/[id]/page.tsx`
- Shows:
  - current prompt content
  - latest agent analysis
  - trajectory timeline
  - version history panel
  - benchmark scorecard panel

### Editor

- `src/components/editor/editor-layout.tsx`
- Saved prompts now expose a `Versions` tab with restore + diff support.

### Collections

- `src/app/[locale]/collections/page.tsx`
- `src/app/[locale]/collections/[id]/page.tsx`
- Sidebar and search dialog now include `Collections`.

## Important Code Locations

- Prisma client: `src/lib/prisma.ts`
- Prompt actions: `src/app/actions/prompt.actions.ts`
- Prompt version actions: `src/app/actions/prompt-version.actions.ts`
- Module actions: `src/app/actions/module.actions.ts`
- Benchmark actions: `src/app/actions/benchmark.actions.ts`
- Collection actions: `src/app/actions/collection.actions.ts`
- Agent history actions: `src/app/actions/agent-history.actions.ts`
- Agent actions: `src/app/actions/agent.actions.ts`
- MiniMax runtime: `src/agent/llm-agent.ts`
- Prompt snapshot helpers: `src/lib/prompt-version.ts`
- Prompt detail UI: `src/app/[locale]/prompts/[id]/page.tsx`
- Editor UI: `src/components/editor/editor-layout.tsx`
- Collections UI: `src/app/[locale]/collections/page.tsx`
- Collection detail UI: `src/app/[locale]/collections/[id]/page.tsx`

## Current Agent Status

- Saved prompts use persisted MiniMax ReAct analysis.
- Playground uses stateless MiniMax ReAct analysis.
- The only live tool in the ReAct loop is `search_prompt_modules`.
- Trajectories are rendered through:
  - `src/components/agent/analysis-panel.tsx`
  - `src/components/agent/trajectory-timeline.tsx`

## Next Milestone

The next implementation target is `Agent-Assisted Refactor`.

Expected direction:

1. analyze the current prompt and suggest reusable module extraction
2. suggest variable slots and parameterization improvements
3. generate a cleaned prompt draft
4. keep using `AgentHistory` for proposal traces
5. only persist changes when the user accepts them

## Guardrails For Future Agents

- Read the code before making architectural assumptions.
- Do not reintroduce `localStorage` for persisted app data.
- Do not move business data into Zustand.
- Do not overload `AgentHistory` with benchmark data.
- Keep `PromptVersion` immutable.
- Keep `BenchmarkRun` separate from `AgentHistory`.
- Keep Playground stateless.
- Update this file and `AGENT_DESIGN.md` whenever schema or agent contracts change.
