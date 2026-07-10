"""Tests for automatic Place database cleaning rules."""

from __future__ import annotations

import unittest

from freshy.cleaner.models import PlaceRow
from freshy.cleaner.osm_enrich import OsmPoiMatch
from freshy.cleaner.rules import (
    CleanPlan,
    build_clean_plan,
    is_hotel_place,
    is_junk_unknown_place,
    is_supermarket_place,
    plan_place_cleanup,
    summarize_plan,
)


def _place(
    *,
    name: str = "Cool Library",
    category: str = "PUBLIC_SPACE",
    address: str | None = "1 Rue Example, 92110 Clichy",
    description: str | None = None,
    place_id: str = "place-1",
    latitude: float = 48.9042,
    longitude: float = 2.3064,
    created_by_id: str = "user-manual",
) -> PlaceRow:
    return PlaceRow(
        id=place_id,
        slug="cool-library",
        name=name,
        category=category,
        address=address,
        latitude=latitude,
        longitude=longitude,
        created_by_id=created_by_id,
        description=description,
    )


class JunkUnknownPlaceTests(unittest.TestCase):
    def test_deletes_unknown_name_without_address(self) -> None:
        place = _place(name="Unknown", address=None)
        action = plan_place_cleanup(place)
        self.assertEqual(action.action, "delete")
        self.assertIn("unknown", action.reason.casefold())

    def test_deletes_unknown_facility_without_address(self) -> None:
        place = _place(name="Unknown Facility", address="")
        action = plan_place_cleanup(place)
        self.assertEqual(action.action, "delete")

    def test_deletes_french_sans_nom_without_address(self) -> None:
        place = _place(name="Sans nom", address=None)
        action = plan_place_cleanup(place)
        self.assertEqual(action.action, "delete")
        self.assertIn("french", action.reason.casefold())

    def test_deletes_french_inconnu_without_address(self) -> None:
        place = _place(name="Lieu inconnu", address=None)
        action = plan_place_cleanup(place)
        self.assertEqual(action.action, "delete")

    def test_deletes_datagouv_placeholder_without_address(self) -> None:
        place = _place(name="Cooling space (Lieux climatisés de Paris)", address=None)
        action = plan_place_cleanup(place)
        self.assertEqual(action.action, "delete")

    def test_renames_datagouv_placeholder_when_osm_match_found(self) -> None:
        place = _place(
            name="Cooling space (Lieux climatisés de Paris)",
            address=None,
            created_by_id="datagouv",
            place_id="datagouv:abc:1",
        )

        def fake_lookup(lat: float, lon: float) -> OsmPoiMatch:
            self.assertAlmostEqual(lat, 48.9042)
            self.assertAlmostEqual(lon, 2.3064)
            return OsmPoiMatch(
                name="Bibliothèque Victor Hugo",
                address="1 Rue Example, 92110 Clichy",
                category="LIBRARY",
                osm_type="node",
                osm_id=42,
                distance_km=0.01,
            )

        action = plan_place_cleanup(
            place,
            enrich_osm=True,
            all_places=[place],
            reserved_slugs={place.slug},
            osm_lookup=fake_lookup,
        )
        self.assertEqual(action.action, "rename")
        self.assertEqual(action.new_name, "Bibliothèque Victor Hugo")
        self.assertEqual(action.new_slug, "bibliotheque-victor-hugo")
        self.assertEqual(action.new_address, "1 Rue Example, 92110 Clichy")
        self.assertEqual(action.new_category, "LIBRARY")

    def test_deletes_datagouv_placeholder_as_duplicate_of_nearby_osm_row(self) -> None:
        placeholder = _place(
            name="Cooling space (Lieux climatisés de Paris)",
            address=None,
            created_by_id="datagouv",
            place_id="datagouv:abc:1",
        )
        existing = _place(
            name="Bibliothèque municipale",
            address=None,
            created_by_id="osm",
            place_id="osm:n123",
        )
        action = plan_place_cleanup(
            placeholder,
            enrich_osm=True,
            all_places=[placeholder, existing],
            reserved_slugs={placeholder.slug, existing.slug},
            osm_lookup=lambda lat, lon: None,
        )
        self.assertEqual(action.action, "delete")
        self.assertIn("duplicate", action.reason.casefold())

    def test_keeps_unknown_name_when_address_exists(self) -> None:
        place = _place(name="Unknown", address="10 Rue Martre, 92110 Clichy")
        action = plan_place_cleanup(place)
        self.assertEqual(action.action, "keep")

    def test_deletes_named_osm_import_with_null_address(self) -> None:
        place = _place(
            name="La Petite Carrière du Château",
            address=None,
            created_by_id="osm",
            place_id="osm:n109",
        )
        action = plan_place_cleanup(place)
        self.assertEqual(action.action, "delete")
        self.assertIn("import without an address", action.reason.casefold())

    def test_deletes_named_osm_import_with_placeholder_address(self) -> None:
        place = _place(
            name="Hubsy République",
            address="No address",
            created_by_id="osm",
            place_id="osm:n489",
        )
        action = plan_place_cleanup(place)
        self.assertEqual(action.action, "delete")
        self.assertIn("placeholder address", action.reason.casefold())

    def test_deletes_french_placeholder_address(self) -> None:
        place = _place(name="Hubsy République", address="Sans adresse")
        action = plan_place_cleanup(place)
        self.assertEqual(action.action, "delete")
        self.assertIn("placeholder address", action.reason.casefold())

    def test_keeps_named_places_without_address(self) -> None:
        place = _place(name="Carrefour City", address=None, category="MALL")
        action = plan_place_cleanup(place)
        self.assertNotEqual(action.action, "delete")


