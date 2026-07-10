"""Tests for cinema detection."""

from __future__ import annotations

import unittest

from freshy.mapper.cinema import is_cinema_signal, name_matches_cinema_signal


class CinemaSignalTests(unittest.TestCase):
    def test_matches_pathe_brand(self) -> None:
        self.assertTrue(name_matches_cinema_signal("Pathé République"))

    def test_matches_cinema_keyword(self) -> None:
        self.assertTrue(name_matches_cinema_signal("Cinéma Les Fauvettes"))

    def test_matches_import_description(self) -> None:
        self.assertTrue(
            is_cinema_signal(
                "Grand Écran",
                "OpenStreetMap tags: amenity: cinema, air conditioning tagged on OpenStreetMap.",
            )
        )

    def test_does_not_match_unrelated_name(self) -> None:
        self.assertFalse(name_matches_cinema_signal("Bibliothèque municipale"))


if __name__ == "__main__":
    unittest.main()
