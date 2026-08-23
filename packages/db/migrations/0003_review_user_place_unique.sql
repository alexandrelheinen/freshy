-- One climate review per user and place. Keep the newest duplicate when cleaning up.
DELETE FROM "Review"
WHERE "rowid" NOT IN (
  SELECT MAX("rowid") FROM "Review" GROUP BY "userId", "placeId"
);

CREATE UNIQUE INDEX "Review_userId_placeId_key" ON "Review"("userId", "placeId");
