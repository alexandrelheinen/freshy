#!/usr/bin/env bash
# Start local PostgreSQL + PostGIS via Docker Compose.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="${ROOT_DIR}/infrastructure/docker/docker-compose.yml"

if ! command -v docker >/dev/null 2>&1; then
  echo "ERROR: Docker is required. Install Docker Desktop or Docker Engine."
  exit 1
fi

echo "==> Starting Freshy local database..."
docker compose -f "${COMPOSE_FILE}" up -d

echo "==> Waiting for PostgreSQL to be healthy..."
for i in $(seq 1 30); do
  if docker compose -f "${COMPOSE_FILE}" exec -T postgres pg_isready -U freshy -d freshy >/dev/null 2>&1; then
    echo "Database is ready."
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "ERROR: Database did not become healthy in time."
    exit 1
  fi
  sleep 2
done

if [ ! -f "${ROOT_DIR}/.env" ]; then
  echo "==> Creating .env from .env.example"
  cp "${ROOT_DIR}/.env.example" "${ROOT_DIR}/.env"
fi

echo ""
echo "Local database running:"
echo "  DATABASE_URL=postgresql://freshy:freshy_dev@localhost:5432/freshy"
echo ""
echo "Next steps:"
echo "  pnpm install"
echo "  pnpm db:generate && pnpm db:migrate && pnpm db:seed"
