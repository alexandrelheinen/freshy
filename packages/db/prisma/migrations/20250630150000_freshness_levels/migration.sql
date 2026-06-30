-- Replace AcStrength with FreshnessLevel (five-level cooling classification)
CREATE TYPE "FreshnessLevel" AS ENUM (
  'NONE',
  'GOOD_VENTILATION',
  'MODEST_AC',
  'VERY_COLD_AC',
  'NATURALLY_FRESH'
);

ALTER TABLE "Place" ADD COLUMN "aggregatedFreshnessLevel" "FreshnessLevel";

UPDATE "Place"
SET "aggregatedFreshnessLevel" = CASE "aggregatedAcStrength"
  WHEN 'LIGHTLY_COOLED' THEN 'GOOD_VENTILATION'::"FreshnessLevel"
  WHEN 'COMFORTABLE' THEN 'MODEST_AC'::"FreshnessLevel"
  WHEN 'FRIGID' THEN 'VERY_COLD_AC'::"FreshnessLevel"
  ELSE NULL
END;

ALTER TABLE "Place" DROP COLUMN "aggregatedAcStrength";
DROP TYPE "AcStrength";
