"""Sync staged SQLite rows to Cloudflare D1 via wrangler."""

from __future__ import annotations

import json
import logging
import shutil
import sqlite3
import subprocess
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from tqdm import tqdm

from seeder.category_mapper import slugify_name
from seeder.config import (
    DUPLICATE_RADIUS_KM,
    REPO_ROOT,
    SYNC_BATCH_SIZE,
    WRANGLER_BIN,
    WRANGLER_CWD,
)
from seeder.geo import is_duplicate_of_existing
from seeder.models import PLACE_COLUMNS
from seeder.place_builder import unique_slug

logger = logging.getLogger(__name__)


def _sql_literal(value: str | None) -> str:
    if value is None:
        return "NULL"
    return "'" + value.replace("'", "''") + "'"


def _wrangler_command(args: list[str]) -> list[str]:
    """Resolve wrangler without pnpm exec to avoid stderr noise and exit-code quirks."""
    if WRANGLER_BIN.is_file():
        return [str(WRANGLER_BIN), *args]
    if shutil.which("wrangler"):
        return ["wrangler", *args]
    if shutil.which("pnpm"):
        return ["pnpm", "--filter", "@freshy/api", "exec", "wrangler", *args]
    raise RuntimeError(
        "wrangler not found. From repo root run: pnpm install && pnpm --filter @freshy/api install"
    )


def _run_wrangler(args: list[str]) -> subprocess.CompletedProcess[str]:
    command = _wrangler_command(args)
    cwd = WRANGLER_CWD if WRANGLER_BIN.is_file() else REPO_ROOT
    logger.debug("[Sync] Running: %s (cwd=%s)", " ".join(command), cwd)
    return subprocess.run(
        command,
        cwd=cwd,
        capture_output=True,
        text=True,
        check=False,
    )


def _format_wrangler_failure(result: subprocess.CompletedProcess[str]) -> str:
    parts: list[str] = [f"exit code {result.returncode}"]
    stdout = result.stdout.strip()
    stderr = result.stderr.strip()
    if stdout:
        parts.append(f"stdout: {stdout[-2000:]}")
    if stderr:
        parts.append(f"stderr: {stderr[-2000:]}")
    if result.returncode != 0 and "not authenticated" in (stdout + stderr).lower():
        parts.append("hint: run `wrangler login` or set CLOUDFLARE_API_TOKEN")
    return " | ".join(parts)


def _parse_wrangler_json(stdout: str) -> list[dict[str, Any]]:
    """Parse wrangler d1 execute --json output into row dicts."""
    rows: list[dict[str, Any]] = []
    text = stdout.strip()
    if not text:
        return rows

    try:
        payload = json.loads(text)
    except json.JSONDecodeError:
        logger.debug("[Sync] wrangler stdout is not JSON; falling back to line parsing")
        for line in stdout.splitlines():
            line = line.strip()
            if not line.startswith("{"):
                continue
            try:
                item = json.loads(line)
            except json.JSONDecodeError:
                continue
            if isinstance(item, dict) and ("id" in item or "latitude" in item):
                rows.append(item)
        return rows

    entries = payload if isinstance(payload, list) else [payload]
    for entry in entries:
        if not isinstance(entry, dict):
            continue
        result_rows = entry.get("results")
        if not isinstance(result_rows, list):
            continue
        for item in result_rows:
            if not isinstance(item, dict):
                continue
            if "results" in item and isinstance(item["results"], list):
                rows.extend(r for r in item["results"] if isinstance(r, dict))
            elif "id" in item or "latitude" in item or "slug" in item:
                rows.append(item)

    return rows


def fetch_existing_places(database: str, remote: bool) -> tuple[set[str], list[tuple[float, float]], set[str]]:
    """Read existing Place ids, coordinates, and slugs from D1."""
    args = [
        "d1",
        "execute",
        database,
        "--yes",
        "--json",
        "--command",
        'SELECT id, slug, latitude, longitude FROM "Place";',
    ]
    if remote:
        args.append("--remote")
    else:
        args.append("--local")

    result = _run_wrangler(args)
    if result.returncode != 0:
        logger.error("[Sync] Failed to read existing places: %s", _format_wrangler_failure(result))
        raise RuntimeError("wrangler d1 execute read failed")

    parsed_rows = _parse_wrangler_json(result.stdout)
    ids: set[str] = set()
    slugs: set[str] = set()
    coords: list[tuple[float, float]] = []

    for row in parsed_rows:
        place_id = row.get("id")
        slug = row.get("slug")
        lat = row.get("latitude")
        lon = row.get("longitude")
        if place_id:
            ids.add(str(place_id))
        if slug:
            slugs.add(str(slug))
        if lat is not None and lon is not None:
            coords.append((float(lat), float(lon)))

    logger.info(
        "[Sync] Loaded %d existing ids, %d slugs, and %d coordinates from D1",
        len(ids),
        len(slugs),
        len(coords),
    )
    return ids, coords, slugs


