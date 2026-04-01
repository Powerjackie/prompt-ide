# Prompt IDE

Prompt IDE is a private **Prompt R&D Workbench** for one operator. It is designed for writing, evaluating, refining, packaging, and reusing prompts with a stable local data layer and an integrated MiniMax-powered agent.

## Current Product Stage

This milestone is the first stable product stage. The app now covers:

- Prompt CRUD with localized app shell and cookie-based auth
- Prompt version history with baseline selection and restore
- MiniMax analysis for saved prompts and the stateless playground
- MiniMax refactor proposals with apply-draft, apply-variables, and module creation
- Benchmark scorecards and evolution comparison
- Collections for packaging prompts and modules
- Skills as reusable capability shells with runner, presets, recent runs, and health management

Out of scope for this stage:

- public marketplace or gallery
- team collaboration and permissions
- multi-model orchestration
- workflow engine / DAG runtime

The next milestone is **Docker containerization and VPS deployment**.

## Tech Stack

- Next.js 16.2.1
- React 19
- Prisma 7 with `@prisma/adapter-libsql`
- SQLite
- `next-intl`
- Tailwind CSS 4
- OpenAI SDK compatibility client for MiniMax

## Run Locally

Install dependencies:

```bash
npm install
```

Configure local environment:

```bash
cp .env.example .env
```

Then set at least:

- `ADMIN_PASSWORD`
- `MINIMAX_API_KEY`
- `DATABASE_URL=file:./dev.db`

Start the app:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Database Commands

```bash
npm run db:push
npm run db:seed
npm run db:reset
```

`npm run db:reset` is the milestone baseline command. It force-resets SQLite and re-seeds a clean demo dataset with:

- prompts
- modules
- one collection
- one baseline prompt version
- one benchmark run
- one skill with runner presets and recent run state

## Quality Gates

Static validation:

```bash
npm run lint
npm run build
```

Browser smoke:

```bash
npm run smoke:browser
npm run smoke:browser:headed
```

The smoke script validates:

- login
- app shell and home
- prompt detail
- editor refactor
- playground analysis
- collections
- skills list / detail / run

## Architecture Snapshot

Persistence boundaries:

- `Prompt`: current working copy
- `PromptVersion`: immutable snapshots
- `BenchmarkRun`: evaluator scorecards
- `AgentHistory`: analysis and refactor traces
- `Collection`: reusable packs
- `Skill`: capability shell above a saved entry prompt
- `Setting`: app settings plus lightweight skill runner state

Primary loops:

- Prompt evolution: `Refactor -> Accept -> Benchmark Compare -> Decide -> Package`
- Skill operations: `Define -> Run -> Observe -> Manage`

For detailed architecture, read:

- [AI_HANDOVER.md](./AI_HANDOVER.md)
- [AGENT_DESIGN.md](./AGENT_DESIGN.md)

## Milestone Notes

This repository follows a write-through documentation rule:

- if schema changes, update handover docs
- if server action patterns change, update handover docs
- if agent or skill contracts change, update handover docs

Stale external memory is treated as a bug.
