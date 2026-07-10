"""data.gouv.fr provider for municipal cooling-space datasets."""

from __future__ import annotations

import csv
import io
import json
import logging
from typing import Any, Iterator
from urllib.parse import urlparse

import requests
from tqdm import tqdm

from freshy.config import DATAGOUV_API_BASE, DATAGOUV_SEARCH_QUERIES
from freshy.geo import extract_lat_lon_from_record
from freshy.models import StagedPlace
from freshy.seeder.builder import build_from_datagouv

logger = logging.getLogger(__name__)

REQUEST_TIMEOUT = 60
USER_AGENT = "freshy-seeder/0.1 (Freshy; contact: dev@freshy.app)"


def _request_json(url: str, params: dict[str, Any] | None = None) -> dict[str, Any]:
    response = requests.get(
        url,
        params=params,
        timeout=REQUEST_TIMEOUT,
        headers={"User-Agent": USER_AGENT},
    )
    response.raise_for_status()
    data = response.json()
    if not isinstance(data, dict):
        raise ValueError(f"Expected JSON object from {url}")
    return data


def _request_text(url: str) -> str:
    response = requests.get(url, timeout=REQUEST_TIMEOUT, headers={"User-Agent": USER_AGENT})
    response.raise_for_status()
    return response.text


def search_datasets() -> list[dict[str, Any]]:
    """Search data.gouv.fr for cooling-space datasets."""
    datasets: dict[str, dict[str, Any]] = {}

    for query in DATAGOUV_SEARCH_QUERIES:
        logger.info('[DataGouv] Searching datasets for query="%s"', query)
        try:
            payload = _request_json(
                f"{DATAGOUV_API_BASE}/datasets/",
                params={"q": query, "page_size": 50},
            )
        except requests.RequestException as exc:
            logger.warning('[DataGouv] Search failed for query="%s": %s', query, exc)
            continue

        for item in payload.get("data", []):
            if isinstance(item, dict) and item.get("id"):
                datasets[str(item["id"])] = item

    logger.info("[DataGouv] Discovered %d unique datasets", len(datasets))
    return list(datasets.values())


def _iter_resources(dataset: dict[str, Any]) -> Iterator[dict[str, Any]]:
    resources = dataset.get("resources") or []
    if not resources and dataset.get("id"):
        try:
            detail = _request_json(f"{DATAGOUV_API_BASE}/datasets/{dataset['id']}/")
            resources = detail.get("resources") or []
        except requests.RequestException as exc:
            logger.warning("[DataGouv] Failed to load dataset detail %s: %s", dataset.get("id"), exc)
            return

    for resource in resources:
        if isinstance(resource, dict):
            yield resource


def _resource_url(resource: dict[str, Any]) -> str | None:
    for key in ("url", "file_url", "latest"):
        value = resource.get(key)
        if isinstance(value, str) and value.startswith("http"):
            return value
    return None


def _parse_csv_records(text: str) -> list[dict[str, str]]:
    sample = text[:4096]
    delimiter = ";" if sample.count(";") > sample.count(",") else ","
    reader = csv.DictReader(io.StringIO(text), delimiter=delimiter)
    return [dict(row) for row in reader]


def _parse_json_records(text: str) -> list[dict[str, Any]]:
    data = json.loads(text)
    if isinstance(data, list):
        return [item for item in data if isinstance(item, dict)]
    if isinstance(data, dict):
        for key in ("results", "records", "features", "data", "rows"):
            value = data.get(key)
            if isinstance(value, list):
                records: list[dict[str, Any]] = []
                for item in value:
                    if isinstance(item, dict):
                        if item.get("type") == "Feature" and isinstance(item.get("geometry"), dict):
                            props = dict(item.get("properties") or {})
                            props["geometry"] = item["geometry"]
                            records.append(props)
                        else:
                            records.append(item)
                return records
    return []


def _record_name(record: dict[str, Any], fallback: str) -> str:
    for key in (
        "name",
        "nom",
        "title",
        "titre",
        "libelle",
        "libellé",
        "denomination",
        "site",
        "equipement",
    ):
        value = record.get(key)
        if value and str(value).strip():
            return str(value).strip()[:120]
    return fallback


def _record_id(dataset_id: str, record: dict[str, Any], index: int) -> str:
    for key in ("id", "identifiant", "code", "uuid", "recordid", "record_id"):
        value = record.get(key)
        if value not in (None, ""):
            return f"datagouv:{dataset_id}:{value}"
    return f"datagouv:{dataset_id}:{index}"


def fetch_datagouv_places(
    region_key: str | None = None,
    reserved_slugs: set[str] | None = None,
) -> list[StagedPlace]:
    """
    Fetch and normalize cooling-space records from data.gouv.fr.

    region_key is used for metadata tagging; dataset search is France-wide.
    """
    slug_registry = reserved_slugs if reserved_slugs is not None else set()
    datasets = search_datasets()
    places: list[StagedPlace] = []
    seen_ids: set[str] = set()

    dataset_bar = tqdm(datasets, desc="[DataGouv] Processing datasets", unit="dataset")
    for dataset in dataset_bar:
        dataset_id = str(dataset.get("id", "unknown"))
        dataset_title = str(dataset.get("title") or dataset_id)
        dataset_bar.set_postfix(title=dataset_title[:40])

        for resource in _iter_resources(dataset):
            url = _resource_url(resource)
            if not url:
                continue

            fmt = str(resource.get("format") or "").lower()
            path = urlparse(url).path.lower()
            is_csv = fmt == "csv" or path.endswith(".csv")
            is_json = fmt in {"json", "geojson"} or path.endswith((".json", ".geojson"))
            if not is_csv and not is_json:
                continue

            logger.info("[DataGouv] Downloading resource %s (%s)", resource.get("title"), url)
            try:
                text = _request_text(url)
            except requests.RequestException as exc:
                logger.warning("[DataGouv] Download failed for %s: %s", url, exc)
                continue

            if not text.strip():
                logger.warning("[DataGouv] Empty payload from %s", url)
                continue

            try:
                records = _parse_csv_records(text) if is_csv else _parse_json_records(text)
            except (json.JSONDecodeError, csv.Error) as exc:
                logger.warning("[DataGouv] Parse error for %s: %s", url, exc)
                continue

            for index, record in enumerate(
                tqdm(records, desc=f"[DataGouv] Parsing {dataset_title[:30]}", leave=False, unit="row")
            ):
                coords = extract_lat_lon_from_record(record)
                if coords is None:
                    continue

                lat, lon = coords
                place_id = _record_id(dataset_id, record, index)
                if place_id in seen_ids:
                    continue
                seen_ids.add(place_id)

                name = _record_name(record, f"Cooling space ({dataset_title[:40]})")
                places.append(
                    build_from_datagouv(
                        place_id=place_id,
                        name=name,
                        latitude=lat,
                        longitude=lon,
                        region_key=region_key,
                        dataset_id=dataset_id,
                        dataset_title=dataset_title,
                        resource_url=url,
                        record=record,
                        reserved_slugs=slug_registry,
                    )
                )

    logger.info("[DataGouv] Found %d places", len(places))
    return places
