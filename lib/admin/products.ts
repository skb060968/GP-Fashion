import { prisma } from "@/lib/prisma"
import { categoryMeta, getAllProducts, getClassification } from "@/lib/data/categories"
import type { OrderStatus } from "@prisma/client"

export const OPEN_ORDER_STATUSES: OrderStatus[] = ["UNDER_VERIFICATION", "VERIFIED", "PROCESSING"]

export const PRODUCT_STATUSES = ["AVAILABLE", "SOLD_OUT", "HIDDEN"] as const
export type ProductStatus = (typeof PRODUCT_STATUSES)[number]

export type AdminProduct = {
  slug: string
  name: string
  category: string
  classification: string
  price: number
  coverThumbnail: string
  status: ProductStatus
  since: string | null
  waiting: number
}

export type ProductUsage = { bags: number; wishlists: number; openOrders: number; waiting: number }

export async function productStatus(slug: string): Promise<{ status: ProductStatus; since: string | null }> {
  const [hidden, soldOut] = await Promise.all([
    prisma.hiddenProduct.findUnique({ where: { slug } }),
    prisma.soldOutProduct.findUnique({ where: { slug } }),
  ])
  if (hidden) return { status: "HIDDEN", since: hidden.hiddenAt.toISOString() }
  if (soldOut) return { status: "SOLD_OUT", since: soldOut.soldOutAt.toISOString() }
  return { status: "AVAILABLE", since: null }
}

export async function setProductStatus(slug: string, status: ProductStatus): Promise<{ status: ProductStatus; since: string | null }> {
  await prisma.$transaction([
    status === "HIDDEN"
      ? prisma.hiddenProduct.upsert({ where: { slug }, create: { slug }, update: {} })
      : prisma.hiddenProduct.deleteMany({ where: { slug } }),
    status === "SOLD_OUT"
      ? prisma.soldOutProduct.upsert({ where: { slug }, create: { slug }, update: {} })
      : prisma.soldOutProduct.deleteMany({ where: { slug } }),
  ])
  return productStatus(slug)
}

export async function waitingCount(slug: string): Promise<number> {
  return prisma.restockRequest.count({ where: { slug } })
}

export async function listAdminProducts(): Promise<AdminProduct[]> {
  const [hiddenRows, soldOutRows, waitingRows] = await Promise.all([
    prisma.hiddenProduct.findMany(),
    prisma.soldOutProduct.findMany(),
    prisma.restockRequest.groupBy({ by: ["slug"], _count: { _all: true } }),
  ])
  const hiddenAt = new Map(hiddenRows.map((row) => [row.slug, row.hiddenAt.toISOString()]))
  const soldOutAt = new Map(soldOutRows.map((row) => [row.slug, row.soldOutAt.toISOString()]))
  const waiting = new Map(waitingRows.map((row) => [row.slug, row._count._all]))

  return getAllProducts().map((product) => {
    const status: ProductStatus = hiddenAt.has(product.slug) ? "HIDDEN" : soldOutAt.has(product.slug) ? "SOLD_OUT" : "AVAILABLE"
    return {
      slug: product.slug,
      name: product.name,
      category: categoryMeta[product.category].title,
      classification: getClassification(product.classification)?.title ?? product.classification,
      price: product.price,
      coverThumbnail: product.coverThumbnail,
      status,
      since: status === "HIDDEN" ? hiddenAt.get(product.slug)! : status === "SOLD_OUT" ? soldOutAt.get(product.slug)! : null,
      waiting: waiting.get(product.slug) ?? 0,
    }
  })
}

export async function productUsage(slug: string): Promise<ProductUsage> {
  const [bagOwners, wishlists, openOrders, waiting] = await Promise.all([
    prisma.bagItem.groupBy({ by: ["userId"], where: { slug } }),
    prisma.wishlistItem.count({ where: { slug } }),
    prisma.order.count({ where: { status: { in: OPEN_ORDER_STATUSES }, items: { some: { slug } } } }),
    waitingCount(slug),
  ])
  return { bags: bagOwners.length, wishlists, openOrders, waiting }
}
