import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { createRateLimiter } from "@/lib/security/rateLimiter"
import { orderAccessToken } from "@/lib/security/orderAccess"

const limiter = createRateLimiter({ windowMs: 15 * 60 * 1000, maxRequests: 20 })

const schema = z.object({
  orderCode: z.string().trim().regex(/^\d{5,8}$/),
  phone: z.string().trim().regex(/^\d{10}$/),
})

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown"
  const rate = limiter.check(ip)
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please wait a few minutes." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
    )
  }

  const parsed = schema.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter your order number and the 10-digit mobile number used at checkout." }, { status: 400 })
  }
  const { orderCode, phone } = parsed.data

  try {
    const order = await prisma.order.findUnique({
      where: { orderCode },
      include: { address: true, items: true, history: { select: { status: true }, orderBy: { changedAt: "asc" } } },
    })

    if (!order || !order.address || order.address.phone !== phone) {
      return NextResponse.json({ error: "We couldn't find an order with those details." }, { status: 404 })
    }

    return NextResponse.json({
      orderCode: order.orderCode,
      status: order.status,
      amount: order.amount,
      createdAt: order.createdAt,

      accessToken: orderAccessToken(order.orderCode),
      history: order.history,
      items: order.items.map((item) => ({
        id: item.id,
        name: item.name,
        size: item.size,
        price: item.price,
        quantity: item.quantity,
      })),
    })
  } catch (error) {
    console.error("TRACK ORDER ERROR:", error)
    return NextResponse.json({ error: "Failed to track order" }, { status: 500 })
  }
}
