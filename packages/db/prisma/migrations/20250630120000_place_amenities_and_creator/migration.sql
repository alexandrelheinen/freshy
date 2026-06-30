-- CreateEnum
CREATE TYPE "PlaceStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- AlterTable
ALTER TABLE "Place" ADD COLUMN "amenities" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "createdById" TEXT,
ADD COLUMN "status" "PlaceStatus" NOT NULL DEFAULT 'PUBLISHED';

-- CreateIndex
CREATE INDEX "Place_createdById_idx" ON "Place"("createdById");

-- AddForeignKey
ALTER TABLE "Place" ADD CONSTRAINT "Place_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
