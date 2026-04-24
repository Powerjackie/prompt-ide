# Lab Notebook UI Migration — Codex Brief (v2)

**Mission**: Replace prompt-ide's neo-brutalist UI system entirely with the Lab Notebook design system from `docs/design-bundle/` and `docs/design-bundle-l2/`. End-to-end execution: all 7 phases, no mid-stop for human review between phases.

**Repo**: `C:\Users\G1942\Documents\GitHub\prompt-ide`
**Base SHA**: `bd047e2` (must verify with `git log` before starting)
**Issued by**: Opus, 2026-04-22

---

## 1. Required pre-reading (do not skip)

Read these IN ORDER before touching any source file:

1. `docs/design-bundle/MOTION_ADDITIONS.md` — 3 motion adds spec (page transition / card promote / verdigris ripple)
2. `docs/design-bundle/colors_and_type.css` — full Lab Notebook tokens (Layer 1)
3. `docs/design-bundle-l2/project/styles/tokens.css` — Layer 2 token confirmation (must match L1)
4. `docs/design-bundle-l2/project/shell/primitives.jsx` — Button / Card / Input / Eyebrow / Folio / StatusDot reference implementations
5. `docs/design-bundle-l2/project/routes/routes-core.jsx` — Home / Login / Playground / Modules / Docs / Admin mockups
6. `docs/design-bundle-l2/project/routes/routes-prompts.jsx` — Prompts list / detail / Editor mockups
7. `docs/design-bundle-l2/project/routes/routes-ops.jsx` — remaining ops mockups
8. `src/app/globals.css` — current brutalist tokens + 700-line route-specific CSS to delete
9. `.agent-memory/AI_PROJECT_STATE.md` — frozen contracts list (do not break silently)

---

## 2. Hard rules

### 2.1 NO new route-specific CSS classes
- `.home-*` / `.playground-*` / `.editor-*` / `.login-*` / `.gs-prompt-*` etc. — none of this pattern in the new system
- If a route needs a unique visual, **extract a new component primitive** in `src/components/ui/` matching `docs/design-bundle-l2/project/shell/primitives.jsx` patterns
- Only globals.css contents allowed: tokens (`:root` + `.dark`) + `@layer base` + `@theme inline` Tailwind mapping + minimal layout shell containers (`.app-shell*` family)

### 2.2 Preserve all logic
- Do not modify: server actions, hooks, route guards, state management, data fetching, i18n keys, accessibility labels, prisma schema/migrations, .env, `.agent-memory/` files
- Do not "fix" unrelated bugs

### 2.3 Brutalist legacy: NO overlay
- Lab Notebook's primitives bundle already provides: distinct hover/focus/active states + mono uppercase Eyebrow rhythm
- **Do not** reintroduce: brutalist hard-offset shadows / `translate(2px, 2px)` press-down hover / lime green / Inter Tight black uppercase / 2px sharp radii / 700-line route-specific CSS
- The Lab Notebook bundle is sufficient; do not "add brutalist crispness back" — that creates visual debt

### 2.4 Windows encoding
- After any Chinese-string edit: `Get-Content -Encoding UTF8 <file>` to verify

---

## 3. Signature motif policy (must enforce throughout)

prompt-ide must retain a strong product memory point. Three motifs are reserved:

| Motif | Token | Use cases |
|---|---|---|
| **Vermillion** | `#C44E2C` (`--vermillion`) | active route marker / primary CTA accent / version diff highlight / error states |
| **Verdigris** | `#6B9080` (`--verdigris`) | system status (production/inbox/draft dot) / module tag / surface marker / focus ring |
| **Folio** | mono 11px ink-soft tracking-[0.04em] | page-bottom marker per route (e.g. `Prompt Lab / v7 / Apr 24`) / version stamps |

Rules:
- Vermillion is for **action signals** — never for decoration / large fills / brand identity
- Verdigris is for **system states** — never for action calls
- Folio appears **once per route** at footer, format: `<route name> / <version-or-state> / <date>`

