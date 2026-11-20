-- AlterTable
ALTER TABLE "Order" ADD COLUMN "sellerLegalName" TEXT,
ADD COLUMN "sellerTradeName" TEXT,
ADD COLUMN "sellerAddress" TEXT,
ADD COLUMN "sellerStateCode" TEXT,
ADD COLUMN "sellerEmail" TEXT,
ADD COLUMN "sellerPhone" TEXT;

-- Invoices already issued keep the seller details they show today
UPDATE "Order"
SET "sellerLegalName" = 'Piyush Bholla',
    "sellerTradeName" = 'Piyush Bholla Label',
    "sellerAddress" = E'N-37A, Vijay Vihar, Uttam Nagar\nDelhi 110059',
    "sellerStateCode" = '07',
    "sellerEmail" = 'piyushbhollalabel@gmail.com',
    "sellerPhone" = '+91 9821818352'
WHERE "invoiceNumber" IS NOT NULL AND "sellerGstin" = '07FSKPB8774F1ZD';
