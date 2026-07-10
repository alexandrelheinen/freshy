"""Detect major restaurant and fast-food chains."""

from __future__ import annotations

import re

from freshy.mapper.supermarket import normalize_match_text

RESTAURANT_CHAIN_BRANDS: tuple[str, ...] = (
    "mcdonald",
    "mcdonalds",
    "burger king",
    "kfc",
    "quick",
    "subway",
    "domino",
    "dominos",
    "pizza hut",
    "five guys",
    "flunch",
    "buffalo grill",
    "hippopotamus",
    "o tacos",
    "o'tacos",
    "nando",
    "nandos",
    "pomme de pain",
    "courtepaille",
    "leon",
    "big fernand",
    "vapiano",
    "pizza pai",
    "speed burger",
    "steak n shake",
    "steak'n shake",
)

RESTAURANT_CHAIN_KEYWORDS: tuple[str, ...] = (
    "fast food",
    "fast-food",
)

_BRAND_PATTERNS: tuple[re.Pattern[str], ...] = tuple(
    re.compile(rf"(?<![a-z0-9]){re.escape(token)}(?![a-z0-9])")
    for token in RESTAURANT_CHAIN_BRANDS
)
_KEYWORD_PATTERNS: tuple[re.Pattern[str], ...] = tuple(
    re.compile(rf"(?<![a-z0-9]){re.escape(token)}(?![a-z0-9])")
    for token in RESTAURANT_CHAIN_KEYWORDS
)


def name_matches_restaurant_chain(name: str) -> bool:
    normalized = normalize_match_text(name)
    return any(pattern.search(normalized) for pattern in _BRAND_PATTERNS) or any(
        pattern.search(normalized) for pattern in _KEYWORD_PATTERNS
    )


def description_matches_restaurant_chain_tags(description: str) -> bool:
    normalized = normalize_match_text(description)
    return "amenity: fast_food" in normalized or "amenity:fast_food" in normalized


def is_restaurant_chain_signal(name: str, description: str | None = None) -> bool:
    if name_matches_restaurant_chain(name):
        return True
    if description and description_matches_restaurant_chain_tags(description):
        return True
    return False