Don't blend motifs. If a primary CTA needs background, it's verdigris (not vermillion); vermillion is the underline / dot / micro-accent.

---

## 4. Typography corrections (override bundle defaults if needed)

### Hero H1 (Home, Login)
- Desktop: 40-52px / weight 600-650 / line-height 1.02-1.12
- Tablet: 34-42px
- Mobile: 30-36px
- **Never** `font-black` 900 (that's brutalist legacy)

### Section H2 (Three surfaces, Workbench, etc.)
- Desktop: 22-28px / weight 600 / line-height 1.18-1.25
- Mobile: 19-22px

### Card title H3
- 16-20px / weight 600 / line-height 1.2

### Body
- 13.5-15px / line-height 1.55-1.7

If the bundle's mockup uses smaller H1 (24-30px) for the home page, **upgrade to the desktop range above**. The bundle is a directional reference, not a pixel-perfect contract.

---

## 5. Phase plan (execute end-to-end, no human pause between)

Each phase = independent commit. Final 8-section report at the very end.

### P1 — Token foundation + fonts + 3 motion adds (1 commit)

- Replace `:root` block in `src/app/globals.css` with `docs/design-bundle/colors_and_type.css` `:root` content
- Replace `.dark` block similarly (Lab Notebook dark tokens — they exist in Layer 1 bundle)
- **Delete** all `--brutal-*` tokens (no consumers after this phase)
- Update `src/app/[locale]/layout.tsx` next/font config:
  - `Source_Serif_4` for `--font-serif`
  - `IBM_Plex_Sans` for `--font-sans` (replace existing Inter — NO, **keep `--font-sans` variable name** for `@theme inline` compatibility, just swap the underlying font import)
  - `JetBrains_Mono` for `--font-jetbrains-mono` (verify the existing variable name is preserved)
- Add 3 motion CSS additions per `docs/design-bundle/MOTION_ADDITIONS.md` — keyframes + transition tokens in globals.css
- Verify dev server starts + Login page renders with new tokens (no 500 / no white screen)

**Commit**:
```
feat(design): apply Lab Notebook tokens + fonts + 3 motion adds (P1)

Drop-in replacement of brutalist :root + .dark tokens with Lab Notebook
(paper #F4EFE3 / ink #1A2C2A / verdigris #6B9080 / vermillion #C44E2C).
Source Serif 4 + IBM Plex Sans + JetBrains Mono replace Inter Tight + Inter.

3 motion adds per docs/design-bundle/MOTION_ADDITIONS.md:
- Page transition (paper fade + 1px y, 200ms cubic-bezier)
- Card promote (hover -1px translateY + shadow upgrade)
- Vermillion ripple wait — actually verdigris ripple per spec, primary
  button press 300ms one-shot

Source bundle: docs/design-bundle/
```

### P1.5 — Extract component primitives (1 commit)

Translate `docs/design-bundle-l2/project/shell/primitives.jsx` into TypeScript React components in `src/components/ui/`:

Required new files:
- `src/components/ui/page-shell.tsx` — top-level route container with consistent padding/maxWidth
- `src/components/ui/page-header.tsx` — eyebrow + H1 + description + actions slot
- `src/components/ui/folio.tsx` — `Folio` and `FolioRow` (footer page-marker)
- `src/components/ui/surface-card.tsx` — Lab Notebook card base (with hover variants)
- `src/components/ui/status-dot.tsx` — production/inbox/archived/draft 4-state dot
- `src/components/ui/version-trail.tsx` — immutable cuts list pattern
- `src/components/ui/workbench-panel.tsx` — "continue work" panel
- `src/components/ui/action-link.tsx` — text + arrow CTA pattern
- `src/components/ui/eyebrow.tsx` — mono uppercase small label

Each must:
- Be TypeScript with proper props interface
- Use `cva` (class-variance-authority) for variants where bundle has multiple modes
- Reference Lab Notebook tokens via Tailwind `bg-card` / `text-foreground` etc. (NOT hex)
- Include JSDoc comment with motif policy reference if relevant (e.g. StatusDot uses verdigris by default, vermillion for "needs attention")

Existing shadcn/ui primitives in `src/components/ui/` (button.tsx, badge.tsx, etc.) — keep but verify they re-render correctly with new tokens. If hardcoded colors leak, fix them.

**Commit**:
```
feat(design): extract Lab Notebook primitive component layer (P1.5)

New TS primitives in src/components/ui/ derived from bundle's primitives.jsx:
PageShell / PageHeader / Folio / SurfaceCard / StatusDot / VersionTrail /
WorkbenchPanel / ActionLink / Eyebrow.

These become the route composition vocabulary, replacing the 700-line
route-specific CSS approach.

Source bundle: docs/design-bundle-l2/project/shell/primitives.jsx
```

### P2 — Shell layout + delete brutalist global CSS (1 commit)

- Update `src/components/layout/app-shell.tsx`, `top-bar.tsx`, `sidebar.tsx` to align with `docs/design-bundle-l2/project/routes/routes-core.jsx` shell sections (Eyebrow + Folio + hairline rules)
- Sidebar should remain `w-24` fixed-width (96px, current contract — frozen by P2-B), but visual style switches: paper background / hairline right border / mono nav labels with verdigris-wash active state / Folio footer
- TopBar gets eyebrow + serif page name + actions area (per HomeRoute PageHeader pattern)
- **Delete** from `src/app/globals.css`:
  - `.app-panel*` (all variants) — ~20 lines
  - `.page-header*` (all variants) — ~30 lines
  - `.brutal-*` utility classes — ~20 lines
  - `.metric-tile*` — ~15 lines
  - `.filter-shell` `.discovery-grid` `.chip-row` `.soft-divider` — ~15 lines
  - `.command-palette-*` — ~15 lines
  - Total deletion: ~100-150 lines
- **Keep** `.app-shell*` family (still load-bearing for the lg:h-[100dvh] grid)

**Commit**:
```
feat(design): apply Lab Notebook shell + delete brutalist globals (P2)

Shell migration: AppShell / TopBar / Sidebar adopt Lab Notebook chrome
(paper / hairlines / Folio markers / mono nav labels with verdigris-wash
active state).

Removes ~120 lines of brutalist-specific globals.css (.app-panel* /
.page-header* / .brutal-* / .metric-tile* / .filter-shell /
.command-palette-*). Keeps .app-shell* container family (still needed
for lg:h-[100dvh] grid contract from P2-B).

Source bundle: docs/design-bundle-l2/project/routes/routes-core.jsx
```

### P3a — Marketing routes (1 commit)

Files to update:
- `src/app/[locale]/page.tsx` (Home) → match `routes-core.jsx` HomeRoute
- `src/app/[locale]/login/page.tsx` → match LoginRoute
- `src/app/[locale]/docs/page.tsx` → match DocsRoute

For each:
- Use new `<PageShell>` / `<PageHeader>` / `<SurfaceCard>` etc. primitives, NOT inline JSX
- Three surfaces cards on Home: each card MUST end with explicit action verb + arrow:
  - Playground → "Open scratchpad →"
  - Library → "Browse library →"
  - Modules → "Manage modules →"
  - NOT vague "hint" text without a verb
- Meta strip on Home: keep content (Author/Test/Release / Playground+Library+Modules / Draft hard) but visual must be **light**: 11-13px / hairline border / low contrast — NOT 3 dashboard tiles
- Workbench section on Home: implement as "continue work" first-class feature using real recent prompt data (server action `getRecentPrompts` if exists, else placeholder data marked `// TODO real data`)
- Footer: every page ends with `<Folio>`

**Delete** from `src/app/globals.css`:
- `.home-*` family (~150 lines)
- `.login-*` / `.auth-shell` family (~80 lines)
- Login glass card / glow / dot-grid CSS (~60 lines)

**Commit**:
```
feat(design): apply Lab Notebook marketing routes (P3a)

Home / Login / Docs routes adopted Lab Notebook composition using
PageShell / PageHeader / SurfaceCard / Folio primitives.

Home: PageHeader + Meta strip + Three surfaces (each with explicit CTA
verb) + Workbench (Latest production drafts + Recent immutable cuts +
Fast access) + Folio footer.

Removes ~290 lines of brutalist-specific globals.css (.home-* / .login-* /
.auth-shell + glass card / glow / dot-grid).

Source bundle: docs/design-bundle-l2/project/routes/routes-core.jsx
```

### P3b — Workbench core (1 commit)

Files:
- `src/app/[locale]/playground/page.tsx` → match PlaygroundRoute (3-panel: Brief / Stage / Console)
- `src/app/[locale]/prompts/page.tsx` → match PromptsRoute (filter rail + list/card toggle + status pills)
- `src/app/[locale]/modules/page.tsx` → match ModulesRoute

For Playground:
- Use `<PageShell>` + 3-column grid (Brief left / Stage flex / Console right)
- Brief column shows: Eyebrow "scratchpad" + serif body explaining stateless analysis context
- Stage is the textarea + run controls
- Console shows analysis output with verdigris status dot when running
- StatusDot color: idle=ink-soft / running=verdigris / error=vermillion / complete=verdigris

For Prompts:
- Filter rail left (search + status chips + tag chips) using verdigris-wash for selected
- Main area: card grid OR list view (toggle)
- Each prompt card: Eyebrow eg "production" + serif title + mono timestamp + StatusDot
- Vermillion underline on hover (link visual cue)

For Modules:
- Module library grid + suggestions panel
- Each module card uses Eyebrow for category + serif title + body excerpt

**Delete** from globals.css:
- `.playground-*` family (~250 lines)
- `.gs-prompt-card` and prompts-related (~30 lines)
- All `gs-*` reduced-motion hidden/visible double-query (~70 lines) — handled by 3 motion adds + `prefers-reduced-motion` blanket disable

**Commit**:
```
feat(design): apply Lab Notebook workbench core routes (P3b)

Playground / Prompts / Modules routes adopted Lab Notebook composition.

Playground: 3-panel Brief / Stage / Console with verdigris status dot.
Prompts: filter rail + card/list toggle + StatusDot per prompt.
Modules: library grid + suggestions panel.

Removes ~350 lines of brutalist-specific globals.css (.playground-* /
.gs-prompt-card / gs-* reduced-motion double-query).

Source bundle: docs/design-bundle-l2/project/routes/routes-prompts.jsx
+ routes-core.jsx (Modules)
```

### P3c — Detail / Editor / Admin (1 commit)

Files:
- `src/app/[locale]/prompts/[id]/page.tsx` → match PromptDetailRoute (left meta rail + right content + version trail)
- `src/app/[locale]/editor/page.tsx` (new) + `editor/[id]/page.tsx` (existing) → match EditorRoute (`isNew` prop differentiates)
- `src/app/[locale]/admin/page.tsx` → match AdminRoute (settings sections + member denial state)

For PromptDetail:
- Use `<PageShell>` + grid `[1fr_2fr]` or similar
- Left rail: Eyebrow "metadata" + serif title + StatusDot + Folio "v7 / Apr 22" + tags as verdigris-wash chips
- Right area: serif markdown render (Source Serif 4 for prose, NOT IBM Plex)
- Version trail at bottom or right rail using `<VersionTrail>` primitive

For Editor:
- Two-column form (left form fields, right live preview) for `isNew=false`
- Single full-width form for `isNew=true`
- Vermillion underline on save action
- StatusDot beside save button reflects unsaved/saved/error state

For Admin:
- Settings sections as `<SurfaceCard>` rows
- Each setting: Eyebrow label + control + description
- Member denial: full-page card with serif notice + Folio explaining role required

By end of P3c, `src/app/globals.css` should be ~150-250 lines total (vs original 1000+):
- @theme inline mapping
- :root + .dark tokens
- @layer base
- @layer components (only `.app-shell*` family + 3 motion add helpers)
- Reduced motion blanket rules

**Commit**:
```
feat(design): apply Lab Notebook detail / editor / admin routes (P3c)

PromptDetail / Editor (new + existing) / Admin routes adopted Lab Notebook
composition with VersionTrail / Folio / SurfaceCard primitives.

PromptDetail: meta rail + serif markdown content + version trail.
Editor: 2-col form + live preview (isNew prop).
Admin: SurfaceCard sections + member denial state.

globals.css now down to ~200 lines (was 1000+) — only tokens + base +
.app-shell* container + 3 motion add helpers.

Source bundle: docs/design-bundle-l2/project/routes/routes-prompts.jsx
+ routes-ops.jsx (Admin)
```

### P0 — GSAP removal (1 commit, in parallel with above — recommend just before P3a)

Decision: **OPTION A — remove all GSAP architecture**.

Rationale: Lab Notebook brief explicitly forbids "Heavy GSAP-style motion language". The 3 motion adds in P1 (page transition + card promote + verdigris ripple) replace GSAP-driven animation with minimal CSS. Keeping GSAP creates dead code + import weight.

Deletions:
- `src/lib/gsap-config.ts` (entire file)
- `src/components/layout/cursor-magnet.tsx` (entire file — already disabled)
- `src/components/layout/global-marquee.tsx` (entire file)
- `src/components/layout/route-transition-overlay.tsx` (entire file — replaced by 3 motion adds page transition)
- All `useGSAP()` hooks in route page.tsx files (Home, Playground, Prompts, Login, etc.) — remove import + hook calls + scope refs
- `gsap` + `@gsap/react` from `package.json` dependencies
- Any GSAP-related code in `src/hooks/use-stagger-reveal.ts` etc. — delete if entire purpose is GSAP-only

Run `npm install` after package.json change.

Verify: build succeeds, no GSAP imports remain (`grep -r "from \"gsap\"\|from '@gsap" src/` returns empty).

**Commit**:
```
refactor(motion): remove brutalist GSAP architecture (Lab Notebook migration)

Removes: gsap-config / cursor-magnet / global-marquee /
route-transition-overlay / all useGSAP() route hooks / use-stagger-reveal.
Drops gsap + @gsap/react from package.json.

Replaced by: 3 minimal CSS motion adds (page transition / card promote /
verdigris ripple) per docs/design-bundle/MOTION_ADDITIONS.md.

Frozen contract impact: P5 Global Motion Layer ownership removed.
P3 Playground theater + P4 Prompts Flip motion removed (still functional,
just static). This is documented in the Lab Notebook migration brief
(docs/LAB_NOTEBOOK_MIGRATION_BRIEF.md) and accepted by Opus.
```

---

## 6. Per-route 10-item verification checklist

Apply to every route after its phase. Include results in 8-section report's "Verification" section.

| # | Check | Pass criterion |
|---|---|---|
| 1 | Uses `<PageShell>` | YES — no per-page custom outer container |
| 2 | Has clear page title | H1 present + correct size range (40-52 desktop, etc.) |
| 3 | Has `<Folio>` at footer | `<route> / <version-or-state> / <date>` format |
| 4 | CTA hierarchy clear | Primary (verdigris bg) / Secondary (ghost) / Text link (vermillion underline) all visually distinct |
| 5 | Status / version consistency | StatusDot uses correct verdigris/vermillion mapping; Folio mono format consistent |
| 6 | Serif/sans split correct | Headings + long-form prose = Source Serif 4; UI controls + labels = IBM Plex Sans |
| 7 | No color token misuse | Vermillion only on action signals; verdigris only on system states; no leaked hex / oklch |
| 8 | Hover/focus states complete | All interactive elements have visible hover + keyboard focus state |
| 9 | Mobile preserves hierarchy | Marginalia space gracefully collapses; key actions remain reachable |
| 10 | NO new route CSS | grep `globals.css` for `.<routename>-` — must be 0 hits |

Document each route's score (e.g. "10/10 ✓" or "8/10 — items 4 + 9 partial, see notes").

---

## 7. Three surfaces card requirement (Home specific)

The 3 cards on Home (Playground / Library / Modules) are the primary navigation. Each MUST have:

```
[Eyebrow strap]
[Serif title]
[Body excerpt, 13.5px ink-muted]
─── hairline ───
[hint text]                  [Action verb + →]
```

Action verbs (NOT optional, NOT just "Open"):
- Playground: "Open scratchpad →"
- Library: "Browse library →"
- Modules: "Manage modules →"

This makes them unambiguous click targets, not decorative previews.

---

## 8. Meta strip rules (Home specific)

```
Mode    │ Surface          │ Rule
Author → Test → Release    │ Playground / Library / Modules │ Draft hard. Keep the good copy.
```

Visual constraints:
- 11-13px text size
- Hairline `var(--rule-fine)` vertical separators (NOT solid borders)
- Background: `var(--paper)` or `var(--ivory)` — NOT card surface (would feel dashboard-y)
- Padding: 16-22px per cell
- Eyebrow label uses Eyebrow primitive

NOT allowed:
- Three separate `<SurfaceCard>` (would look like 3 dashboard tiles)
- Bold or larger headings on values
- Color accents (keep neutral)

---

## 9. Final 8-section report (delivered AFTER all phases complete)

1. **Completion summary**: 7 commit hashes (P1, P1.5, P2, P3a, P3b, P3c, P0) + total lines added/removed
2. **File change inventory**: per-phase grouped by globals.css / src/app / src/components / src/lib
3. **Key diff narrative**: per-phase 1-paragraph explanation of why (visual impact mapping)
4. **Verification evidence**: per-route 10-item checklist results table + DOM measurements + screenshots saved to `reports/lab-notebook-migration/`
5. **P2 reports** (issues found but deferred): list with explanation
6. **Risk register**: frozen contracts impacted (with explicit references to AI_PROJECT_STATE.md sections) + any retained-surface smoke regressions
7. **Memory writeback recommendations**: new feedback memories for Opus to add (e.g. "Lab Notebook migration retrospective", "GSAP removal lessons")
8. **Next steps**: post-migration cleanup items, optional P4 polish ideas

---

## 10. Execution mode

- **No mid-pause** between phases — run all 7 phases (P1, P1.5, P2, P3a, P3b, P3c, P0) end-to-end
- Each phase commits independently (so any single phase can be reverted if needed)
- Browser-test each phase: `npm run dev` → login → access affected routes → screenshot to `reports/lab-notebook-migration/p<N>-<route>.png`
- DOM measurement per route: viewport + key element heights/widths in JSON to `reports/lab-notebook-migration/p<N>-metrics.json`
- If a phase blocks (build fails, route 500s), STOP that phase, document, but **continue to next phase if possible** (e.g. P3b can proceed even if P3a Login has unresolved issue) — note in report
- All phases done → final 8-section report inline in the chat reply

---

## 11. Reminders

- Bundle in `docs/design-bundle/` and `docs/design-bundle-l2/` is **reference**, not directly importable — translate JSX patterns to TypeScript React with shadcn/ui conventions
- Existing shadcn/ui primitives stay (button.tsx etc.) — verify they render correctly with new tokens
- Do not commit screenshots / DOM-metrics JSON — gitignore `reports/` if not already
- Do not modify `docs/design-bundle*/` content
- Do not modify `.agent-memory/` files
- Do not modify `eslint.config.mjs` / `package.json` further (already adjusted in `bd047e2` for the bundle commit)
- Encoding discipline: any Chinese-string edits → `Get-Content -Encoding UTF8` verify

---

End of brief. Begin with `git log --oneline -3` to confirm base SHA `bd047e2`, then read pre-reading list, then execute P1 → P1.5 → P0 → P2 → P3a → P3b → P3c (P0 placement: just before P3a is recommended to clear GSAP imports before route page edits).
