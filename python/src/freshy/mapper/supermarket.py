"""Detect major French supermarket and grocery chains by name or import metadata."""

from __future__ import annotations

import re
import unicodedata

# Whole-word or phrase match only (no substring hits like "ed" in "mediatheque").
FRENCH_SUPERMARKET_BRANDS: tuple[str, ...] = (
    "auchan",
    "carrefour",
    "casino",
    "cora",
    "franprix",
    "geant",
    "géant",
    "intermarche",
    "intermarché",
    "leclerc",
    "lidl",
    "aldi",
    "monoprix",
    "netto",
    "simply market",
    "super u",
    "hyper u",
    "u express",
    "match",
    "spar",
    "proxi",
    "proxy",
    "grand frais",
    "biocoop",
    "naturalia",
    "picard",
    "e.leclerc",
    "e leclerc",
)

SUPERMARKET_NAME_KEYWORDS: tuple[str, ...] = (
    "supermarche",
    "supermarché",
    "hypermarche",
    "hypermarché",
    "superette",
    "supérette",
    "epicerie",
    "épicerie",
    "grocery",
    "supermarket",
    "hypermarket",
    "centre commercial",
)

_BRAND_PATTERNS: tuple[re.Pattern[str], ...] = tuple(
    re.compile(rf"(?<![a-z0-9]){re.escape(token)}(?![a-z0-9])")
    for token in FRENCH_SUPERMARKET_BRANDS
)
_KEYWORD_PATTERNS: tuple[re.Pattern[str], ...] = tuple(
    re.compile(rf"(?<![a-z0-9]){re.escape(token)}(?![a-z0-9])")
    for token in SUPERMARKET_NAME_KEYWORDS
)


def normalize_match_text(value: str) -> str:
    """Lowercase, strip accents, and collapse whitespace for brand matching."""
    normalized = unicodedata.normalize("NFKD", value)
    ascii_text = normalized.encode("ascii", "ignore").decode("ascii")
    return re.sub(r"\s+", " ", ascii_text.strip().casefold())


def name_matches_supermarket_brand(name: str) -> bool:
    """True when the place name contains a known French grocery chain (whole token)."""
    normalized = normalize_match_text(name)
    return any(pattern.search(normalized) for pattern in _BRAND_PATTERNS) or any(
        pattern.search(normalized) for pattern in _KEYWORD_PATTERNS
    )


def description_matches_supermarket_tags(description: str) -> bool:
    """True when import metadata tags the source as supermarket or convenience shop."""
    normalized = normalize_match_text(description)
    return (
        "shop: supermarket" in normalized
        or "shop: convenience" in normalized
        or "shop:supermarket" in normalized
        or "shop:convenience" in normalized
    )


def is_supermarket_signal(name: str, description: str | None = None) -> bool:
    """Combine name and OSM-style import description signals."""
    if name_matches_supermarket_brand(name):
        return True
    if description and description_matches_supermarket_tags(description):
        return True
    return False
