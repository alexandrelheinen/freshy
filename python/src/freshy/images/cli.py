"""freshy-images CLI: find free venue image URLs and update D1."""

from __future__ import annotations

import argparse
import json
import logging
import sys

from freshy.config import DEFAULT_D1_DATABASE
from freshy.images.d1 import fetch_places_without_image
from freshy.images.plan import apply_image_plan, build_image_plan, summarize_image_plan
from freshy.logging import setup_logging

logger = logging.getLogger("freshy.images.cli")


def _load_places(args: argparse.Namespace):
    places = fetch_places_without_image(database=args.database, remote=args.remote)
    if args.limit is not None:
        return places[: args.limit]
    return places


def cmd_plan(args: argparse.Namespace) -> int:
    try:
        places = _load_places(args)
        plan = build_image_plan(
            places,
            allow_commons_search=not args.no_commons_search,
            min_confidence=args.min_confidence,
        )
        summary = summarize_image_plan(plan, upload_r2=args.upload_r2)
        print(json.dumps(summary, indent=2, ensure_ascii=False))
        logger.info(
            "[Plan] places=%d match=%d skip=%d storage=%s",
            summary["totals"]["places"],
            summary["totals"]["match"],
            summary["totals"]["skip"],
            summary["totals"]["storage"],
        )
        return 0
    except RuntimeError as exc:
        logger.error("[Plan] Failed: %s", exc)
        return 1


def cmd_apply(args: argparse.Namespace) -> int:
    try:
        places = _load_places(args)
        plan = build_image_plan(
            places,
            allow_commons_search=not args.no_commons_search,
            min_confidence=args.min_confidence,
        )
        stats = apply_image_plan(
            plan,
            database=args.database,
            remote=args.remote,
            dry_run=args.dry_run,
            min_confidence=args.min_confidence,
            upload_r2=args.upload_r2,
        )
        logger.info(
            "[Apply] matched=%d updated=%d failed=%d skipped=%d storage=%s",
            stats["matched"],
            stats["updated"],
            stats["failed"],
            stats["skipped"],
            stats["storage"],
        )
        if args.json:
            print(json.dumps(stats, indent=2))
        return 0
    except RuntimeError as exc:
        logger.error("[Apply] Failed: %s", exc)
        return 1


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="freshy-images",
        description=(
            "Find free-licensed venue images (OSM, Wikimedia Commons, Wikidata) "
            "and store image URLs on Place rows."
        ),
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
        "--limit",
        type=int,
        default=None,
        help="Process only the first N places (testing)",
    )
    common.add_argument(
        "--min-confidence",
        type=float,
        default=0.7,
        help="Minimum candidate confidence to include or apply (default: 0.7)",
    )
    common.add_argument(
        "--no-commons-search",
        action="store_true",
        help="Skip Wikimedia Commons name search (OSM and Wikidata only)",
    )
    common.add_argument(
        "--upload-r2",
        action="store_true",
        help=(
            "Download each image and upload to R2 instead of storing the external URL "
            "(requires R2 env vars; uses bucket storage)"
        ),
    )

    sub = parser.add_subparsers(dest="command", required=True)

    plan = sub.add_parser("plan", parents=[common], help="Search for images without writing")
    plan.set_defaults(func=cmd_plan)

    apply_cmd = sub.add_parser("apply", parents=[common], help="Update D1 image URLs")
    apply_cmd.add_argument(
        "--dry-run",
        action="store_true",
        help="Search and report without updating D1",
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
    logger.info("freshy-images starting (command=%s)", args.command)
    return args.func(args)


if __name__ == "__main__":
    sys.exit(main())
