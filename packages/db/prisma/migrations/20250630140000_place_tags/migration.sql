-- Rename amenities column to tags (catalog defined in packages/config/place-tags.yaml)
ALTER TABLE "Place" RENAME COLUMN "amenities" TO "tags";
