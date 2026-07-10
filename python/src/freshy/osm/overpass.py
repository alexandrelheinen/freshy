"""Overpass API client with retries and mirror fallbacks."""

from __future__ import annotations

import logging
import time
from typing import Any

import requests

from freshy.config import (
    OVERPASS_MAX_RETRIES,
    OVERPASS_REQUEST_TIMEOUT,
    OVERPASS_RETRY_BASE_SECONDS,
    OVERPASS_URLS,
)

logger = logging.getLogger(__name__)

USER_AGENT = "freshy/0.1 (Freshy; contact: dev@freshy.app)"
RETRYABLE_HTTP_STATUS = {429, 502, 503, 504}


def execute_overpass(query: str, strategy_name: str) -> dict[str, Any]:
    """POST to Overpass with retries, backoff, and mirror fallbacks."""
    last_error: str | None = None

    for url in OVERPASS_URLS:
        for attempt in range(1, OVERPASS_MAX_RETRIES + 1):
            try:
                logger.debug(
                    "[Overpass] POST strategy=%s endpoint=%s attempt=%d/%d",
                    strategy_name,
                    url,
                    attempt,
                    OVERPASS_MAX_RETRIES,
                )
                response = requests.post(
                    url,
                    data={"data": query},
                    timeout=OVERPASS_REQUEST_TIMEOUT,
                    headers={"User-Agent": USER_AGENT},
                )

                if response.status_code in RETRYABLE_HTTP_STATUS:
                    wait = OVERPASS_RETRY_BASE_SECONDS * (2 ** (attempt - 1))
                    logger.warning(
                        "[Overpass] %s returned HTTP %d for strategy=%s; retry in %ds (attempt %d/%d)",
                        url,
                        response.status_code,
                        strategy_name,
                        wait,
                        attempt,
                        OVERPASS_MAX_RETRIES,
                    )
                    last_error = f"HTTP {response.status_code} from {url}"
                    time.sleep(wait)
                    continue

                response.raise_for_status()
                payload = response.json()
                if not isinstance(payload, dict):
                    raise ValueError(f"Unexpected Overpass payload type from {url}")
                return payload

            except requests.Timeout:
                wait = OVERPASS_RETRY_BASE_SECONDS * (2 ** (attempt - 1))
                logger.warning(
                    "[Overpass] Timeout from %s for strategy=%s; retry in %ds (attempt %d/%d)",
                    url,
                    strategy_name,
                    wait,
                    attempt,
                    OVERPASS_MAX_RETRIES,
                )
                last_error = f"timeout from {url}"
                time.sleep(wait)
            except requests.RequestException as exc:
                wait = OVERPASS_RETRY_BASE_SECONDS * (2 ** (attempt - 1))
                logger.warning(
                    "[Overpass] Request error from %s for strategy=%s: %s; retry in %ds (attempt %d/%d)",
                    url,
                    strategy_name,
                    exc,
                    wait,
                    attempt,
                    OVERPASS_MAX_RETRIES,
                )
                last_error = str(exc)
                time.sleep(wait)

        logger.warning(
            "[Overpass] Exhausted retries on %s for strategy=%s; trying next endpoint",
            url,
            strategy_name,
        )

    raise RuntimeError(
        f"Overpass API failed for strategy={strategy_name} after all endpoints and retries"
        + (f": {last_error}" if last_error else "")
    )
