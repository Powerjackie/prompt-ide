# Prompt IDE Design System — “Lab Notebook”

> **Status:** v1 (fresh system)
> **Product:** Prompt IDE — a personal Prompt R&D workbench for a single developer. Mature, in maintenance mode.
> **Successor:** `prompt-agent` (warm cream + clay). Prompt IDE is **visually distinct** — calm, scholarly, paper-and-ink.

The existing app ships neo-brutalist (lime-green primary + Inter Tight uppercase titles + hard offset shadows). This system **replaces that entirely** with a Lab Notebook aesthetic inspired by Tufte, Stripe Press, and academic publishing: warm paper white, ink green-black text, verdigris (oxidized copper) accent, hairline rules, natural case, generous marginalia.

---

## Sources

- **Codebase:** `github.com/zackpower-bot/prompt-ide` (private, branch `master`). Read on demand via GitHub connector.
- **Key read references:** `src/app/globals.css`, `src/app/[locale]/page.tsx`, `src/components/layout/sidebar.tsx`, `src/components/layout/navigation-items.ts`, `src/components/prompts/prompt-card.tsx`, `src/components/ui/{button,badge,card,brutal-card}.tsx`, `messages/en.json`.
- **Stack (to respect):** Next.js 16 App Router (`src/app/[locale]/…`), React 19, Tailwind 4, shadcn/ui (`style: base-nova`, `iconLibrary: lucide`), `next-themes` for dark mode.

No design system or Figma was supplied — this system was derived from the codebase, message catalogue (product copy tone), and the brief's explicit visual direction.

---

## Product context

Prompt IDE is a **single-operator** workbench for writing, evaluating, refining, packaging, and reusing prompts. Local-first (SQLite), MiniMax-powered agent, private workspace behind a shared password. No teams, no marketplace, no workflow DAG. Current milestone focus: stability and credible self-hosting.

The 10 surfaces (locale-prefixed):

| Route | Purpose |
|---|---|
| `/` | Home — continue work, recent versions, fast access |
| `/login` | Password unlock |
| `/playground` | Stateless MiniMax analysis of pasted prompt text |
| `/prompts` | Library of saved prompts w/ filters |
| `/prompts/[id]` | Prompt detail (content, versions, analysis, benchmark) |
| `/editor`, `/editor/[id]` | Prompt authoring canvas + metadata + preview |
| `/modules` | Reusable roles / goals / constraints / formats |
| `/docs` | In-app documentation |
| `/admin` | Settings, agent controls, data recovery |

Primary loops:

- **Prompt evolution:** Refactor → Accept → Benchmark Compare → Decide → Package
- **Skill operations:** Define → Run → Observe → Manage

---

## Content fundamentals

**Voice.** Private workbench, not a product pitch. Confident, quiet, load-bearing. Writes to itself: the operator is the audience. Reads like lab-notebook running notes — present-tense, direct, no hedging, no enthusiasm. Never cheery, never salesy.

**Case.** Natural case everywhere. **Never uppercase**. Not eyebrows, not section headers, not buttons. (This is the primary break from the outgoing brutalist system.) Small-caps via `font-variant-caps: all-small-caps` is acceptable for eyebrow/metadata labels.

**Person.** Second-person for UI copy ("Open Playground", "Paste a prompt here to analyze"). Third-person declarative for status/descriptions ("This run is stateless: it does not write Prompt, AgentHistory, or benchmark data back into the workspace.").

**Emoji.** Never. Not in labels, not in empty states. No unicode decorations.

**Punctuation.** Periods at end of descriptive sentences. No exclamations. `/` is used as a structural separator ("Author / Test / Release", "Home + Playground + Library / Live"). Em dashes fine; Oxford comma observed.

**Tone markers from `messages/en.json`:**

