"""Tests for OSM enrichment helpers."""

from __future__ import annotations

import unittest

from freshy.cleaner.osm_enrich import (
    element_to_category_match,
    element_to_poi_match,
    is_generic_osm_name,
    select_best_category_match,
    select_best_poi_match,
)


class OsmEnrichTests(unittest.TestCase):
    def test_rejects_generic_osm_names(self) -> None:
        self.assertTrue(is_generic_osm_name("Building"))
        self.assertFalse(is_generic_osm_name("Bibliothèque Victor Hugo"))

    def test_selects_closest_relevant_named_feature(self) -> None:
        elements = [
            {
                "type": "node",
                "id": 1,
                "lat": 48.90425,
                "lon": 2.30645,
                "tags": {"name": "Far Library", "amenity": "library"},
            },
            {
                "type": "node",
                "id": 2,
                "lat": 48.90421,
                "lon": 2.30641,
                "tags": {"name": "Near Library", "amenity": "library"},
            },
        ]
        match = select_best_poi_match(elements, origin_lat=48.9042, origin_lon=2.3064)
        self.assertIsNotNone(match)
        assert match is not None
        self.assertEqual(match.name, "Near Library")
        self.assertEqual(match.osm_id, 2)

    def test_ignores_unnamed_or_irrelevant_features(self) -> None:
        element = {
            "type": "node",
            "id": 3,
            "lat": 48.9042,
            "lon": 2.3064,
            "tags": {"name": "Building", "building": "yes"},
        }
        self.assertIsNone(
            element_to_poi_match(element, origin_lat=48.9042, origin_lon=2.3064)
        )

    def test_selects_best_category_from_shop_tags(self) -> None:
        elements = [
            {
                "type": "node",
                "id": 10,
                "lat": 48.90421,
                "lon": 2.30641,
                "tags": {"shop": "sports", "brand": "Decathlon"},
            }
        ]
        match = select_best_category_match(elements, origin_lat=48.9042, origin_lon=2.3064)
        self.assertIsNotNone(match)
        assert match is not None
        self.assertEqual(match.category, "MALL")
        self.assertEqual(match.osm_id, 10)


if __name__ == "__main__":
    unittest.main()
