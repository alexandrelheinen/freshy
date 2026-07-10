"""OSM Overpass lookup for cleaner rename and category enrichment."""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Any

from freshy.config import DUPLICATE_RADIUS_KM
from freshy.geo import haversine_km
from freshy.mapper.category import build_address, infer_category
from freshy.mapper.supermarket import normalize_match_text
from freshy.osm.overpass import execute_overpass

logger = logging.getLogger(__name__)

OSM_ENRICH_RADIUS_M = max(25, int(DUPLICATE_RADIUS_KM * 1000))

GENERIC_OSM_NAMES: frozenset[str] = frozenset(
    {
        "building",
        "commercial",
        "no",
        "residential",
        "retail",
        "shop",
        "store",
        "unknown",
        "unknown facility",
        "unnamed",
        "yes",
    }
)


@dataclass(frozen=True)
class OsmPoiMatch:
    name: str
    address: str | None
    category: str
    osm_type: str
    osm_id: int
    distance_km: float


@dataclass(frozen=True)
class OsmCategoryMatch:
    category: str
    osm_type: str
    osm_id: int
    distance_km: float


def build_category_around_query(lat: float, lon: float, radius_m: int) -> str:
    """Overpass query for tagged amenities and shops near a WGS84 point."""
    return f"""
[out:json][timeout:25];
(
  node(around:{radius_m},{lat},{lon})["amenity"];
  way(around:{radius_m},{lat},{lon})["amenity"];
  relation(around:{radius_m},{lat},{lon})["amenity"];
  node(around:{radius_m},{lat},{lon})["shop"];
  way(around:{radius_m},{lat},{lon})["shop"];
  relation(around:{radius_m},{lat},{lon})["shop"];
  node(around:{radius_m},{lat},{lon})["tourism"];
  way(around:{radius_m},{lat},{lon})["tourism"];
  relation(around:{radius_m},{lat},{lon})["tourism"];
  node(around:{radius_m},{lat},{lon})["leisure"];
  way(around:{radius_m},{lat},{lon})["leisure"];
  relation(around:{radius_m},{lat},{lon})["leisure"];
);
out center tags;
"""


def _extract_coordinates(element: dict[str, Any]) -> tuple[float, float] | None:
    if "lat" in element and "lon" in element:
        return float(element["lat"]), float(element["lon"])
    center = element.get("center")
    if isinstance(center, dict) and "lat" in center and "lon" in center:
        return float(center["lat"]), float(center["lon"])
    return None


def _element_display_name(tags: dict[str, Any]) -> str | None:
    for key in ("name", "brand", "operator"):
        value = tags.get(key)
        if value is None:
            continue
        text = str(value).strip()
        if text and not is_generic_osm_name(text):
            return text[:120]
    return None


def is_generic_osm_name(name: str) -> bool:
    normalized = normalize_match_text(name)
    return not normalized or normalized in GENERIC_OSM_NAMES


def _is_relevant_osm_tags(tags: dict[str, Any]) -> bool:
    if tags.get("air_conditioning") == "yes":
        return True
    return any(tags.get(key) for key in ("amenity", "tourism", "shop", "leisure"))


def _has_category_tags(tags: dict[str, Any]) -> bool:
    return _is_relevant_osm_tags(tags)


def element_to_poi_match(
    element: dict[str, Any],
    *,
    origin_lat: float,
    origin_lon: float,
) -> OsmPoiMatch | None:
    element_type = element.get("type")
    element_id = element.get("id")
    if not element_type or element_id is None:
        return None

    coords = _extract_coordinates(element)
    if coords is None:
        return None

    tags = element.get("tags") or {}
    if not isinstance(tags, dict) or not _is_relevant_osm_tags(tags):
        return None

    name = _element_display_name(tags)
    if name is None:
        return None

    lat, lon = coords
    return OsmPoiMatch(
        name=name,
        address=build_address(tags),
        category=infer_category(tags),
        osm_type=str(element_type),
        osm_id=int(element_id),
        distance_km=haversine_km(origin_lat, origin_lon, lat, lon),
    )


