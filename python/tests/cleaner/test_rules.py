"""Tests for automatic Place database cleaning rules."""

from __future__ import annotations

import unittest

from freshy.cleaner.rules import (
    CleanPlan,
    PlaceRow,
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
) -> PlaceRow:
    return PlaceRow(
        id=place_id,
        slug="cool-library",
        name=name,
        category=category,
        address=address,
        description=description,
    )


class JunkUnknownPlaceTests(unittest.TestCase):
    def test_deletes_unknown_name_without_address(self) -> None:
        place = _place(name="Unknown", address=None)
        action = plan_place_cleanup(place)
        self.assertEqual(action.action, "delete")
        self.assertIn("unknown", action.reason)

    def test_deletes_unknown_facility_without_address(self) -> None:
        place = _place(name="Unknown Facility", address="")
        action = plan_place_cleanup(place)
        self.assertEqual(action.action, "delete")

    def test_keeps_unknown_name_when_address_exists(self) -> None:
        place = _place(name="Unknown", address="10 Rue Martre, 92110 Clichy")
        action = plan_place_cleanup(place)
        self.assertEqual(action.action, "keep")

    def test_keeps_named_places_without_address(self) -> None:
        place = _place(name="Carrefour City", address=None, category="MALL")
        action = plan_place_cleanup(place)
        self.assertNotEqual(action.action, "delete")


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
    def test_is_junk_unknown_place_requires_both_conditions(self) -> None:
        self.assertTrue(is_junk_unknown_place("unknown", None))
        self.assertFalse(is_junk_unknown_place("Carrefour", None))
        self.assertFalse(is_junk_unknown_place("unknown", "1 Rue Example"))


if __name__ == "__main__":
    unittest.main()
