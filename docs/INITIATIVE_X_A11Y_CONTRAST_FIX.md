# Initiative X — Lab Notebook Accessibility Contrast Fix — Codex Brief

**Repo**: `C:\Users\G1942\Documents\GitHub\prompt-ide`
**Base SHA**: `7d736a8` (must verify with `git log` before starting)
**Push remote**: `zackpower-bot` (NOT `origin` — origin is read-only for this account, push will 403)
**Issued by**: Opus, 2026-04-24

---

## Recent context (don't re-discover)

The Lab Notebook migration commits (`3f0e6ac` → `8578817`) replaced the previous brutalist UI. Two CI infra bugs were just fixed on top:

- `9754aea` fix(seed): tolerate missing .env in CI
- `7d736a8` fix(ci): use multi-line script for LHCI Chromium path resolution

CI run `24883922932` on commit `7d736a8` shows:

- ✅ build / production smoke / lint all pass
- ❌ `Run accessibility gate on retained routes` — FAIL with 14 `color-contrast` violations across `zh home / zh docs / en docs / zh admin / zh prompts / zh editor / zh playground / member admin denial`

Sample violation selectors from the failed run log (use as starting point, no need to re-fetch):

`zh home` node selectors:

- `.bg-[var(--verdigris-wash)] > .lg:block.hidden`
- `.items-baseline > .folio`
- `.border-[var(--verdigris-deep)]`
- `.last:border-b-0.last:pb-0.pb-4:nth-child(1) > .folio`
- `.last:border-b-0.last:pb-0.pb-4:nth-child(2) > .folio`

Likely offending tokens (current values in `src/app/globals.css`):

| Token | Current | On bg | Estimated ratio | WCAG AA |
|---|---|---|---|---|
| `--ink-soft` | `#8a9490` | paper `#f4efe3` | ~2.85:1 | ❌ FAIL (need 4.5) |
| `--verdigris-deep` | `#547265` | verdigris-wash `#e4ece7` | ~3.8:1 | ❌ FAIL (need 4.5) |

`Folio` component (`src/components/ui/folio.tsx`) uses `.folio` class which has `color: var(--ink-soft)` at `globals.css:426`.

---

## WHY

Post-migration visual verification (separate dispatch, see `docs/POST_MIGRATION_VERIFICATION.md`) generated many P1 findings, but most are commander-brief false positives:

- Lab Notebook hairline shadows (`box-shadow: 0 1px 0 0 var(--rule-fine)`) misclassified as brutalist hard offset shadows
- Retained-surface smoke selectors `.home-*` / `.playground-*` / `.gs-*` are intentional compatibility (commit `8578817 test(design): preserve retained-surface selectors`), not visual residual
- Mobile H1 < 30px is responsive design, not regression

**Do NOT re-run that verification. Do NOT fix those false positives.**

The single real blocker is the a11y CI fail above. That is this initiative.

---

## GOAL

Make the automated accessibility gate (`npm run smoke:browser:a11y:ci`) pass on master, while preserving Lab Notebook visual identity (paper / ink / verdigris / vermillion).

Path of least change is preferred: bump tokens / Folio color, not redesign.

---

## SCOPE

**Allowed to modify**:

- `src/app/globals.css` (token values + `.folio` rule + dark mode equivalents)
- `src/components/ui/folio.tsx`, `eyebrow.tsx`, `status-dot.tsx` — minimal color/weight tweaks if needed
- Other primitive `ui/*` files only if necessary

**Forbidden**:

- Do NOT edit `docs/POST_MIGRATION_VERIFICATION.md`
- Do NOT delete `.home-*` / `.playground-*` / `.gs-*` compatibility selectors
- Do NOT do broad visual refactor / introduce new design system
- Do NOT modify `package.json` deps (a11y tooling already installed: `@axe-core/playwright`)
- Do NOT regress to brutalist (no lime / no Inter Tight uppercase / no hard offset shadows from old system)
- Do NOT amend existing commits `9754aea` / `7d736a8`

---

## HOW

