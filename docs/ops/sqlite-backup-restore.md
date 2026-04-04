# SQLite Backup And Restore

This runbook is for the single-host Prompt IDE deployment.

It avoids reading `.env` and focuses only on the SQLite file and Docker runtime already used on the VPS.

## Hot Backup

Run a manual hot backup from the repo root:

```bash
./scripts/ops/backup-sqlite.sh
```

By default the script writes timestamped backups to:

```text
/srv/prompt-ide-backups
```

The script first looks for the database at:

```text
./data/prompt-ide.db
```

If that file is not present, it falls back to the Docker named volume currently used by the live VPS deployment.

Example output:

```text
Created hot backup at /srv/prompt-ide-backups/prompt-ide-YYYYMMDD-HHMMSS.db
```

## Cron Job Setup

Example daily cron entry:

```cron
30 3 * * * cd /srv/prompt-ide && ./scripts/ops/backup-sqlite.sh >> /var/log/prompt-ide-sqlite-backup.log 2>&1
```

This creates one timestamped SQLite hot backup per day in `/srv/prompt-ide-backups`.

## Disaster Recovery (Critical)

When you need to restore a backup manually:

1. Stop the app container:

```bash
cd /srv/prompt-ide
docker compose stop app
```

2. Locate the live database file.

If you are using a bind-mounted host path, the file should be:

```text
./data/prompt-ide.db
```

If you are using the current VPS deployment with a Docker named volume:

```bash
docker volume ls | grep prompt-ide-data
docker volume inspect <volume_name>
```

Then use the reported mountpoint and target:

```text
<mountpoint>/prompt-ide.db
```

3. Replace the live database file with the backup you want to restore:

```bash
cp /srv/prompt-ide-backups/prompt-ide-YYYYMMDD-HHMMSS.db <live_db_path>
```

4. Fix ownership if necessary so the runtime container can still write the file.

The current Prompt IDE container runs as the `node` user, so the common fix is:

```bash
chown 1000:1000 <live_db_path>
```

5. Bring the app back up:

```bash
cd /srv/prompt-ide
docker compose up -d --wait app
```

6. Verify health immediately:

```bash
curl -fsS http://127.0.0.1:3403/api/health
docker compose ps
```

Only treat the restore as complete after the health endpoint returns `ok: true` and the app container is `healthy`.
