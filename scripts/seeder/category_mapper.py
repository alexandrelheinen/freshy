"""Map external provider metadata to Freshy Place categories."""

from __future__ import annotations

import re
import unicodedata
from typing import Any

PLACE_CATEGORIES = (
    "CAFE",
    "RESTAURANT",
    "BAR",
    "LIBRARY",
    "MALL",
    "MUSEUM",
    "COWORKING",
    "PUBLIC_SPACE",
)


def infer_category(tags: dict[str, Any]) -> str:
    """Infer a Freshy category from OSM or open-data tags."""
    amenity = str(tags.get("amenity", "")).lower()
    tourism = str(tags.get("tourism", "")).lower()
    shop = str(tags.get("shop", "")).lower()
    leisure = str(tags.get("leisure", "")).lower()
    category_hint = str(tags.get("category", tags.get("categorie", ""))).upper()

    if category_hint in PLACE_CATEGORIES:
        return category_hint

    mapping = {
        "library": "LIBRARY",
        "cinema": "PUBLIC_SPACE",
        "theatre": "PUBLIC_SPACE",
        "community_centre": "PUBLIC_SPACE",
        "townhall": "PUBLIC_SPACE",
        "museum": "MUSEUM",
        "gallery": "MUSEUM",
        "cafe": "CAFE",
        "restaurant": "RESTAURANT",
        "bar": "BAR",
        "pub": "BAR",
        "mall": "MALL",
        "shopping_centre": "MALL",
        "coworking_space": "COWORKING",
    }

    for token in (amenity, tourism, shop, leisure):
        if token in mapping:
            return mapping[token]

    name = str(tags.get("name", "")).lower()
    if "biblioth" in name:
        return "LIBRARY"
    if "musée" in name or "musee" in name:
        return "MUSEUM"
    if "cinéma" in name or "cinema" in name:
        return "PUBLIC_SPACE"

    return "PUBLIC_SPACE"


def slugify_name(name: str) -> str:
    """Mirror Freshy slugifyPlaceName (ASCII-safe slug)."""
    normalized = unicodedata.normalize("NFKD", name)
    ascii_name = normalized.encode("ascii", "ignore").decode("ascii")
    slug = re.sub(r"[^a-z0-9]+", "-", ascii_name.lower()).strip("-")
    return slug or "place"


def build_address(tags: dict[str, Any]) -> str | None:
    """Build a display address from OSM-style tags."""
    if full := tags.get("addr:full") or tags.get("address"):
        return str(full).strip()[:240]

    parts: list[str] = []
    for key in ("addr:housenumber", "addr:street", "addr:postcode", "addr:city"):
        if value := tags.get(key):
            parts.append(str(value).strip())
    if parts:
        return ", ".join(parts)[:240]
    return None
