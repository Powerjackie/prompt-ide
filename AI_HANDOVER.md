# AI Handover

## Project Identity

Self-Hosted Personal Prompt IDE.

The product is now explicitly positioned as a private prompt R&D workbench for an individual user, not a public prompt marketplace or social platform.

## Product Direction

- Focus: versioning, benchmarking, reuse, and iterative prompt improvement
- Not in scope: marketplace, public prompt gallery, social feed, payments, team permissions
- Current milestone status:
  - `PromptVersion` history is live
  - `PromptVersion` baseline selection is live
  - `BenchmarkRun` scorecards are live
  - `Collections` / prompt packs are live
  - `Agent-Assisted Refactor` is live for saved prompts
  - Refactor acceptance now auto-runs benchmark comparison against a baseline or previous version

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
- `AgentHistory`: reasoning traces and serialized agent runs, including refactor proposals
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
  - `isBaseline`
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
- Current MiniMax runs use:
  - `type: "react_trajectory"` for analysis
  - `type: "refactor_proposal"` for saved-prompt refactor proposals

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
5. Baseline selection is user-controlled and never moves automatically on save or restore.

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

### Saved Prompt Refactor

Source files:

- `src/agent/llm-agent.ts`
- `src/app/actions/agent.actions.ts`
- `src/app/actions/agent-history.actions.ts`

Behavior:

1. UI calls `runPromptRefactor(content, promptId)`.
2. MiniMax executes a module-aware ReAct refactor loop.
3. `AgentHistory` receives `type: "refactor_proposal"`, `output`, and `trajectory`.
4. The UI hydrates the latest refactor proposal from `AgentHistory`.
5. Applying draft or variables routes through existing prompt update actions, which creates a new `PromptVersion` and marks analysis as stale.
6. Creating modules from a refactor proposal writes new `Module` rows only for the selected suggestions.

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
3. Benchmark runs are de-duplicated per `PromptVersion` by default; reloading or re-opening the page should reuse the latest saved run instead of writing duplicates.
4. Scores are persisted in `BenchmarkRun`.
5. Comparison uses `compareBenchmarkRuns(leftId, rightId)`.

### Prompt Evolution Comparison

Source files:

- `src/app/actions/agent.actions.ts`
- `src/app/actions/benchmark.actions.ts`
- `src/components/agent/refactor-panel.tsx`
- `src/components/prompts/benchmark-panel.tsx`

Behavior:

1. User accepts a refactor draft or refactor variables.
2. The prompt update creates a new `PromptVersion`.
3. The server resolves the comparison target:
   - baseline version if one exists
   - otherwise the previous version
4. `runPromptEvolutionComparison(promptId, candidateVersionId, comparisonVersionId)` ensures both versions have benchmark runs.
5. The refactor UI shows the delta summary immediately after acceptance.
6. The refactor UI also shows a field-level draft diff against the current working copy before acceptance.
7. Prompt detail `BenchmarkPanel` can now surface the latest refactor-triggered evolution comparison directly.
8. `getLatestPromptEvolutionComparison(promptId, strategy)` is read-only on page load; it reconstructs the latest compare view only when both required benchmark runs already exist, so detail-page refreshes do not silently trigger new MiniMax benchmark writes.
9. `BenchmarkPanel` lets the user switch the evolution compare target between:
   - baseline version
   - previous version
   when those targets exist.

### Collections / Packs

Source files:

- `src/app/actions/collection.actions.ts`
- `src/app/[locale]/collections/page.tsx`
- `src/app/[locale]/collections/[id]/page.tsx`

Behavior:

1. User creates a `Collection`.
2. User adds ordered `CollectionItem` rows for prompts or modules.
3. Refactor-created modules can be bulk-added into an existing collection from `RefactorPanel`.
4. If no suitable collection exists yet, `RefactorPanel` can open the existing collection-creation dialog and immediately add the new modules after save.
5. The create-collection dialog can be prefilled from the refactor proposal summary and cleaned draft title.
6. Collections become reusable personal solution packs.

## UI Wiring

### Prompt Detail

