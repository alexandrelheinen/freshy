"""Detect invalid or placeholder place names that should be removed from D1."""

from __future__ import annotations

import re

from freshy.config import SEEDER_PROVIDER_USER_IDS
from freshy.geo import is_in_france_metropolitan, is_invalid_wgs84_coordinates
from freshy.mapper.supermarket import normalize_match_text

# Exact normalized names (English and French) that indicate junk when there is no address.
JUNK_NAME_EXACT: frozenset[str] = frozenset(
    {
        # English (OSM imports and bad submissions)
        "unknown",
        "unknown facility",
        "unknown place",
        "unnamed",
        "unnamed place",
        "no name",
        "n/a",
        "na",
        "not known",
        "no title",
        # French
        "inconnu",
        "inconnue",
        "inconnu(e)",
        "lieu inconnu",
        "nom inconnu",
        "sans nom",
        "sans titre",
        "non nomme",
        "non nommee",
        "anonyme",
        "pas de nom",
        "sans denomination",
        "sans dénomination",
    }
)

# Normalized name starts with these prefixes (no address required for delete).
JUNK_NAME_PREFIXES: tuple[str, ...] = (
    "unknown ",
    "inconnu ",
    "sans nom ",
    "lieu inconnu ",
    "nom inconnu ",
    "unnamed ",
)

# Normalized name ends with these suffixes.
JUNK_NAME_SUFFIXES: tuple[str, ...] = (
    " unknown",
    " inconnu",
    " inconnue",
)

# Whole-name patterns for auto-generated import placeholders.
JUNK_NAME_PATTERNS: tuple[re.Pattern[str], ...] = (
    re.compile(r"^cooling space \(.+\)$"),
    re.compile(r"^espace rafraichi \(.+\)$"),
    re.compile(r"^espace rafraîchi \(.+\)$"),
)


def is_blank_address(address: str | None) -> bool:
    return address is None or not str(address).strip()


def is_auto_generated_import_placeholder(name: str) -> bool:
    """True for datagouv-style fallback titles such as Cooling space (...)."""
    normalized = normalize_match_text(name)
    return any(pattern.match(normalized) for pattern in JUNK_NAME_PATTERNS)


def is_junk_name(name: str) -> bool:
    """True when the display name is a known placeholder or unknown-style label."""
    stripped = name.strip()
    if not stripped:
        return True

    normalized = normalize_match_text(stripped)
    if not normalized or normalized in {".", "-", "?", "..."}:
        return True

    if normalized in JUNK_NAME_EXACT:
        return True

    if any(normalized.startswith(prefix) for prefix in JUNK_NAME_PREFIXES):
        return True

    if any(normalized.endswith(suffix) for suffix in JUNK_NAME_SUFFIXES):
        return True

    if any(pattern.match(normalized) for pattern in JUNK_NAME_PATTERNS):
        return True

    return False


def _junk_name_delete_reason(name: str) -> str | None:
    """Return a delete reason for junk names when address is already known blank."""
    if not is_junk_name(name):
        return None

    normalized = normalize_match_text(name)
    if any(pattern.match(normalized) for pattern in JUNK_NAME_PATTERNS):
        return "auto-generated import placeholder without an address"
    if not name.strip():
        return "empty name without an address"

    french_markers = (
        "inconnu",
        "sans nom",
        "sans titre",
        "anonyme",
        "non nomme",
        "pas de nom",
    )
    if any(marker in normalized for marker in french_markers):
        return "French placeholder or unknown name without an address"

    english_markers = ("unknown", "unnamed", "no name")
    if normalized in JUNK_NAME_EXACT or any(marker in normalized for marker in english_markers):
        return "unknown English name without an address"

    return "invalid placeholder name without an address"


def place_delete_reason(
    *,
    name: str,
    address: str | None,
    latitude: float,
    longitude: float,
    created_by_id: str,
) -> str | None:
    """
    Return a delete reason when a row should be removed, else None.

    All delete rules require a blank or missing address.
    """
    if not is_blank_address(address):
        return None

    stripped = name.strip()
    if len(stripped) < 2:
        if not stripped:
            return "empty name without an address"
        return "name too short without an address"

    if is_invalid_wgs84_coordinates(latitude, longitude):
        return "invalid coordinates without an address"

    if (
        created_by_id in SEEDER_PROVIDER_USER_IDS
        and not is_in_france_metropolitan(latitude, longitude)
    ):
        return "import provider place outside France without an address"

    return _junk_name_delete_reason(name)


def junk_delete_reason(name: str, address: str | None) -> str | None:
    """
    Return a delete reason for junk-name-only checks (legacy signature).

    Prefer place_delete_reason when latitude, longitude, and created_by_id are available.
    """
    if not is_blank_address(address):
        return None
    return _junk_name_delete_reason(name)
