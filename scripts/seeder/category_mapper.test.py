"""Tests for external tag to Freshy category mapping."""

from __future__ import annotations

import unittest

from seeder.category_mapper import infer_category


class CategoryMapperTests(unittest.TestCase):
    def test_maps_supermarket_shop_to_mall(self) -> None:
        self.assertEqual(infer_category({"shop": "supermarket"}), "MALL")

    def test_maps_convenience_shop_to_mall(self) -> None:
        self.assertEqual(infer_category({"shop": "convenience"}), "MALL")

    def test_maps_carrefour_name_to_mall(self) -> None:
        self.assertEqual(infer_category({"name": "Carrefour City"}), "MALL")

    def test_maps_leclerc_brand_to_mall(self) -> None:
        self.assertEqual(infer_category({"brand": "E.Leclerc"}), "MALL")

    def test_keeps_library_amenity(self) -> None:
        self.assertEqual(infer_category({"amenity": "library"}), "LIBRARY")

    def test_hotel_still_defaults_to_public_space(self) -> None:
        self.assertEqual(infer_category({"tourism": "hotel", "name": "Generic Stay"}), "PUBLIC_SPACE")


if __name__ == "__main__":
    unittest.main()
