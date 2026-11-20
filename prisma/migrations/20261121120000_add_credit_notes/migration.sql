CREATE TABLE "CreditNote" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "taxableValue" INTEGER NOT NULL,
    "cgst" INTEGER NOT NULL,
    "sgst" INTEGER NOT NULL,
    "igst" INTEGER NOT NULL,
    "placeOfSupply" TEXT NOT NULL,
    "buyerGstin" TEXT,
    "buyerName" TEXT,
    "invoiceNumber" TEXT NOT NULL,
    "invoiceDate" TIMESTAMP(3) NOT NULL,
    "invoiceAmount" INTEGER NOT NULL,
    "sellerGstin" TEXT NOT NULL,
    "sellerLegalName" TEXT NOT NULL,
    "sellerTradeName" TEXT NOT NULL,
    "sellerAddress" TEXT NOT NULL,
    "sellerStateCode" TEXT NOT NULL,
    "sellerEmail" TEXT NOT NULL,
    "sellerPhone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "orderId" TEXT NOT NULL,

    CONSTRAINT "CreditNote_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CreditNoteItem" (
    "id" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "color" TEXT,
    "hsn" TEXT NOT NULL,
    "gstRate" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "taxableValue" INTEGER NOT NULL,
    "taxAmount" INTEGER NOT NULL,
    "creditNoteId" TEXT NOT NULL,

    CONSTRAINT "CreditNoteItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CreditNote_number_key" ON "CreditNote"("number");

CREATE INDEX "CreditNote_orderId_idx" ON "CreditNote"("orderId");

CREATE INDEX "CreditNote_date_idx" ON "CreditNote"("date");

CREATE INDEX "CreditNoteItem_creditNoteId_idx" ON "CreditNoteItem"("creditNoteId");

ALTER TABLE "CreditNote" ADD CONSTRAINT "CreditNote_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CreditNoteItem" ADD CONSTRAINT "CreditNoteItem_creditNoteId_fkey" FOREIGN KEY ("creditNoteId") REFERENCES "CreditNote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
