# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Build & Dev Commands

```bash
npm run dev      # Start dev server at http://localhost:3000
npm run build    # Production build (Turbopack)
npm run start    # Run production server
npm run lint     # ESLint
```

No test runner is configured. Verify changes via `npm run build`.

## Architecture

**Prompt IDE** is a Next.js 16 application for managing, analyzing, and organizing LLM prompts. Prompt data is persisted in **SQLite via Prisma 7** with server actions. Module and Settings stores still use localStorage (migration pending).

### Stack

- **Next.js 16** (App Router) + **React 19** — `params` is a Promise (must `await` in server components, `use()` in client)
- **Base-UI** (shadcn/ui v4 "base-nova" style) — NOT Radix. Uses `render` prop instead of `asChild` for component composition (e.g., `<AlertDialogTrigger render={<Button />}>`)
- **Prisma 7** with `@prisma/adapter-libsql` — schema in `prisma/schema.prisma`, generated client in `src/generated/prisma/`
- **Zustand 5** — UI-only stores only (`usePromptUIStore`, `useModuleUIStore`). **Zero `persist` middleware anywhere.** All business data in SQLite.
- **next-intl 4** — zh/en bilingual. Dictionaries in `messages/`. Locale routing via `src/app/[locale]/` + `src/middleware.ts`
- **TailwindCSS 4** — utility-first, CSS variables for theming via next-themes

### Database Commands

```bash
npm run db:push   # Push schema to SQLite
npm run db:seed   # Seed initial data (6 prompts + 4 modules)
npm run db:reset  # Force-reset DB + re-seed
```

### Key Directories

- `src/app/[locale]/` — All page routes (home, prompts, editor, inbox, modules, favorites, archive, tags, playground, settings)
- `src/app/actions/` — Server actions: `prompt.actions.ts`, `module.actions.ts`, `settings.actions.ts`, `agent-history.actions.ts`
- `src/stores/` — Zustand UI-only stores: `prompt-store.ts` (`usePromptUIStore`), `module-store.ts` (`useModuleUIStore`). No `settings-store.ts` (deleted).
- `src/hooks/use-prompts.ts` — Client-side hook that fetches prompts via `getPrompts()` server action
- `src/hooks/use-modules.ts` — Client-side hook that fetches modules via `getModules()` server action
- `src/lib/prisma.ts` — PrismaClient singleton with libsql adapter
- `src/agent/` — Client-side rules engine: classification, risk/PII detection, variable extraction, similarity matching, normalization
- `src/i18n/` — `routing.ts` (locales config), `navigation.ts` (locale-aware Link/useRouter/usePathname), `request.ts` (server message loader)
- `src/components/ui/` — shadcn-generated Base-UI primitives
- `src/components/layout/` — Sidebar, TopBar, SearchDialog, LocaleSwitcher
- `src/components/editor/` — Editor layout, metadata form, preview, module inserter
- `src/components/agent/` — Analysis panel (renders AgentAnalysisResult)
- `src/types/` — TypeScript interfaces for Prompt, Module, AgentAnalysisResult, Settings

### Data Flow

1. **Prompts**: Server actions in `src/app/actions/prompt.actions.ts` are the single source of truth, backed by Prisma/SQLite. Pages fetch via `usePrompts()` hook or direct `getPromptById()` calls. Mutations use `useTransition` for non-blocking UI.
2. **Modules**: Server actions in `src/app/actions/module.actions.ts`, fetched via `useModules()` hook. `useModuleUIStore` holds only `activeFilter` UI state.
3. **Settings**: Server actions in `src/app/actions/settings.actions.ts`. Stored as a single JSON blob in the `Setting` table under key `app-settings`. Settings page loads on mount via `getSettings()` and writes immediately on each change.
3. **Agent analysis** runs client-side via `analyzePrompt()` in `src/agent/analyzer.ts` — returns structured `AgentReason[]` and `AgentSummaryPart[]` (translation-key objects, not raw strings) for i18n. Results are saved to DB via `setPromptAnalysis()`.
4. **i18n** — all user-facing text uses `useTranslations()` hooks with namespace keys. Agent reasons use `key + params` objects translated at the UI layer.
5. **Serialization**: `tags`, `variables`, `agentAnalysis` are stored as JSON strings in SQLite, parsed in `deserializePrompt()`. Status and model fields use type casts (`as PromptStatus`, `as ModelType`).

### Critical Patterns

- **Server action responses**: All actions return `{ success: true, data } | { success: false, error }`. Always check `result.success` before accessing `result.data`.
- **Cache invalidation**: Mutations call `revalidatePath("/[locale]", "layout")` to bust Next.js cache.
- **Base-UI composition**: Use `render={<Component />}` prop, NOT Radix's `asChild`. Example: `<DropdownMenuTrigger render={<Button />}>`.
- **Select `onValueChange`**: Base-UI passes `string | null`. Always guard: `(v) => v && handler(v)`.
- **Navigation imports**: Use `@/i18n/navigation` for `Link`, `useRouter`, `usePathname` — NOT `next/link` or `next/navigation`. The i18n navigation wrappers handle locale prefixing.
- **Middleware location**: Must be at `src/middleware.ts` (not project root) because the app uses the `src/` directory.
- **Seed data**: `prisma/seed.ts` runs via `npm run db:seed`. Skips if DB already has data.
