#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

cd "${REPO_ROOT}"

if ! command -v docker >/dev/null 2>&1; then
  echo "docker is required but was not found in PATH." >&2
  exit 1
fi

if [[ ! -f ".env" ]]; then
  echo "Missing .env in ${REPO_ROOT}. The deployment environment must already be configured." >&2
  exit 1
fi

VOLUME_NAME="$(docker volume ls --format '{{.Name}}' | grep 'prompt-ide-data$' | head -n1 || true)"

if [[ -z "${VOLUME_NAME}" ]]; then
  echo "Could not find the prompt-ide data volume." >&2
  exit 1
fi

docker build -t prompt-ide-import:local --target builder .

docker run --rm \
  --env-file .env \
  -e DATABASE_URL=file:/app/data/prompt-ide.db \
  -v "${VOLUME_NAME}:/app/data" \
  prompt-ide-import:local \
  npx tsx scripts/import-source-prompts.ts "$@"
