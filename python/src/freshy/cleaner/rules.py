"""Automatic Place database cleaning rules."""

from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass
from typing import Any, Literal

CleanActionKind = Literal["delete", "reclassify", "keep"]

# English junk names produced by imports or bad submissions (no address required).
UNKNOWN_NAME_VALUES = frozenset(
    {
        "unknown",
        "unknown facility",
        "unknown place",
        "unnamed",
        "unnamed place",
        "no name",
        "n/a",
        "na",
    }
)

# Major French supermarket and hypermarket chains (accent-insensitive substring match).
FRENCH_SUPERMARKET_BRANDS = (
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
    "ed",
    "e.leclerc",
    "e leclerc",
)

SUPERMARKET_NAME_KEYWORDS = (
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
)

# Hotel brands and name cues. Freshy has no HOTEL category; map to RESTAURANT.
HOTEL_NAME_KEYWORDS = (
    "hotel",
    "hôtel",
    "motel",
    "auberge",
    "hostel",
    "ibis",
    "novotel",
    "mercure",
    "sofitel",
    "pullman",
    "accor",
    "premiere classe",
    "première classe",
    "campanile",
    "kyriad",
    "b&b",
    "bb hotel",
    "formule 1",
    "etap hotel",
    "holiday inn",
    "best western",
    "marriott",
    "hilton",
    "radisson",
)

HOTEL_TARGET_CATEGORY = "RESTAURANT"


@dataclass(frozen=True)
class PlaceRow:
    id: str
    slug: str
    name: str
    category: str
    address: str | None
    description: str | None = None


@dataclass(frozen=True)
class CleanAction:
    place: PlaceRow
    action: CleanActionKind
    reason: str
    new_category: str | None = None


@dataclass(frozen=True)
class CleanPlan:
    actions: tuple[CleanAction, ...]

    @property
    def deletes(self) -> tuple[CleanAction, ...]:
        return tuple(action for action in self.actions if action.action == "delete")

    @property
    def reclassifies(self) -> tuple[CleanAction, ...]:
        return tuple(action for action in self.actions if action.action == "reclassify")

    @property
    def keeps(self) -> tuple[CleanAction, ...]:
        return tuple(action for action in self.actions if action.action == "keep")


def normalize_text(value: str) -> str:
    """Lowercase, strip accents, and collapse whitespace for fuzzy matching."""
    normalized = unicodedata.normalize("NFKD", value)
    ascii_text = normalized.encode("ascii", "ignore").decode("ascii")
    return re.sub(r"\s+", " ", ascii_text.strip().casefold())


def is_blank_address(address: str | None) -> bool:
    return address is None or not str(address).strip()


def is_unknown_junk_name(name: str) -> bool:
    normalized = normalize_text(name)
    if normalized in UNKNOWN_NAME_VALUES:
        return True
    return normalized.startswith("unknown ") or normalized.endswith(" unknown")


def is_junk_unknown_place(name: str, address: str | None) -> bool:
    """True when the place has an unknown-style English name and no address."""
    return is_blank_address(address) and is_unknown_junk_name(name)


def _contains_any(haystack: str, needles: tuple[str, ...]) -> bool:
    return any(needle in haystack for needle in needles)


def is_supermarket_place(name: str, description: str | None = None) -> bool:
    normalized_name = normalize_text(name)
    if _contains_any(normalized_name, FRENCH_SUPERMARKET_BRANDS):
        return True
    if _contains_any(normalized_name, SUPERMARKET_NAME_KEYWORDS):
        return True
    if description:
        normalized_description = normalize_text(description)
        if "shop: supermarket" in normalized_description or "shop: convenience" in normalized_description:
            return True
        if "shop:supermarket" in normalized_description or "shop:convenience" in normalized_description:
            return True
    return False


def is_hotel_place(name: str, description: str | None = None) -> bool:
    normalized_name = normalize_text(name)
    if _contains_any(normalized_name, HOTEL_NAME_KEYWORDS):
        return True
    if description:
        normalized_description = normalize_text(description)
        if "tourism: hotel" in normalized_description or "tourism: motel" in normalized_description:
            return True
        if "tourism:hotel" in normalized_description or "tourism:motel" in normalized_description:
            return True
    return False


def plan_place_cleanup(
    place: PlaceRow,
    *,
    reclassify_hotels: bool = True,
) -> CleanAction:
    """Return the cleanup action for a single place row."""
    if is_junk_unknown_place(place.name, place.address):
        return CleanAction(
            place=place,
            action="delete",
            reason="unknown English name without an address",
        )

    if is_supermarket_place(place.name, place.description) and place.category != "MALL":
        return CleanAction(
            place=place,
            action="reclassify",
            reason="French supermarket or grocery chain mapped to MALL",
            new_category="MALL",
        )

    if (
        reclassify_hotels
        and is_hotel_place(place.name, place.description)
        and place.category != HOTEL_TARGET_CATEGORY
    ):
        return CleanAction(
            place=place,
            action="reclassify",
            reason="hotel mapped to RESTAURANT (public dining areas, no HOTEL category)",
            new_category=HOTEL_TARGET_CATEGORY,
        )

    return CleanAction(place=place, action="keep", reason="no cleanup rule matched")


def build_clean_plan(
    places: list[PlaceRow],
    *,
    reclassify_hotels: bool = True,
) -> CleanPlan:
    actions = tuple(
        plan_place_cleanup(place, reclassify_hotels=reclassify_hotels) for place in places
    )
    return CleanPlan(actions=actions)


def summarize_plan(plan: CleanPlan) -> dict[str, Any]:
    """Build a JSON-serializable summary for CLI output."""
    return {
        "totals": {
            "places": len(plan.actions),
            "delete": len(plan.deletes),
            "reclassify": len(plan.reclassifies),
            "keep": len(plan.keeps),
        },
        "delete": [
            {
                "id": action.place.id,
                "name": action.place.name,
                "category": action.place.category,
                "reason": action.reason,
            }
            for action in plan.deletes
        ],
        "reclassify": [
            {
                "id": action.place.id,
                "name": action.place.name,
                "from": action.place.category,
                "to": action.new_category,
                "reason": action.reason,
            }
            for action in plan.reclassifies
        ],
    }
