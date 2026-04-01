# CLAUDE.md

Repository guidance for agentic coding tools working in this project.

@AGENTS.md

## Product Identity

Prompt IDE is a **private Prompt R&D Workbench**. It is not a public prompt marketplace, content feed, or team collaboration product.

Current product focus:

- prompt authoring
- prompt versioning and baseline management
- benchmark evaluation
- MiniMax analysis and refactor
- collections / prompt packs
- skill shells and skill runner workflows

## Build and Validation

```bash
npm run dev
npm run build
npm run start
npm run lint
```

Browser smoke:

```bash
npm run smoke:browser
npm run smoke:browser:headed
```

Database:

```bash
npm run db:push
npm run db:seed
npm run db:reset
```

## Core Stack

- Next.js 16 (App Router)
- React 19
- Prisma 7 with `@prisma/adapter-libsql`
- SQLite
- `next-intl`
- Tailwind CSS 4
- OpenAI SDK compatibility client for MiniMax
- Zustand for client-only UI state

## Routing and Shell

- Localized app lives in `src/app/[locale]/`
- Route protection is enforced by `src/proxy.ts`
- Login page is `src/app/[locale]/login/page.tsx`
- Main shell uses a fixed sidebar + scrolling content pane pattern

## Persistence Boundaries

- `Prompt`: current editable working copy
- `PromptVersion`: immutable snapshots created on save/restore
- `BenchmarkRun`: prompt-version scorecards
- `AgentHistory`: saved analysis and refactor traces
- `Collection` and `CollectionItem`: reusable packs
- `Skill`: capability layer above a saved entry prompt
- `Setting`: serialized app settings and lightweight skill runner state

`localStorage` is not used for business persistence.

## Agent and Skill Runtime

- Main LLM runtime: `src/agent/llm-agent.ts`
- Saved prompt analysis: `runAgentAnalysis`
- Saved prompt refactor: `runPromptRefactor`
- Playground analysis: `runStatelessAgentAnalysis`
- Benchmark evaluator: `runPromptBenchmark`
- Skill runner uses stateless MiniMax analysis against a rendered entry prompt

## Important Actions

Primary server actions live in `src/app/actions/`:

- `prompt.actions.ts`
- `prompt-version.actions.ts`
- `benchmark.actions.ts`
- `agent.actions.ts`
- `collection.actions.ts`
- `skill.actions.ts`
- `settings.actions.ts`
- `auth.actions.ts`

All actions follow the standard response shape:

```ts
{ success: true, data } | { success: false, error }
```

## Current UX Model

- Home and list pages are discovery-first
- Prompt detail is mixed-layout, not a permanently long dual column
- Editor is a dual-column workspace with an internally scrolling tool rail
- Skills list is a health-driven management surface

## Milestone Status

This repository is currently in a **milestone closure** phase:

- major product capabilities are already implemented
- priority is stability, clean sample data, regression safety, and documentation sync
- next milestone is Docker containerization and VPS deployment

## Documentation Discipline

Read and keep synchronized:

- `AI_HANDOVER.md`
- `AGENT_DESIGN.md`

If schema, server action patterns, agent contracts, trajectory format, benchmark behavior, or skill behavior changes, update those files in the same change.
