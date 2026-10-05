// lib/admin/couponStatus.ts
// Derived coupon state and summary text, shared by the API filter and the admin UI.

import type { Prisma } from "@prisma/client"

export type CouponLike = {
  discountType: "PERCENTAGE" | "FIXED"
  discountValue: number
  minOrderAmount: number | null
  maxUses: number | null
  currentUses: number
  expiresAt: Date | string | null
  isActive: boolean
}

export type CouponState = "ACTIVE" | "INACTIVE" | "EXPIRED" | "EXHAUSTED"

export const COUPON_STATE_LABEL: Record<CouponState, string> = {
  ACTIVE: "Active",
  INACTIVE: "Paused",
  EXPIRED: "Expired",
  EXHAUSTED: "Used up",
}

export function couponState(c: CouponLike, now = new Date()): CouponState {
  if (!c.isActive) return "INACTIVE"
  if (c.expiresAt && new Date(c.expiresAt) < now) return "EXPIRED"
  if (c.maxUses !== null && c.currentUses >= c.maxUses) return "EXHAUSTED"
  return "ACTIVE"
}

/** Prisma `where` fragment that matches a derived state. */
export function couponStateWhere(state: CouponState, now = new Date()): Prisma.CouponWhereInput {
  switch (state) {
    case "INACTIVE":
      return { isActive: false }
    case "EXPIRED":
      return { isActive: true, expiresAt: { lt: now } }
    case "EXHAUSTED":
      // Prisma can't compare two columns directly; callers post-filter for this.
      return { isActive: true, maxUses: { not: null }, OR: [{ expiresAt: null }, { expiresAt: { gte: now } }] }
    case "ACTIVE":
      return { isActive: true, OR: [{ expiresAt: null }, { expiresAt: { gte: now } }] }
  }
}

const rupees = (paise: number) => `₹${(paise / 100).toLocaleString("en-IN")}`

/** "15% off" / "₹500 off" */
export function discountSummary(c: Pick<CouponLike, "discountType" | "discountValue">) {
  return c.discountType === "PERCENTAGE" ? `${c.discountValue}% off` : `${rupees(c.discountValue)} off`
}

/** "on orders over ₹5,000" or "" */
export function minOrderSummary(c: Pick<CouponLike, "minOrderAmount">) {
  return c.minOrderAmount ? `on orders over ${rupees(c.minOrderAmount)}` : ""
}
