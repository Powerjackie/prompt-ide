# Manual Accessibility Signoff

**Initiative:** Post-Refactor Initiative T — Manual Accessibility Signoff
**Date:** 2026-04-11
**Environment:** Local dev, Windows host, baseline port `3000`
**Tester:** Agent-assisted browser inspection (DOM/a11y-tree queries via Chrome extension)

---

## Scope

This document records manual accessibility spot-checks across all retained live routes.
It supplements the automated `@axe-core/playwright` gate from Initiative O with human-readable observations.

Retained routes tested:

- `/zh` — Home
- `/zh/docs` — Documentation
- `/zh/admin` — Admin Console (as member: denial page; as admin: full console)
- `/zh/prompts` — Prompts Library
- `/zh/editor` — Editor (new prompt)
- `/zh/playground` — Playground
- `/zh/modules` — Modules

---

## Method

Inspection was performed via browser JavaScript queries against live DOM:
- Heading hierarchy (`h1`–`h6`)
- Landmark regions (`main`, `nav`, `header`, `footer`, `[role="search"]`, etc.)
- Focusable element enumeration with tab-order index
- Accessible name computation for inputs, buttons, and custom widgets
- `aria-*` attribute completeness on interactive elements (switches, comboboxes, dialogs)
- CSS focus-visible behavior (outline suppression check)
- `lang` attribute correctness

---

## Cross-Route Findings

| Item | Observation | Status |
|---|---|---|
| Page `<title>` | Generic "Prompt IDE" on all routes; no per-route title differentiation | ✓ Fixed (Initiative U) |
| Skip navigation | No skip-to-main link on any route | ✓ Fixed (Initiative U) |
| Footer landmark | No `<footer>` on any route (consistent design decision) | Non-blocking |
| `lang` attribute | `lang="zh"` on all tested zh-locale pages | ✓ PASS |
| Focus ring | No global `outline: none` suppression detected; browser native `:focus-visible` in use | ✓ PASS |

---

## Per-Route Results

> **Note (Initiative U, 2026-04-11):** The tables below are the original Initiative T inspection record. Rows that were subsequently fixed by Initiative U show **✓ Fixed (Initiative U)** in the Result column.

### `/zh` — Home

| Check | Result | Notes |
|---|---|---|
| H1 | ✓ PASS | "提示词运营" |
| H2s | ✓ PASS | Multiple H2s present |
| Landmarks | ✓ PASS | nav / header / main present |
| Focusable elements | ✓ PASS | 13 elements in logical DOM order |
| Command palette dialog | ✓ PASS | `role="dialog"`, `aria-labelledby` → "命令面板" |
| `aria-modal` on dialog | ✓ Fixed (Initiative U) | Added `aria-modal="true"` to `CommandDialog`'s `DialogContent` in `command.tsx` |
| Nav link accessible names | ✓ PASS | `aria-label` on each nav anchor |

---

### `/zh/docs` — Documentation

| Check | Result | Notes |
|---|---|---|
| H1 | ✓ PASS | "使用文档" |
| H2s | ✓ PASS | Section headings present |
| Landmarks | ✓ PASS | nav / header / main present |

---

### `/zh/admin` — Admin Console (member denial)

| Check | Result | Notes |
|---|---|---|
| H1 | ✓ PASS | "访问受限" |
| Body text | ✓ PASS | Explains denial clearly |
| `ensureAdmin()` guard | ✓ PASS | Admin-only controls hidden; denial is visible and descriptive |

---

### `/zh/admin` — Admin Console (admin user)

| Check | Result | Notes |
|---|---|---|
| H1 | ✓ PASS | "管理控制台" |
| Landmarks | ✓ PASS | nav / header / main present |
| Switch controls (×5) | ✓ PASS | All have `aria-labelledby` → label element + `aria-checked` state |
| Number inputs (×2) | ✓ PASS | `<label for>` → `id` association: "置信度阈值", "相似度阈值" |
| Combobox controls (×7) | ✓ PASS | `<label for>` → `id` linkage for 主题, 默认视图, 默认模型, 默认状态, 提供方, 分析深度, 风险阈值 |
| Textarea (settings import) | ✓ PASS | `<label for="admin-import-text">导入设置 JSON</label>` |
| Section H2s within content | ✓ Fixed (Initiative U) | Settings intro `<div>` promoted to `<h2>` in `admin/page.tsx` |
| Focusable order | ✓ PASS | 32 interactive elements, logical top-to-bottom flow |

---

### `/zh/prompts` — Prompts Library

| Check | Result | Notes |
|---|---|---|
| H1 | ✓ PASS | "提示词" |
| H2 | ✓ PASS | "N 条提示词" count heading present |
| H3 per card | ✓ PASS | Prompt title as H3 in each card |
| Filter comboboxes | ✓ PASS | `aria-label` on 状态 / 模型 / 最近更新 controls |
| View toggle buttons | ✓ PASS | `aria-label="Card view"` / `aria-label="List view"` |
| Card action buttons | ✓ PASS | `aria-label="Reorder {title}"`, "Add to favorites", "Copy prompt" — all prompt-specific |
| Search input | ✓ Fixed (Initiative U) | `aria-label` added to search `<Input>` in `prompt-filters.tsx` |

---

### `/zh/editor` — Editor (new prompt)

