

ALTER TABLE "Order" ADD COLUMN     "orderCode" TEXT NOT NULL;

CREATE UNIQUE INDEX "Order_orderCode_key" ON "Order"("orderCode");
