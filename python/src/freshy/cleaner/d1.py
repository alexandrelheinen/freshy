"""D1 read and write helpers for place cleanup."""

from __future__ import annotations

import logging
import tempfile
from datetime import datetime, timezone
from pathlib import Path

from freshy.cleaner.models import PlaceRow
from freshy.cleaner.rules import CleanAction, CleanPlan
from freshy.d1.wrangler import parse_wrangler_json, run_wrangler, sql_literal

logger = logging.getLogger(__name__)


def _utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")


def fetch_all_places(database: str, remote: bool) -> list[PlaceRow]:
    """Read all Place rows from D1 via wrangler."""
    args = [
        "d1",
        "execute",
        database,
        "--yes",
        "--json",
        "--command",
        'SELECT id, slug, name, category, address, description, latitude, longitude, createdById FROM "Place";',
    ]
    if remote:
        args.append("--remote")
    else:
        args.append("--local")

    result = run_wrangler(args)
    if result.returncode != 0:
        raise RuntimeError("wrangler d1 execute read failed")

    rows: list[PlaceRow] = []
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
        created_by_id = item.get("createdById")
        if not created_by_id:
            continue
        rows.append(
            PlaceRow(
                id=str(place_id),
                slug=str(slug),
                name=str(name),
                category=str(category),
                address=str(item["address"]).strip() if item.get("address") else None,
                latitude=latitude,
                longitude=longitude,
                created_by_id=str(created_by_id),
                description=str(item["description"]) if item.get("description") else None,
            )
        )
    logger.info("[Cleaner] Loaded %d places from D1", len(rows))
    return rows


def _build_delete_statements(place_ids: list[str]) -> list[str]:
    if not place_ids:
        return []
    literals = ", ".join(sql_literal(place_id) for place_id in place_ids)
    return [f'DELETE FROM "Place" WHERE id IN ({literals});']


def _build_rename_statements(actions: list[CleanAction]) -> list[str]:
    statements: list[str] = []
    updated_at = _utc_now()
    for action in actions:
        if action.new_name is None or action.new_slug is None:
            continue

        assignments = [
            f'name = {sql_literal(action.new_name)}',
            f'slug = {sql_literal(action.new_slug)}',
        ]
        if action.new_category:
            assignments.append(f'category = {sql_literal(action.new_category)}')
        if action.new_address:
            assignments.append(f'address = {sql_literal(action.new_address)}')
        assignments.append(f'updatedAt = {sql_literal(updated_at)}')

        statements.append(
            'UPDATE "Place" SET '
            + ", ".join(assignments)
            + f' WHERE id = {sql_literal(action.place.id)};'
        )
    return statements


def _build_reclassify_statements(actions: list[CleanAction]) -> list[str]:
    statements: list[str] = []
    updated_at = _utc_now()
    for action in actions:
        if action.new_category is None:
            continue
        statements.append(
            "UPDATE \"Place\" SET "
            f'category = {sql_literal(action.new_category)}, '
            f'updatedAt = {sql_literal(updated_at)} '
            f'WHERE id = {sql_literal(action.place.id)};'
        )
    return statements


def apply_clean_plan(
    plan: CleanPlan,
    *,
    database: str,
    remote: bool,
    dry_run: bool = False,
) -> dict[str, int]:
    """Apply delete, rename, and reclassify actions to D1."""
    delete_ids = [action.place.id for action in plan.deletes]
    rename_actions = list(plan.renames)
    reclassify_actions = list(plan.reclassifies)
    statements = (
        _build_delete_statements(delete_ids)
        + _build_rename_statements(rename_actions)
        + _build_reclassify_statements(reclassify_actions)
    )

    if dry_run:
        logger.info(
            "[Cleaner] Dry run: would delete %d, rename %d, and reclassify %d places",
            len(delete_ids),
            len(rename_actions),
            len(reclassify_actions),
        )
        return {
            "deleted": len(delete_ids),
            "renamed": len(rename_actions),
            "reclassified": len(reclassify_actions),
            "kept": len(plan.keeps),
            "batches": 0,
        }

    if not statements:
        logger.info("[Cleaner] Nothing to apply")
        return {
            "deleted": 0,
            "renamed": 0,
            "reclassified": 0,
            "kept": len(plan.keeps),
            "batches": 0,
        }

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

    logger.info(
        "[Cleaner] Applied %d deletes, %d renames, and %d reclassifications",
        len(delete_ids),
        len(rename_actions),
        len(reclassify_actions),
    )
    return {
        "deleted": len(delete_ids),
        "renamed": len(rename_actions),
        "reclassified": len(reclassify_actions),
        "kept": len(plan.keeps),
        "batches": 1,
    }