def element_to_category_match(
    element: dict[str, Any],
    *,
    origin_lat: float,
    origin_lon: float,
) -> OsmCategoryMatch | None:
    element_type = element.get("type")
    element_id = element.get("id")
    if not element_type or element_id is None:
        return None

    coords = _extract_coordinates(element)
    if coords is None:
        return None

    tags = element.get("tags") or {}
    if not isinstance(tags, dict) or not _has_category_tags(tags):
        return None

    lat, lon = coords
    return OsmCategoryMatch(
        category=infer_category(tags),
        osm_type=str(element_type),
        osm_id=int(element_id),
        distance_km=haversine_km(origin_lat, origin_lon, lat, lon),
    )


def select_best_poi_match(
    elements: list[dict[str, Any]],
    *,
    origin_lat: float,
    origin_lon: float,
) -> OsmPoiMatch | None:
    candidates: list[OsmPoiMatch] = []
    for element in elements:
        if not isinstance(element, dict):
            continue
        match = element_to_poi_match(element, origin_lat=origin_lat, origin_lon=origin_lon)
        if match is not None:
            candidates.append(match)

    if not candidates:
        return None

    return min(candidates, key=lambda candidate: candidate.distance_km)


def select_best_category_match(
    elements: list[dict[str, Any]],
    *,
    origin_lat: float,
    origin_lon: float,
) -> OsmCategoryMatch | None:
    candidates: list[OsmCategoryMatch] = []
    for element in elements:
        if not isinstance(element, dict):
            continue
        match = element_to_category_match(element, origin_lat=origin_lat, origin_lon=origin_lon)
        if match is not None:
            candidates.append(match)

    if not candidates:
        return None

    return min(candidates, key=lambda candidate: candidate.distance_km)


def fetch_nearby_osm_elements(
    lat: float,
    lon: float,
    *,
    radius_m: int = OSM_ENRICH_RADIUS_M,
) -> list[dict[str, Any]]:
    """Fetch tagged OSM elements near a coordinate (shared cache entry for enrich flags)."""
    query = build_category_around_query(lat, lon, radius_m)
    payload = execute_overpass(query, strategy_name="cleaner-category-around")
    elements = payload.get("elements", [])
    if not isinstance(elements, list):
        return []
    return [element for element in elements if isinstance(element, dict)]


def lookup_nearby_poi(
    lat: float,
    lon: float,
    *,
    radius_m: int = OSM_ENRICH_RADIUS_M,
    elements: list[dict[str, Any]] | None = None,
) -> OsmPoiMatch | None:
    """Query Overpass for the closest relevant named POI near a coordinate."""
    nearby = elements if elements is not None else fetch_nearby_osm_elements(lat, lon, radius_m=radius_m)
    match = select_best_poi_match(nearby, origin_lat=lat, origin_lon=lon)
    if match is not None:
        logger.info(
            "[Cleaner] OSM POI match near (%.5f, %.5f): %s (%s%s) at %.0fm",
            lat,
            lon,
            match.name,
            match.osm_type,
            match.osm_id,
            match.distance_km * 1000,
        )
    return match


def lookup_nearby_category(
    lat: float,
    lon: float,
    *,
    radius_m: int = OSM_ENRICH_RADIUS_M,
    elements: list[dict[str, Any]] | None = None,
) -> OsmCategoryMatch | None:
    """Infer Freshy category from the closest tagged OSM feature near a coordinate."""
    nearby = elements if elements is not None else fetch_nearby_osm_elements(lat, lon, radius_m=radius_m)
    match = select_best_category_match(nearby, origin_lat=lat, origin_lon=lon)
    if match is not None:
        logger.debug(
            "[Cleaner] OSM category near (%.5f, %.5f): %s (%s%s) at %.0fm",
            lat,
            lon,
            match.category,
            match.osm_type,
            match.osm_id,
            match.distance_km * 1000,
        )
    return match
