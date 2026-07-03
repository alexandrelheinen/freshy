"""Geospatial helpers: Lambert-93 conversion, haversine distance, deduplication."""

from __future__ import annotations

import logging
import math
import re
from typing import Iterable

from pyproj import Transformer

logger = logging.getLogger(__name__)

_LAMBERT93_TO_WGS84 = Transformer.from_crs("EPSG:2154", "EPSG:4326", always_xy=True)


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great-circle distance in kilometers."""
    radius_km = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lambda = math.radians(lon2 - lon1)
    a = math.sin(d_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
    return radius_km * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def lambert93_to_wgs84(x: float, y: float) -> tuple[float, float]:
    """Convert Lambert-93 (EPSG:2154) easting/northing to WGS84 lat/lon."""
    lon, lat = _LAMBERT93_TO_WGS84.transform(x, y)
    return lat, lon


def parse_coordinate_pair(value: object) -> tuple[float, float] | None:
    """Parse common French open-data coordinate string formats."""
    if value is None:
        return None

    if isinstance(value, (list, tuple)) and len(value) >= 2:
        try:
            a, b = float(value[0]), float(value[1])
            return _normalize_lat_lon(a, b)
        except (TypeError, ValueError):
            return None

    if isinstance(value, dict):
        if "coordinates" in value and isinstance(value["coordinates"], list):
            coords = value["coordinates"]
            if len(coords) >= 2:
                try:
                    lon, lat = float(coords[0]), float(coords[1])
                    return lat, lon
                except (TypeError, ValueError):
                    return None
        lat = _to_float(value.get("lat") or value.get("latitude"))
        lon = _to_float(value.get("lon") or value.get("longitude"))
        if lat is not None and lon is not None:
            return lat, lon

    text = str(value).strip()
    if not text:
        return None

    if ";" in text or "," in text:
        parts = [p.strip() for p in text.replace(";", ",").split(",") if p.strip()]
        if len(parts) >= 2:
            try:
                return _normalize_lat_lon(float(parts[0]), float(parts[1]))
            except ValueError:
                pass

    match = re.match(r"^\s*(-?\d+(?:\.\d+)?)\s*[,;]\s*(-?\d+(?:\.\d+)?)\s*$", text)
    if match:
        return _normalize_lat_lon(float(match.group(1)), float(match.group(2)))

    return None


def _normalize_lat_lon(a: float, b: float) -> tuple[float, float]:
    """Heuristic: values in Lambert range vs WGS84."""
    if abs(a) <= 90 and abs(b) <= 180:
        return a, b
    if abs(b) <= 90 and abs(a) <= 180:
        return b, a
    if 1_000_000 <= abs(a) <= 1_300_000 and 6_000_000 <= abs(b) <= 7_200_000:
        return lambert93_to_wgs84(a, b)
    if 1_000_000 <= abs(b) <= 1_300_000 and 6_000_000 <= abs(a) <= 7_200_000:
        return lambert93_to_wgs84(b, a)
    logger.debug("Could not normalize coordinate pair (%s, %s)", a, b)
    return a, b


def _to_float(value: object) -> float | None:
    if value is None or value == "":
        return None
    try:
        return float(str(value).replace(",", "."))
    except (TypeError, ValueError):
        return None


def extract_lat_lon_from_record(record: dict[str, object]) -> tuple[float, float] | None:
    """Extract WGS84 coordinates from a heterogeneous open-data row."""
    key_pairs = (
        ("latitude", "longitude"),
        ("lat", "lon"),
        ("lat", "lng"),
        ("Latitude", "Longitude"),
        ("y_lat", "x_lon"),
    )
    for lat_key, lon_key in key_pairs:
        lat = _to_float(record.get(lat_key))
        lon = _to_float(record.get(lon_key))
        if lat is not None and lon is not None:
            return _normalize_lat_lon(lat, lon)

    lambert_pairs = (
        ("x_lambert", "y_lambert"),
        ("lambert_x", "lambert_y"),
        ("x", "y"),
        ("coord_x", "coord_y"),
    )
    for x_key, y_key in lambert_pairs:
        x = _to_float(record.get(x_key))
        y = _to_float(record.get(y_key))
        if x is not None and y is not None:
            return lambert93_to_wgs84(x, y)

    geo_keys = (
        "geo_point_2d",
        "coordonnees_gps",
        "coordinates",
        "geom",
        "geometry",
        "localisation",
        "position",
    )
    for key in geo_keys:
        if key in record:
            parsed = parse_coordinate_pair(record[key])
            if parsed:
                return parsed

    return None


def is_duplicate_of_existing(
    lat: float,
    lon: float,
    existing_coords: Iterable[tuple[float, float]],
    radius_km: float,
) -> bool:
    """Return True when a point falls within radius_km of any existing coordinate."""
    for existing_lat, existing_lon in existing_coords:
        if haversine_km(lat, lon, existing_lat, existing_lon) <= radius_km:
            return True
    return False
