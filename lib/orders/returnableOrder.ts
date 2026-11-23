import { getProduct } from "@/lib/data/categories"
import { isSnapshot } from "@/lib/measurements/fields"
import { returnable, type Returnable } from "./returns"

export function returnableOrder(
  order: {
    status: string
    history: { status: string; changedAt: Date | string }[]
    items: { id: string; slug: string; name: string; size: string; color: string | null; quantity: number; measurements: unknown }[]
  },
  now: Date = new Date()
): Returnable | null {
  return returnable(
    {
      status: order.status,
      history: order.history,
      items: order.items.map((i) => ({
        id: i.id,
        name: i.name,
        size: i.size,
        color: i.color,
        quantity: i.quantity,
        madeToMeasure: isSnapshot(i.measurements),
        sizes: getProduct(i.slug)?.sizes ?? [],
      })),
    },
    now
  )
}
