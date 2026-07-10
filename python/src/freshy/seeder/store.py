"""Local SQLite staging store using the D1 Place schema."""

from __future__ import annotations

import logging
import sqlite3
from pathlib import Path

from tqdm import tqdm

from freshy.config import LOCAL_PLACES_SCHEMA
from freshy.models import PLACE_COLUMNS, StagedPlace

logger = logging.getLogger(__name__)

PLACE_SELECT = ", ".join(f'"{column}"' for column in PLACE_COLUMNS)
PLACE_INSERT_COLUMNS = ", ".join(f'"{column}"' for column in PLACE_COLUMNS)
PLACE_INSERT_PLACEHOLDERS = ", ".join("?" for _ in PLACE_COLUMNS)
PLACE_UPSERT_SET = ", ".join(
    f'"{column}" = excluded."{column}"' for column in PLACE_COLUMNS if column not in ("id", "createdAt")
)


class LocalStore:
    """Manage freshy_local.db as a D1-shaped Place staging database."""

    def __init__(self, db_path: Path) -> None:
        self.db_path = db_path
        self._conn: sqlite3.Connection | None = None

    def connect(self) -> sqlite3.Connection:
        if self._conn is None:
            self.db_path.parent.mkdir(parents=True, exist_ok=True)
            self._conn = sqlite3.connect(self.db_path)
            self._conn.row_factory = sqlite3.Row
        return self._conn

    def close(self) -> None:
        if self._conn is not None:
            self._conn.close()
            self._conn = None

    def initialize(self) -> None:
        conn = self.connect()
        legacy = conn.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='places'"
        ).fetchone()
        if legacy:
            logger.warning(
                "[SQLite] Dropping legacy places table; local DB now uses D1-shaped Place"
            )
            conn.execute("DROP TABLE places")
        conn.executescript(LOCAL_PLACES_SCHEMA)
        conn.commit()
        logger.info("[SQLite] Initialized D1-shaped Place schema at %s", self.db_path)

    def load_reserved_slugs(self) -> set[str]:
        return self._load_reserved_slugs()

    def _load_reserved_slugs(self) -> set[str]:
        conn = self.connect()
        rows = conn.execute('SELECT "slug" FROM "Place"').fetchall()
        return {str(row["slug"]) for row in rows}

    def wipe_provider(self, provider_user_id: str) -> int:
        conn = self.connect()
        cursor = conn.execute('DELETE FROM "Place" WHERE "createdById" = ?', (provider_user_id,))
        conn.commit()
        deleted = cursor.rowcount
        logger.info("[SQLite] Wiped %d rows for createdById=%s", deleted, provider_user_id)
        return deleted

    def upsert_places(self, places: list[StagedPlace]) -> int:
        if not places:
            logger.warning("[SQLite] No places to upsert")
            return 0

        conn = self.connect()
        sql = f"""
            INSERT INTO "Place" ({PLACE_INSERT_COLUMNS})
            VALUES ({PLACE_INSERT_PLACEHOLDERS})
            ON CONFLICT("id") DO UPDATE SET
                {PLACE_UPSERT_SET}
        """
        inserted = 0
        for place in tqdm(places, desc='[SQLite] Upserting Place rows', unit="place"):
            conn.execute(sql, place.to_row())
            inserted += 1
        conn.commit()
        logger.info(
            '[SQLite] Upserted %d Place rows with status IMPORTED into %s',
            inserted,
            self.db_path,
        )
        return inserted

    def fetch_all(self) -> list[sqlite3.Row]:
        conn = self.connect()
        rows = conn.execute(f'SELECT {PLACE_SELECT} FROM "Place" ORDER BY "id"').fetchall()
        logger.info("[SQLite] Loaded %d staged Place rows for sync", len(rows))
        return rows

    def count_by_provider(self) -> dict[str, int]:
        conn = self.connect()
        rows = conn.execute(
            'SELECT "createdById", COUNT(*) AS count FROM "Place" GROUP BY "createdById" ORDER BY "createdById"'
        ).fetchall()
        return {str(row["createdById"]): int(row["count"]) for row in rows}
