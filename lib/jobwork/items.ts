import { itemSizeLabel } from "@/lib/measurements/fields"
import { needsChallan, type ChallanItem } from "./challan"

export type OrderItemForChallan = { id: string; name: string; slug: string; size: string; color: string | null; quantity: number; measurements?: unknown }

export function challanItems(items: OrderItemForChallan[]): ChallanItem[] {
  return items.map((i) => ({
    id: i.id,
    name: i.name,
    detail: [itemSizeLabel(i), i.color].filter(Boolean).join(" · "),
    quantity: i.quantity,
    needsChallan: needsChallan(i.slug),
  }))
}
