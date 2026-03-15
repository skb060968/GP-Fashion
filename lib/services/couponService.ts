import { prisma } from "@/lib/prisma";

export interface CouponValidationResult {
  valid: boolean;
  discountAmount?: number; // in paise
  error?:
    | "NOT_FOUND"
    | "INACTIVE"
    | "EXPIRED"
    | "USAGE_LIMIT"
    | "MIN_ORDER_NOT_MET";
}

/**
 * Pure discount calculation — exported for testing.
 * percentage: Math.round(subtotal * value / 100)
 * fixed: value (already in paise)
 */
export function calculateDiscount(
  discountType: "PERCENTAGE" | "FIXED",
  discountValue: number,
  orderSubtotal: number
): number {
  if (discountType === "PERCENTAGE") {
    return Math.round((orderSubtotal * discountValue) / 100);
  }
  return discountValue;
}

/**
 * Validates a coupon code against the database and order subtotal.
 * Checks in order: exists → active → not expired → usage limit → min order amount.
 */
export async function validateCoupon(
  code: string,
  orderSubtotal: number
): Promise<CouponValidationResult> {
  const coupon = await prisma.coupon.findUnique({
    where: { code },
  });

  if (!coupon) {
    return { valid: false, error: "NOT_FOUND" };
  }

  if (!coupon.isActive) {
    return { valid: false, error: "INACTIVE" };
  }

  if (coupon.expiresAt && coupon.expiresAt <= new Date()) {
    return { valid: false, error: "EXPIRED" };
  }

  if (coupon.maxUses !== null && coupon.currentUses >= coupon.maxUses) {
    return { valid: false, error: "USAGE_LIMIT" };
  }

  if (
    coupon.minOrderAmount !== null &&
    orderSubtotal < coupon.minOrderAmount
  ) {
    return { valid: false, error: "MIN_ORDER_NOT_MET" };
  }

  const discountAmount = calculateDiscount(
    coupon.discountType,
    coupon.discountValue,
    orderSubtotal
  );

  return { valid: true, discountAmount };
}

/**
 * Increments the currentUses counter for a coupon.
 * Uses Prisma's atomic increment to avoid race conditions.
 */
export async function applyCoupon(code: string): Promise<void> {
  await prisma.coupon.update({
    where: { code },
    data: { currentUses: { increment: 1 } },
  });
}
