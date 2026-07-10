"""Tests for Wikimedia Commons helpers."""

from __future__ import annotations

import unittest

from freshy.images.sources.wikimedia import (
    is_allowed_license,
    is_wikimedia_host,
    normalize_commons_file_title,
)


class WikimediaHelperTests(unittest.TestCase):
    def test_normalizes_commons_file_title(self) -> None:
        self.assertEqual(normalize_commons_file_title("Example.jpg"), "File:Example.jpg")
        self.assertEqual(normalize_commons_file_title("File:Example.jpg"), "File:Example.jpg")

    def test_accepts_free_licenses(self) -> None:
        self.assertTrue(is_allowed_license("CC BY-SA 4.0"))
        self.assertTrue(is_allowed_license("Public domain"))
        self.assertFalse(is_allowed_license("Copyrighted"))

    def test_detects_wikimedia_hosts(self) -> None:
        self.assertTrue(is_wikimedia_host("https://upload.wikimedia.org/wikipedia/commons/a/a1/Test.jpg"))
        self.assertFalse(is_wikimedia_host("https://example.com/photo.jpg"))


if __name__ == "__main__":
    unittest.main()
