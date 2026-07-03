"""Build D1-shaped Place rows at scrape time."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from seeder.category_mapper import build_address, infer_category, slugify_name
from seeder.config import FRANCE_REGIONS
from seeder.models import StagedPlace

IMPORT_STATUS = "IMPORTED"
DEFAULT_FRESHNESS = "MODEST_AC"
DESCRIPTION_MAX_LENGTH = 1000
PROVIDER_USER_IDS = frozenset({"osm", "datagouv"})


def utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")


def unique_slug(base: str, reserved: set[str]) -> str:
    slug = base or "place"
    if slug not in reserved:
        reserved.add(slug)
        return slug
    suffix = 0
    while True:
        suffix += 1
        candidate = f"{base}-{suffix}"
        if candidate not in reserved:
            reserved.add(candidate)
            return candidate


def _clamp_description(text: str) -> str:
    cleaned = " ".join(text.split())
    if len(cleaned) <= DESCRIPTION_MAX_LENGTH:
        return cleaned
    return cleaned[: DESCRIPTION_MAX_LENGTH - 1].rstrip() + "…"


def _region_label(region_key: str | None) -> str | None:
    if not region_key:
        return None
    region = FRANCE_REGIONS.get(region_key)
    return region["label"] if region else region_key


def _format_osm_feature_label(osm_type: str, osm_id: int | str) -> str:
    type_labels = {
        "node": "node",
        "way": "way",
        "relation": "relation",
    }
    label = type_labels.get(osm_type.lower(), osm_type.lower())
    return f"{label} {osm_id}"


def _osm_tag_summary(tags: dict[str, Any]) -> str | None:
    parts: list[str] = []
    if value := tags.get("amenity"):
        parts.append(f"amenity: {value}")
    if value := tags.get("tourism"):
        parts.append(f"tourism: {value}")
    if tags.get("air_conditioning") == "yes":
        parts.append("air conditioning tagged on OpenStreetMap")
    if value := tags.get("operator"):
        parts.append(f"operator: {value}")
    if value := tags.get("addr:city"):
        parts.append(f"city: {value}")
    if not parts:
        return None
    return "OpenStreetMap tags: " + ", ".join(parts) + "."


def build_osm_import_description(
    *,
    region_key: str,
    osm_type: str,
    osm_id: int | str,
    tags: dict[str, Any],
    imported_at: str,
) -> str:
    region = _region_label(region_key) or region_key
    feature = _format_osm_feature_label(osm_type, osm_id)
    paragraphs = [
        (
            "This place was automatically imported by the Freshy import system from "
            f"OpenStreetMap. It was collected during a cooling-place scrape of {region}."
        ),
        f"The source record is OpenStreetMap {feature}.",
    ]
    tag_summary = _osm_tag_summary(tags)
    if tag_summary:
        paragraphs.append(tag_summary)
    paragraphs.append(
        f"Imported on {imported_at} UTC with status IMPORTED, pending review in Freshy Studio."
    )
    return _clamp_description(" ".join(paragraphs))


def build_datagouv_import_description(
    *,
    region_key: str | None,
    dataset_title: str,
    dataset_id: str,
    resource_url: str,
    imported_at: str,
) -> str:
    paragraphs = [
        (
            "This place was automatically imported by the Freshy import system from "
            f'data.gouv.fr (dataset "{dataset_title.strip()}").'
        ),
        f"Dataset identifier: {dataset_id}.",
    ]
    region = _region_label(region_key)
    if region:
        paragraphs.append(f"The scrape run was scoped to {region}.")
    paragraphs.append(f"Source file: {resource_url.strip()}.")
    paragraphs.append(
        f"Imported on {imported_at} UTC with status IMPORTED, pending review in Freshy Studio."
    )
    return _clamp_description(" ".join(paragraphs))


def build_address_from_record(record: dict[str, Any]) -> str | None:
    for key in ("adresse", "address", "commune", "ville", "city"):
        if record.get(key):
            return str(record[key]).strip()[:240]
    return None


def build_from_osm(
    *,
    place_id: str,
    name: str,
    latitude: float,
    longitude: float,
    region_key: str,
    osm_type: str,
    osm_id: int | str,
    tags: dict[str, Any],
    reserved_slugs: set[str],
) -> StagedPlace:
    now = utc_now()
    slug = unique_slug(slugify_name(name), reserved_slugs)
    return StagedPlace(
        id=place_id,
        slug=slug,
        name=name[:120],
        description=build_osm_import_description(
            region_key=region_key,
            osm_type=osm_type,
            osm_id=osm_id,
            tags=tags,
            imported_at=now,
        ),
        category=infer_category(tags),
        latitude=latitude,
        longitude=longitude,
        address=build_address(tags),
        photoUrl=None,
        aggregatedFreshnessLevel=DEFAULT_FRESHNESS,
        tags="[]",
        isOpen=True,
        createdById="osm",
        status=IMPORT_STATUS,
        createdAt=now,
        updatedAt=now,
    )


def build_from_datagouv(
    *,
    place_id: str,
    name: str,
    latitude: float,
    longitude: float,
    region_key: str | None,
    dataset_id: str,
    dataset_title: str,
    resource_url: str,
    record: dict[str, Any],
    reserved_slugs: set[str],
) -> StagedPlace:
    now = utc_now()
    slug = unique_slug(slugify_name(name), reserved_slugs)
    address = build_address(record) or build_address_from_record(record)
    return StagedPlace(
        id=place_id,
        slug=slug,
        name=name[:120],
        description=build_datagouv_import_description(
            region_key=region_key,
            dataset_title=dataset_title,
            dataset_id=dataset_id,
            resource_url=resource_url,
            imported_at=now,
        ),
        category=infer_category(record),
        latitude=latitude,
        longitude=longitude,
        address=address,
        photoUrl=None,
        aggregatedFreshnessLevel=DEFAULT_FRESHNESS,
        tags="[]",
        isOpen=True,
        createdById="datagouv",
        status=IMPORT_STATUS,
        createdAt=now,
        updatedAt=now,
    )
