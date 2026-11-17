ALTER TABLE "Address" ADD COLUMN     "stateCode" TEXT NOT NULL;

ALTER TABLE "Order" ADD COLUMN     "buyerGstin" TEXT,
ADD COLUMN     "buyerName" TEXT,
ADD COLUMN     "cgst" INTEGER NOT NULL,
ADD COLUMN     "igst" INTEGER NOT NULL,
ADD COLUMN     "invoiceDate" TIMESTAMP(3),
ADD COLUMN     "invoiceNumber" TEXT,
ADD COLUMN     "placeOfSupply" TEXT NOT NULL,
ADD COLUMN     "sellerGstin" TEXT,
ADD COLUMN     "sgst" INTEGER NOT NULL,
ADD COLUMN     "subtotal" INTEGER NOT NULL,
ADD COLUMN     "taxableValue" INTEGER NOT NULL;

ALTER TABLE "OrderItem" ADD COLUMN     "discount" INTEGER NOT NULL,
ADD COLUMN     "gstRate" INTEGER NOT NULL,
ADD COLUMN     "hsn" TEXT NOT NULL,
ADD COLUMN     "taxAmount" INTEGER NOT NULL,
ADD COLUMN     "taxableValue" INTEGER NOT NULL;

CREATE TABLE "InvoiceCounter" (
    "financialYear" TEXT NOT NULL,
    "last" INTEGER NOT NULL,

    CONSTRAINT "InvoiceCounter_pkey" PRIMARY KEY ("financialYear")
);

CREATE UNIQUE INDEX "Order_invoiceNumber_key" ON "Order"("invoiceNumber");
