# Bundle Transparency Baseline (Initiative Q)

- Generated at: 2026-04-11T11:26:48.784Z
- Source command: `npm run perf:bundle:transparency`
- Analyzer source: `.next/diagnostics/analyze`
- Summary JSON: `output/perf/bundle-transparency-summary.json`

## Retained Routes (Evidence Table)

| Route | Analyzer payload bytes | Analyzer chunk refs | NFT traced files | NFT traced bytes | Top traced package |
| --- | ---: | ---: | ---: | ---: | --- |
| /zh/editor | 369,447 B | 35 | 320 | 17.49 MiB | @libsql/win32-x64-msvc (8668.2 KiB) |
| /zh/admin | 335,306 B | 35 | 317 | 17.32 MiB | @libsql/win32-x64-msvc (8668.2 KiB) |
| /zh/prompts | 327,894 B | 34 | 316 | 17.28 MiB | @libsql/win32-x64-msvc (8668.2 KiB) |
| /zh/playground | 322,940 B | 31 | 316 | 17.26 MiB | @libsql/win32-x64-msvc (8668.2 KiB) |
| /zh/modules | 329,040 B | 34 | 315 | 17.25 MiB | @libsql/win32-x64-msvc (8668.2 KiB) |
| / (zh default route) | 294,544 B | 30 | 313 | 17.09 MiB | @libsql/win32-x64-msvc (8668.2 KiB) |
| /zh/docs | 288,700 B | 28 | 310 | 17.04 MiB | @libsql/win32-x64-msvc (8668.2 KiB) |

## Shared Traced Packages (Retained Routes, unique files)

| Package | Traced size |
| --- | ---: |
| @libsql/win32-x64-msvc | 8.47 MiB |
| @prisma/client | 4.69 MiB |
| next | 1.15 MiB |
| tr46 | 0.26 MiB |
| @libsql/hrana-client | 0.25 MiB |
| ws | 0.13 MiB |
| @libsql/client | 0.12 MiB |
| @prisma/client-runtime-utils | 0.07 MiB |
| react | 0.06 MiB |
| cross-fetch | 0.05 MiB |
| whatwg-url | 0.04 MiB |
| @libsql/core | 0.03 MiB |

## Retained Route Server Action Chains

- No retained-route server actions found in server-reference-manifest.

## Facts

- Bundle transparency entrypoint is now repeatable via npm scripts and produces both JSON + markdown evidence artifacts.
- Top retained route by NFT traced bytes is /zh/editor (17.49 MiB).
- Second retained route by NFT traced bytes is /zh/admin (17.32 MiB).
- Shared traced package weight across retained routes is currently dominated by @libsql/win32-x64-msvc (8.47 MiB).
- Retained route server action chains are now visible from server-reference-manifest for 0 retained routes.

## Hypotheses

- Routes with higher NFT traced bytes (/zh/editor, /zh/admin) should be the first targets in a follow-up optimization initiative.
- The current retained-route weight profile suggests shared runtime/data dependencies are a larger factor than one-off route UI code changes.
- For /zh/editor, server action chain breadth (no server actions) may be a contributor, but this still requires module-level split validation before refactoring.

## Blockers / Limitations

- Next experimental-analyze exposes [client-fs] virtual chunk references; they are retained as route evidence, but chunk byte sizing is derived from NFT traces instead of direct chunk-file mapping.

## Scope Guardrails

- This round adds bundle transparency only.
- It does not enable `experimental.optimizePackageImports`.
- It does not include route refactors, GSAP refactors, or database migration.
