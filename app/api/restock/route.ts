import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getProduct } from "@/lib/data/categories"
import { getProductStatusLists } from "@/lib/catalog/visibility"
import { requireSameOriginJson } from "@/lib/security/adminAuth"
import { createRateLimiter } from "@/lib/security/rateLimiter"

const limiter = createRateLimiter({ windowMs: 10 * 60 * 1000, maxRequests: 10 })

const bodySchema = z.object({
  slug: z.string().min(1).max(100),
  email: z.string().trim().toLowerCase().email().max(200),
})

export async function POST(req: NextRequest) {
  const invalid = requireSameOriginJson(req)
  if (invalid) return invalid

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown"
  const rate = limiter.check(ip)
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
    )
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 })
  const { slug, email } = parsed.data

  const product = getProduct(slug)
  const { hidden, soldOut } = await getProductStatusLists()
  if (!product || hidden.includes(slug)) return NextResponse.json({ error: "This piece is no longer available." }, { status: 404 })
  if (!soldOut.includes(slug)) return NextResponse.json({ error: "Good news: this piece is available to order now." }, { status: 409 })

  try {
    await prisma.restockRequest.upsert({ where: { slug_email: { slug, email } }, create: { slug, email }, update: {} })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("RESTOCK REQUEST ERROR:", error)
    return NextResponse.json({ error: "Could not save your request. Please try again." }, { status: 500 })
  }
}
