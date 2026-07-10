"""Data models for image enrichment plans."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class PlaceImageRow:
    id: str
    slug: str
    name: str
    category: str
    latitude: float
    longitude: float
    image_url: str | None


@dataclass(frozen=True)
class ImageCandidate:
    source: str
    source_label: str
    download_url: str
    license_name: str | None
    confidence: float
    file_title: str | None = None


@dataclass(frozen=True)
class ImageAction:
    place: PlaceImageRow
    candidate: ImageCandidate | None
    skipped_reason: str | None = None


@dataclass(frozen=True)
class ImagePlan:
    actions: tuple[ImageAction, ...]

    @property
    def matches(self) -> tuple[ImageAction, ...]:
        return tuple(action for action in self.actions if action.candidate is not None)

    @property
    def skips(self) -> tuple[ImageAction, ...]:
        return tuple(action for action in self.actions if action.candidate is None)
