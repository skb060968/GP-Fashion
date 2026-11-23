import { NextResponse, after, type NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { canReadOrder, orderAccessToken } from "@/lib/security/orderAccess"
import { requireSameOriginJson } from "@/lib/security/adminAuth"
import { createRateLimiter } from "@/lib/security/rateLimiter"
import { returnRequestSchema } from "@/lib/validation/schemas"
import { buildOrderEmailData, requestReturn, ReturnRequestError } from "@/lib/services/orderStatusService"
import { sendMail } from "@/lib/mailer"
import { orderStatusEmailCustomer } from "@/lib/emails/orderStatusEmailCustomer"
import { returnRequestedEmailAdmin } from "@/lib/emails/returnRequested"

const limiter = createRateLimiter({ windowMs: 15 * 60 * 1000, maxRequests: 10 })

export async function POST(req: NextRequest, context: { params: Promise<{ orderId: string }> }) {
  const invalid = requireSameOriginJson(req)
  if (invalid) return invalid

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown"
  const rate = limiter.check(ip)
  if (!rate.allowed) {
    return NextResponse.json({ error: "Too many attempts. Please wait a few minutes." }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } })
  }

  try {
    const { orderId } = await context.params
    const owner = await prisma.order.findUnique({ where: { orderCode: orderId }, select: { orderCode: true, userId: true, address: { select: { email: true } } } })
    if (!owner || !(await canReadOrder(req, owner.orderCode, { userId: owner.userId, email: owner.address?.email ?? null }))) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    const parsed = returnRequestSchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Please check the request and try again." }, { status: 400 })
    }

    let updated
    try {
      updated = await requestReturn(owner.orderCode, parsed.data)
    } catch (err) {
      if (err instanceof ReturnRequestError) return NextResponse.json({ error: err.message }, { status: err.status })
      throw err
    }
    if (!updated) return NextResponse.json({ error: "Order not found" }, { status: 404 })

    const data = { ...buildOrderEmailData(updated), accessToken: orderAccessToken(updated.orderCode) }
    const to = updated.address?.email
    after(async () => {
      const jobs: Promise<unknown>[] = []
      if (to) {
        const { subject, html } = orderStatusEmailCustomer(data)
        jobs.push(sendMail({ to, subject, html }))
      }
      if (process.env.ADMIN_EMAIL) {
        const { subject, html } = returnRequestedEmailAdmin(data)
        jobs.push(sendMail({ to: process.env.ADMIN_EMAIL, subject, html }))
      }
      for (const r of await Promise.allSettled(jobs)) if (r.status === "rejected") console.error("RETURN_EMAIL_FAILED:", r.reason)
    })

    return NextResponse.json({ status: updated.status, emailed: Boolean(to) })
  } catch (error) {
    console.error("RETURN_REQUEST_ERROR:", error)
    return NextResponse.json({ error: "We couldn't send your request. Please try again." }, { status: 500 })
  }
}
