"""Tests for image plan summaries."""

from __future__ import annotations

import unittest

from freshy.images.models import ImageAction, ImageCandidate, ImagePlan, PlaceImageRow
from freshy.images.plan import summarize_image_plan


class ImagePlanSummaryTests(unittest.TestCase):
    def test_summarize_counts(self) -> None:
        place = PlaceImageRow(
            id="p1",
            slug="slug",
            name="Decathlon",
            category="MALL",
            latitude=48.9,
            longitude=2.3,
            image_url=None,
        )
        candidate = ImageCandidate(
            source="wikidata",
            source_label="Q1234 → File:Store.jpg",
            download_url="https://upload.wikimedia.org/wikipedia/commons/1/1a/Store.jpg",
            license_name="CC BY-SA 4.0",
            confidence=0.8,
        )
        plan = ImagePlan(
            actions=(
                ImageAction(place=place, candidate=candidate),
                ImageAction(place=place, candidate=None, skipped_reason="none"),
            )
        )
        summary = summarize_image_plan(plan)
        self.assertEqual(summary["totals"]["match"], 1)
        self.assertEqual(summary["totals"]["skip"], 1)
        self.assertEqual(summary["totals"]["storage"], "external_url")
        self.assertIn("upload.wikimedia.org", summary["match"][0]["image_url"])


if __name__ == "__main__":
    unittest.main()
