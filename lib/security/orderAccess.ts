// lib/security/orderAccess.ts
// Who may read a given order (and its invoice).
//
// Order codes are short and sequential, so knowing one must not be enough to
// see the customer's address. A reader must present one of:
//   1. an admin session cookie,
//   2. a customer session whose account owns the order (by userId or email),
//   3. an access token: HMAC(orderCode) handed out only to someone who has
//      already proven ownership (the checkout that created the order, or a
//      successful track-order lookup with the matching phone number).

import crypto from "crypto"
import type { NextRequest } from "next/server"
import { isAdminRequest } from "./adminAuth"
import { getUserFromRequest } from "./userSession"

/** Dedicated secret preferred; otherwise derived from the database URL, which is also secret and stable. */
function secret(): string {
  const s = process.env.ORDER_ACCESS_SECRET || process.env.DATABASE_URL
  if (!s) throw new Error("ORDER_ACCESS_SECRET or DATABASE_URL must be set")
  return crypto.createHash("sha256").update(`order-access:${s}`).digest("hex")
}

export function orderAccessToken(orderCode: string): string {
  return crypto.createHmac("sha256", secret()).update(orderCode).digest("hex").slice(0, 32)
}

export function isValidOrderToken(orderCode: string, token: string | null | undefined): boolean {
  if (!token || token.length !== 32) return false
  const a = Buffer.from(orderAccessToken(orderCode))
  const b = Buffer.from(token)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

export type OrderOwner = { userId: string | null; email: string | null }

/**
 * True when the request may read this order. `owner` comes from the order row
 * so the caller decides which fields to load.
 */
export async function canReadOrder(req: NextRequest, orderCode: string, owner: OrderOwner): Promise<boolean> {
  if (isValidOrderToken(orderCode, req.nextUrl.searchParams.get("t"))) return true

  const user = await getUserFromRequest(req)
  if (user) {
    if (owner.userId && owner.userId === user.id) return true
    if (owner.email && owner.email.toLowerCase() === user.email.toLowerCase()) return true
  }

  return isAdminRequest(req)
}
