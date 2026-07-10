"""Tests for external tag to Freshy category mapping."""

from __future__ import annotations

import unittest

from freshy.mapper.category import infer_category


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

    def test_maps_hotel_tourism_to_restaurant(self) -> None:
        self.assertEqual(infer_category({"tourism": "hotel", "name": "Generic Stay"}), "RESTAURANT")

    def test_maps_ibis_name_to_restaurant(self) -> None:
        self.assertEqual(infer_category({"name": "Ibis Budget Clichy"}), "RESTAURANT")

    def test_maps_cinema_amenity_to_museum(self) -> None:
        self.assertEqual(infer_category({"amenity": "cinema"}), "MUSEUM")

    def test_maps_mcdonalds_name_to_restaurant(self) -> None:
        self.assertEqual(infer_category({"name": "McDonald's"}), "RESTAURANT")

    def test_maps_pathe_cinema_name_to_museum(self) -> None:
        self.assertEqual(infer_category({"name": "Pathé République"}), "MUSEUM")

    def test_maps_decathlon_name_to_mall(self) -> None:
        self.assertEqual(infer_category({"name": "Decathlon Clichy"}), "MALL")

    def test_maps_sports_shop_tag_to_mall(self) -> None:
        self.assertEqual(infer_category({"shop": "sports"}), "MALL")

    def test_does_not_map_mediathèque_to_mall(self) -> None:
        self.assertEqual(infer_category({"name": "Médiathèque"}), "PUBLIC_SPACE")


if __name__ == "__main__":
    unittest.main()
