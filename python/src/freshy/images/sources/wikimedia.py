"""Wikimedia Commons API helpers."""

from __future__ import annotations

import logging
import re
from typing import Any
from urllib.parse import unquote, urlparse

import requests

logger = logging.getLogger(__name__)

COMMONS_API = "https://commons.wikimedia.org/w/api.php"
USER_AGENT = "freshy-images/0.1 (Freshy; contact: dev@freshy.app)"

ALLOWED_LICENSE_MARKERS: tuple[str, ...] = (
    "cc0",
    "cc-zero",
    "public domain",
    "pd-",
    "cc-by",
    "cc by",
    "cc-by-sa",
    "cc by-sa",
    "creative commons",
)

WIKIMEDIA_HOSTS = (
    "upload.wikimedia.org",
    "commons.wikimedia.org",
)


def is_allowed_license(license_name: str | None) -> bool:
    if not license_name:
        return False
    normalized = license_name.casefold()
    return any(marker in normalized for marker in ALLOWED_LICENSE_MARKERS)


def is_wikimedia_host(url: str) -> bool:
    try:
        host = urlparse(url).netloc.casefold()
    except ValueError:
        return False
    return any(wikimedia_host in host for wikimedia_host in WIKIMEDIA_HOSTS)


def normalize_commons_file_title(value: str) -> str:
    text = value.strip()
    if text.startswith("http://") or text.startswith("https://"):
        text = unquote(text.rsplit("/", 1)[-1])
    if text.startswith("File:"):
        return text
    return f"File:{text}"


def _commons_api(params: dict[str, str]) -> dict[str, Any]:
    response = requests.get(
        COMMONS_API,
        params={**params, "format": "json"},
        timeout=30,
        headers={"User-Agent": USER_AGENT},
    )
    response.raise_for_status()
    payload = response.json()
    if not isinstance(payload, dict):
        raise ValueError("Unexpected Commons API payload")
    return payload


def resolve_commons_file(
    file_title: str,
    *,
    confidence: float,
    source: str,
) -> dict[str, Any] | None:
    """Return download metadata for a Commons file title."""
    title = normalize_commons_file_title(file_title)
    payload = _commons_api(
        {
            "action": "query",
            "titles": title,
            "prop": "imageinfo",
            "iiprop": "url|extmetadata",
        }
    )
    pages = payload.get("query", {}).get("pages", {})
    if not isinstance(pages, dict):
        return None

    for page in pages.values():
        if not isinstance(page, dict):
            continue
        imageinfo = page.get("imageinfo")
        if not isinstance(imageinfo, list) or not imageinfo:
            continue
        info = imageinfo[0]
        if not isinstance(info, dict):
            continue
        download_url = info.get("url")
        if not isinstance(download_url, str) or not download_url:
            continue

        extmetadata = info.get("extmetadata") or {}
        license_name = None
        if isinstance(extmetadata, dict):
            license_short = extmetadata.get("LicenseShortName")
            if isinstance(license_short, dict):
                license_name = str(license_short.get("value") or "").strip() or None

        if license_name and not is_allowed_license(license_name):
            logger.debug("[Images] Rejected Commons file %s license=%s", title, license_name)
            return None

        return {
            "source": source,
            "source_label": title,
            "download_url": download_url,
            "license_name": license_name,
            "confidence": confidence,
            "file_title": title,
        }

    return None


def resolve_direct_wikimedia_url(url: str) -> dict[str, Any] | None:
    """Accept direct Wikimedia upload URLs when the license cannot be verified."""
    if not is_wikimedia_host(url):
        return None
    file_name = unquote(url.rsplit("/", 1)[-1])
    return {
        "source": "osm_image_url",
        "source_label": url,
        "download_url": url,
        "license_name": "Wikimedia hosted",
        "confidence": 0.85,
        "file_title": file_name,
    }


def search_commons_by_name(name: str, *, limit: int = 3) -> dict[str, Any] | None:
    """Search Commons for a file matching a place name (low confidence)."""
    query = re.sub(r"\s+", " ", name.strip())
    if len(query) < 3:
        return None

    payload = _commons_api(
        {
            "action": "query",
            "list": "search",
            "srsearch": query,
            "srnamespace": "6",
            "srlimit": str(limit),
        }
    )
    results = payload.get("query", {}).get("search", [])
    if not isinstance(results, list):
        return None

    for item in results:
        if not isinstance(item, dict):
            continue
        title = item.get("title")
        if not isinstance(title, str):
            continue
        resolved = resolve_commons_file(title, confidence=0.55, source="commons_search")
        if resolved is not None:
            return resolved

    return None
