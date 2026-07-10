"""Extract image hints from nearby OSM elements."""

from __future__ import annotations

from typing import Any

from freshy.cleaner.osm_enrich import fetch_nearby_osm_elements, select_best_category_match
from freshy.geo import haversine_km


def _element_distance_km(
    element: dict[str, Any],
    *,
    origin_lat: float,
    origin_lon: float,
) -> float | None:
    if "lat" in element and "lon" in element:
        return haversine_km(origin_lat, origin_lon, float(element["lat"]), float(element["lon"]))
    center = element.get("center")
    if isinstance(center, dict) and "lat" in center and "lon" in center:
        return haversine_km(
            origin_lat,
            origin_lon,
            float(center["lat"]),
            float(center["lon"]),
        )
    return None


def nearest_tagged_osm_element(
    lat: float,
    lon: float,
    *,
    elements: list[dict[str, Any]] | None = None,
) -> dict[str, Any] | None:
    """Return the closest OSM element that carries image-related tags."""
    nearby = elements if elements is not None else fetch_nearby_osm_elements(lat, lon)
    best: dict[str, Any] | None = None
    best_distance: float | None = None

    for element in nearby:
        if not isinstance(element, dict):
            continue
        tags = element.get("tags") or {}
        if not isinstance(tags, dict):
            continue
        if not any(key in tags for key in ("image", "wikimedia_commons", "wikidata", "brand:wikidata")):
            continue
        distance = _element_distance_km(element, origin_lat=lat, origin_lon=lon)
        if distance is None:
            continue
        if best is None or (best_distance is not None and distance < best_distance):
            best = element
            best_distance = distance

    if best is None:
        # Fall back to the closest categorized element (may still have wikidata on brand).
        category_match = select_best_category_match(nearby, origin_lat=lat, origin_lon=lon)
        if category_match is None:
            return None
        for element in nearby:
            if not isinstance(element, dict):
                continue
            if element.get("type") == category_match.osm_type and element.get("id") == category_match.osm_id:
                return element

    return best


def extract_osm_image_hints(tags: dict[str, Any]) -> dict[str, str]:
    """Collect image-related OSM tag values from one element."""
    hints: dict[str, str] = {}
    for key in ("image", "image:0", "wikimedia_commons", "wikidata", "brand:wikidata"):
        value = tags.get(key)
        if value is None:
            continue
        text = str(value).strip()
        if text:
            hints[key] = text
    return hints
