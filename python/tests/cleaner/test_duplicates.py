"""Tests for nearby duplicate detection."""

from __future__ import annotations

import unittest

from freshy.cleaner.duplicates import find_nearby_duplicate
from freshy.cleaner.models import PlaceRow


def _place(
    *,
    place_id: str,
    name: str,
    latitude: float = 48.9042,
    longitude: float = 2.3064,
    created_by_id: str = "osm",
) -> PlaceRow:
    return PlaceRow(
        id=place_id,
        slug=place_id,
        name=name,
        category="LIBRARY",
        address=None,
        latitude=latitude,
        longitude=longitude,
        created_by_id=created_by_id,
    )


class DuplicateDetectionTests(unittest.TestCase):
    def test_finds_nearby_named_duplicate(self) -> None:
        placeholder = _place(
            place_id="datagouv:abc:1",
            name="Cooling space (Lieux climatisés)",
            created_by_id="datagouv",
        )
        existing = _place(place_id="osm:n123", name="Bibliothèque municipale")
        duplicate = find_nearby_duplicate(placeholder, [placeholder, existing])
        self.assertIsNotNone(duplicate)
        assert duplicate is not None
        self.assertEqual(duplicate.id, "osm:n123")

    def test_ignores_distant_places(self) -> None:
        placeholder = _place(
            place_id="datagouv:abc:1",
            name="Cooling space (Lieux climatisés)",
            created_by_id="datagouv",
        )
        distant = _place(
            place_id="osm:n999",
            name="Far Library",
            latitude=45.0,
            longitude=2.0,
        )
        self.assertIsNone(find_nearby_duplicate(placeholder, [placeholder, distant]))


if __name__ == "__main__":
    unittest.main()