| Check | Result | Notes |
|---|---|---|
| H1 | ✓ PASS | "新建提示词" |
| H2 hierarchy | ✓ PASS | "提示词元数据" / "提示词内容 *" / "工作台工具" / "命令面板" |
| title input | ✓ PASS | `<label for="title">标题 *</label>` |
| description input | ✓ PASS | `<label for="description">描述</label>` |
| model combobox | ✓ PASS | `<label for="editor-model">模型</label>` |
| status combobox | ✓ PASS | `<label for="editor-status">状态</label>` |
| category combobox | ✓ PASS | `<label for="editor-category">分类</label>` |
| source input | ✓ PASS | `<label for="source">来源</label>` |
| notes textarea | ✓ PASS | `<label for="notes">备注</label>` |
| Tags input | ✓ Fixed (Initiative U) | `id="tag-input"` added to input; `<Label htmlFor="tag-input">` added in `metadata-form.tsx` |
| Content textarea | ✓ Fixed (Initiative U) | `aria-label={t("canvasTitle")}` added to `<Textarea>` in `prompt-editor.tsx` |

---

### `/zh/playground` — Playground

| Check | Result | Notes |
|---|---|---|
| H1 | ✓ PASS | "PLAYGROUND" (all-caps design; underlying text is readable) |
| H2 | ✓ PASS | "控制台待命" |
| Landmarks | ✓ PASS | nav / header / main present |
| Sample prompt buttons | ✓ PASS | Button text includes name + description — descriptive for screen readers |
| "清空" / "分析" buttons | ✓ PASS | Clear text labels; disabled state conveyed via `disabled` attribute |
| Prompt textarea | ✓ Fixed (Initiative U) | `aria-label` ("提示词输入" / "Prompt input") added to `<Textarea>` in `playground/page.tsx` |

---

### `/zh/modules` — Modules

| Check | Result | Notes |
|---|---|---|
| H1 | ✓ PASS | "模块" |
| Landmarks | ✓ PASS | nav / header / main present |
| "新建模块" button | ✓ PASS | Descriptive text |
| "编辑" / "复制" / "删除" buttons | ✓ Fixed (Initiative U) | `aria-label="{action} {module.title}"` added to edit/copy/delete buttons in `modules/page.tsx` |

---

## Summary of Non-Blocking Findings

> **Initiative U (2026-04-11):** All 9 findings below were addressed. See "Fixed in Initiative U" column.

| # | Route(s) | Finding | Impact | Fix Applied (Initiative U) |
|---|---|---|---|---|
| 1 | All | Generic page title "Prompt IDE" on all routes | Low — no route differentiation for screen reader browser history | ✓ FIXED — per-route `metadata` / `document.title` added to all 6 page routes |
| 2 | All | No skip navigation link | Low — keyboard users must tab through nav on every page load | ✓ FIXED — `<a href="#main-content">` skip link added in `[locale]/layout.tsx`; `id="main-content"` added to `<main>` in `app-shell.tsx` |
| 3 | `/zh` | Command palette dialog missing `aria-modal="true"` | Low — Radix focus sentinels compensate; background not fully inert | ✓ FIXED — `aria-modal="true"` added to `CommandDialog`'s `DialogContent` in `command.tsx` |
| 4 | `/zh/admin` | No H2 section headings within settings sections | Low — heading-nav skips settings structure | ✓ FIXED — settings intro `div` promoted to `<h2>` in `admin/page.tsx` |
| 5 | `/zh/prompts` | Search input: placeholder-only accessible name | Low — placeholder disappears on input | ✓ FIXED — `aria-label={tc("search")}` added to search `<Input>` in `prompt-filters.tsx` |
| 6 | `/zh/editor` | Tags input: placeholder-only accessible name | Low | ✓ FIXED — `id="tag-input"` added to input; `<Label htmlFor="tag-input">` added in `metadata-form.tsx` |
| 7 | `/zh/editor` | Content textarea: no programmatic label | Low — placeholder is descriptive; H2 is nearby but not linked | ✓ FIXED — `aria-label={t("canvasTitle")}` added to `<Textarea>` in `prompt-editor.tsx` |
| 8 | `/zh/playground` | Prompt textarea: no programmatic label | Low | ✓ FIXED — `aria-label` ("提示词输入" / "Prompt input") added to `<Textarea>` in `playground/page.tsx` |
| 9 | `/zh/modules` | Action buttons lack per-module context | Low — buttons are clear in visual context only | ✓ FIXED — `aria-label="{action} {module.title}"` added to edit/copy/delete buttons in `modules/page.tsx` |

---

## Passed Items (No Action Required)

- All route H1s present and descriptive ✓
- All `lang="zh"` attributes correct ✓  
- All nav link `aria-label` values set ✓
- No global focus outline suppression ✓
- Admin switch controls fully labeled via `aria-labelledby` + `aria-checked` ✓
- Admin number inputs, comboboxes, and import textarea all have `<label for>` associations ✓
- Prompts page filter controls, view toggles, and card action buttons all have descriptive `aria-label` ✓
- Editor core form fields (title, description, model, status, category, source, notes) all have `<label for>` ✓
- Admin member denial page presents clear, descriptive rejection message ✓
- Command palette dialog has `role="dialog"` + `aria-labelledby` ✓

---

## Conclusion

**Manual accessibility signoff: COMPLETE** (Initiative T, 2026-04-11)

**Initiative U polish signoff: COMPLETE** (2026-04-11)

All 9 non-blocking findings from Initiative T have been addressed in Initiative U.
Automated accessibility gate (9/9 tests passing) and retained-surface smoke (6/6 tests passing) confirmed post-fix.
No blocking defects. No regressions to accepted contracts.

```
current_stage = post-refactor-initiative-U-accessibility-polish-accepted
current_blocker = post-refactor-no-active-blocker
```
