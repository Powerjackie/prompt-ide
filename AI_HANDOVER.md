# AI Handover

## Project Identity

Self-Hosted Personal Prompt IDE.

This application is a private prompt vault and asset library for capturing, editing, organizing, analyzing, and reusing prompts and reusable prompt modules.

## Tech Stack

- Next.js 16.2.1
- React 19
- Prisma 7
- SQLite via `@prisma/adapter-libsql`
- `next-intl`
- TypeScript
- Zustand for client-only UI state

## Architecture Rules

1. All business data flows through Prisma-backed Next.js Server Actions.
2. Prompts, Modules, Agent History, and Settings are persisted in SQLite.
3. `localStorage` is completely eradicated for data persistence.
4. Zustand is restricted to ephemeral UI state only.
5. The locale-aware app lives under `src/app/[locale]/`.
6. `zh` is the default locale and `en` is also supported.
7. The current prompt analysis engine is still rule-based and local to `src/agent/`.

### Persistence Rule

Do not reintroduce client-side persistence for prompts, modules, settings, or agent history.

Approved persistence layer:

- Prisma client in `src/lib/prisma.ts`
- Server Actions in `src/app/actions/*.ts`
- SQLite database configured through `.env` `DATABASE_URL`

Disallowed persistence pattern:

- `localStorage`
- Zustand `persist`
- client-side source-of-truth stores for business data

## Security

The app is protected globally through cookie-based auth in `src/middleware.ts`.

### Mechanism

- Login page: `src/app/[locale]/login/page.tsx`
- Auth server action: `src/app/actions/auth.actions.ts`
- Guard: `src/middleware.ts`
- Secret source: `.env` `ADMIN_PASSWORD`

### Auth Flow

1. A user visits any protected route.
2. `src/middleware.ts` checks for the `auth_token` cookie before handing off to `next-intl`.
3. `/login`, locale login routes, static assets, and API paths are exempt.
4. If the cookie is missing or invalid, the user is redirected to `/<locale>/login`.
5. The login form posts to `loginAction`.
6. `loginAction` compares the submitted password against `process.env.ADMIN_PASSWORD`.
7. On success, it sets `auth_token=authenticated` as an HTTP-only cookie with a 30 day lifetime and redirects to `/`.

### Security Notes

- The cookie is `httpOnly`.
- The cookie uses `sameSite: "lax"`.
- The cookie uses `secure` in production.
- There is no user database. This is intentionally a minimalist single-password vault gate.

## Database Schema Snapshot

The Prisma schema currently defines four models.

### `Prompt`

- `id`: `String`, primary key
- `title`: `String`
- `description`: `String`
- `content`: `String`
- `status`: `String` with app-level values `inbox | production | archived`
- `source`: `String`
- `model`: `String` with app-level values `universal | claude | gpt4 | gemini | deepseek`
- `category`: `String`
- `tags`: `String` storing a JSON string array
- `isFavorite`: `Boolean`
- `notes`: `String`
- `variables`: `String` storing a JSON array of variable metadata
- `agentAnalysis`: `String?` storing the serialized analysis result
- `lastAnalyzedAt`: `DateTime?`
- `agentVersion`: `String?`
- `needsReanalysis`: `Boolean`
- `lastUsedAt`: `DateTime?`
- `createdAt`: `DateTime`
- `updatedAt`: `DateTime`
- Relation: one-to-many with `AgentHistory`

### `Module`

- `id`: `String`, primary key
- `title`: `String`
- `type`: `String`
- `content`: `String`
- `tags`: `String` storing a JSON string array
- `createdAt`: `DateTime`
- `updatedAt`: `DateTime`

### `AgentHistory`

- `id`: `String`, primary key
- `promptId`: `String`
- `type`: `String` with current values such as `rule_analysis | react_trajectory | chat`
- `input`: `String`
- `output`: `String` storing serialized structured output
- `trajectory`: `String` storing a serialized JSON array
- `createdAt`: `DateTime`
- Relation: belongs to `Prompt` with cascade delete

### `Setting`

- `key`: `String`, primary key
- `value`: `String` storing serialized JSON

## Important Code Locations

- Prisma client: `src/lib/prisma.ts`
- Prompt actions: `src/app/actions/prompt.actions.ts`
- Module actions: `src/app/actions/module.actions.ts`
- Settings actions: `src/app/actions/settings.actions.ts`
- Agent history actions: `src/app/actions/agent-history.actions.ts`
- Auth action: `src/app/actions/auth.actions.ts`
- Middleware auth guard: `src/middleware.ts`
- Rule-based analyzer: `src/agent/analyzer.ts`
- Analyzer rules: `src/agent/rules/*`
- Locale routing: `src/i18n/routing.ts`
- Locale request config: `src/i18n/request.ts`

## Current State of Client State

Zustand stores in `src/stores/` are UI-only.

Current examples:

- prompt UI filters
- module filter state

They are not allowed to fetch, cache, or persist business records.

## Next Milestone

The immediate next task is upgrading `src/agent/analyzer.ts` from the current rule-based analyzer to an LLM-driven ReAct architecture.

### Required Direction

- Keep Prompt, Module, Setting, and AgentHistory persistence on Server Actions + Prisma.
- Preserve the existing `AgentHistory` model.
- Use the `AgentHistory.trajectory` field to store ReAct trajectories, step traces, or tool-thought/action history as structured JSON.
- Evolve the analyzer from deterministic local heuristics into a server-backed LLM analysis pipeline.
- Maintain compatibility with the editor UI and the existing analysis display where possible during the migration.

### Migration Intent

The current `src/agent/analyzer.ts` is the legacy implementation.

The next agent should:

1. move analysis execution to the server side where appropriate
2. define the LLM prompt contract and output schema
3. store generated trajectories in `AgentHistory.trajectory`
4. preserve versioning through `agentVersion`
5. keep `needsReanalysis` meaningful when analysis logic changes

## Operational Guardrails For Future Agents

- Read the code before making architectural assumptions.
- Do not reintroduce `localStorage` for persisted app data.
- Do not move business data into Zustand.
- Do not bypass the auth middleware for app pages.
- Prefer evolving the current schema and action layer instead of creating parallel persistence mechanisms.
