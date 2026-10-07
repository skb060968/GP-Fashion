

import crypto from "crypto"
import type { NextRequest } from "next/server"
import { isAdminRequest } from "./adminAuth"
import { getUserFromRequest } from "./userSession"

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

export async function canReadOrder(req: NextRequest, orderCode: string, owner: OrderOwner): Promise<boolean> {
  if (isValidOrderToken(orderCode, req.nextUrl.searchParams.get("t"))) return true

  const user = await getUserFromRequest(req)
  if (user) {
    if (owner.userId && owner.userId === user.id) return true
    if (owner.email && owner.email.toLowerCase() === user.email.toLowerCase()) return true
  }

  return isAdminRequest(req)
}
