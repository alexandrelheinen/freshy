"""Resolve a free image candidate for one place."""

from __future__ import annotations

import logging
from typing import Any

from freshy.images.models import ImageCandidate, PlaceImageRow
from freshy.images.sources.osm import extract_osm_image_hints, nearest_tagged_osm_element
from freshy.images.sources.wikimedia import (
    resolve_commons_file,
    resolve_direct_wikimedia_url,
    search_commons_by_name,
)
from freshy.images.sources.wikidata import normalize_wikidata_id, resolve_wikidata_image

logger = logging.getLogger(__name__)


def _candidate_from_dict(data: dict[str, Any]) -> ImageCandidate:
    return ImageCandidate(
        source=str(data["source"]),
        source_label=str(data["source_label"]),
        download_url=str(data["download_url"]),
        license_name=str(data["license_name"]) if data.get("license_name") else None,
        confidence=float(data["confidence"]),
        file_title=str(data["file_title"]) if data.get("file_title") else None,
    )


def _resolve_osm_hints(hints: dict[str, str]) -> ImageCandidate | None:
    if image_url := hints.get("image"):
        if image_url.startswith("http://") or image_url.startswith("https://"):
            direct = resolve_direct_wikimedia_url(image_url)
            if direct is not None:
                return _candidate_from_dict(direct)
        if not image_url.startswith("http"):
            resolved = resolve_commons_file(image_url, confidence=0.9, source="osm_image")
            if resolved is not None:
                return _candidate_from_dict(resolved)

    if commons_title := hints.get("wikimedia_commons"):
        resolved = resolve_commons_file(commons_title, confidence=0.9, source="osm_commons")
        if resolved is not None:
            return _candidate_from_dict(resolved)

    for key in ("wikidata", "brand:wikidata"):
        if qid := hints.get(key):
            normalized = normalize_wikidata_id(qid)
            if normalized is None:
                continue
            resolved = resolve_wikidata_image(normalized)
            if resolved is not None:
                return _candidate_from_dict(resolved)

    return None


def resolve_image_candidate(
    place: PlaceImageRow,
    *,
    allow_commons_search: bool = True,
    osm_elements: list[dict[str, Any]] | None = None,
) -> ImageCandidate | None:
    """Find the best free image candidate for a place row."""
    element = nearest_tagged_osm_element(
        place.latitude,
        place.longitude,
        elements=osm_elements,
    )
    if element is not None:
        tags = element.get("tags") or {}
        if isinstance(tags, dict):
            candidate = _resolve_osm_hints(extract_osm_image_hints(tags))
            if candidate is not None:
                return candidate

    if allow_commons_search:
        searched = search_commons_by_name(place.name)
        if searched is not None:
            return _candidate_from_dict(searched)

    logger.debug("[Images] No candidate for place=%s", place.id)
    return None
