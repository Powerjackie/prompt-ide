# Comprehensive Acceptance Baseline

**Initiative:** Post-Refactor Initiative S — Comprehensive Acceptance Signoff
**Date:** 2026-04-12
**Environment:** Local dev + production mode, Windows host, baseline port `3000`

---

## Scope

This document records the first unified project-level acceptance baseline for `prompt-ide`.

It does **not** replace individual initiative acceptance records. It establishes a single composited view of the project's current acceptance state after N–R.

---

## Environment Notes

- Baseline port: `3000` (project contract)
- Host-specific fallback: `5173` may be used on this Windows host when TCP exclusions block `3000`; this is **not** a project or CI contract change
- Dev mode: `next dev` via `npm run dev`
- Production mode: `next build && next start` (used by prod smoke and LHCI)
- Database: SQLite via Prisma; seeded via `npm run db:seed`

---

## Acceptance Matrix

### Layer 1 · Static / Build

| Check | Result | Notes |
|---|---|---|
| `npm run lint` | **PASS** | Zero ESLint errors |
| `npm run build` | **PASS** | Clean compile; NFT warning from `/api/health/route.ts` is pre-existing, non-blocking |
| `npm run test` (vitest) | **PASS** | 14/14 tests passed |

### Layer 2 · Functional Runtime

| Check | Result | Notes |
|---|---|---|
| Dev retained-surface smoke | **PASS** | 6/6 — admin routes, settings hydration, command palette, member denial, mobile, reduced-motion |
| Prod retained-surface smoke | **PASS** | 3/3 — admin routes + command palette, settings-backed contracts, member denial |
| Live route contract preserved | **PASS** | `/`, `/login`, `/playground`, `/prompts`, `/prompts/[id]`, `/editor`, `/editor/[id]`, `/modules`, `/docs`, `/admin` all reachable |
| Absent route contract preserved | **PASS** | `/settings`, `/skills/**`, `/collections`, `/archive`, `/favorites`, `/inbox`, `/tags` all intentionally absent |
| Admin/member role split | **PASS** | Member admin denial verified in both dev and prod smoke |
| Mobile / reduced-motion checks | **PASS** | Retained surfaces remain visible under both conditions |
| Settings hydration contracts | **PASS** | `/editor` new prompt hydrates `defaultModel`/`defaultStatus`; `/editor/[id]` preserves prompt-owned values |

### Layer 3 · Accessibility

| Check | Result | Notes |
|---|---|---|
| Automated a11y gate | **PASS** | 9/9 — `/zh`, `/zh/docs`, `/en/docs`, `/zh/admin`, `/zh/prompts`, `/zh/editor`, `/zh/playground`, command palette dialog, member denial page |
| Manual spot-check: heading hierarchy | **Requires human review** | Not agent-verifiable |
| Manual spot-check: focus order | **Requires human review** | Not agent-verifiable |
| Manual spot-check: keyboard reachability | **Requires human review** | Not agent-verifiable |
| Manual spot-check: dialog perceivability | **Requires human review** | Not agent-verifiable |
| Manual spot-check: route-change state | **Requires human review** | Not agent-verifiable |

> **Scope truth:** Automated baseline ≠ full WCAG certification. Manual review items above remain open for human spot-check. These are non-blocking for this initiative.

### Layer 4 · Performance

| Check | Result | Notes |
|---|---|---|
| Lighthouse CI baseline | **PASS** | 5 routes audited: `/`, `/zh/docs`, `/zh/admin`, `/zh/playground`, `/zh/prompts`; assertions passed |
| Field Web Vitals probe | **PASS** | 1/1 — metrics tracked on `window.__PROMPT_IDE_WEB_VITALS__`; outlet confirmed functional |

> **Scope truth:** LHCI baseline and Web Vitals outlet are evidence wiring, not external production observability. No optimization targets are implied.

### Layer 5 · Health / Security / Data

| Check | Result | Notes |
|---|---|---|
| `/api/health` response | **PASS** | HTTP 200 `{"ok":true,"database":{"ok":true},"storage":{"ok":true,"reason":"relative_database_url_skipped"}}` |
| Database / storage health | **PASS** | Prisma/SQLite healthy; `relative_database_url_skipped` is expected for local SQLite |
| Admin security boundary | **PASS** | `ensureAdmin()` guard verified via member denial smoke in dev + prod |
| Settings import/export guard | **PASS** | Admin export/import retained; member controls hidden (verified by smoke) |

> **Known non-blocking:** `/api/health` NFT trace warning in build output. Pre-existing, does not affect runtime health response.

---

## Uncovered Items

| Item | Reason | Blocking? |
|---|---|---|
| Manual a11y checklist (keyboard/focus/dialog/screen-reader) | Not agent-verifiable | No |
| `/api/health` NFT build warning | Pre-existing, non-runtime | No |
| Full WCAG certification | Out of scope; automated baseline is the accepted contract | No |
| External production observability | Out of scope; Web Vitals outlet is project-local | No |

---

## Non-Blocking Residuals

- NFT trace warning from `next.config.ts` → `/api/health/route.ts`: present since Initiative N, non-blocking, no regression
- Manual accessibility spot-checks: open for human review, not required for this automated baseline signoff
- `storage.reason: relative_database_url_skipped`: expected behavior for local SQLite config, not a health failure

---

## Conclusion

**Project-level accepted baseline: ACHIEVED**

All automated gates pass. No active implementation blocker. Manual accessibility items remain open for human spot-check but are not blocking. This baseline is the reference point for future initiative regressions.

```
current_stage = post-refactor-initiative-S-comprehensive-acceptance-signoff-accepted
current_blocker = post-refactor-no-active-blocker
```
