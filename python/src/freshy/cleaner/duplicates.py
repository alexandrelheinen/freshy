"""Find nearby duplicate places already stored in D1."""

from __future__ import annotations

from freshy.cleaner.junk import is_auto_generated_import_placeholder, is_junk_name
from freshy.cleaner.models import PlaceRow
from freshy.config import DUPLICATE_RADIUS_KM
from freshy.geo import haversine_km


def has_meaningful_name(name: str) -> bool:
    """True when a place name is worth keeping over a datagouv placeholder duplicate."""
    return not is_junk_name(name) and not is_auto_generated_import_placeholder(name)


def find_nearby_duplicate(
    place: PlaceRow,
    all_places: list[PlaceRow],
    *,
    radius_km: float = DUPLICATE_RADIUS_KM,
) -> PlaceRow | None:
    """Return the closest named place within radius_km, if any."""
    best_match: PlaceRow | None = None
    best_distance_km = radius_km

    for other in all_places:
        if other.id == place.id:
            continue
        if not has_meaningful_name(other.name):
            continue

        distance_km = haversine_km(
            place.latitude,
            place.longitude,
            other.latitude,
            other.longitude,
        )
        if distance_km > radius_km:
            continue
        if best_match is None or distance_km < best_distance_km:
            best_match = other
            best_distance_km = distance_km

    return best_match
