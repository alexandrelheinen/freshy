"""Shared cleaner data models."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class PlaceRow:
    id: str
    slug: str
    name: str
    category: str
    address: str | None
    latitude: float
    longitude: float
    created_by_id: str
    description: str | None = None
