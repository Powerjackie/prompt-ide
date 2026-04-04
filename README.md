# Prompt IDE

Prompt IDE is a private **Prompt R&D Workbench** for one operator. It is designed for writing, evaluating, refining, packaging, and reusing prompts with a stable local data layer and an integrated MiniMax-powered agent.

## Current Product Stage

This milestone is the first stable product stage. The app now covers:

- Prompt CRUD with localized app shell and shared-password auth roles
- Prompt version history with baseline selection and restore
- MiniMax analysis for saved prompts and the stateless playground
- MiniMax refactor proposals with apply-draft, apply-variables, and module creation
- Benchmark scorecards and evolution comparison
- Collections for packaging prompts and modules
- Skills as reusable capability shells with runner, presets, recent runs, and health management

Out of scope for this stage:

- public marketplace or gallery
- team collaboration, invitations, and per-user permissions
- multi-model orchestration
- workflow engine / DAG runtime

This milestone now includes a production-oriented Docker / Compose deployment path for a single self-hosted operator.

## Tech Stack

- Next.js 16.2.1
- React 19
- Prisma 7 with `@prisma/adapter-libsql`
- SQLite
- `next-intl`
- Tailwind CSS 4
- OpenAI SDK compatibility client for MiniMax

## Run Locally

Install dependencies:

```bash
npm install
```

Configure local environment:

```bash
cp .env.example .env
```

Then set at least:

- `ADMIN_PASSWORD`
- `MEMBER_PASSWORD` (optional, enables non-admin shared access without destructive asset permissions)
- `MINIMAX_API_KEY`
- `DATABASE_URL=file:./dev.db`

Start the app:

```bash
npm run dev
```

Open `http://localhost:3000`.

Local development intentionally uses **HTTP** because `next dev` is serving directly without a local TLS termination layer.

## Deploy With Docker

Prompt IDE now ships a minimal single-host deployment setup based on:

- `Dockerfile` multi-stage standalone build
- `compose.yaml` for the app container plus an on-demand schema sync service
- named-volume SQLite persistence mounted at `/app/data`
- `/api/health` readiness probe that checks Prisma + SQLite availability
- `deploy/backup.sh` and `deploy/restore.sh` for SQLite cold-backup and restore
- `deploy/update.sh` for the recommended server-side update flow

### Production Environment

Copy `.env.example` to `.env` on the server and set at least:

- `DATABASE_URL=file:/app/data/prompt-ide.db`
- `ADMIN_PASSWORD`
- `MEMBER_PASSWORD` (optional, keeps shared non-admin access enabled)
- `MINIMAX_API_KEY`
- `NODE_ENV=production`
- `HOSTNAME=0.0.0.0`
- `PORT=3000`
- `NEXT_TELEMETRY_DISABLED=1`

`NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` is required for production. It must be base64 encoded and decode to 16, 24, or 32 bytes.

### First Deploy

```bash
docker compose --profile ops build app schema
docker compose --profile ops run --rm schema
docker compose up -d --wait app
```

Image build only installs dependencies, generates the Prisma client, and builds the Next standalone bundle. Database schema sync remains an explicit deployment step through the `schema` service, not part of `docker build`. The `schema` service now runs `prisma migrate deploy`, so production rollout follows Prisma migration history instead of `db push`.

When the app sits behind Cloudflare and/or Nginx, `next.config.ts` now explicitly configures `serverActions.allowedOrigins` for the production host.

Baseline note: if an existing production SQLite database was originally created before Prisma Migrate history existed, the first rollout onto `migrate deploy` requires a one-time `prisma migrate resolve --applied 0_init` before normal deploys continue.

Then open `http://<server-host>:3000/zh/login`.

### Update Flow

The recommended update flow for this repo is server-side source checkout plus rebuild:

```bash
./deploy/update.sh
```

The script performs:

- `PROMPT_IDE_BACKUP_KIND=preupdate ./deploy/backup.sh`
- `git pull --ff-only`
- `docker compose --profile ops build app schema`
- `docker compose --profile ops run --rm schema` (`prisma migrate deploy`)
- `docker compose up -d --wait app`

### Backup And Restore

The default backup strategy for this deployment is:

- backup directory outside the repo: `/srv/prompt-ide-backups`
- daily cold backup at `03:30`
- keep the last 7 days of `daily-*` backups
- keep `preupdate-*` and `pre-restore-*` backups until you clean them up manually
- run the backup scripts as the same VPS operator that already manages Docker and can write `/srv/prompt-ide-backups`

Manual backup:

```bash
PROMPT_IDE_BACKUP_KIND=manual ./deploy/backup.sh
```

Daily backup via cron:

```cron
30 3 * * * cd /srv/prompt-ide && PROMPT_IDE_BACKUP_KIND=daily ./deploy/backup.sh >> /var/log/prompt-ide-backup.log 2>&1
```

Restore from a specific backup:

```bash
./deploy/restore.sh /srv/prompt-ide-backups/daily-YYYY-MM-DD-HHMMSS.db
```

`restore.sh` always creates a `pre-restore-*` rescue snapshot before it overwrites the active database. After a restore, verify:

- `curl http://127.0.0.1:<published-port>/api/health`
- admin login
- prompt list visibility
- one known prompt still exists
- creating and saving a temporary prompt still works

### Persistence And Scope

- SQLite data lives in the named volume declared by `compose.yaml`
- container health is driven by `/api/health`, which verifies both Prisma queryability and SQLite storage writability
- the deployment setup is intentionally single-host and single-volume
- reverse proxy / TLS is still handled outside this repo, but this deployment baseline has already been exercised successfully behind Nginx and Cloudflare
- this is a deployment baseline, not a clustered or multi-instance topology

## Database Commands

```bash
npm run db:migrate:dev
npm run db:migrate:deploy
npm run db:migrate:status
npm run db:push
npm run db:seed
npm run db:reset
```

- development schema changes should use `prisma migrate dev` via `npm run db:migrate:dev`
- production schema changes should use `prisma migrate deploy` via `npm run db:migrate:deploy`
- `npm run db:push` remains available for local temporary experiments only and is not the production path

`npm run db:reset` is the milestone baseline command. It force-resets SQLite and re-seeds a clean demo dataset with:

- prompts
- modules
- one collection
- one baseline prompt version
- one benchmark run
- one skill with runner presets and recent run state

## Quality Gates

Static validation:

```bash
npm run lint
npm run build
```

Browser smoke:

```bash
npm run smoke:browser
npm run smoke:browser:headed
```

The smoke script validates:

- login
- app shell and home
- prompt detail
- editor refactor
- playground analysis
- collections
- skills list / detail / run

## Architecture Snapshot

Persistence boundaries:

- `Prompt`: current working copy
- `PromptVersion`: immutable snapshots
- `BenchmarkRun`: evaluator scorecards
- `AgentHistory`: analysis and refactor traces
- `Collection`: reusable packs
- `Skill`: capability shell above a saved entry prompt
- `Setting`: app settings plus lightweight skill runner state

Primary loops:

- Prompt evolution: `Refactor -> Accept -> Benchmark Compare -> Decide -> Package`
- Skill operations: `Define -> Run -> Observe -> Manage`

## Milestone Notes

The repository now ships a first production-oriented deployment baseline:

- core product capabilities are implemented and locally validated
- the current focus is stability, regression safety, and credible self-hosting
- Docker / Compose assets now exist in-repo for a single-host VPS path
- reverse proxy / TLS and backup / restore are now covered by the current baseline
- off-host backup replication and host hardening remain infrastructure follow-up work
