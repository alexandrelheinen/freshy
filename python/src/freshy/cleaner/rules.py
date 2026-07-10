"""Automatic Place database cleaning rules."""

from __future__ import annotations

import re
from collections.abc import Callable
from dataclasses import dataclass
from typing import Any, Literal

from freshy.cleaner.duplicates import find_nearby_duplicate
from freshy.cleaner.junk import is_auto_generated_import_placeholder, is_blank_address, place_delete_reason
from freshy.cleaner.models import PlaceRow
from freshy.cleaner.osm_enrich import (
    OsmCategoryMatch,
    OsmPoiMatch,
    fetch_nearby_osm_elements,
    lookup_nearby_category,
    lookup_nearby_poi,
)
from freshy.mapper.cinema import is_cinema_signal
from freshy.mapper.restaurant_chain import is_restaurant_chain_signal
from freshy.mapper.retail_store import is_retail_store_signal
from freshy.mapper.category import slugify_name
from freshy.mapper.supermarket import is_supermarket_signal, normalize_match_text
from freshy.seeder.builder import unique_slug

CleanActionKind = Literal["delete", "reclassify", "rename", "keep"]

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
CINEMA_TARGET_CATEGORY = "MUSEUM"
RESTAURANT_CHAIN_TARGET_CATEGORY = "RESTAURANT"
DATAGOUV_PROVIDER_ID = "datagouv"
PLACEHOLDER_DELETE_REASON = "auto-generated import placeholder without an address"

_HOTEL_PATTERNS: tuple[re.Pattern[str], ...] = tuple(
    re.compile(rf"(?<![a-z0-9]){re.escape(token)}(?![a-z0-9])")
    for token in HOTEL_NAME_KEYWORDS
)

OsmLookup = Callable[[float, float], OsmPoiMatch | None]
OsmCategoryLookup = Callable[[float, float], OsmCategoryMatch | None]


@dataclass(frozen=True)
class CleanAction:
    place: PlaceRow
    action: CleanActionKind
    reason: str
    new_category: str | None = None
    new_name: str | None = None
    new_slug: str | None = None
    new_address: str | None = None


@dataclass(frozen=True)
class CleanPlan:
    actions: tuple[CleanAction, ...]

    @property
    def deletes(self) -> tuple[CleanAction, ...]:
        return tuple(action for action in self.actions if action.action == "delete")

    @property
    def renames(self) -> tuple[CleanAction, ...]:
        return tuple(action for action in self.actions if action.action == "rename")

    @property
    def reclassifies(self) -> tuple[CleanAction, ...]:
        return tuple(action for action in self.actions if action.action == "reclassify")

    @property
    def keeps(self) -> tuple[CleanAction, ...]:
        return tuple(action for action in self.actions if action.action == "keep")


def is_supermarket_place(name: str, description: str | None = None) -> bool:
    return is_supermarket_signal(name, description)


def is_cinema_place(name: str, description: str | None = None) -> bool:
    return is_cinema_signal(name, description)


def is_restaurant_chain_place(name: str, description: str | None = None) -> bool:
    return is_restaurant_chain_signal(name, description)


def is_retail_store_place(name: str, description: str | None = None) -> bool:
    return is_retail_store_signal(name, description)


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


def is_osm_enrich_candidate(place: PlaceRow, delete_reason: str) -> bool:
    """True when a datagouv placeholder may be recovered via OSM before deletion."""
    return (
        place.created_by_id == DATAGOUV_PROVIDER_ID
        and is_blank_address(place.address)
        and is_auto_generated_import_placeholder(place.name)
        and delete_reason == PLACEHOLDER_DELETE_REASON
    )


def _resolve_placeholder_with_osm(
    place: PlaceRow,
    *,
    all_places: list[PlaceRow],
    reserved_slugs: set[str],
    osm_lookup: OsmLookup,
) -> CleanAction | None:
    duplicate = find_nearby_duplicate(place, all_places)
    if duplicate is not None:
        return CleanAction(
            place=place,
            action="delete",
            reason=f"duplicate of nearby place {duplicate.name} ({duplicate.id})",
        )

    match = osm_lookup(place.latitude, place.longitude)
    if match is None:
        return None

    new_slug = unique_slug(slugify_name(match.name), reserved_slugs)
    new_category = match.category if match.category != place.category else None
    return CleanAction(
        place=place,
        action="rename",
        reason=(
            f"OSM nearby match ({match.osm_type}{match.osm_id}) "
            f"for datagouv placeholder without an address"
        ),
        new_name=match.name,
        new_slug=new_slug,
        new_address=match.address,
        new_category=new_category,
    )


