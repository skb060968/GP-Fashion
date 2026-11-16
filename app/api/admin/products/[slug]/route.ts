import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireAdmin, requireAdminMutation } from "@/lib/security/adminAuth"
import { getProduct } from "@/lib/data/categories"
import { productUsage } from "@/lib/admin/products"
import { refreshStorefront } from "@/lib/catalog/visibility"

type Params = { params: Promise<{ slug: string }> }

const bodySchema = z.object({ hidden: z.boolean() })

export async function GET(req: NextRequest, { params }: Params) {
  const denied = await requireAdmin(req)
  if (denied) return denied

  const { slug } = await params
  if (!getProduct(slug)) return NextResponse.json({ error: "Product not found" }, { status: 404 })

  try {
    return NextResponse.json({ usage: await productUsage(slug) })
  } catch (error) {
    console.error("ADMIN PRODUCT USAGE ERROR:", error)
    return NextResponse.json({ error: "Could not count bags and wishlists" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const denied = await requireAdminMutation(req)
  if (denied) return denied

  const { slug } = await params
  const product = getProduct(slug)
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 })

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 })

  try {
    let hiddenAt: string | null = null
    if (parsed.data.hidden) {
      const row = await prisma.hiddenProduct.upsert({ where: { slug }, create: { slug }, update: {} })
      hiddenAt = row.hiddenAt.toISOString()
    } else {
      await prisma.hiddenProduct.deleteMany({ where: { slug } })
    }
    refreshStorefront()
    return NextResponse.json({ slug, hidden: parsed.data.hidden, hiddenAt })
  } catch (error) {
    console.error("ADMIN PRODUCT VISIBILITY ERROR:", error)
    return NextResponse.json({ error: `Could not update ${product.name}` }, { status: 500 })
  }
}
