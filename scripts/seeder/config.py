"""Configuration constants for freshy-seeder."""

from __future__ import annotations

from pathlib import Path

# Overpass API
OVERPASS_URLS = (
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
)
OVERPASS_TIMEOUT_SECONDS = 120
OVERPASS_REQUEST_TIMEOUT = 150
OVERPASS_MAX_RETRIES = 4
OVERPASS_RETRY_BASE_SECONDS = 5
OVERPASS_INTER_QUERY_SLEEP_SECONDS = 2

# Each strategy runs as its own Overpass request to avoid gateway timeouts on large regions.
OSM_QUERY_STRATEGIES: tuple[tuple[str, str], ...] = (
    ("air_conditioning", 'nwr["air_conditioning"="yes"](area.search_area);'),
    ("library", 'nwr["amenity"="library"](area.search_area);'),
    ("cinema", 'nwr["amenity"="cinema"](area.search_area);'),
    ("museum", 'nwr["tourism"="museum"](area.search_area);'),
)

# data.gouv.fr API
DATAGOUV_API_BASE = "https://www.data.gouv.fr/api/1"
DATAGOUV_SEARCH_QUERIES = (
    "lieux climatisés",
    "salles rafraîchies",
    "salles rafraichies",
    "espaces rafraîchis",
)

# Local SQLite staging database (SDD schema)
DEFAULT_DB_PATH = Path("freshy_local.db")

# D1 sync defaults
DEFAULT_D1_DATABASE = "freshy-db"
SYNC_BATCH_SIZE = 50
DUPLICATE_RADIUS_KM = 0.05

# Monorepo layout: scripts/seeder/config.py -> repo root is parents[2]
REPO_ROOT = Path(__file__).resolve().parents[2]
SCRIPTS_DIR = Path(__file__).resolve().parents[1]
WRANGLER_CWD = REPO_ROOT / "packages" / "api"
WRANGLER_BIN = WRANGLER_CWD / "node_modules" / ".bin" / "wrangler"

# French administrative regions for Overpass area filters (ISO 3166-2)
FRANCE_REGIONS: dict[str, dict[str, str]] = {
    "all": {"scope": "country", "iso3166_1": "FR", "label": "France (metropolitan)"},
    "Île-de-France": {"scope": "region", "iso3166_2": "FR-IDF", "label": "Île-de-France"},
    "Auvergne-Rhône-Alpes": {"scope": "region", "iso3166_2": "FR-ARA", "label": "Auvergne-Rhône-Alpes"},
    "Bourgogne-Franche-Comté": {
        "scope": "region",
        "iso3166_2": "FR-BFC",
        "label": "Bourgogne-Franche-Comté",
    },
    "Bretagne": {"scope": "region", "iso3166_2": "FR-BRE", "label": "Bretagne"},
    "Centre-Val de Loire": {"scope": "region", "iso3166_2": "FR-CVL", "label": "Centre-Val de Loire"},
    "Corse": {"scope": "region", "iso3166_2": "FR-COR", "label": "Corse"},
    "Grand Est": {"scope": "region", "iso3166_2": "FR-GES", "label": "Grand Est"},
    "Hauts-de-France": {"scope": "region", "iso3166_2": "FR-HDF", "label": "Hauts-de-France"},
    "Normandie": {"scope": "region", "iso3166_2": "FR-NOR", "label": "Normandie"},
    "Nouvelle-Aquitaine": {
        "scope": "region",
        "iso3166_2": "FR-NAQ",
        "label": "Nouvelle-Aquitaine",
    },
    "Occitanie": {"scope": "region", "iso3166_2": "FR-OCC", "label": "Occitanie"},
    "Pays de la Loire": {"scope": "region", "iso3166_2": "FR-PDL", "label": "Pays de la Loire"},
    "Provence-Alpes-Côte d'Azur": {
        "scope": "region",
        "iso3166_2": "FR-PAC",
        "label": "Provence-Alpes-Côte d'Azur",
    },
}

# Known provider dummy user ids (must exist in remote D1 User table before sync).
SEEDER_PROVIDER_USER_IDS = ("osm", "datagouv")

LOCAL_PLACES_SCHEMA = """
CREATE TABLE IF NOT EXISTS "Place" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "latitude" REAL NOT NULL,
    "longitude" REAL NOT NULL,
    "address" TEXT,
    "photoUrl" TEXT,
    "aggregatedFreshnessLevel" TEXT,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "isOpen" BOOLEAN NOT NULL DEFAULT 1,
    "createdById" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'IMPORTED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "Place_slug_key" ON "Place"("slug");
CREATE INDEX IF NOT EXISTS "Place_category_idx" ON "Place"("category");
CREATE INDEX IF NOT EXISTS "Place_latitude_longitude_idx" ON "Place"("latitude", "longitude");
CREATE INDEX IF NOT EXISTS "Place_createdById_idx" ON "Place"("createdById");
"""
