"""Tests for import place description builders."""

from __future__ import annotations

import json
import unittest

from seeder.place_builder import (
    DESCRIPTION_MAX_LENGTH,
    build_datagouv_import_description,
    build_osm_import_description,
)


class PlaceBuilderDescriptionTests(unittest.TestCase):
    def test_osm_description_is_human_readable_prose(self) -> None:
        text = build_osm_import_description(
            region_key="Île-de-France",
            osm_type="way",
            osm_id=1234567,
            tags={
                "amenity": "library",
                "air_conditioning": "yes",
                "addr:city": "Paris",
            },
            imported_at="2026-07-03 16:00:00",
        )
        self.assertIn("Freshy import system", text)
        self.assertIn("OpenStreetMap", text)
        self.assertIn("Île-de-France", text)
        self.assertIn("way 1234567", text)
        self.assertIn("air conditioning tagged on OpenStreetMap", text)
        self.assertIn("IMPORTED", text)
        with self.assertRaises(json.JSONDecodeError):
            json.loads(text)

    def test_datagouv_description_includes_dataset_and_source_file(self) -> None:
        text = build_datagouv_import_description(
            region_key="Île-de-France",
            dataset_title="Lieux climatisés de Paris",
            dataset_id="abc-123",
            resource_url="https://example.com/data.csv",
            imported_at="2026-07-03 16:00:00",
        )
        self.assertIn("data.gouv.fr", text)
        self.assertIn("Lieux climatisés de Paris", text)
        self.assertIn("abc-123", text)
        self.assertIn("https://example.com/data.csv", text)
        self.assertIn("Freshy Studio", text)

    def test_description_respects_max_length(self) -> None:
        long_title = "X" * 2000
        text = build_datagouv_import_description(
            region_key="all",
            dataset_title=long_title,
            dataset_id="dataset-id",
            resource_url="https://example.com/" + ("path/" * 200) + "file.csv",
            imported_at="2026-07-03 16:00:00",
        )
        self.assertLessEqual(len(text), DESCRIPTION_MAX_LENGTH)


if __name__ == "__main__":
    unittest.main()
