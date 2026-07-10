"""Tests for French supermarket brand detection."""

from __future__ import annotations

import unittest

from freshy.mapper.supermarket import is_supermarket_signal, name_matches_supermarket_brand


class SupermarketBrandTests(unittest.TestCase):
    def test_detects_leclerc(self) -> None:
        self.assertTrue(name_matches_supermarket_brand("E.Leclerc"))
        self.assertTrue(name_matches_supermarket_brand("Centre Commercial E. Leclerc"))

    def test_detects_carrefour(self) -> None:
        self.assertTrue(name_matches_supermarket_brand("Carrefour Market"))

    def test_detects_match_supermarket_chain(self) -> None:
        self.assertTrue(name_matches_supermarket_brand("Match"))
        self.assertTrue(name_matches_supermarket_brand("Match Saint-Ouen"))

    def test_rejects_mediathèque_false_positive(self) -> None:
        self.assertFalse(name_matches_supermarket_brand("Médiathèque"))
        self.assertFalse(name_matches_supermarket_brand("Médiathèque Pablo-Picasso"))

    def test_rejects_bibliotheque_multimedia_false_positive(self) -> None:
        self.assertFalse(
            name_matches_supermarket_brand("Bibliothèque Arts et multimédia")
        )

    def test_rejects_matchplay_false_positive(self) -> None:
        self.assertFalse(name_matches_supermarket_brand("Matchplay Society"))

    def test_rejects_medef_false_positive(self) -> None:
        self.assertFalse(name_matches_supermarket_brand("Medef de l'Est Parisien"))

    def test_detects_from_import_description(self) -> None:
        self.assertTrue(
            is_supermarket_signal(
                "Cooling spot",
                "OpenStreetMap tags: shop: supermarket, air conditioning tagged on OpenStreetMap.",
            )
        )


if __name__ == "__main__":
    unittest.main()
