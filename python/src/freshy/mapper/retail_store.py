"""Detect major French retail and specialty store chains for MALL classification."""

from __future__ import annotations

import re

from freshy.mapper.supermarket import normalize_match_text

# Whole-word or phrase match only.
FRENCH_RETAIL_BRANDS: tuple[str, ...] = (
    "action",
    "apple store",
    "boulanger",
    "brico depot",
    "brico dépôt",
    "but",
    "castorama",
    "conforama",
    "cultura",
    "darty",
    "decathlon",
    "fnac",
    "galerie lafayette",
    "gifi",
    "h&m",
    "hm",
    "ikea",
    "jardiland",
    "joue club",
    "kiabi",
    "king jouet",
    "leroy merlin",
    "maison du monde",
    "micromania",
    "mr bricolage",
    "nature et decouvertes",
    "nature et découvertes",
    "primark",
    "printemps",
    "sostrene grene",
    "truffaut",
    "uniqlo",
    "weldom",
    "zara",
)

RETAIL_SHOP_KEYWORDS: tuple[str, ...] = (
    "magasin",
    "store",
    "retail",
)

# OSM shop=* values that should map to MALL (non-grocery retail).
RETAIL_SHOP_TAGS: frozenset[str] = frozenset(
    {
        "baby_goods",
        "beauty",
        "bicycle",
        "books",
        "clothes",
        "computer",
        "department_store",
        "doityourself",
        "electronics",
        "furniture",
        "garden_centre",
        "gift",
        "hardware",
        "houseware",
        "kiosk",
        "mall",
        "mobile_phone",
        "outdoor",
        "shoes",
        "sports",
        "stationery",
        "toys",
        "variety_store",
        "video",
    }
)

_BRAND_PATTERNS: tuple[re.Pattern[str], ...] = tuple(
    re.compile(rf"(?<![a-z0-9]){re.escape(token)}(?![a-z0-9])")
    for token in FRENCH_RETAIL_BRANDS
)
_KEYWORD_PATTERNS: tuple[re.Pattern[str], ...] = tuple(
    re.compile(rf"(?<![a-z0-9]){re.escape(token)}(?![a-z0-9])")
    for token in RETAIL_SHOP_KEYWORDS
)


def name_matches_retail_store(name: str) -> bool:
    normalized = normalize_match_text(name)
    return any(pattern.search(normalized) for pattern in _BRAND_PATTERNS) or any(
        pattern.search(normalized) for pattern in _KEYWORD_PATTERNS
    )


def description_matches_retail_shop_tags(description: str) -> bool:
    normalized = normalize_match_text(description)
    for shop_tag in RETAIL_SHOP_TAGS:
        if f"shop: {shop_tag}" in normalized or f"shop:{shop_tag}" in normalized:
            return True
    return False


def is_retail_store_signal(name: str, description: str | None = None) -> bool:
    if name_matches_retail_store(name):
        return True
    if description and description_matches_retail_shop_tags(description):
        return True
    return False
