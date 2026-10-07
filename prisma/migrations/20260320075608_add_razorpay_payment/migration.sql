
ALTER TYPE "PaymentMethod" ADD VALUE 'RAZORPAY';

ALTER TABLE "Order" ADD COLUMN     "razorpayOrderId" TEXT,
ADD COLUMN     "razorpayPaymentId" TEXT;
