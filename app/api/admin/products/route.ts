import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/security/adminAuth"
import { listAdminProducts } from "@/lib/admin/products"

export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req)
  if (denied) return denied

  try {
    return NextResponse.json({ products: await listAdminProducts() })
  } catch (error) {
    console.error("ADMIN PRODUCTS LIST ERROR:", error)
    return NextResponse.json({ error: "Could not load products" }, { status: 500 })
  }
}
