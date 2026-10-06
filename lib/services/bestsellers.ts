// lib/services/bestsellers.ts
// Top-selling products per category, from real orders. Until a category has
// enough sales, falls back to the products flagged `bestseller: true` in
// catalogue meta.json.

import { prisma } from "@/lib/prisma"
import { getCategoryProducts, type CategorySlug, type Product } from "@/lib/data/categories"
import { OrderStatus } from "@prisma/client"

/** Orders in these states don't count towards sales. */
const EXCLUDED_STATUSES: OrderStatus[] = ["REJECTED", "CANCELLED", "REFUNDED"]
/** Sales window. */
export const BESTSELLER_WINDOW_DAYS = 90
/** How many products a bestsellers page shows. */
export const BESTSELLER_LIMIT = 8
/** Below this many distinct products sold, the manual flags are used instead. */
export const BESTSELLER_MIN_PRODUCTS = 4

/** Units sold per product slug in the window. Pure given its input, so it is testable. */
export function rankBySales<T extends { slug: string }>(pool: T[], unitsBySlug: Map<string, number>, limit = BESTSELLER_LIMIT): T[] {
  return pool
    .filter((p) => (unitsBySlug.get(p.slug) ?? 0) > 0)
    .sort((a, b) => (unitsBySlug.get(b.slug) ?? 0) - (unitsBySlug.get(a.slug) ?? 0))
    .slice(0, limit)
}

/** Manual fallback: products flagged in meta.json, in catalogue order. */
export function manualBestsellers(pool: Product[], limit = BESTSELLER_LIMIT): Product[] {
  return pool.filter((p) => p.bestseller).slice(0, limit)
}

async function unitsSoldSince(since: Date): Promise<Map<string, number>> {
  const rows = await prisma.orderItem.groupBy({
    by: ["slug"],
    _sum: { quantity: true },
    where: {
      order: {
        createdAt: { gte: since },
        status: { notIn: EXCLUDED_STATUSES },
      },
    },
  })
  return new Map(rows.map((r) => [r.slug, r._sum.quantity ?? 0]))
}

/**
 * Bestsellers for a category. Returns the source so the page can say whether
 * the list is based on sales. Database errors fall back to the manual list
 * rather than failing the page.
 */
export async function getBestsellers(category: CategorySlug): Promise<{ products: Product[]; source: "sales" | "manual" }> {
  const pool = getCategoryProducts(category)
  if (pool.length === 0) return { products: [], source: "manual" }

  try {
    const since = new Date(Date.now() - BESTSELLER_WINDOW_DAYS * 86_400_000)
    const ranked = rankBySales(pool, await unitsSoldSince(since))
    if (ranked.length >= BESTSELLER_MIN_PRODUCTS) return { products: ranked, source: "sales" }
  } catch (err) {
    console.error("bestsellers: falling back to manual list", err)
  }

  return { products: manualBestsellers(pool), source: "manual" }
}
