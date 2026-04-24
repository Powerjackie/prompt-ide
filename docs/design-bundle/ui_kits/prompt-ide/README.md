# Prompt IDE — UI Kit

Lab Notebook-skinned recreation of Prompt IDE's core surfaces. Interactive click-thru in `index.html`.

## Surfaces included

- **Home** — hero ("Prompt Operations"), three-feature band, continue-work + recent-versions workbench, fast access
- **Prompts library** — filter rail + prompt cards grid (matches `prompt-card.tsx` shape)
- **Prompt editor** — metadata rail + canvas + live preview
- **Playground** — stateless analysis: input textarea + rendered result panel
- **Modules** — reusable block library
- **Login** — password unlock ("Vault Access")

## Chrome

- Sidebar: 64px icon rail, verdigris active-indicator, serif `p` monogram
- Top bar: breadcrumb + command search + theme toggle

## Stack

React 18 (via Babel standalone), inline JSX. Fonts from `../../colors_and_type.css`. Lucide icons drawn inline as small SVG primitives (no network fetch).

## Known caveats

- No real data — surfaces render with plausible sample content derived from `messages/en.json`.
- Dark-mode preview is baked into tokens but not exposed by the toggle here.
