"""Wrangler CLI helpers for Cloudflare D1 execute commands."""

from __future__ import annotations

import json
import logging
import shutil
import subprocess
from typing import Any

from freshy.config import REPO_ROOT, WRANGLER_BIN, WRANGLER_CWD

logger = logging.getLogger(__name__)


def sql_literal(value: str | None) -> str:
    if value is None:
        return "NULL"
    return "'" + value.replace("'", "''") + "'"


def wrangler_command(args: list[str]) -> list[str]:
    """Resolve wrangler without pnpm exec to avoid stderr noise and exit-code quirks."""
    if WRANGLER_BIN.is_file():
        return [str(WRANGLER_BIN), *args]
    if shutil.which("wrangler"):
        return ["wrangler", *args]
    if shutil.which("pnpm"):
        return ["pnpm", "--filter", "@freshy/api", "exec", "wrangler", *args]
    raise RuntimeError(
        "wrangler not found. From repo root run: pnpm install && pnpm --filter @freshy/api install"
    )


def run_wrangler(args: list[str]) -> subprocess.CompletedProcess[str]:
    command = wrangler_command(args)
    cwd = WRANGLER_CWD if WRANGLER_BIN.is_file() else REPO_ROOT
    logger.debug("[D1] Running: %s (cwd=%s)", " ".join(command), cwd)
    return subprocess.run(
        command,
        cwd=cwd,
        capture_output=True,
        text=True,
        check=False,
    )


def format_wrangler_failure(result: subprocess.CompletedProcess[str]) -> str:
    parts: list[str] = [f"exit code {result.returncode}"]
    stdout = result.stdout.strip()
    stderr = result.stderr.strip()
    if stdout:
        parts.append(f"stdout: {stdout[-2000:]}")
    if stderr:
        parts.append(f"stderr: {stderr[-2000:]}")
    if result.returncode != 0 and "not authenticated" in (stdout + stderr).lower():
        parts.append("hint: run `wrangler login` or set CLOUDFLARE_API_TOKEN")
    return " | ".join(parts)


def parse_wrangler_json(stdout: str) -> list[dict[str, Any]]:
    """Parse wrangler d1 execute --json output into row dicts."""
    rows: list[dict[str, Any]] = []
    text = stdout.strip()
    if not text:
        return rows

    try:
        payload = json.loads(text)
    except json.JSONDecodeError:
        logger.debug("[D1] wrangler stdout is not JSON; falling back to line parsing")
        for line in stdout.splitlines():
            line = line.strip()
            if not line.startswith("{"):
                continue
            try:
                item = json.loads(line)
            except json.JSONDecodeError:
                continue
            if isinstance(item, dict) and ("id" in item or "latitude" in item):
                rows.append(item)
        return rows

    entries = payload if isinstance(payload, list) else [payload]
    for entry in entries:
        if not isinstance(entry, dict):
            continue
        result_rows = entry.get("results")
        if not isinstance(result_rows, list):
            continue
        for item in result_rows:
            if not isinstance(item, dict):
                continue
            if "results" in item and isinstance(item["results"], list):
                rows.extend(r for r in item["results"] if isinstance(r, dict))
            elif "id" in item or "latitude" in item or "slug" in item:
                rows.append(item)

    return rows
