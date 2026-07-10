"""Tests for junk address and name detection."""

from __future__ import annotations

import unittest

from freshy.cleaner.junk import is_blank_address, is_placeholder_address, place_delete_reason


class PlaceholderAddressTests(unittest.TestCase):
    def test_detects_no_address_string(self) -> None:
        self.assertTrue(is_placeholder_address("No address"))
        self.assertTrue(is_blank_address("No address"))

    def test_detects_french_sans_adresse(self) -> None:
        self.assertTrue(is_placeholder_address("Sans adresse"))

    def test_does_not_flag_real_address(self) -> None:
        self.assertFalse(is_placeholder_address("10 Rue Martre, 92110 Clichy"))

    def test_delete_reason_for_null_osm_import_address(self) -> None:
        reason = place_delete_reason(
            name="La Petite Carrière du Château",
            address=None,
            latitude=48.9,
            longitude=2.3,
            created_by_id="osm",
        )
        self.assertEqual(reason, "import without an address")

    def test_delete_reason_for_placeholder_address(self) -> None:
        reason = place_delete_reason(
            name="Hubsy République",
            address="No address",
            latitude=48.9,
            longitude=2.3,
            created_by_id="osm",
        )
        self.assertEqual(reason, "placeholder address text")


if __name__ == "__main__":
    unittest.main()