- `src/app/[locale]/prompts/[id]/page.tsx`
- Shows:
  - current prompt content
  - latest agent analysis
  - latest saved refactor proposal
  - analysis/refactor mode switch
  - trajectory timeline
  - version history panel
  - benchmark scorecard panel
  - benchmark evolution summary when a refactor acceptance just produced one

### Editor

- `src/components/editor/editor-layout.tsx`
- Saved prompts now expose:
  - a `Versions` tab with restore + diff support
  - an Agent area with `Analysis` and `Refactor` modes
  - refactor acceptance that auto-runs benchmark comparison
  - refactor draft-vs-current diffing before acceptance

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
- Refactor types: `src/types/refactor.ts`
- Refactor UI: `src/components/agent/refactor-panel.tsx`
- Prompt snapshot helpers: `src/lib/prompt-version.ts`
- Prompt detail UI: `src/app/[locale]/prompts/[id]/page.tsx`
- Editor UI: `src/components/editor/editor-layout.tsx`
- Collections UI: `src/app/[locale]/collections/page.tsx`
- Collection detail UI: `src/app/[locale]/collections/[id]/page.tsx`

## Current Agent Status

- Saved prompts use persisted MiniMax ReAct analysis.
- Saved prompts also support persisted MiniMax refactor proposals.
- Saved prompts support explicit baseline versioning.
- Saved prompt refactor acceptance auto-compares the new version against a baseline or previous version.
- Saved prompt refactor now exposes a field-level draft diff before acceptance.
- Refactor-created modules can be added directly into existing collections from the refactor UI.
- Refactor-created modules can also be routed into a newly created collection without leaving the refactor workflow.
- Playground uses stateless MiniMax ReAct analysis.
- The only live tool in the ReAct loop is `search_prompt_modules`.
- Trajectories are rendered through:
  - `src/components/agent/analysis-panel.tsx`
  - `src/components/agent/trajectory-timeline.tsx`
- Refactor results are rendered through:
  - `src/components/agent/refactor-panel.tsx`

## Next Milestone

The core of `Prompt Evolution Loop v1` is now live:

1. `Refactor`
2. `Accept`
3. `Auto Benchmark Compare`
4. `Decide`
5. `Package` via existing collection quick add

The next logical implementation target is either:

1. `Prompt Evolution Loop v1.1`
   - persist evolution comparison context beyond the immediate refactor session if desired
   - improve collection creation defaults and naming heuristics directly from refactor output
2. `Skill Layer MVP`
   - add a lightweight capability layer above `Prompt` / `Module` / `Collection`

## Guardrails For Future Agents

- Read the code before making architectural assumptions.
- Do not reintroduce `localStorage` for persisted app data.
- Do not move business data into Zustand.
- Do not overload `AgentHistory` with benchmark data.
- Keep `PromptVersion` immutable.
- Keep `BenchmarkRun` separate from `AgentHistory`.
- Keep Playground stateless.
- Update this file and `AGENT_DESIGN.md` whenever schema or agent contracts change.

## Living Document Protocol

### Write-Through Rule (MANDATORY)
From this point forward, any agent operating on this codebase MUST follow this protocol:

**Any time you modify any of the following, you MUST autonomously update `AI_HANDOVER.md` and/or `AGENT_DESIGN.md` in the same commit:**

- Database schema changes (new tables, columns, indexes, migrations)
- New Server Action patterns or changes to existing ones
- Changes to the trajectory JSON structure
- New agent capabilities or workflow changes
- API endpoint additions or modifications

**The external memory (`AI_HANDOVER.md` / `AGENT_DESIGN.md`) must always reflect 100% of the actual codebase reality. Stale documentation is treated as a bug.**

### Git Commit Discipline (MANDATORY)
For meaningful project changes, agents should maintain intentional Git hygiene:

1. Stage only the files relevant to the current task
2. Create a clear commit message describing the change
3. If the task includes schema changes, server action changes, trajectory changes, or agent workflow changes, the commit message should explicitly mention the documentation update

**No undocumented architectural changes. No unrelated files in the same commit. Documentation and implementation must stay synchronized.**
