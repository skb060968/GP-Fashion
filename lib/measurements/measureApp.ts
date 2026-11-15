import type { ProductCategory } from "@/lib/data/shop"
import { KINDS_FOR_CATEGORY, PERSON_KINDS, isSnapshot, type PersonKind } from "./fields"

export type PatternSnapshot = {
  app: PersonKind
  garment: string
  name: string
  options: Record<string, string>
}

export function isPattern(v: unknown): v is PatternSnapshot {
  if (!v || typeof v !== "object") return false
  const p = v as Record<string, unknown>
  return PERSON_KINDS.includes(p.app as PersonKind) && typeof p.garment === "string" && (!p.options || typeof p.options === "object")
}

export type MeasureAppItem = {
  slug: string
  name: string
  size: string
  pattern?: unknown
  measurements?: unknown
}

export type MeasureAppPayload = {
  category: PersonKind
  product: string
  productName: string
  garment?: string
  options?: Record<string, string>
  size?: string
  values?: Record<string, number>
  notes?: string | null
  customer: string
  source: string
}

export function measureAppPayload(orderCode: string, item: MeasureAppItem, productCategory: ProductCategory | null): MeasureAppPayload | null {
  const snapshot = isSnapshot(item.measurements) ? item.measurements : null
  const pattern = isPattern(item.pattern) ? item.pattern : null
  const category = snapshot?.kind ?? pattern?.app ?? (productCategory ? KINDS_FOR_CATEGORY[productCategory][0] : undefined)
  if (!category) return null
  const who = snapshot ? snapshot.name : `size ${item.size}`
  return {
    category,
    product: item.slug,
    productName: item.name,
    ...(pattern ? { garment: pattern.garment, options: pattern.options } : {}),
    ...(snapshot ? { values: snapshot.values, notes: snapshot.notes } : { size: item.size }),
    customer: `${who} · order ${orderCode}`.slice(0, 60),
    source: `${item.name}, order ${orderCode}`,
  }
}
