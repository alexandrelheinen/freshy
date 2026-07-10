"""D1 read and write helpers for place cleanup."""

from __future__ import annotations

import logging
import tempfile
from datetime import datetime, timezone
from pathlib import Path

from freshy.cleaner.rules import CleanAction, CleanPlan, PlaceRow
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
        'SELECT id, slug, name, category, address, description FROM "Place";',
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
        rows.append(
            PlaceRow(
                id=str(place_id),
                slug=str(slug),
                name=str(name),
                category=str(category),
                address=str(item["address"]).strip() if item.get("address") else None,
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
    """Apply delete and reclassify actions to D1."""
    delete_ids = [action.place.id for action in plan.deletes]
    reclassify_actions = list(plan.reclassifies)
    statements = _build_delete_statements(delete_ids) + _build_reclassify_statements(
        reclassify_actions
    )

    if dry_run:
        logger.info(
            "[Cleaner] Dry run: would delete %d and reclassify %d places",
            len(delete_ids),
            len(reclassify_actions),
        )
        return {
            "deleted": len(delete_ids),
            "reclassified": len(reclassify_actions),
            "kept": len(plan.keeps),
            "batches": 0,
        }

    if not statements:
        logger.info("[Cleaner] Nothing to apply")
        return {
            "deleted": 0,
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
        "[Cleaner] Applied %d deletes and %d reclassifications",
        len(delete_ids),
        len(reclassify_actions),
    )
    return {
        "deleted": len(delete_ids),
        "reclassified": len(reclassify_actions),
        "kept": len(plan.keeps),
        "batches": 1,
    }
