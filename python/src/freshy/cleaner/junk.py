"""Detect invalid or placeholder place names that should be removed from D1."""

from __future__ import annotations

import re
import unicodedata

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


def junk_delete_reason(name: str, address: str | None) -> str | None:
    """
    Return a delete reason when a row should be removed, else None.

    Delete policy (all conditions required):
    - Blank or missing address, AND
    - Name is junk (see is_junk_name)
    """
    if not is_blank_address(address):
        return None
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
