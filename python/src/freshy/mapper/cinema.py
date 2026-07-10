"""Detect cinemas for Arts and Culture (MUSEUM) classification."""

from __future__ import annotations

import re

from freshy.mapper.supermarket import normalize_match_text

CINEMA_BRANDS: tuple[str, ...] = (
    "pathe",
    "pathé",
    "gaumont",
    "ugc",
    "mk2",
    "cgr",
    "kinepolis",
    "megarama",
    "cineville",
    "cinéville",
    "multiplex",
    "cinema city",
    "cinéma city",
)

CINEMA_NAME_KEYWORDS: tuple[str, ...] = (
    "cinema",
    "cinéma",
    "cinemas",
    "cinémas",
)

_BRAND_PATTERNS: tuple[re.Pattern[str], ...] = tuple(
    re.compile(rf"(?<![a-z0-9]){re.escape(token)}(?![a-z0-9])")
    for token in CINEMA_BRANDS
)
_KEYWORD_PATTERNS: tuple[re.Pattern[str], ...] = tuple(
    re.compile(rf"(?<![a-z0-9]){re.escape(token)}(?![a-z0-9])")
    for token in CINEMA_NAME_KEYWORDS
)


def name_matches_cinema_signal(name: str) -> bool:
    normalized = normalize_match_text(name)
    return any(pattern.search(normalized) for pattern in _BRAND_PATTERNS) or any(
        pattern.search(normalized) for pattern in _KEYWORD_PATTERNS
    )


def description_matches_cinema_tags(description: str) -> bool:
    normalized = normalize_match_text(description)
    return (
        "amenity: cinema" in normalized
        or "amenity:cinema" in normalized
        or "amenity: theatre" in normalized
        or "amenity:theatre" in normalized
    )


def is_cinema_signal(name: str, description: str | None = None) -> bool:
    if name_matches_cinema_signal(name):
        return True
    if description and description_matches_cinema_tags(description):
        return True
    return False
