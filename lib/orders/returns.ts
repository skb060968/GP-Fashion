export const RETURN_WINDOW_DAYS = 7

export const RETURN_REASONS = {
  WRONG_SIZE: "Wrong size",
  OTHER_PIECE: "Would like a different piece",
  DAMAGED: "Arrived damaged",
  WRONG_ITEM: "Wrong item sent",
} as const

export const RETURN_RESOLUTIONS = {
  SIZE: "Exchange for another size",
  PIECE: "Exchange for a different piece",
  REFUND: "Refund",
} as const

export type ReturnReason = keyof typeof RETURN_REASONS
export type ReturnResolution = keyof typeof RETURN_RESOLUTIONS

export const REFUND_REASONS: ReturnReason[] = ["DAMAGED", "WRONG_ITEM"]
export const PHOTO_REASONS: ReturnReason[] = ["DAMAGED", "WRONG_ITEM"]

export type ReturnableItem = { id: string; name: string; size: string; color: string | null; quantity: number; sizes: string[] }

export type Returnable = { deadline: string; items: ReturnableItem[] }

export type ReturnRequestItem = {
  orderItemId: string
  name: string
  size: string
  color: string | null
  quantity: number
  exchangeSize: string | null
}

export class ReturnRequestError extends Error {
  constructor(message: string, public status = 400) {
    super(message)
  }
}

const IST = 330 * 60 * 1000
const DAY = 24 * 60 * 60 * 1000

export function deliveredAt(history: { status: string; changedAt: Date | string }[]): Date | null {
  const first = history
    .filter((h) => h.status === "DELIVERED")
    .map((h) => new Date(h.changedAt))
    .sort((a, b) => a.getTime() - b.getTime())[0]
  return first ?? null
}

export function returnDeadline(delivered: Date): Date {
  const ist = new Date(delivered.getTime() + IST)
  const dayStart = Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate()) - IST
  return new Date(dayStart + (RETURN_WINDOW_DAYS + 1) * DAY)
}

export function returnable(
  order: {
    status: string
    history: { status: string; changedAt: Date | string }[]
    items: { id: string; name: string; size: string; color: string | null; quantity: number; madeToMeasure: boolean; sizes: string[] }[]
  },
  now: Date = new Date()
): Returnable | null {
  if (order.status !== "DELIVERED") return null
  const delivered = deliveredAt(order.history)
  if (!delivered) return null
  const deadline = returnDeadline(delivered)
  if (now.getTime() >= deadline.getTime()) return null
  const items = order.items
    .filter((i) => !i.madeToMeasure)
    .map((i) => ({ id: i.id, name: i.name, size: i.size, color: i.color, quantity: i.quantity, sizes: i.sizes.filter((s) => s !== i.size) }))
  return items.length ? { deadline: deadline.toISOString(), items } : null
}

export type ReturnRequestInput = {
  reason: ReturnReason
  resolution: ReturnResolution
  note?: string
  items: { orderItemId: string; quantity: number; exchangeSize?: string }[]
}

export function checkReturnRequest(allowed: Returnable, input: ReturnRequestInput): ReturnRequestItem[] {
  if (input.resolution === "REFUND" && !REFUND_REASONS.includes(input.reason)) {
    throw new ReturnRequestError("A refund is only offered for a damaged piece or a wrong item. Choose an exchange instead.")
  }
  if (input.resolution === "PIECE" && !input.note?.trim()) {
    throw new ReturnRequestError("Tell us which piece you would like instead.")
  }
  const byId = new Map(allowed.items.map((i) => [i.id, i]))
  const seen = new Set<string>()
  const out: ReturnRequestItem[] = []
  for (const r of input.items) {
    if (r.quantity === 0) continue
    const item = byId.get(r.orderItemId)
    if (!item) throw new ReturnRequestError("One of the chosen pieces cannot be returned from this order.")
    if (seen.has(item.id)) throw new ReturnRequestError(`${item.name} is listed twice.`)
    seen.add(item.id)
    if (!Number.isInteger(r.quantity) || r.quantity < 0 || r.quantity > item.quantity) {
      throw new ReturnRequestError(`Choose up to ${item.quantity} of ${item.name}.`)
    }
    let exchangeSize: string | null = null
    if (input.resolution === "SIZE") {
      if (!r.exchangeSize || !item.sizes.includes(r.exchangeSize)) throw new ReturnRequestError(`Choose the new size for ${item.name}.`)
      exchangeSize = r.exchangeSize
    }
    out.push({ orderItemId: item.id, name: item.name, size: item.size, color: item.color, quantity: r.quantity, exchangeSize })
  }
  if (out.length === 0) throw new ReturnRequestError("Choose at least one piece.")
  return out
}

export function itemLine(i: ReturnRequestItem): string {
  return `${i.name}, size ${i.size}${i.color ? `, ${i.color}` : ""} × ${i.quantity}${i.exchangeSize ? ` → size ${i.exchangeSize}` : ""}`
}

export function describeReturn(r: { reason: string; resolution: string; note: string | null; items: unknown }) {
  const items = Array.isArray(r.items) ? (r.items as ReturnRequestItem[]) : []
  return {
    reason: RETURN_REASONS[r.reason as ReturnReason] ?? r.reason,
    resolution: RETURN_RESOLUTIONS[r.resolution as ReturnResolution] ?? r.resolution,
    items: items.map(itemLine),
    note: r.note,
    photos: PHOTO_REASONS.includes(r.reason as ReturnReason),
  }
}

export function returnHistoryNote(r: { reason: string; resolution: string; note: string | null; items: unknown }): string {
  const d = describeReturn(r)
  return [`Customer request: ${d.reason}. ${d.resolution}.`, d.items.join("; "), d.note ? `Note: ${d.note}` : ""]
    .filter(Boolean)
    .join(" ")
    .slice(0, 500)
}
