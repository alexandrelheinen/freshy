"""OpenStreetMap provider via Overpass API."""

from __future__ import annotations

import logging
import time
from typing import Any

from tqdm import tqdm

from freshy.config import (
    FRANCE_REGIONS,
    OSM_QUERY_STRATEGIES,
    OVERPASS_INTER_QUERY_SLEEP_SECONDS,
    OVERPASS_TIMEOUT_SECONDS,
)
from freshy.models import StagedPlace
from freshy.osm.overpass import execute_overpass
from freshy.seeder.builder import build_from_osm

logger = logging.getLogger(__name__)


def _area_filter(region_key: str) -> str:
    region = FRANCE_REGIONS.get(region_key)
    if region is None:
        known = ", ".join(sorted(FRANCE_REGIONS))
        raise ValueError(f"Unknown region '{region_key}'. Known regions: {known}")

    if region["scope"] == "country":
        return 'area["ISO3166-1"="FR"]->.search_area;'
    iso = region["iso3166_2"]
    return f'area["ISO3166-2"="{iso}"]->.search_area;'


def build_overpass_query(region_key: str, strategy_filter: str) -> str:
    """Build a single-strategy Overpass QL query for a French region."""
    return f"""
[out:json][timeout:{OVERPASS_TIMEOUT_SECONDS}];
{_area_filter(region_key)}
{strategy_filter}
out center;
"""


def _extract_coordinates(element: dict[str, Any]) -> tuple[float, float] | None:
    if "lat" in element and "lon" in element:
        return float(element["lat"]), float(element["lon"])
    center = element.get("center")
    if isinstance(center, dict) and "lat" in center and "lon" in center:
        return float(center["lat"]), float(center["lon"])
    return None


def _element_to_place(
    element: dict[str, Any],
    region_key: str,
    reserved_slugs: set[str],
) -> StagedPlace | None:
    element_type = element.get("type")
    element_id = element.get("id")
    if not element_type or element_id is None:
        return None

    coords = _extract_coordinates(element)
    if coords is None:
        logger.debug("[OSM] Skipping element without coordinates: %s", element_id)
        return None

    lat, lon = coords
    tags = element.get("tags") or {}
    if not isinstance(tags, dict):
        tags = {}

    name = str(tags.get("name") or tags.get("brand") or "Unknown Facility").strip()
    place_id = f"osm:{element_type[0]}{element_id}"
    return build_from_osm(
        place_id=place_id,
        name=name,
        latitude=lat,
        longitude=lon,
        region_key=region_key,
        osm_type=str(element_type),
        osm_id=element_id,
        tags=tags,
        reserved_slugs=reserved_slugs,
    )


def fetch_osm_places(region_key: str, reserved_slugs: set[str] | None = None) -> list[StagedPlace]:
    """Download and normalize OSM elements for the given French region."""
    slug_registry = reserved_slugs if reserved_slugs is not None else set()
    region_label = FRANCE_REGIONS[region_key]["label"]
    logger.info(
        "[OSM] Querying Overpass for region=%s (%s) using %d split strategies",
        region_key,
        region_label,
        len(OSM_QUERY_STRATEGIES),
    )

    places: list[StagedPlace] = []
    seen_ids: set[str] = set()
    total_elements = 0

    for index, (strategy_name, strategy_filter) in enumerate(OSM_QUERY_STRATEGIES):
        if index > 0 and OVERPASS_INTER_QUERY_SLEEP_SECONDS > 0:
            time.sleep(OVERPASS_INTER_QUERY_SLEEP_SECONDS)

        query = build_overpass_query(region_key, strategy_filter)
        logger.info("[OSM] Running strategy=%s for region=%s", strategy_name, region_key)

        payload = execute_overpass(query, strategy_name)
        elements = payload.get("elements", [])
        if not isinstance(elements, list):
            elements = []

        total_elements += len(elements)
        logger.info("[OSM] Strategy=%s returned %d elements", strategy_name, len(elements))

        for element in tqdm(elements, desc=f"[OSM] Parsing {strategy_name}", unit="element", leave=False):
            if not isinstance(element, dict):
                continue
            place = _element_to_place(element, region_key, slug_registry)
            if place is None or place.id in seen_ids:
                continue
            seen_ids.add(place.id)
            places.append(place)

    if total_elements == 0:
        logger.warning("[OSM] Overpass returned no elements for region=%s", region_key)

    logger.info("[OSM] Found %d unique places in region=%s", len(places), region_key)
    return places
