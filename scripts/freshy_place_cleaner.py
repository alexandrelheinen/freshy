#!/usr/bin/env python3
"""
freshy-place-cleaner: remove junk imports and fix misclassified places in D1.

Usage:
  python scripts/freshy_place_cleaner.py plan --database="freshy-db"
  python scripts/freshy_place_cleaner.py apply --database="freshy-db" --dry-run
  python scripts/freshy_place_cleaner.py apply --database="freshy-db" --remote
"""

from __future__ import annotations

import argparse
import json
import logging
import sys
from pathlib import Path

_SCRIPTS_DIR = Path(__file__).resolve().parent
if str(_SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(_SCRIPTS_DIR))

from seeder.config import DEFAULT_D1_DATABASE
from seeder.log_setup import setup_logging
from seeder.place_cleaner import (
    apply_clean_plan,
    build_clean_plan,
    fetch_all_places,
    summarize_plan,
)

logger = logging.getLogger("freshy_place_cleaner.cli")


def _load_places(args: argparse.Namespace):
    return fetch_all_places(database=args.database, remote=args.remote)


def cmd_plan(args: argparse.Namespace) -> int:
    try:
        places = _load_places(args)
        plan = build_clean_plan(places, delete_hotels=not args.keep_hotels)
        summary = summarize_plan(plan)
        print(json.dumps(summary, indent=2, ensure_ascii=False))
        logger.info(
            "[Plan] delete=%d reclassify=%d keep=%d",
            summary["totals"]["delete"],
            summary["totals"]["reclassify"],
            summary["totals"]["keep"],
        )
        return 0
    except RuntimeError as exc:
        logger.error("[Plan] Failed: %s", exc)
        return 1


def cmd_apply(args: argparse.Namespace) -> int:
    try:
        places = _load_places(args)
        plan = build_clean_plan(places, delete_hotels=not args.keep_hotels)
        stats = apply_clean_plan(
            plan,
            database=args.database,
            remote=args.remote,
            dry_run=args.dry_run,
        )
        logger.info(
            "[Apply] deleted=%d reclassified=%d kept=%d batches=%d",
            stats["deleted"],
            stats["reclassified"],
            stats["kept"],
            stats["batches"],
        )
        if args.json:
            print(json.dumps(stats, indent=2))
        return 0
    except RuntimeError as exc:
        logger.error("[Apply] Failed: %s", exc)
        return 1


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="freshy-place-cleaner",
        description="Clean junk places and fix supermarket classification in Cloudflare D1.",
    )
    parser.add_argument("-v", "--verbose", action="store_true", help="Enable debug logging")

    common = argparse.ArgumentParser(add_help=False)
    common.add_argument(
        "--database",
        default=DEFAULT_D1_DATABASE,
        help=f"D1 database name (default: {DEFAULT_D1_DATABASE})",
    )
    common.add_argument(
        "--remote",
        action="store_true",
        help="Target remote D1 (omit for local wrangler D1)",
    )
    common.add_argument(
        "--keep-hotels",
        action="store_true",
        help="Keep hotel rows instead of deleting them (no HOTEL category yet)",
    )

    sub = parser.add_subparsers(dest="command", required=True)

    plan = sub.add_parser("plan", parents=[common], help="Print cleanup actions without writing")
    plan.set_defaults(func=cmd_plan)

    apply_cmd = sub.add_parser("apply", parents=[common], help="Apply cleanup actions to D1")
    apply_cmd.add_argument(
        "--dry-run",
        action="store_true",
        help="Compute actions without executing wrangler",
    )
    apply_cmd.add_argument(
        "--json",
        action="store_true",
        help="Print apply stats as JSON",
    )
    apply_cmd.set_defaults(func=cmd_apply)

    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    setup_logging(verbose=args.verbose)
    logger.info("freshy-place-cleaner starting (command=%s)", args.command)
    return args.func(args)


if __name__ == "__main__":
    sys.exit(main())
