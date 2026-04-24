# Lab Notebook Post-Migration Verification — Codex Brief

**Mission**: Browser-verify all 8 routes after the Lab Notebook migration. Catch any visual regression / brutalist residual / Lab Notebook contract violation that file-level inspection missed.

**Repo**: `C:\Users\G1942\Documents\GitHub\prompt-ide`
**Base SHA**: `8578817` (must verify with `git log` before starting)
**Issued by**: Opus, 2026-04-22

---

## 1. Scope

Verify these **8 routes** at desktop (1440×900) AND mobile (375×812):

1. `/zh/login`
2. `/zh` (Home)
3. `/zh/playground`
4. `/zh/prompts`
5. `/zh/prompts/[id]` — pick the first available prompt id from DB
6. `/zh/editor` (new) AND `/zh/editor/[id]` (existing — same prompt id as above)
7. `/zh/modules`
8. `/zh/docs`
9. `/zh/admin`

(That's 9 distinct routes / 18 viewport-route combinations.)

---

## 2. Pre-flight

```bash
git log --oneline -1   # confirm 8578817 base
npm run dev            # start server (port 3000 expected)
```

For protected routes: **Login flow required**. Get password from `.env` (`ADMIN_PASSWORD` or `MEMBER_PASSWORD`). Use Playwright to fill login form, get `pa_auth` cookie, reuse cookie for all subsequent route navigations.

If `.env` is unavailable, STOP and report — do not invent a workaround.

---

## 3. Per-route 12-point checklist

For each route × viewport, capture:

```json
{
  "route": "/zh/playground",
  "viewport": "desktop",
  "checks": {
    "1_renders_no_500": true,                              // HTTP 200
    "2_no_console_errors_new": true,                       // console errors that are NEW since session start
    "3_h1_present": true,                                  // <h1> exists
    "4_h1_text": "Playground",                             // verbatim
    "5_h1_font_family": "Source Serif 4",                  // computed
    "6_h1_font_size_px": 48,                               // computed (must be in 30-52 range per Lab Notebook brief)
    "7_bg_color": "rgb(244, 239, 227)",                    // = #F4EFE3 paper
    "8_primary_color_used": "rgb(107, 144, 128)",          // verdigris #6B9080 or vermillion #C44E2C present
    "9_folio_present_at_footer": true,                     // <Folio> primitive used
    "10_no_brutalist_residual": true,                      // no .home-* / .playground-* / lime / Inter Tight uppercase / hard offset shadows
    "11_no_horizontal_overflow": true,                     // body.scrollWidth === clientWidth
    "12_bounded_scroll_works": true                        // page is fully reachable to bottom (scrollTop reaches scrollHeight - clientHeight)
  }
}
```

---

## 4. Brutalist residual detection

For each route, scan the rendered DOM for these red flags:

| Red flag | Detection method | If found |
|---|---|---|
| Lime color | `rgb(...145...)` in any computed style | Document with selector path |
| Inter Tight uppercase H1 | `text-transform: uppercase` on h1/h2 | Document |
| Hard offset shadow | `box-shadow: Npx Npx 0 0 ...` (NO blur) | Document |
| `.brutal-*` class | `[class*="brutal-"]` in DOM | Document |
| `.gs-*` reduced-motion class | `[class^="gs-"]` in DOM | Document |
| `--brutal-*` CSS var | computed `getPropertyValue('--brutal-border-w')` returns value | Document |

Any of these = regression.

---

## 5. Lab Notebook signature compliance

For each route, also verify these positive Lab Notebook signals:

| Signal | Check |
|---|---|
| Eyebrow uppercase mono labels | At least one element with `font-family: monospace` + `text-transform: uppercase` + small font-size (≤ 13px) |
| Hairline separators | At least one element with `border-color` matching `--rule-fine` (#CDC8B8) and `border-width: 1px` |
| Folio at page bottom | `<footer>` or last child contains element styled as Folio (mono small ink-soft) |
| Verdigris status indicator | Where applicable (Playground console, Prompts list status), verdigris color appears |
| No vivid color outside vermillion + verdigris | Scan for any element with `color` / `background-color` whose hue isn't ink/paper/cream/verdigris/vermillion family |

---

## 6. Cross-viewport (mobile) checks

Mobile-specific:
- Sidebar collapses to mobile sheet (or hidden)
- Top bar still has brand + key actions
- Marginalia space gracefully reduced (NOT broken layout)
- All CTAs reachable
- No horizontal scroll

---

## 7. Output

Save artifacts to `reports/lab-notebook-migration/post-merge-verify/`:

- `<route-slug>-desktop.png` — full-page screenshot
- `<route-slug>-mobile.png`
- `metrics.json` — single JSON file containing the per-route checklist results for ALL routes

If ANY route × viewport fails any checklist item, document in a `findings.md` file in same folder with:
- Route + viewport
- Failed check ID + name
- Screenshot annotation (or just link to PNG with description)
- Severity: P0 (blocks acceptance) / P1 (must fix before push) / P2 (defer to later)

---

## 8. Exit criteria

**ACCEPT migration if:**
- All 9 routes × 2 viewports = 18 combos render
- 0 P0 findings
- ≤ 3 P1 findings
- Brutalist residual scan returns 0 hits across all routes

**FLAG for follow-up if:**
- Any P0 finding (e.g. route 500s, navigation broken, primary action missing)
- Brutalist residual found anywhere
- 5+ P1 findings (suggests systemic issue)

---

## 9. Final report format

Inline 8-section report after artifacts saved:

1. **Summary**: routes verified / total, P0 count, P1 count, P2 count, accept/flag verdict
2. **Per-route results table**: route × viewport × pass/fail summary
3. **Brutalist residual scan results**: per route, hits found
4. **Lab Notebook signature compliance**: per route, signals present
5. **Findings list**: each finding with severity + repro + suggested fix
6. **Screenshot inventory**: list of PNG files saved
7. **Memory writeback recommendations**: any new patterns observed worth recording
8. **Next steps**: if accepted → commit screenshots? (NO — `reports/` is gitignored). If flagged → suggest patch dispatch.

---

## 10. Constraints

- Do not modify any source files (this is read-only verification)
- Do not commit anything (reports/ is gitignored)
- Do not modify `docs/design-bundle*/`
- Do not change git history
- If dev server fails to start, report and stop
- Do not run `npm install` or modify package.json
- Use existing test infrastructure if available (Playwright already configured)

End of brief. Start with `git log --oneline -1` to verify `8578817`, then `npm run dev`, then iterate the 9 routes.
