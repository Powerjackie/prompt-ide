#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

BACKUP_DIR="${PROMPT_IDE_BACKUP_DIR:-/srv/prompt-ide-backups}"
APP_SERVICE="app"
SCHEMA_SERVICE="schema"
DB_PATH="/app/data/prompt-ide.db"

cd "${REPO_ROOT}"

usage() {
  echo "Usage: ./deploy/restore.sh /srv/prompt-ide-backups/<backup-file>.db" >&2
}

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

resolve_backup_file() {
  local input_path="$1"
  if [[ "${input_path}" = /* ]]; then
    printf '%s\n' "${input_path}"
  else
    printf '%s\n' "$(cd "$(dirname "${input_path}")" && pwd)/$(basename "${input_path}")"
  fi
}

resolve_app_port() {
  local port_line
  port_line="$(docker compose port "${APP_SERVICE}" 3000 2>/dev/null | tail -n 1 || true)"
  if [[ -z "${port_line}" ]]; then
    return 1
  fi

  printf '%s\n' "${port_line##*:}"
}

require_command docker
require_command curl

if ! docker compose version >/dev/null 2>&1; then
  echo "docker compose plugin is required but was not found." >&2
  exit 1
fi

if [[ ! -f ".env" ]]; then
  echo "Missing .env in ${REPO_ROOT}. The deployment environment must already be configured." >&2
  exit 1
fi

if [[ $# -ne 1 ]]; then
  usage
  exit 1
fi

BACKUP_FILE="$(resolve_backup_file "$1")"

if [[ ! -f "${BACKUP_FILE}" ]]; then
  echo "Backup file not found: ${BACKUP_FILE}" >&2
  exit 1
fi

prepare_backup_dir

docker compose stop "${APP_SERVICE}"

STAMP="$(date +%F-%H%M%S)"
RESCUE_NAME="pre-restore-${STAMP}.db"
RESTORE_SOURCE_DIR="$(dirname "${BACKUP_FILE}")"
RESTORE_SOURCE_NAME="$(basename "${BACKUP_FILE}")"

docker compose run --rm --no-deps \
  -v "${BACKUP_DIR}:/backup" \
  "${SCHEMA_SERVICE}" \
  sh -lc "if test -f '${DB_PATH}'; then cp '${DB_PATH}' '/backup/${RESCUE_NAME}'; else echo 'Current database missing; skipping rescue snapshot.' >&2; fi"

docker compose run --rm --no-deps \
  -v "${RESTORE_SOURCE_DIR}:/restore-src:ro" \
  "${SCHEMA_SERVICE}" \
  sh -lc "cp '/restore-src/${RESTORE_SOURCE_NAME}' '${DB_PATH}'"

docker compose up -d --wait "${APP_SERVICE}"

APP_PORT="$(resolve_app_port)"

if [[ -z "${APP_PORT}" ]]; then
  echo "Could not resolve the published port for ${APP_SERVICE}." >&2
  exit 1
fi

HEALTH_RESPONSE="$(curl -fsS "http://127.0.0.1:${APP_PORT}/api/health")"

if [[ "${HEALTH_RESPONSE}" != *'"ok":true'* ]]; then
  echo "Restore completed but the app health check did not return ok=true." >&2
  echo "${HEALTH_RESPONSE}" >&2
  exit 1
fi

echo "Restored database from ${BACKUP_FILE}"
echo "Rescue snapshot saved to ${BACKUP_DIR}/${RESCUE_NAME}"
