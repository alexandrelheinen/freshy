"""D1-shaped Place row staged for local SQLite and remote sync."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

PLACE_COLUMNS: tuple[str, ...] = (
    "id",
    "slug",
    "name",
    "description",
    "category",
    "latitude",
    "longitude",
    "address",
    "photoUrl",
    "aggregatedFreshnessLevel",
    "tags",
    "isOpen",
    "createdById",
    "status",
    "createdAt",
    "updatedAt",
)


@dataclass(frozen=True)
class StagedPlace:
    """Mirrors the production D1 Place table."""

    id: str
    slug: str
    name: str
    category: str
    latitude: float
    longitude: float
    tags: str
    isOpen: bool
    createdById: str
    status: str
    createdAt: str
    updatedAt: str
    description: str | None = None
    address: str | None = None
    photoUrl: str | None = None
    aggregatedFreshnessLevel: str | None = None

    def to_row(self) -> tuple[Any, ...]:
        return (
            self.id,
            self.slug,
            self.name,
            self.description,
            self.category,
            self.latitude,
            self.longitude,
            self.address,
            self.photoUrl,
            self.aggregatedFreshnessLevel,
            self.tags,
            1 if self.isOpen else 0,
            self.createdById,
            self.status,
            self.createdAt,
            self.updatedAt,
        )

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "slug": self.slug,
            "name": self.name,
            "description": self.description,
            "category": self.category,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "address": self.address,
            "photoUrl": self.photoUrl,
            "aggregatedFreshnessLevel": self.aggregatedFreshnessLevel,
            "tags": self.tags,
            "isOpen": 1 if self.isOpen else 0,
            "createdById": self.createdById,
            "status": self.status,
            "createdAt": self.createdAt,
            "updatedAt": self.updatedAt,
        }


# Backward-compatible alias used by providers during refactor.
ScrapedPlace = StagedPlace