1. Run `npm run smoke:browser:a11y:ci` locally to confirm and capture exact contrast ratios per selector. (Build first if needed: `npm run build`.)
2. For each failing selector, identify computed FG/BG and compute target color that hits ≥ 4.5:1 (normal text) or ≥ 3:1 (large/bold text).
3. Minimal token changes — recommended starting point (you may iterate):
   - `--ink-soft: #8a9490` → `#5e6a66` (≈ 5.3:1 on paper, distinct from `--ink-muted: #5c6b68`)
   - `--verdigris-deep: #547265` → `#3d5949` (≈ 6:1 on verdigris-wash, ≈ 8.5:1 on paper)
   - Dark mode equivalents in `:root.dark` block (around `globals.css:159-161`) — adjust to maintain contrast in dark theme too
4. Re-run a11y gate. Iterate until all violations cleared.
5. Run `npm run lint` + `npm run build` + `npm run smoke:browser:prod:ci` to confirm no regression.
6. Browser visual spot-check (use existing playwright infra or quick dev-server load). Minimum routes:
   - `/zh`
   - `/zh/playground`
   - `/zh/prompts`
   - `/zh/admin`
   Both desktop (1440×900) + mobile (375×812). Confirm Folio still reads as "soft" (just no longer whisper-thin) and verdigris accents still feel like verdigris (just deeper).

---

## VERIFICATION

**Level 1**:

- `npm run lint` PASS
- `npm run build` PASS

**Level 2**:

- `npm run smoke:browser:a11y:ci` PASS (zero color-contrast violations)
- `npm run smoke:browser:prod:ci` PASS (retained-surface smoke unbroken)

**Level 3**:

- contrast root cause fixed (verify with axe-core report)
- Lab Notebook visual identity preserved (Folio still small mono soft / verdigris still verdigris)
- retained selector compatibility preserved (grep `.home-` `.playground-` `.gs-` in src/ — must still exist)

**Level 4** (optional, if repo workflow tracks these):

- Update `AI_PROJECT_STATE` / `AI_HANDOVER` / `KG_FACTS` / `VISUAL_REFACTOR_PLAN` only if those files exist in this repo. If not, skip silently.
- mempalace sync if applicable
- kg seed if applicable

---

## COMMIT POLICY

- One commit per logical change (token bump = 1 commit; Folio component tweak = 1 commit if needed)
- DO NOT amend my existing commits `9754aea` / `7d736a8`
- Push to remote `zackpower-bot master` after all verification passes (`git push zackpower-bot master`)
- DO NOT push to `origin` — it will 403

---

## COMPLETION FORMAT

Return exactly this structure:

```
[P7-COMPLETION] Initiative X Lab Notebook Accessibility Contrast Fix

Files modified:
1. ...

Level 1:
- lint: PASS|FAIL
- build: PASS|FAIL

Level 2:
- accessibility gate: PASS|FAIL
- retained-surface smoke: PASS|FAIL

Level 3:
- contrast root cause fixed: PASS|FAIL
- Lab Notebook visual identity preserved: PASS|FAIL
- retained selector compatibility preserved: PASS|FAIL

Root cause summary:
- (one paragraph: which tokens, which contrast ratios before/after)

Notes / surprises:
- (any unexpected findings)

Risks / blockers:
- (anything that could block follow-up)

Final signoff judgment:
- ACCEPTED | NEEDS-FOLLOWUP
```

---

## HARD RULES (codified from prior memory feedback)

- If a dependency / config change feels needed for any reason, **STOP and ask before committing** (we just had a case of `next/font/google` being silently swapped — see `feedback_codex_unrequested_dependency_changes.md`).
- Bundle in `docs/design-bundle{,-l2}/` is reference, not directly importable — do not copy from it.
- For CJK comments / strings, write UTF-8 (Windows shell may corrupt — verify with file inspection after write).
- `"use server"` files: only `async function` exports allowed (next.js 16 catches this only at build).
- Tool observation step: business data lives in `step.content`, not `step.data`.

---

## Constraints

- Do not modify `docs/design-bundle*/`
- Do not change git history of existing commits
- If dev server / a11y gate fails to start, report and stop — do not invent workarounds
- Do not run `npm install` or modify `package.json` (deps already correct)

End of brief. Start with `git log --oneline -3` to verify base `7d736a8`, then proceed.