- "Draft hard. Keep the good copy."
- "Build prompts. Stress them. Version the wins."
- "Keep the working surface clean."
- "Capture first, refine later"
- "Immutable snapshots created whenever this prompt is saved."
- "This run is stateless: it does not write … back into the workspace."
- Risk labels: "Low risk", "Medium risk", "High risk" — lowercase severity, not SHOUT.

**What NOT to write:** marketing fluff, onboarding celebrations, tour copy, "Welcome back!", empty-state jokes, "✨", gradients-of-adjectives, or anything that addresses a team. There is no team.

---

## Visual foundations

### Colors

| Token | Hex | Role |
|---|---|---|
| `--paper` | `#F4EFE3` | App background — warm paper, aged-manuscript tint |
| `--ivory` | `#FAF6EB` | Card/surface — raised "page" |
| `--paper-deep` | `#EDE6D3` | Recessed well, disabled fill |
| `--ink` | `#1A2C2A` | Text. **Never pure black.** Slight teal cast. |
| `--ink-muted` | `#5C6B68` | Secondary text |
| `--ink-soft` | `#8A9490` | Tertiary / folio / gutter marks |
| `--verdigris` | `#6B9080` | Accent — oxidized copper. Selected, primary button. |
| `--verdigris-deep` | `#547265` | Hover/pressed accent; link text |
| `--verdigris-wash` | `#E4ECE7` | Tint fill (selected row, code bg) |
| `--vermillion` | `#C44E2C` | Proofreading red. **Sparingly.** Destructive, error. |
| `--amber-rule` | `#B89868` | Archival amber — marginalia underline, link underline |
| `--rule-fine` | `#CDC8B8` | 1px hairline |
| `--rule-strong` | `#1A2C2A` | 2px ink, emphasis only |

