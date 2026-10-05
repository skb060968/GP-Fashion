-- AlterTable: internal notes + last-updated on orders
ALTER TABLE "Order" ADD COLUMN     "notes" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable: optional reason on each status change
ALTER TABLE "StatusHistory" ADD COLUMN     "note" TEXT;
