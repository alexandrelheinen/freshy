"""Sync staged SQLite rows to Cloudflare D1 via wrangler."""

from __future__ import annotations

import logging
import sqlite3
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from tqdm import tqdm

from freshy.config import DUPLICATE_RADIUS_KM, SYNC_BATCH_SIZE
from freshy.d1.wrangler import format_wrangler_failure, parse_wrangler_json, run_wrangler, sql_literal
from freshy.geo import is_duplicate_of_existing
from freshy.mapper.category import slugify_name
from freshy.models import PLACE_COLUMNS
from freshy.seeder.builder import unique_slug

logger = logging.getLogger(__name__)


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

    result = run_wrangler(args)
    if result.returncode != 0:
        logger.error("[Sync] Failed to read existing places: %s", format_wrangler_failure(result))
        raise RuntimeError("wrangler d1 execute read failed")

    parsed_rows = parse_wrangler_json(result.stdout)
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
        sql_literal(str(place["id"])),
        sql_literal(str(place["slug"])),
        sql_literal(str(place["name"])),
        sql_literal(place["description"] if place["description"] is not None else None),
        sql_literal(str(place["category"])),
        str(place["latitude"]),
        str(place["longitude"]),
        sql_literal(place["address"] if place["address"] is not None else None),
        sql_literal(place["photoUrl"] if place["photoUrl"] is not None else None),
        sql_literal(
            place["aggregatedFreshnessLevel"] if place["aggregatedFreshnessLevel"] is not None else None
        ),
        sql_literal(str(place["tags"])),
        str(place["isOpen"]),
        sql_literal(str(place["createdById"])),
        sql_literal(str(place["status"])),
        sql_literal(str(place["createdAt"])),
        sql_literal(str(place["updatedAt"])),
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

        result = run_wrangler(args)
        tmp_path.unlink(missing_ok=True)
        batches += 1

        if result.returncode != 0:
            logger.error(
                "[Sync] Batch %d failed (rows %d-%d): %s",
                batches,
                start,
                start + len(chunk),
                format_wrangler_failure(result),
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
