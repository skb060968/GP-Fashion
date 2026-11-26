CREATE TABLE "Purchase" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "supplierName" TEXT NOT NULL,
    "supplierGstin" TEXT,
    "supplierStateCode" TEXT,
    "billNumber" TEXT,
    "billKey" TEXT,
    "description" TEXT NOT NULL,
    "taxableValue" INTEGER NOT NULL,
    "igst" INTEGER NOT NULL DEFAULT 0,
    "cgst" INTEGER NOT NULL DEFAULT 0,
    "sgst" INTEGER NOT NULL DEFAULT 0,
    "claimItc" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "orderId" TEXT,
    "challanId" TEXT,

    CONSTRAINT "Purchase_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Gstr2bImport" (
    "id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "gstin" TEXT NOT NULL,
    "generatedOn" TEXT,
    "fileName" TEXT,
    "docs" JSONB NOT NULL,
    "other" JSONB,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Gstr2bImport_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "GstFiling" ADD COLUMN "itcSaved" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "Purchase_date_idx" ON "Purchase"("date");

CREATE INDEX "Purchase_orderId_idx" ON "Purchase"("orderId");

CREATE INDEX "Purchase_challanId_idx" ON "Purchase"("challanId");

CREATE INDEX "Purchase_supplierGstin_billKey_idx" ON "Purchase"("supplierGstin", "billKey");

CREATE UNIQUE INDEX "Gstr2bImport_period_key" ON "Gstr2bImport"("period");

ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_challanId_fkey" FOREIGN KEY ("challanId") REFERENCES "JobWorkChallan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
