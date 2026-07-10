"""Tests for Wikidata helpers."""

from __future__ import annotations

import unittest

from freshy.images.sources.wikidata import normalize_wikidata_id


class WikidataHelperTests(unittest.TestCase):
    def test_normalizes_qid(self) -> None:
        self.assertEqual(normalize_wikidata_id("q42"), "Q42")
        self.assertEqual(normalize_wikidata_id("https://www.wikidata.org/wiki/Q123"), "Q123")
        self.assertIsNone(normalize_wikidata_id("not-a-qid"))


if __name__ == "__main__":
    unittest.main()
