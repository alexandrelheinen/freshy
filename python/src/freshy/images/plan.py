"""Build and apply image enrichment plans."""

from __future__ import annotations

import logging
from typing import Any

from tqdm import tqdm

from freshy.cleaner.osm_enrich import fetch_nearby_osm_elements
from freshy.images.d1 import apply_image_urls
from freshy.images.models import ImageAction, ImageCandidate, ImagePlan, PlaceImageRow
from freshy.images.resolve import resolve_image_candidate

logger = logging.getLogger(__name__)


def build_image_plan(
    places: list[PlaceImageRow],
    *,
    allow_commons_search: bool = True,
    min_confidence: float = 0.0,
) -> ImagePlan:
    """Search free sources for each place and build a plan."""
    element_cache: dict[str, list] = {}
    actions: list[ImageAction] = []

    for place in tqdm(places, desc="[Images] Searching", unit="place"):
        cache_key = f"{place.latitude:.5f},{place.longitude:.5f}"
        if cache_key not in element_cache:
            element_cache[cache_key] = fetch_nearby_osm_elements(place.latitude, place.longitude)

        candidate = resolve_image_candidate(
            place,
            allow_commons_search=allow_commons_search,
            osm_elements=element_cache[cache_key],
        )
        if candidate is not None and candidate.confidence < min_confidence:
            actions.append(
                ImageAction(
                    place=place,
                    candidate=None,
                    skipped_reason=(
                        f"candidate confidence {candidate.confidence:.2f} "
                        f"below minimum {min_confidence:.2f}"
                    ),
                )
            )
            continue

        if candidate is None:
            actions.append(
                ImageAction(
                    place=place,
                    candidate=None,
                    skipped_reason="no free image candidate found",
                )
            )
        else:
            actions.append(ImageAction(place=place, candidate=candidate))

    return ImagePlan(actions=tuple(actions))


def summarize_image_plan(plan: ImagePlan, *, upload_r2: bool = False) -> dict[str, Any]:
    storage = "r2" if upload_r2 else "external_url"
    return {
        "totals": {
            "places": len(plan.actions),
            "match": len(plan.matches),
            "skip": len(plan.skips),
            "storage": storage,
        },
        "match": [
            {
                "id": action.place.id,
                "name": action.place.name,
                "slug": action.place.slug,
                "source": action.candidate.source if action.candidate else None,
                "source_label": action.candidate.source_label if action.candidate else None,
                "license": action.candidate.license_name if action.candidate else None,
                "confidence": action.candidate.confidence if action.candidate else None,
                "image_url": action.candidate.download_url if action.candidate else None,
            }
            for action in plan.matches
        ],
        "skip": [
            {
                "id": action.place.id,
                "name": action.place.name,
                "reason": action.skipped_reason,
            }
            for action in plan.skips
        ],
    }


def apply_image_plan(
    plan: ImagePlan,
    *,
    database: str,
    remote: bool,
    dry_run: bool = False,
    min_confidence: float = 0.7,
    upload_r2: bool = False,
) -> dict[str, int]:
    """Update D1 photoUrl with external image URLs, or mirror to R2 when requested."""
    updates: list[tuple[str, str]] = []
    failed = 0

    candidates = [
        action
        for action in plan.matches
        if action.candidate is not None and action.candidate.confidence >= min_confidence
    ]

    for action in tqdm(candidates, desc="[Images] Applying", unit="place"):
        assert action.candidate is not None
        candidate: ImageCandidate = action.candidate
        if dry_run:
            updates.append((action.place.id, candidate.download_url))
            continue

        try:
            if upload_r2:
                from freshy.images.download import download_image
                from freshy.images.r2 import read_r2_config_from_env, upload_place_image

                downloaded = download_image(candidate.download_url)
                uploaded = upload_place_image(
                    slug=action.place.slug,
                    data=downloaded.data,
                    content_type=downloaded.content_type,
                    extension=downloaded.extension,
                    config=read_r2_config_from_env(),
                )
                image_url = uploaded.public_url
            else:
                image_url = candidate.download_url

            updates.append((action.place.id, image_url))
        except (OSError, ValueError, RuntimeError) as exc:
            failed += 1
            logger.warning(
                "[Images] Failed for %s (%s): %s",
                action.place.id,
                action.place.name,
                exc,
            )

    applied = apply_image_urls(
        updates,
        database=database,
        remote=remote,
        dry_run=dry_run,
    )

    return {
        "planned": len(plan.actions),
        "matched": len(plan.matches),
        "eligible": len(candidates),
        "updated": applied,
        "failed": failed,
        "skipped": len(plan.skips) + (len(plan.matches) - len(candidates)),
        "storage": "r2" if upload_r2 else "external_url",
    }
