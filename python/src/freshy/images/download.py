"""Download and validate venue images."""

from __future__ import annotations

import logging
from dataclasses import dataclass

import requests

logger = logging.getLogger(__name__)

MAX_IMAGE_BYTES = 10 * 1024 * 1024
ALLOWED_CONTENT_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
}

USER_AGENT = "freshy-images/0.1 (Freshy; contact: dev@freshy.app)"


@dataclass(frozen=True)
class DownloadedImage:
    data: bytes
    content_type: str
    extension: str


def _extension_for_content_type(content_type: str) -> str | None:
    normalized = content_type.split(";", 1)[0].strip().casefold()
    if normalized == "image/jpeg":
        return "jpg"
    if normalized == "image/png":
        return "png"
    if normalized == "image/webp":
        return "webp"
    return None


def download_image(url: str) -> DownloadedImage:
    """Download one image and validate size and MIME type."""
    response = requests.get(
        url,
        timeout=60,
        headers={"User-Agent": USER_AGENT},
        stream=True,
    )
    response.raise_for_status()

    content_type = response.headers.get("Content-Type", "").split(";", 1)[0].strip().casefold()
    if content_type not in ALLOWED_CONTENT_TYPES:
        raise ValueError(f"Unsupported content type: {content_type or 'unknown'}")

    extension = _extension_for_content_type(content_type)
    if extension is None:
        raise ValueError(f"Unsupported content type: {content_type}")

    chunks: list[bytes] = []
    total = 0
    for chunk in response.iter_content(chunk_size=64 * 1024):
        if not chunk:
            continue
        total += len(chunk)
        if total > MAX_IMAGE_BYTES:
            raise ValueError("Image exceeds 10MB limit")
        chunks.append(chunk)

    data = b"".join(chunks)
    if not data:
        raise ValueError("Empty image response")

    return DownloadedImage(data=data, content_type=content_type, extension=extension)