**Never:** lime green, vivid/neon anything, Anthropic clay orange, cream + clay combinations (that's prompt-agent), bluish-purple gradients.

### Typography

- **Display / headings / prose:** Source Serif 4 (variable). Transitional serif, scholarly. Weights 400–600. Never 700+.
- **UI body:** IBM Plex Sans. Weights 400–600. Swiss engineering precision, pairs well with the serif.
- **Mono:** JetBrains Mono 400–600. Labels, metadata values, code, kbd.
- **All three loaded from Google Fonts** in `colors_and_type.css` (no self-hosted files). Flagged to user — if brand licenses require self-hosting, drop `.woff2` files into `fonts/`.

Rules:

- Natural case; no uppercase titles
- No heavy black weights — 600 is the ceiling
- Body sits at 15px (UI) / 17px (prose); line-height 1.55–1.7; 68ch measure for long-form
- Small-caps via `font-variant-caps: all-small-caps` replaces uppercase-tracked labels

### Backgrounds, texture, motion

- **No gradients**, no full-bleed imagery, no hand-drawn illustrations. The paper color *is* the texture.
- No background patterns. (If texture is ever added, it would be a very subtle paper grain SVG at 3% opacity — not shipping by default.)
- **Hover:** link text darkens to `--ink`; underline thickens from 1px to 1px verdigris. Buttons: fill darkens one step. No translate, no rotate, no shadow shift.
- **Press:** 1px inset shadow + slight color deepening. Never a translate offset.
- **Focus:** 2px `--verdigris` ring with 2px paper-colored gap (shadcn `--ring`).
- **Motion:** 120ms ease for color; 180ms ease-out for toggles/menus. **No GSAP timelines, no SplitText, no stagger waves.** Reveal = fade + 4px translate, max 240ms.

### Borders, shadows, radii

- **Hairline border:** 1px `--rule-fine` is the default. Emphasis borders are 2px `--ink`.
- **Shadows** are *extremely* subtle — `0 1px 0 rgba(26,44,42,0.06), 0 2px 4px rgba(26,44,42,0.04)`. Never offset-brutalist, never colored glow.
- **Corner radius:** 3–6px. Mostly square. Pills (`999px`) only for single-line chips and status dots.

### Density, layout, marginalia

- Tighter than Anthropic's product designs, looser than the outgoing brutalist system.
- Content column maxes at `~68ch`. Metadata and notes live in a 16–32px **marginalia gutter** to the right (or left, mirrored for RTL).
- Section separators are **hairline horizontal rules**, not color blocks.
- Cards feel like pages in a bound notebook — ivory fill, 1px hairline border, 5px radius, whisper of shadow. They are not "floating tiles"; they sit *in* the paper.
- Transparency/blur: **not used.** Glassmorphism is not the aesthetic.

### Imagery

- Warm, muted. If photographic imagery is ever introduced (it is not in scope for this product), treat with a 4–6% warm-paper tint overlay and desaturate 15–20%. Never cool, never high-contrast, never grain-heavy.

---

## Iconography

**Library:** [`lucide-react`](https://lucide.dev) — matching the app's `components.json` setting. 16px default in chrome; 14px inline with text; 20–24px for feature cards.

**Stroke:** 1.5 (Lucide default). In this system, weight it down to **1.25** so icons read as "fine-point ink" rather than marker. Set on the icon directly (`strokeWidth={1.25}`).

**Color:** icons inherit `currentColor`. Chrome icons use `--ink-muted`; active/selected use `--verdigris-deep`.

**SVGs from the repo:** only `public/file.svg`, `public/globe.svg`, `public/next.svg`, `public/vercel.svg`, `public/window.svg` exist — these are Next.js template defaults, **not brand assets**. Not copied in.

**Logo / mark:** no formal logo exists in the codebase. The sidebar uses a plain `Sparkles` Lucide icon in a 48×48 ink square. This system provides a new wordmark + monogram under `assets/`:
- `assets/logo-wordmark.svg` — Source Serif 4 "Prompt IDE" in ink + small verdigris `·` separator.
- `assets/logo-monogram.svg` — 48×48 ivory tile with a 2px ink rule, serif lowercase `p` in verdigris.

**Emoji:** never.

**Unicode as iconography:** a sparing set of typographic marks is permitted — `§` (section), `¶` (pilcrow), `†` (dagger, reference), `·` (middle dot separator). Rendered in the serif, ink-muted. These are for marginalia notation, not primary UI affordances.

---

## Index — what's in this folder

```
README.md                  ← this file
SKILL.md                   ← cross-compatible skill manifest
colors_and_type.css        ← ALL design tokens + semantic element styles
assets/                    ← logos, monogram
preview/                   ← Design System tab cards (HTML)
ui_kits/
  prompt-ide/              ← Lab Notebook recreation of the app
    README.md
    index.html             ← interactive click-thru
    *.jsx                  ← modular components
```

### UI kits

- **`ui_kits/prompt-ide/`** — recreates the core surfaces of Prompt IDE in Lab Notebook skin: sidebar, top-bar, home landing, prompt library, editor workspace, playground, and a login screen. Click-thru interactive demo in `index.html`.

### Preview cards (Design System tab)

Cards are split by group: **Type**, **Colors**, **Spacing**, **Components**, **Brand** — one concept per card, small and scannable.

---

## Caveats

- **Fonts are loaded from Google Fonts via `@import`.** If you need fully self-hosted files for the production Next.js app, drop `Source Serif 4`, `IBM Plex Sans`, `JetBrains Mono` `.woff2` files into `fonts/` and wire `next/font/local`. Flagged.
- **No logo existed in the source.** The wordmark + monogram in `assets/` are newly-proposed and should be reviewed.
- **No Figma or screenshots were provided.** UI kit compositions are faithful to the codebase structure (`navigation-items.ts`, `home/landing/*` copy keys, `prompt-card.tsx` shape) but surface-level cosmetic recreations — they replace the outgoing brutalist visuals entirely rather than mimicking them.
- The **dark mode** palette is a first pass ("library lamp" — deep ink-teal paper with warm ivory text). Worth a review in-context.
