"""Tests for image resolution."""

from __future__ import annotations

import unittest
from unittest.mock import patch

from freshy.images.models import PlaceImageRow
from freshy.images.resolve import resolve_image_candidate


def _place(**overrides: object) -> PlaceImageRow:
    defaults = {
        "id": "osm:n1",
        "slug": "decathlon-clichy",
        "name": "Decathlon Clichy",
        "category": "MALL",
        "latitude": 48.9042,
        "longitude": 2.3064,
        "image_url": None,
    }
    defaults.update(overrides)
    return PlaceImageRow(**defaults)  # type: ignore[arg-type]


class ResolveImageTests(unittest.TestCase):
    def test_resolves_osm_wikimedia_commons_tag(self) -> None:
        place = _place()
        elements = [
            {
                "type": "node",
                "id": 42,
                "lat": 48.9042,
                "lon": 2.3064,
                "tags": {"wikimedia_commons": "File:Decathlon store.jpg", "shop": "sports"},
            }
        ]
        commons_payload = {
            "source": "osm_commons",
            "source_label": "File:Decathlon store.jpg",
            "download_url": "https://upload.wikimedia.org/wikipedia/commons/1/1a/Decathlon.jpg",
            "license_name": "CC BY-SA 4.0",
            "confidence": 0.9,
            "file_title": "File:Decathlon store.jpg",
        }

        with patch(
            "freshy.images.resolve.resolve_commons_file",
            return_value=commons_payload,
        ):
            candidate = resolve_image_candidate(
                place,
                allow_commons_search=False,
                osm_elements=elements,
            )

        self.assertIsNotNone(candidate)
        assert candidate is not None
        self.assertEqual(candidate.source, "osm_commons")
        self.assertEqual(candidate.confidence, 0.9)

    def test_skips_when_no_sources_match(self) -> None:
        place = _place(name="Unknown spot")
        with patch("freshy.images.resolve.search_commons_by_name", return_value=None):
            candidate = resolve_image_candidate(place, osm_elements=[])
        self.assertIsNone(candidate)


if __name__ == "__main__":
    unittest.main()
