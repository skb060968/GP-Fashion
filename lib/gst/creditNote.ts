export type CreditableItem = {
  id: string
  name: string
  size: string
  color: string | null
  hsn: string
  gstRate: number
  quantity: number
  taxableValue: number
  taxAmount: number
}

export type CreditedSoFar = { orderItemId: string; quantity: number; taxableValue: number; taxAmount: number }

export type CreditLine = {
  orderItemId: string
  name: string
  size: string
  color: string | null
  hsn: string
  gstRate: number
  quantity: number
  taxableValue: number
  taxAmount: number
}

export type CreditTotals = { taxableValue: number; cgst: number; sgst: number; igst: number; amount: number }

export class CreditNoteError extends Error {
  constructor(message: string, public status = 400) {
    super(message)
  }
}

export function creditNoteNumber(financialYear: string, sequence: number): string {
  return `CN/${financialYear}/${String(sequence).padStart(3, "0")}`
}

export const creditNoteSlug = (number: string) => number.replace(/\//g, "-")

export function creditNoteFromSlug(slug: string): string | null {
  const m = /^CN-(\d{2}-\d{2})-(\d{3,})$/.exec(slug.replace(/\.pdf$/i, ""))
  return m ? `CN/${m[1]}/${m[2]}` : null
}

export const creditNoteFileName = (number: string) => `Credit-Note-${creditNoteSlug(number)}`

export function remainingQuantities(
  items: { id: string; quantity: number }[],
  credited: { orderItemId: string; quantity: number }[]
): Map<string, number> {
  const out = new Map(items.map((i) => [i.id, i.quantity]))
  for (const c of credited) out.set(c.orderItemId, (out.get(c.orderItemId) ?? 0) - c.quantity)
  return out
}

export function creditLines(items: CreditableItem[], credited: CreditedSoFar[], requested: { orderItemId: string; quantity: number }[]): CreditLine[] {
  const byId = new Map(items.map((i) => [i.id, i]))
  const sum = new Map<string, { quantity: number; taxableValue: number; taxAmount: number }>()
  for (const c of credited) {
    const s = sum.get(c.orderItemId) ?? { quantity: 0, taxableValue: 0, taxAmount: 0 }
    s.quantity += c.quantity
    s.taxableValue += c.taxableValue
    s.taxAmount += c.taxAmount
    sum.set(c.orderItemId, s)
  }
  const seen = new Set<string>()
  const lines: CreditLine[] = []
  for (const r of requested) {
    if (!Number.isInteger(r.quantity) || r.quantity < 0) throw new CreditNoteError("Quantities must be whole numbers")
    if (r.quantity === 0) continue
    const item = byId.get(r.orderItemId)
    if (!item) throw new CreditNoteError("An item on the credit note is not on this order")
    if (seen.has(item.id)) throw new CreditNoteError(`${item.name} is listed twice`)
    seen.add(item.id)
    const done = sum.get(item.id) ?? { quantity: 0, taxableValue: 0, taxAmount: 0 }
    const left = item.quantity - done.quantity
    if (r.quantity > left) {
      throw new CreditNoteError(left > 0 ? `Only ${left} of ${item.name} can still be credited` : `${item.name} has already been credited in full`)
    }
    const all = r.quantity === left
    lines.push({
      orderItemId: item.id,
      name: item.name,
      size: item.size,
      color: item.color,
      hsn: item.hsn,
      gstRate: item.gstRate,
      quantity: r.quantity,
      taxableValue: all ? item.taxableValue - done.taxableValue : Math.round((item.taxableValue * r.quantity) / item.quantity),
      taxAmount: all ? item.taxAmount - done.taxAmount : Math.round((item.taxAmount * r.quantity) / item.quantity),
    })
  }
  if (lines.length === 0) throw new CreditNoteError("Choose at least one item to credit")
  return lines
}

export function creditTotals(lines: Pick<CreditLine, "taxableValue" | "taxAmount">[], intraState: boolean): CreditTotals {
  const t = { taxableValue: 0, cgst: 0, sgst: 0, igst: 0, amount: 0 }
  for (const l of lines) {
    const cgst = intraState ? Math.round(l.taxAmount / 2) : 0
    t.taxableValue += l.taxableValue
    t.cgst += cgst
    t.sgst += intraState ? l.taxAmount - cgst : 0
    t.igst += intraState ? 0 : l.taxAmount
    t.amount += l.taxableValue + l.taxAmount
  }
  return t
}

export function creditNoteDeadline(invoiceDate: Date | string): Date {
  const ist = new Date(new Date(invoiceDate).getTime() + 330 * 60 * 1000)
  const fyEnd = ist.getUTCMonth() >= 3 ? ist.getUTCFullYear() + 1 : ist.getUTCFullYear()
  return new Date(Date.UTC(fyEnd, 11, 1) - 330 * 60 * 1000)
}
