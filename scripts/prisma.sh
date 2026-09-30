#!/usr/bin/env bash
set -euo pipefail

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [[ -f "$project_root/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$project_root/.env"
  set +a
fi

exec npx prisma "$@"
