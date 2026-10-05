import type { CouponState } from "@/lib/admin/couponStatus"

export interface Coupon {
  id: string
  code: string
  discountType: "PERCENTAGE" | "FIXED"
  discountValue: number
  minOrderAmount: number | null
  maxUses: number | null
  currentUses: number
  expiresAt: string | null
  isActive: boolean
  createdAt: string
  state: CouponState
}
