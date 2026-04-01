# Milestone V1: Prompt R&D Workbench

## What This Stage Delivers

This milestone turns the project into a stable private prompt workbench with four connected loops:

1. **Prompt authoring**
2. **Prompt evolution**
3. **Capability packaging**
4. **Skill operations**

## Stable Core Capabilities

### Prompt authoring

- localized app shell
- cookie-based authentication
- prompt list, detail, and editor
- module library
- collections

### Prompt evolution

- immutable `PromptVersion` snapshots
- baseline version selection
- benchmark scorecards
- MiniMax analysis
- MiniMax refactor proposals
- accept draft / variables
- create reusable modules from refactor output
- refactor-triggered benchmark comparison

### Capability packaging

- collections as reusable packs
- modules and prompts as collection items
- refactor output can flow directly into a collection

### Skill operations

- skill definition from a saved prompt
- optional collection attachment
- input and output schema definitions
- skill run page with rendered prompt preview
- presets, recent values, and recent runs
- capability health summaries
- health-driven skills list filters, sorting, and priority queue

## What This Stage Explicitly Does Not Do

- public community feed
- marketplace or payments
- multi-model routing
- workflow DAG execution
- team permissions
- cloud deployment automation

## Operational Baseline

This milestone is considered healthy when the following pass:

- `npm run lint`
- `npm run build`
- `npm run smoke:browser`

The seeded development database must support:

- at least one prompt
- one collection
- one baseline version
- one benchmark
- one skill with runner state

## Architecture Snapshot

Persistence boundaries:

- `Prompt`: working copy
- `PromptVersion`: snapshot history
- `BenchmarkRun`: evaluation records
- `AgentHistory`: analysis and refactor traces
- `Collection`: reusable pack
- `Skill`: capability shell
- `Setting`: app settings and skill runner state

## Why This Milestone Matters

The project is no longer a prompt notebook. It is now a private system for:

- improving prompts iteratively
- validating changes before reuse
- packaging reusable assets
- turning strong prompts into reusable skills

## Next Milestone

The next milestone is **Docker containerization and VPS deployment**.

It will focus on:

- production Dockerfile
- SQLite volume persistence
- Nginx reverse proxy guidance
- health check endpoint
- deployment docs for a low-cost AMD64 Ubuntu VPS
