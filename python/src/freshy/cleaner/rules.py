"""Automatic Place database cleaning rules."""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Any, Literal

from freshy.cleaner.junk import place_delete_reason
from freshy.mapper.supermarket import is_supermarket_signal, normalize_match_text

CleanActionKind = Literal["delete", "reclassify", "keep"]

HOTEL_NAME_KEYWORDS: tuple[str, ...] = (
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

_HOTEL_PATTERNS: tuple[re.Pattern[str], ...] = tuple(
    re.compile(rf"(?<![a-z0-9]){re.escape(token)}(?![a-z0-9])")
    for token in HOTEL_NAME_KEYWORDS
)


@dataclass(frozen=True)
class PlaceRow:
    id: str
    slug: str
    name: str
    category: str
    address: str | None
    latitude: float
    longitude: float
    created_by_id: str
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


def is_supermarket_place(name: str, description: str | None = None) -> bool:
    return is_supermarket_signal(name, description)


def is_hotel_place(name: str, description: str | None = None) -> bool:
    normalized_name = normalize_match_text(name)
    if any(pattern.search(normalized_name) for pattern in _HOTEL_PATTERNS):
        return True
    if description:
        normalized_description = normalize_match_text(description)
        if "tourism: hotel" in normalized_description or "tourism: motel" in normalized_description:
            return True
        if "tourism:hotel" in normalized_description or "tourism:motel" in normalized_description:
            return True
    return False


def is_junk_unknown_place(place: PlaceRow) -> bool:
    """True when the place should be deleted as database pollution."""
    return place_delete_reason(
        name=place.name,
        address=place.address,
        latitude=place.latitude,
        longitude=place.longitude,
        created_by_id=place.created_by_id,
    ) is not None


def plan_place_cleanup(
    place: PlaceRow,
    *,
    reclassify_hotels: bool = True,
) -> CleanAction:
    """Return the cleanup action for a single place row."""
    delete_reason = place_delete_reason(
        name=place.name,
        address=place.address,
        latitude=place.latitude,
        longitude=place.longitude,
        created_by_id=place.created_by_id,
    )
    if delete_reason is not None:
        return CleanAction(
            place=place,
            action="delete",
            reason=delete_reason,
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
