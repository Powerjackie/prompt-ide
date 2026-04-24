# Changelog

## [0.2.0](https://github.com/zackpower-bot/prompt-ide/compare/prompt-ide-v0.1.0...prompt-ide-v0.2.0) (2026-04-24)


### Features

* add documentation system infrastructure with layout, sidebar, TOC, and placeholder pages ([71d55bb](https://github.com/zackpower-bot/prompt-ide/commit/71d55bb64ef957111acab34b09f85804da95ff5f))
* add source prompt import pipeline ([d96839e](https://github.com/zackpower-bot/prompt-ide/commit/d96839ea16ecf6d2bb675c0411170e907d447f76))
* add Tavily web search tool to agent ReAct loop ([17400e0](https://github.com/zackpower-bot/prompt-ide/commit/17400e0737ef2e22a966ca9d0b822578a7cf38ae))
* **design:** add lab notebook primitives ([0bf5b4a](https://github.com/zackpower-bot/prompt-ide/commit/0bf5b4a50ca6a5cc89948fe9ffd333a37f0032e8))
* **design:** apply lab notebook foundation tokens ([3f0e6ac](https://github.com/zackpower-bot/prompt-ide/commit/3f0e6ace9f21129a10a5cf1ef622a432503eb519))
* **design:** migrate library surfaces to lab notebook ([535dfdb](https://github.com/zackpower-bot/prompt-ide/commit/535dfdbdfff6143f95d12b46bff5ba19bb991e6b))
* **design:** migrate ops and editor surfaces to lab notebook ([6f7caf2](https://github.com/zackpower-bot/prompt-ide/commit/6f7caf249f10a7732b54003c1287875b478279dd))
* **design:** migrate shell to lab notebook frame ([617cb3c](https://github.com/zackpower-bot/prompt-ide/commit/617cb3cd19c14f921a35a3ed445afc1b7acf2af3))
* **design:** polish lab notebook entry routes ([20457b0](https://github.com/zackpower-bot/prompt-ide/commit/20457b0f740e7e89d33109d4d10470021493be96))
* fill all 20 docs pages with real content and polished zh/en copy ([afb6aa2](https://github.com/zackpower-bot/prompt-ide/commit/afb6aa23a3208e4f7cfe7b5427578a0cab6652a0))
* server-side search/filter + all tags on /prompts ([471a63b](https://github.com/zackpower-bot/prompt-ide/commit/471a63b5bb12714a0b7bf82a185372e38573c024))


### Bug Fixes

* **a11y:** raise lab notebook contrast ([d06d66c](https://github.com/zackpower-bot/prompt-ide/commit/d06d66c0d4b37dc763512cc625cee313326045f4))
* **ci:** pass --no-sandbox to Lighthouse Chromium ([bf12dd3](https://github.com/zackpower-bot/prompt-ide/commit/bf12dd352d6b909f7a44ebfeb561232fdcaa74d0))
* **ci:** use multi-line script for LHCI Chromium path resolution ([7d736a8](https://github.com/zackpower-bot/prompt-ide/commit/7d736a89830fe7bb516a180659acf67d73bb4bc7))
* cursor magnet stays visible when mouse leaves page ([0fc020a](https://github.com/zackpower-bot/prompt-ide/commit/0fc020a3b7adabb73ed1173328e76e8e08f90cdb))
* disable cursor magnet to eliminate persistent square artifacts ([722d2d9](https://github.com/zackpower-bot/prompt-ide/commit/722d2d9f0aec46a123f79fc36414de81bc5cf766))
* friendly network errors, empty password validation, localized 404, editor panel scroll ([d75a242](https://github.com/zackpower-bot/prompt-ide/commit/d75a2420491c2b017fc7939bc4dd56c01c6d0c1b))
* home page rendering + add module pagination ([9967926](https://github.com/zackpower-bot/prompt-ide/commit/99679260b8ef4ab126fe43c4cab56335e5bed738))
* home page rendering regression + cursor magnet visibility ([81d9371](https://github.com/zackpower-bot/prompt-ide/commit/81d93713401cc1e04bec227133f3422189db95de))
* reduce shadow sizes to prevent overflow clipping ([92d12b6](https://github.com/zackpower-bot/prompt-ide/commit/92d12b6dfe02a6ae1e2fc241cc58825f3b3c9471))
* **seed:** tolerate missing .env in CI ([9754aea](https://github.com/zackpower-bot/prompt-ide/commit/9754aea38f23a981e8ce3ed676bdd6352496fabc))
* shadow clipping + sidebar/topbar height alignment ([1647b17](https://github.com/zackpower-bot/prompt-ide/commit/1647b1797d673d38620ba6495ed3d49fb1f16fbf))


### Performance Improvements

* paginate prompts list and optimize home page data fetching ([1468f56](https://github.com/zackpower-bot/prompt-ide/commit/1468f5672be7f253d3228614d11a05f63adbc1d2))

## Changelog

All notable changes to this project will be documented in this file.

This repository uses release-please and Conventional Commits to manage release PRs, changelog updates, and GitHub Releases.
