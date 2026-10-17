ALTER TABLE "OrderItem" ADD COLUMN "color" TEXT;

ALTER TABLE "BagItem" ADD COLUMN "color" TEXT;

DROP INDEX "BagItem_userId_slug_size_key";

CREATE UNIQUE INDEX "BagItem_userId_slug_size_color_key" ON "BagItem"("userId", "slug", "size", "color");
