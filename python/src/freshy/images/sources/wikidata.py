"""Wikidata image (P18) lookups."""

from __future__ import annotations

import logging
import re
from typing import Any

import requests

from freshy.images.sources.wikimedia import resolve_commons_file

logger = logging.getLogger(__name__)

WIKIDATA_API = "https://www.wikidata.org/w/api.php"
USER_AGENT = "freshy-images/0.1 (Freshy; contact: dev@freshy.app)"

_QID_PATTERN = re.compile(r"^Q\d+$", re.IGNORECASE)


def normalize_wikidata_id(value: str) -> str | None:
    text = value.strip()
    if _QID_PATTERN.match(text):
        return text.upper()
    if "wikidata.org/wiki/" in text:
        qid = text.rsplit("/", 1)[-1]
        if _QID_PATTERN.match(qid):
            return qid.upper()
    return None


def fetch_wikidata_commons_file(qid: str) -> str | None:
    """Return a Commons file title from Wikidata property P18."""
    response = requests.get(
        WIKIDATA_API,
        params={
            "action": "wbgetentities",
            "ids": qid,
            "props": "claims",
            "format": "json",
        },
        timeout=30,
        headers={"User-Agent": USER_AGENT},
    )
    response.raise_for_status()
    payload = response.json()
    if not isinstance(payload, dict):
        return None

    entity = payload.get("entities", {}).get(qid)
    if not isinstance(entity, dict):
        return None

    claims = entity.get("claims", {})
    if not isinstance(claims, dict):
        return None

    p18 = claims.get("P18")
    if not isinstance(p18, list) or not p18:
        return None

    for claim in p18:
        if not isinstance(claim, dict):
            continue
        mainsnak = claim.get("mainsnak")
        if not isinstance(mainsnak, dict):
            continue
        datavalue = mainsnak.get("datavalue")
        if not isinstance(datavalue, dict):
            continue
        value = datavalue.get("value")
        if isinstance(value, str) and value.strip():
            return value.strip()

    return None


def resolve_wikidata_image(qid: str) -> dict[str, Any] | None:
    normalized = normalize_wikidata_id(qid)
    if normalized is None:
        return None

    file_title = fetch_wikidata_commons_file(normalized)
    if file_title is None:
        logger.debug("[Images] Wikidata %s has no P18 image", normalized)
        return None

    resolved = resolve_commons_file(
        file_title,
        confidence=0.8,
        source="wikidata",
    )
    if resolved is not None:
        resolved["source_label"] = f"{normalized} → {resolved['source_label']}"
    return resolved
