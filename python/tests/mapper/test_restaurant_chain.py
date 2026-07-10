"""Tests for restaurant chain detection."""

from __future__ import annotations

import unittest

from freshy.mapper.restaurant_chain import is_restaurant_chain_signal, name_matches_restaurant_chain


class RestaurantChainSignalTests(unittest.TestCase):
    def test_matches_mcdonalds(self) -> None:
        self.assertTrue(name_matches_restaurant_chain("McDonald's République"))

    def test_matches_burger_king(self) -> None:
        self.assertTrue(name_matches_restaurant_chain("Burger King Paris"))

    def test_matches_fast_food_description(self) -> None:
        self.assertTrue(
            is_restaurant_chain_signal(
                "Quick",
                "OpenStreetMap tags: amenity: fast_food, brand: Quick.",
            )
        )

    def test_does_not_match_generic_restaurant(self) -> None:
        self.assertFalse(name_matches_restaurant_chain("Le Petit Bistrot"))


if __name__ == "__main__":
    unittest.main()
