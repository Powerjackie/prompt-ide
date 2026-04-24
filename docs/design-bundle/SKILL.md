# Prompt IDE Design System — Skill

Use this system when designing for the `prompt-ide` codebase (private repo `zackpower-bot/prompt-ide`, branch `master`). It is a **Lab Notebook** aesthetic — warm paper, ink green-black, verdigris accent — replacing the former neo-brutalist skin. It is **distinct from `prompt-agent`** (which uses warm cream + clay); do not blend them.

## Non-negotiables

- **Never uppercase.** Titles, eyebrows, buttons — all natural case. Small-caps (`font-variant-caps: all-small-caps`) is the correct replacement for small labels.
- **Never pure black.** Text is `#1A2C2A` (`--ink`, green-black).
- **Never lime green, neon, or gradients.** The only accent is verdigris `#6B9080`.
- **Never emoji.**
- **Never brutalist offset shadows** (`4px 4px 0 0 …`). Shadows are whisper-subtle, ink-tinted.
- **Never scale/rotate on hover.** Motion is color and 1–4px translate only, ≤200ms.

## Always

- Source Serif 4 for headings + prose. IBM Plex Sans for UI. JetBrains Mono for code, metadata, labels.
- Hairline 1px `--rule-fine` separators over colored dividers or boxes.
- 5px corner radius by default; 3px for chips; nothing pill-shaped unless single-line status.
- Cards = ivory page on paper, 1px hairline, whisper shadow.
- Content measure ~68ch; marginalia gutter 16–32px for metadata/version/folio.
- Lucide icons at 1.25 stroke, 16px default.

## Voice

Private workbench, single operator. Clipped, declarative, unshowy. Imperatives and noun phrases: _"Draft hard. Keep the good copy."_ / _"Ready to analyze"_ / _"Baseline version updated"_. Domain terms used specifically: prompt, module, version, baseline, benchmark, trajectory, variable.

## Files to reference

- `colors_and_type.css` — all tokens + semantic element styles (headings, prose, code, hr, etc). Import this in any HTML you create.
- `README.md` — full system reference.
- `ui_kits/prompt-ide/index.html` — canonical app shell (sidebar + top bar + screen router). Reuse `Sidebar`, `TopBar`, `PageHeader`, `Card`, `Button`, `Eyebrow`, `StatusDot`, `Tag`, `Folio` primitives.
- `preview/` — per-concept cards for quick reference.
- `assets/logo-wordmark.svg`, `assets/logo-monogram.svg` — brand marks.

## Product context snapshot

Next.js 16 (App Router, `src/app/[locale]/…`), React 19, Tailwind 4, shadcn/ui (`style: base-nova`, `iconLibrary: lucide`), `next-themes` for dark mode. Single-operator local-first workbench: `/`, `/login`, `/playground`, `/prompts`, `/prompts/[id]`, `/editor`, `/editor/[id]`, `/modules`, `/docs`, `/admin`.