def plan_place_cleanup(
    place: PlaceRow,
    *,
    reclassify_hotels: bool = True,
    enrich_osm: bool = False,
    enrich_osm_categories: bool = False,
    all_places: list[PlaceRow] | None = None,
    reserved_slugs: set[str] | None = None,
    osm_lookup: OsmLookup | None = None,
    osm_category_lookup: OsmCategoryLookup | None = None,
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
        if (
            enrich_osm
            and is_osm_enrich_candidate(place, delete_reason)
            and all_places is not None
            and reserved_slugs is not None
            and osm_lookup is not None
        ):
            enriched = _resolve_placeholder_with_osm(
                place,
                all_places=all_places,
                reserved_slugs=reserved_slugs,
                osm_lookup=osm_lookup,
            )
            if enriched is not None:
                return enriched

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

    if is_cinema_place(place.name, place.description) and place.category != CINEMA_TARGET_CATEGORY:
        return CleanAction(
            place=place,
            action="reclassify",
            reason="cinema mapped to MUSEUM (Arts and Culture)",
            new_category=CINEMA_TARGET_CATEGORY,
        )

    if (
        is_restaurant_chain_place(place.name, place.description)
        and place.category != RESTAURANT_CHAIN_TARGET_CATEGORY
    ):
        return CleanAction(
            place=place,
            action="reclassify",
            reason="known restaurant or fast-food chain mapped to RESTAURANT",
            new_category=RESTAURANT_CHAIN_TARGET_CATEGORY,
        )

    if is_retail_store_place(place.name, place.description) and place.category != "MALL":
        return CleanAction(
            place=place,
            action="reclassify",
            reason="known retail or specialty store chain mapped to MALL",
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

    if enrich_osm_categories and osm_category_lookup is not None:
        category_match = osm_category_lookup(place.latitude, place.longitude)
        if category_match is not None and category_match.category != place.category:
            return CleanAction(
                place=place,
                action="reclassify",
                reason=(
                    f"OSM tags at coordinates map to {category_match.category} "
                    f"({category_match.osm_type}{category_match.osm_id})"
                ),
                new_category=category_match.category,
            )

    return CleanAction(place=place, action="keep", reason="no cleanup rule matched")


def build_clean_plan(
    places: list[PlaceRow],
    *,
    reclassify_hotels: bool = True,
    enrich_osm: bool = False,
    enrich_osm_categories: bool = False,
    osm_lookup: OsmLookup | None = None,
    osm_category_lookup: OsmCategoryLookup | None = None,
) -> CleanPlan:
    slug_registry = {place.slug for place in places}
    poi_cache: dict[str, OsmPoiMatch | None] = {}
    category_cache: dict[str, OsmCategoryMatch | None] = {}
    element_cache: dict[str, list[dict[str, Any]]] = {}

    poi_fn = osm_lookup or lookup_nearby_poi
    category_fn = osm_category_lookup or lookup_nearby_category

    def _elements_for(lat: float, lon: float) -> list:
        cache_key = f"{lat:.5f},{lon:.5f}"
        if cache_key not in element_cache:
            element_cache[cache_key] = fetch_nearby_osm_elements(lat, lon)
        return element_cache[cache_key]

    def cached_poi_lookup(lat: float, lon: float) -> OsmPoiMatch | None:
        cache_key = f"{lat:.5f},{lon:.5f}"
        if cache_key not in poi_cache:
            poi_cache[cache_key] = poi_fn(lat, lon, elements=_elements_for(lat, lon))
        return poi_cache[cache_key]

    def cached_category_lookup(lat: float, lon: float) -> OsmCategoryMatch | None:
        cache_key = f"{lat:.5f},{lon:.5f}"
        if cache_key not in category_cache:
            category_cache[cache_key] = category_fn(lat, lon, elements=_elements_for(lat, lon))
        return category_cache[cache_key]

    actions: list[CleanAction] = []
    for place in places:
        action = plan_place_cleanup(
            place,
            reclassify_hotels=reclassify_hotels,
            enrich_osm=enrich_osm,
            enrich_osm_categories=enrich_osm_categories,
            all_places=places if enrich_osm else None,
            reserved_slugs=slug_registry if enrich_osm else None,
            osm_lookup=cached_poi_lookup if enrich_osm else None,
            osm_category_lookup=cached_category_lookup if enrich_osm_categories else None,
        )
        if action.action == "rename" and action.new_slug:
            slug_registry.add(action.new_slug)
        actions.append(action)

    return CleanPlan(actions=tuple(actions))


def summarize_plan(plan: CleanPlan) -> dict[str, Any]:
    """Build a JSON-serializable summary for CLI output."""
    return {
        "totals": {
            "places": len(plan.actions),
            "delete": len(plan.deletes),
            "rename": len(plan.renames),
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
        "rename": [
            {
                "id": action.place.id,
                "from_name": action.place.name,
                "to_name": action.new_name,
                "to_slug": action.new_slug,
                "to_address": action.new_address,
                "to_category": action.new_category,
                "reason": action.reason,
            }
            for action in plan.renames
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
