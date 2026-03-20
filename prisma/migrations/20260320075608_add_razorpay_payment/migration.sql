-- AlterEnum
ALTER TYPE "PaymentMethod" ADD VALUE 'RAZORPAY';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "razorpayOrderId" TEXT,
ADD COLUMN     "razorpayPaymentId" TEXT;
