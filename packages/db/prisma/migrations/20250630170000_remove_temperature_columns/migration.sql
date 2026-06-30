-- Drop redundant temperature columns; freshness level is the sole cooling metric
ALTER TABLE "Place" DROP COLUMN "aggregatedTemperatureC";
ALTER TABLE "Review" DROP COLUMN "temperatureC";