def _row_to_d1_place(row: sqlite3.Row, existing_slugs: set[str]) -> dict[str, Any]:
    """Map a local Place row to D1 insert payload, resolving remote slug conflicts only."""
    place = {column: row[column] for column in PLACE_COLUMNS}
    slug = str(place["slug"])
    if slug in existing_slugs:
        place["slug"] = unique_slug(slugify_name(str(place["name"])), existing_slugs)
    else:
        existing_slugs.add(slug)
    place["updatedAt"] = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
    return place


def _build_insert_statement(place: dict[str, Any]) -> str:
    values = (
        _sql_literal(str(place["id"])),
        _sql_literal(str(place["slug"])),
        _sql_literal(str(place["name"])),
        _sql_literal(place["description"] if place["description"] is not None else None),
        _sql_literal(str(place["category"])),
        str(place["latitude"]),
        str(place["longitude"]),
        _sql_literal(place["address"] if place["address"] is not None else None),
        _sql_literal(place["photoUrl"] if place["photoUrl"] is not None else None),
        _sql_literal(
            place["aggregatedFreshnessLevel"] if place["aggregatedFreshnessLevel"] is not None else None
        ),
        _sql_literal(str(place["tags"])),
        str(place["isOpen"]),
        _sql_literal(str(place["createdById"])),
        _sql_literal(str(place["status"])),
        _sql_literal(str(place["createdAt"])),
        _sql_literal(str(place["updatedAt"])),
    )
    cols = ", ".join(f'"{c}"' for c in PLACE_COLUMNS)
    vals = ", ".join(values)
    updates = ", ".join(
        f'"{c}" = excluded."{c}"'
        for c in PLACE_COLUMNS
        if c not in ("id", "createdAt")
    )
    return f'INSERT INTO "Place" ({cols}) VALUES ({vals}) ON CONFLICT("id") DO UPDATE SET {updates};'


def sync_to_d1(
    rows: list[sqlite3.Row],
    database: str,
    remote: bool,
    dry_run: bool = False,
) -> dict[str, int]:
    """Push staged places to D1 with deduplication and batched wrangler executes."""
    existing_ids, existing_coords, existing_slugs = fetch_existing_places(database, remote=remote)

    to_sync: list[dict[str, Any]] = []
    skipped_id = 0
    skipped_geo = 0

    for row in rows:
        place_id = str(row["id"])
        lat = float(row["latitude"])
        lon = float(row["longitude"])

        if place_id in existing_ids:
            skipped_id += 1
            continue
        if is_duplicate_of_existing(lat, lon, existing_coords, DUPLICATE_RADIUS_KM):
            skipped_geo += 1
            continue

        mapped = _row_to_d1_place(row, existing_slugs)
        to_sync.append(mapped)
        existing_coords.append((lat, lon))
        existing_ids.add(place_id)

    logger.info(
        "[Sync] Prepared %d rows (%d skipped by id, %d skipped by geo proximity)",
        len(to_sync),
        skipped_id,
        skipped_geo,
    )

    if dry_run:
        logger.info("[Sync] Dry run enabled; no wrangler commands executed")
        return {"synced": 0, "skipped_id": skipped_id, "skipped_geo": skipped_geo, "batches": 0}

    batches = 0
    synced = 0
    for start in tqdm(range(0, len(to_sync), SYNC_BATCH_SIZE), desc="[Sync] Applying batches", unit="batch"):
        chunk = to_sync[start : start + SYNC_BATCH_SIZE]
        statements = [_build_insert_statement(place) for place in chunk]
        sql_blob = "\n".join(statements)

        with tempfile.NamedTemporaryFile("w", suffix=".sql", delete=False, encoding="utf-8") as tmp:
            tmp.write(sql_blob)
            tmp_path = Path(tmp.name)

        args = ["d1", "execute", database, "--yes", "--file", str(tmp_path)]
        if remote:
            args.append("--remote")
        else:
            args.append("--local")

        result = _run_wrangler(args)
        tmp_path.unlink(missing_ok=True)
        batches += 1

        if result.returncode != 0:
            logger.error(
                "[Sync] Batch %d failed (rows %d-%d): %s",
                batches,
                start,
                start + len(chunk),
                _format_wrangler_failure(result),
            )
            raise RuntimeError(f"wrangler sync batch {batches} failed")

        synced += len(chunk)
        logger.info("[Sync] Batch %d applied (%d rows)", batches, len(chunk))

    logger.info("[Sync] Completed: %d places synced in %d batches", synced, batches)
    return {
        "synced": synced,
        "skipped_id": skipped_id,
        "skipped_geo": skipped_geo,
        "batches": batches,
    }
