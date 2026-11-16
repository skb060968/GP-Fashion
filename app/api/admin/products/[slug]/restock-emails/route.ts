import { NextRequest, NextResponse, after } from "next/server"
import { requireAdminMutation } from "@/lib/security/adminAuth"
import { getProduct } from "@/lib/data/categories"
import { productStatus, waitingCount } from "@/lib/admin/products"
import { sendRestockEmails } from "@/lib/catalog/restock"

type Params = { params: Promise<{ slug: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  const denied = await requireAdminMutation(req)
  if (denied) return denied

  const { slug } = await params
  const product = getProduct(slug)
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 })

  try {
    const { status } = await productStatus(slug)
    if (status !== "AVAILABLE") {
      return NextResponse.json({ error: `Make ${product.name} available before emailing the waiting customers.` }, { status: 409 })
    }
    const emailing = await waitingCount(slug)
    if (emailing > 0) after(() => sendRestockEmails(slug))
    return NextResponse.json({ slug, emailing })
  } catch (error) {
    console.error("ADMIN RESTOCK EMAIL ERROR:", error)
    return NextResponse.json({ error: "Could not start the emails" }, { status: 500 })
  }
}
