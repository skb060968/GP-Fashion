ALTER TABLE "OrderItem" ADD COLUMN "measurements" JSONB;
ALTER TABLE "OrderItem" ADD COLUMN "measurementsConfirmedAt" TIMESTAMP(3);
ALTER TABLE "OrderItem" ADD COLUMN "measurementsConfirmNote" TEXT;

ALTER TABLE "BagItem" ADD COLUMN "profileId" TEXT;
ALTER TABLE "BagItem" ADD COLUMN "profileName" TEXT;

DROP INDEX "BagItem_userId_slug_size_color_key";

CREATE UNIQUE INDEX "BagItem_userId_slug_size_color_profileId_key" ON "BagItem"("userId", "slug", "size", "color", "profileId");
