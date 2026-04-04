#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

BACKUP_DIR="${PROMPT_IDE_BACKUP_DIR:-/srv/prompt-ide-backups}"
DB_PATH="${PROMPT_IDE_SQLITE_PATH:-./data/prompt-ide.db}"

require_command() {
  local cmd="$1"
  if ! command -v "${cmd}" >/dev/null 2>&1; then
    echo "${cmd} is required but was not found in PATH." >&2
    exit 1
  fi
}

prepare_backup_dir() {
  if [[ "$(id -u)" -eq 0 ]]; then
    install -d -m 0750 -o 1000 -g 1000 "${BACKUP_DIR}"
  else
    mkdir -p "${BACKUP_DIR}"
  fi
}

resolve_db_path() {
  local direct_path="${REPO_ROOT}/${DB_PATH#./}"
  if [[ -f "${direct_path}" ]]; then
    printf '%s\n' "${direct_path}"
    return 0
  fi

  if command -v docker >/dev/null 2>&1; then
    local volume_name
    volume_name="$(
      docker volume ls --format '{{.Name}}'         | grep -E '(^|_)prompt-ide-data$'         | head -n 1         || true
    )"

    if [[ -n "${volume_name}" ]]; then
      local mountpoint
      mountpoint="$(docker volume inspect --format '{{ .Mountpoint }}' "${volume_name}")"
      local candidate="${mountpoint}/prompt-ide.db"
      if [[ -f "${candidate}" ]]; then
        printf '%s\n' "${candidate}"
        return 0
      fi
    fi
  fi

  return 1
}

require_command sqlite3

cd "${REPO_ROOT}"
prepare_backup_dir

SOURCE_DB="$(resolve_db_path || true)"

if [[ -z "${SOURCE_DB}" ]]; then
  echo "Could not locate the SQLite database. Checked ${REPO_ROOT}/${DB_PATH#./} and any Docker volume ending in prompt-ide-data." >&2
  exit 1
fi

STAMP="$(date +%Y%m%d-%H%M%S)"
TARGET_DB="${BACKUP_DIR}/prompt-ide-${STAMP}.db"

sqlite3 "${SOURCE_DB}" ".backup '${TARGET_DB}'"

echo "Created hot backup at ${TARGET_DB}"
