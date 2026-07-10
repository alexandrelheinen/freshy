"""D1 read and write helpers for image enrichment."""

from __future__ import annotations

import logging
import tempfile
from datetime import datetime, timezone
from pathlib import Path

from freshy.d1.wrangler import parse_wrangler_json, run_wrangler, sql_literal
from freshy.images.models import PlaceImageRow

logger = logging.getLogger(__name__)


def _utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")


def fetch_places_without_image(database: str, remote: bool) -> list[PlaceImageRow]:
    """Load Place rows that still use the category default image."""
    args = [
        "d1",
        "execute",
        database,
        "--yes",
        "--json",
        "--command",
        'SELECT id, slug, name, category, latitude, longitude, photoUrl FROM "Place" '
        'WHERE photoUrl IS NULL OR TRIM(photoUrl) = \'\';',
    ]
    if remote:
        args.append("--remote")
    else:
        args.append("--local")

    result = run_wrangler(args)
    if result.returncode != 0:
        raise RuntimeError("wrangler d1 execute read failed")

    rows: list[PlaceImageRow] = []
    for item in parse_wrangler_json(result.stdout):
        place_id = item.get("id")
        slug = item.get("slug")
        name = item.get("name")
        category = item.get("category")
        if not place_id or not slug or not name or not category:
            continue
        try:
            latitude = float(item["latitude"])
            longitude = float(item["longitude"])
        except (KeyError, TypeError, ValueError):
            continue
        photo_url = item.get("photoUrl")
        rows.append(
            PlaceImageRow(
                id=str(place_id),
                slug=str(slug),
                name=str(name),
                category=str(category),
                latitude=latitude,
                longitude=longitude,
                image_url=str(photo_url).strip() if photo_url else None,
            )
        )

    logger.info("[Images] Loaded %d places without a custom image URL", len(rows))
    return rows


def apply_image_urls(
    updates: list[tuple[str, str]],
    *,
    database: str,
    remote: bool,
    dry_run: bool = False,
) -> int:
    """Write image URLs to D1 (photoUrl column)."""
    if not updates:
        return 0

    if dry_run:
        logger.info("[Images] Dry run: would update %d image URLs", len(updates))
        return len(updates)

    updated_at = _utc_now()
    statements = [
        'UPDATE "Place" SET '
        f'photoUrl = {sql_literal(image_url)}, '
        f'updatedAt = {sql_literal(updated_at)} '
        f'WHERE id = {sql_literal(place_id)};'
        for place_id, image_url in updates
    ]

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
    if result.returncode != 0:
        raise RuntimeError("wrangler d1 execute apply failed")

    logger.info("[Images] Updated %d image URLs in D1", len(updates))
    return len(updates)
