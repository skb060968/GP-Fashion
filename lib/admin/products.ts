import { prisma } from "@/lib/prisma"
import { categoryMeta, getAllProducts, getClassification } from "@/lib/data/categories"
import type { OrderStatus } from "@prisma/client"

export const OPEN_ORDER_STATUSES: OrderStatus[] = ["UNDER_VERIFICATION", "VERIFIED", "PROCESSING"]

export type AdminProduct = {
  slug: string
  name: string
  category: string
  classification: string
  price: number
  coverThumbnail: string
  hidden: boolean
  hiddenAt: string | null
}

export type ProductUsage = { bags: number; wishlists: number; openOrders: number }

export async function listAdminProducts(): Promise<AdminProduct[]> {
  const rows = await prisma.hiddenProduct.findMany()
  const hiddenAt = new Map(rows.map((row) => [row.slug, row.hiddenAt.toISOString()]))
  return getAllProducts().map((product) => ({
    slug: product.slug,
    name: product.name,
    category: categoryMeta[product.category].title,
    classification: getClassification(product.classification)?.title ?? product.classification,
    price: product.price,
    coverThumbnail: product.coverThumbnail,
    hidden: hiddenAt.has(product.slug),
    hiddenAt: hiddenAt.get(product.slug) ?? null,
  }))
}

export async function productUsage(slug: string): Promise<ProductUsage> {
  const [bagOwners, wishlists, openOrders] = await Promise.all([
    prisma.bagItem.groupBy({ by: ["userId"], where: { slug } }),
    prisma.wishlistItem.count({ where: { slug } }),
    prisma.order.count({ where: { status: { in: OPEN_ORDER_STATUSES }, items: { some: { slug } } } }),
  ])
  return { bags: bagOwners.length, wishlists, openOrders }
}
