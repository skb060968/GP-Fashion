CREATE TABLE "Tailor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "city" TEXT NOT NULL,
    "stateCode" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "gstin" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tailor_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "JobWorkChallan" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "pieces" JSONB NOT NULL,
    "taxableValue" INTEGER NOT NULL,
    "taxAmount" INTEGER NOT NULL,
    "fabricBill" TEXT,
    "ewayBill" TEXT,
    "note" TEXT,
    "tailorName" TEXT NOT NULL,
    "tailorAddress" TEXT NOT NULL,
    "tailorStateCode" TEXT NOT NULL,
    "tailorGstin" TEXT,
    "tailorPhone" TEXT,
    "sellerGstin" TEXT NOT NULL,
    "sellerLegalName" TEXT NOT NULL,
    "sellerTradeName" TEXT NOT NULL,
    "sellerAddress" TEXT NOT NULL,
    "sellerStateCode" TEXT NOT NULL,
    "sellerEmail" TEXT NOT NULL,
    "sellerPhone" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3),
    "receivedNote" TEXT,
    "receivedEwayBill" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "orderId" TEXT NOT NULL,
    "tailorId" TEXT NOT NULL,

    CONSTRAINT "JobWorkChallan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "JobWorkChallanLine" (
    "id" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "kind" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "hsn" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "taxableValue" INTEGER NOT NULL,
    "gstRate" INTEGER NOT NULL,
    "taxAmount" INTEGER NOT NULL,
    "challanId" TEXT NOT NULL,

    CONSTRAINT "JobWorkChallanLine_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "JobWorkChallan_number_key" ON "JobWorkChallan"("number");

CREATE INDEX "JobWorkChallan_orderId_idx" ON "JobWorkChallan"("orderId");

CREATE INDEX "JobWorkChallan_tailorId_idx" ON "JobWorkChallan"("tailorId");

CREATE INDEX "JobWorkChallan_date_idx" ON "JobWorkChallan"("date");

CREATE INDEX "JobWorkChallan_receivedAt_idx" ON "JobWorkChallan"("receivedAt");

CREATE INDEX "JobWorkChallanLine_challanId_idx" ON "JobWorkChallanLine"("challanId");

ALTER TABLE "JobWorkChallan" ADD CONSTRAINT "JobWorkChallan_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "JobWorkChallan" ADD CONSTRAINT "JobWorkChallan_tailorId_fkey" FOREIGN KEY ("tailorId") REFERENCES "Tailor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "JobWorkChallanLine" ADD CONSTRAINT "JobWorkChallanLine_challanId_fkey" FOREIGN KEY ("challanId") REFERENCES "JobWorkChallan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
