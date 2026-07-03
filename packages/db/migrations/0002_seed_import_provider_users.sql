-- Seeder places reference createdById = 'osm' | 'datagouv'. Ensure User rows exist for Studio joins.
INSERT OR IGNORE INTO "User" ("id", "email", "displayName", "username", "updatedAt")
VALUES
  ('osm', 'osm@import.freshy', 'OpenStreetMap Import', 'osm-import', CURRENT_TIMESTAMP),
  ('datagouv', 'datagouv@import.freshy', 'data.gouv Import', 'datagouv-import', CURRENT_TIMESTAMP);
