"""freshy-seeder CLI: scrape French cooling-place data and sync to Cloudflare D1."""

from __future__ import annotations

import argparse
import logging
import subprocess
import sys
from pathlib import Path

import requests

from freshy.config import DEFAULT_D1_DATABASE, DEFAULT_DB_PATH, FRANCE_REGIONS
from freshy.logging import setup_logging
from freshy.seeder.providers import fetch_datagouv_places, fetch_osm_places
from freshy.seeder.store import LocalStore
from freshy.seeder.sync import sync_to_d1

logger = logging.getLogger("freshy.seeder.cli")


def _resolve_region(raw: str) -> str:
    if raw.lower() == "all":
        return "all"
    if raw in FRANCE_REGIONS:
        return raw
    normalized = raw.strip().casefold()
    for key in FRANCE_REGIONS:
        if key.casefold() == normalized:
            return key
    known = ", ".join(f'"{k}"' for k in FRANCE_REGIONS)
    raise argparse.ArgumentTypeError(f"Unknown region {raw!r}. Known values: {known}")


def cmd_scrape(args: argparse.Namespace) -> int:
    region = _resolve_region(args.region)
    db_path = Path(args.db)
    store = LocalStore(db_path)

    try:
        store.initialize()
        all_places = []

        if args.providers in ("all", "osm"):
            store.wipe_provider("osm")
            osm_places = fetch_osm_places(region, store.load_reserved_slugs())
            all_places.extend(osm_places)

        if args.providers in ("all", "datagouv"):
            store.wipe_provider("datagouv")
            datagouv_places = fetch_datagouv_places(region_key=region, reserved_slugs=store.load_reserved_slugs())
            all_places.extend(datagouv_places)

        if not all_places:
            logger.warning("[Scrape] No places collected for region=%s", region)
            return 1

        store.upsert_places(all_places)
        counts = store.count_by_provider()
        for created_by_id, count in counts.items():
            logger.info("[Scrape] createdById=%s: %d staged rows", created_by_id, count)

        logger.info("[Scrape] Finished. Local database: %s", db_path.resolve())
        return 0
    except (RuntimeError, ValueError, requests.RequestException) as exc:
        logger.error("[Scrape] Failed: %s", exc)
        return 1
    finally:
        store.close()


def cmd_sync(args: argparse.Namespace) -> int:
    db_path = Path(args.db)
    if not db_path.exists():
        logger.error("[Sync] Local database not found at %s. Run scrape first.", db_path)
        return 1

    store = LocalStore(db_path)
    try:
        rows = store.fetch_all()
        if not rows:
            logger.warning("[Sync] No staged places to sync")
            return 1

        stats = sync_to_d1(
            rows=rows,
            database=args.database,
            remote=args.remote,
            dry_run=args.dry_run,
        )
        logger.info(
            "[Sync] Summary: synced=%d skipped_id=%d skipped_geo=%d batches=%d",
            stats["synced"],
            stats["skipped_id"],
            stats["skipped_geo"],
            stats["batches"],
        )
        return 0
    except (RuntimeError, FileNotFoundError, subprocess.CalledProcessError) as exc:
        logger.error("[Sync] Failed: %s", exc)
        return 1
    finally:
        store.close()


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="freshy-seeder",
        description="Scrape French cooling-place data and sync to Cloudflare D1.",
    )
    parser.add_argument("-v", "--verbose", action="store_true", help="Enable debug logging")
    sub = parser.add_subparsers(dest="command", required=True)

    scrape = sub.add_parser("scrape", help="Collect data into local SQLite (freshy_local.db)")
    scrape.add_argument(
        "--region",
        default="all",
        help='French region name or "all" (default: all)',
    )
    scrape.add_argument(
        "--db",
        default=str(DEFAULT_DB_PATH),
        help=f"Local SQLite path (default: {DEFAULT_DB_PATH})",
    )
    scrape.add_argument(
        "--providers",
        choices=("all", "osm", "datagouv"),
        default="all",
        help="Data providers to run (default: all)",
    )
    scrape.set_defaults(func=cmd_scrape)

    sync = sub.add_parser("sync", help="Push staged rows to Cloudflare D1 via wrangler")
    sync.add_argument(
        "--database",
        default=DEFAULT_D1_DATABASE,
        help=f"D1 database name (default: {DEFAULT_D1_DATABASE})",
    )
    sync.add_argument(
        "--db",
        default=str(DEFAULT_DB_PATH),
        help=f"Local SQLite path (default: {DEFAULT_DB_PATH})",
    )
    sync.add_argument(
        "--remote",
        action="store_true",
        help="Sync to remote D1 (omit for local wrangler D1)",
    )
    sync.add_argument(
        "--dry-run",
        action="store_true",
        help="Prepare sync stats without executing wrangler",
    )
    sync.set_defaults(func=cmd_sync)

    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    setup_logging(verbose=args.verbose)
    logger.info("freshy-seeder starting (command=%s)", args.command)
    return args.func(args)


if __name__ == "__main__":
    sys.exit(main())
