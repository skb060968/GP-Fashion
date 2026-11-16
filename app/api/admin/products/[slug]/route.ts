import { NextRequest, NextResponse, after } from "next/server"
import { z } from "zod"
import { requireAdmin, requireAdminMutation } from "@/lib/security/adminAuth"
import { getProduct } from "@/lib/data/categories"
import { PRODUCT_STATUSES, productUsage, setProductStatus, waitingCount } from "@/lib/admin/products"
import { refreshStorefront } from "@/lib/catalog/visibility"
import { sendRestockEmails } from "@/lib/catalog/restock"

type Params = { params: Promise<{ slug: string }> }

const bodySchema = z.object({ status: z.enum(PRODUCT_STATUSES), notifyWaiting: z.boolean().optional() })

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
    const result = await setProductStatus(slug, parsed.data.status)
    refreshStorefront()
    const waiting = await waitingCount(slug)
    const emailing = result.status === "AVAILABLE" && parsed.data.notifyWaiting ? waiting : 0
    if (emailing > 0) after(() => sendRestockEmails(slug))
    return NextResponse.json({ slug, ...result, waiting, emailing })
  } catch (error) {
    console.error("ADMIN PRODUCT STATUS ERROR:", error)
    return NextResponse.json({ error: `Could not update ${product.name}` }, { status: 500 })
  }
}
