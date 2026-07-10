"""Tests for retail store detection."""

from __future__ import annotations

import unittest

from freshy.mapper.retail_store import is_retail_store_signal, name_matches_retail_store


class RetailStoreSignalTests(unittest.TestCase):
    def test_matches_decathlon(self) -> None:
        self.assertTrue(name_matches_retail_store("Decathlon Paris"))

    def test_matches_truffaut(self) -> None:
        self.assertTrue(name_matches_retail_store("Truffaut Nanterre"))

    def test_matches_apple_store(self) -> None:
        self.assertTrue(name_matches_retail_store("Apple Store Opéra"))

    def test_matches_fnac(self) -> None:
        self.assertTrue(name_matches_retail_store("Fnac Forum"))

    def test_matches_shop_tag_in_description(self) -> None:
        self.assertTrue(
            is_retail_store_signal(
                "Sports shop",
                "OpenStreetMap tags: shop: sports, air conditioning tagged on OpenStreetMap.",
            )
        )

    def test_does_not_match_unrelated_name(self) -> None:
        self.assertFalse(name_matches_retail_store("Bibliothèque municipale"))


if __name__ == "__main__":
    unittest.main()
