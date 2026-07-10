"""Freshy Python tooling: seed, map, and clean cooling-place data."""

from __future__ import annotations

try:
    from importlib.metadata import version

    __version__ = version("freshy")
except Exception:
    __version__ = "0.1.0"