class NoAddressDeleteRuleTests(unittest.TestCase):
    def test_deletes_single_character_name_without_address(self) -> None:
        place = _place(name="X", address=None)
        action = plan_place_cleanup(place)
        self.assertEqual(action.action, "delete")
        self.assertIn("too short", action.reason.casefold())

    def test_deletes_null_island_without_address(self) -> None:
        place = _place(name="Cool Library", address=None, latitude=0.0, longitude=0.0)
        action = plan_place_cleanup(place)
        self.assertEqual(action.action, "delete")
        self.assertIn("invalid coordinates", action.reason.casefold())

    def test_deletes_out_of_range_coordinates_without_address(self) -> None:
        place = _place(name="Cool Library", address=None, latitude=95.0, longitude=2.0)
        action = plan_place_cleanup(place)
        self.assertEqual(action.action, "delete")
        self.assertIn("invalid coordinates", action.reason.casefold())

    def test_deletes_osm_import_outside_france_without_address(self) -> None:
        place = _place(
            name="Cool Library",
            address=None,
            latitude=40.7128,
            longitude=-74.0060,
            created_by_id="osm",
        )
        action = plan_place_cleanup(place)
        self.assertEqual(action.action, "delete")
        self.assertIn("outside france", action.reason.casefold())

    def test_deletes_datagouv_import_outside_france_without_address(self) -> None:
        place = _place(
            name="Cool Library",
            address=None,
            latitude=52.52,
            longitude=13.405,
            created_by_id="datagouv",
        )
        action = plan_place_cleanup(place)
        self.assertEqual(action.action, "delete")
        self.assertIn("outside france", action.reason.casefold())

    def test_keeps_osm_import_outside_france_when_address_exists(self) -> None:
        place = _place(
            name="Cool Library",
            address="10 Rue Example",
            latitude=40.7128,
            longitude=-74.0060,
            created_by_id="osm",
        )
        action = plan_place_cleanup(place)
        self.assertNotEqual(action.action, "delete")

    def test_keeps_manual_place_outside_france_without_address(self) -> None:
        place = _place(
            name="Cool Library",
            address=None,
            latitude=40.7128,
            longitude=-74.0060,
            created_by_id="user-manual",
        )
        action = plan_place_cleanup(place)
        self.assertEqual(action.action, "keep")


class SupermarketClassificationTests(unittest.TestCase):
    def test_reclassifies_carrefour_from_public_space(self) -> None:
        place = _place(name="Carrefour Market", category="PUBLIC_SPACE")
        action = plan_place_cleanup(place)
        self.assertEqual(action.action, "reclassify")
        self.assertEqual(action.new_category, "MALL")

    def test_reclassifies_leclerc_with_accents(self) -> None:
        place = _place(name="E.Leclerc Clichy", category="PUBLIC_SPACE")
        action = plan_place_cleanup(place)
        self.assertEqual(action.action, "reclassify")
        self.assertEqual(action.new_category, "MALL")

    def test_reclassifies_intermarche_keyword(self) -> None:
        place = _place(name="Intermarché Express", category="PUBLIC_SPACE")
        action = plan_place_cleanup(place)
        self.assertEqual(action.action, "reclassify")
        self.assertEqual(action.new_category, "MALL")

    def test_keeps_supermarket_already_in_mall(self) -> None:
        place = _place(name="Monoprix", category="MALL")
        action = plan_place_cleanup(place)
        self.assertEqual(action.action, "keep")

    def test_detects_supermarket_from_import_description(self) -> None:
        self.assertTrue(
            is_supermarket_place(
                "Cooling spot",
                "OpenStreetMap tags: shop: supermarket, air conditioning tagged on OpenStreetMap.",
            )
        )

    def test_keeps_mediathèque(self) -> None:
        place = _place(name="Médiathèque", category="LIBRARY")
        action = plan_place_cleanup(place)
        self.assertEqual(action.action, "keep")

    def test_keeps_matchplay_bar(self) -> None:
        place = _place(name="Matchplay Society", category="BAR")
        action = plan_place_cleanup(place)
        self.assertEqual(action.action, "keep")

    def test_keeps_bibliotheque_multimedia(self) -> None:
        place = _place(
            name="Bibliothèque Arts et multimédia",
            category="LIBRARY",
        )
        action = plan_place_cleanup(place)
        self.assertEqual(action.action, "keep")


