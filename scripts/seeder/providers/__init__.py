"""Data providers for freshy-seeder."""

from seeder.providers.datagouv import fetch_datagouv_places
from seeder.providers.osm import fetch_osm_places

__all__ = ["fetch_datagouv_places", "fetch_osm_places"]