class CinemaCleanupTests(unittest.TestCase):
    def test_reclassifies_cinema_to_museum(self) -> None:
        place = _place(name="Pathé République", category="PUBLIC_SPACE")
        action = plan_place_cleanup(place)
        self.assertEqual(action.action, "reclassify")
        self.assertEqual(action.new_category, "MUSEUM")
        self.assertIn("cinema", action.reason.casefold())

    def test_keeps_cinema_already_in_museum(self) -> None:
        place = _place(name="UGC Ciné Cité", category="MUSEUM")
        action = plan_place_cleanup(place)
        self.assertEqual(action.action, "keep")


class RestaurantChainCleanupTests(unittest.TestCase):
    def test_reclassifies_mcdonalds_to_restaurant(self) -> None:
        place = _place(name="McDonald's République", category="PUBLIC_SPACE")
        action = plan_place_cleanup(place)
        self.assertEqual(action.action, "reclassify")
        self.assertEqual(action.new_category, "RESTAURANT")
        self.assertIn("restaurant", action.reason.casefold())

    def test_reclassifies_burger_king_to_restaurant(self) -> None:
        place = _place(name="Burger King Paris", category="MALL")
        action = plan_place_cleanup(place)
        self.assertEqual(action.action, "reclassify")
        self.assertEqual(action.new_category, "RESTAURANT")


class HotelCleanupTests(unittest.TestCase):
    def test_reclassifies_hotel_to_restaurant_by_default(self) -> None:
        place = _place(name="Ibis Budget Clichy", category="PUBLIC_SPACE")
        action = plan_place_cleanup(place)
        self.assertEqual(action.action, "reclassify")
        self.assertEqual(action.new_category, "RESTAURANT")
        self.assertIn("hotel", action.reason.casefold())

    def test_keeps_hotel_already_in_restaurant(self) -> None:
        place = _place(name="Novotel Paris", category="RESTAURANT")
        action = plan_place_cleanup(place)
        self.assertEqual(action.action, "keep")

    def test_skips_hotel_reclassify_when_disabled(self) -> None:
        place = _place(name="Novotel Paris", category="PUBLIC_SPACE")
        action = plan_place_cleanup(place, reclassify_hotels=False)
        self.assertEqual(action.action, "keep")

    def test_detects_hotel_from_import_description(self) -> None:
        self.assertTrue(
            is_hotel_place(
                "Imported facility",
                "OpenStreetMap tags: tourism: hotel, air conditioning tagged on OpenStreetMap.",
            )
        )


class CleanPlanTests(unittest.TestCase):
    def test_builds_mixed_plan(self) -> None:
        places = [
            _place(name="Unknown", address=None, place_id="junk"),
            _place(name="Carrefour City", category="PUBLIC_SPACE", place_id="market"),
            _place(name="Bibliothèque", category="LIBRARY", place_id="library"),
        ]
        plan = build_clean_plan(places)
        self.assertIsInstance(plan, CleanPlan)
        self.assertEqual(len(plan.deletes), 1)
        self.assertEqual(len(plan.reclassifies), 1)
        self.assertEqual(len(plan.keeps), 1)

    def test_summarize_plan_counts(self) -> None:
        plan = build_clean_plan(
            [
                _place(name="Unknown", address=None),
                _place(name="Auchan", category="PUBLIC_SPACE"),
            ]
        )
        summary = summarize_plan(plan)
        self.assertEqual(summary["totals"]["delete"], 1)
        self.assertEqual(summary["totals"]["reclassify"], 1)


class MatcherUnitTests(unittest.TestCase):
    def test_is_junk_unknown_place_detects_delete_candidates(self) -> None:
        self.assertTrue(is_junk_unknown_place(_place(name="unknown", address=None)))
        self.assertFalse(is_junk_unknown_place(_place(name="Carrefour", address=None)))
        self.assertFalse(
            is_junk_unknown_place(_place(name="unknown", address="1 Rue Example"))
        )


if __name__ == "__main__":
    unittest.main()
