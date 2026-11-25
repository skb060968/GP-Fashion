import { categoryOf } from "@/lib/data/categories"
import { IST_OFFSET_MS } from "@/lib/gst/period"

export class ChallanError extends Error {
  constructor(message: string, public status = 400) {
    super(message)
  }
}

export const challanSeries = (financialYear: string) => `JW/${financialYear}`

export function challanNumber(financialYear: string, sequence: number): string {
  return `JW/${financialYear}/${String(sequence).padStart(3, "0")}`
}

export const challanSlug = (number: string) => number.replace(/\//g, "-")

export function challanFromSlug(slug: string): string | null {
  const m = /^JW-(\d{2}-\d{2})-(\d{3,})$/.exec(slug.replace(/\.pdf$/i, ""))
  return m ? `JW/${m[1]}/${m[2]}` : null
}

export const challanFileName = (number: string) => `Job-Work-Challan-${challanSlug(number)}`

export const LINE_KINDS = ["FABRIC", "LINING", "TRIM", "OTHER"] as const
export type LineKind = (typeof LINE_KINDS)[number]
export const LINE_KIND_LABEL: Record<LineKind, string> = { FABRIC: "Fabric", LINING: "Lining", TRIM: "Trims", OTHER: "Other" }

export const UNITS = ["MTR", "PCS", "NOS", "SET", "ROL"] as const
export type Unit = (typeof UNITS)[number]
export const UNIT_LABEL: Record<Unit, string> = { MTR: "m", PCS: "pcs", NOS: "nos", SET: "sets", ROL: "rolls" }
export const UNIT_NAME: Record<Unit, string> = { MTR: "Metres", PCS: "Pieces", NOS: "Numbers", SET: "Sets", ROL: "Rolls" }

export const GST_RATES = [0, 5, 12, 18, 28, 40] as const

export const ISSUE_STATUSES = ["PROCESSING"] as const

export const needsChallan = (slug: string) => categoryOf(slug) !== "accessories"

export type ChallanPiece = { orderItemId: string; name: string; detail: string; quantity: number }

export type ChallanItem = { id: string; name: string; detail: string; quantity: number; needsChallan: boolean }

export type ChallanState = { number: string; pieces: unknown; receivedAt: Date | string | null; cancelledAt: Date | string | null }

export function parsePieces(value: unknown): ChallanPiece[] {
  if (!Array.isArray(value)) return []
  return value.filter(
    (p): p is ChallanPiece =>
      !!p && typeof p === "object" && typeof p.orderItemId === "string" && typeof p.name === "string" && typeof p.quantity === "number"
  ).map((p) => ({ orderItemId: p.orderItemId, name: p.name, detail: typeof p.detail === "string" ? p.detail : "", quantity: p.quantity }))
}

export type ChallanStatus = "open" | "received" | "cancelled"

export const challanStatus = (c: Pick<ChallanState, "receivedAt" | "cancelledAt">): ChallanStatus =>
  c.cancelledAt ? "cancelled" : c.receivedAt ? "received" : "open"

function quantities(challans: ChallanState[], keep: (c: ChallanState) => boolean): Map<string, number> {
  const out = new Map<string, number>()
  for (const c of challans) {
    if (!keep(c)) continue
    for (const p of parsePieces(c.pieces)) out.set(p.orderItemId, (out.get(p.orderItemId) ?? 0) + p.quantity)
  }
  return out
}

export const quantitiesOnChallans = (challans: ChallanState[]) => quantities(challans, (c) => challanStatus(c) !== "cancelled")

export const quantitiesReceived = (challans: ChallanState[]) => quantities(challans, (c) => challanStatus(c) === "received")

export function challanPieces(items: ChallanItem[], challans: ChallanState[], requested: { orderItemId: string; quantity: number }[]): ChallanPiece[] {
  const byId = new Map(items.map((i) => [i.id, i]))
  const used = quantitiesOnChallans(challans)
  const seen = new Set<string>()
  const pieces: ChallanPiece[] = []
  for (const r of requested) {
    const item = byId.get(r.orderItemId)
    if (!item) throw new ChallanError("A piece on this challan is not part of the order")
    if (seen.has(r.orderItemId)) throw new ChallanError(`${item.name} is listed twice`)
    seen.add(r.orderItemId)
    if (!Number.isInteger(r.quantity) || r.quantity < 0) throw new ChallanError(`Enter a whole number of pieces for ${item.name}`)
    if (r.quantity === 0) continue
    if (!item.needsChallan) throw new ChallanError(`${item.name} is an accessory and is not sent to a tailor`)
    const left = item.quantity - (used.get(item.id) ?? 0)
    if (r.quantity > left) {
      throw new ChallanError(left > 0 ? `Only ${left} of ${item.name} ${left === 1 ? "is" : "are"} not on a challan yet` : `${item.name} is already on a challan`)
    }
    pieces.push({ orderItemId: item.id, name: item.name, detail: item.detail, quantity: r.quantity })
  }
  if (pieces.length === 0) throw new ChallanError("Choose the pieces the tailor will make")
  return pieces
}

export type LineInput = { kind: string; description: string; hsn: string; quantity: number; unit: string; value: number; gstRate: number }

export type ChallanLine = {
  position: number
  kind: LineKind
  description: string
  hsn: string
  quantity: number
  unit: Unit
  taxableValue: number
  gstRate: number
  taxAmount: number
}

export function challanLines(input: LineInput[]): { lines: ChallanLine[]; taxableValue: number; taxAmount: number } {
  if (input.length === 0) throw new ChallanError("Add the fabric sent to the tailor")
  if (input.length > 20) throw new ChallanError("A challan can have up to 20 lines")
  const lines = input.map((l, i): ChallanLine => {
    const row = `Line ${i + 1}`
    if (!(LINE_KINDS as readonly string[]).includes(l.kind)) throw new ChallanError(`${row}: choose fabric, lining, trims or other`)
    const description = l.description.trim()
    if (!description) throw new ChallanError(`${row}: describe the material, for example "Cotton satin, ivory"`)
    if (description.length > 120) throw new ChallanError(`${row}: keep the description under 120 characters`)
    const hsn = l.hsn.trim()
    if (!/^\d{4}(\d{2}){0,2}$/.test(hsn)) throw new ChallanError(`${row}: the HSN code has 4, 6 or 8 digits`)
    const quantity = Math.round(l.quantity * 1000) / 1000
    if (!Number.isFinite(quantity) || quantity <= 0 || quantity > 10000) throw new ChallanError(`${row}: enter the quantity sent`)
    if (!(UNITS as readonly string[]).includes(l.unit)) throw new ChallanError(`${row}: choose the unit`)
    if (!Number.isInteger(l.value) || l.value <= 0 || l.value > 100_000_000) throw new ChallanError(`${row}: enter the value from the purchase bill`)
    if (!(GST_RATES as readonly number[]).includes(l.gstRate)) throw new ChallanError(`${row}: choose the GST rate`)
    return {
      position: i + 1,
      kind: l.kind as LineKind,
      description,
      hsn,
      quantity,
      unit: l.unit as Unit,
      taxableValue: l.value,
      gstRate: l.gstRate,
      taxAmount: Math.round((l.value * l.gstRate) / 100),
    }
  })
  return { lines, taxableValue: lines.reduce((n, l) => n + l.taxableValue, 0), taxAmount: lines.reduce((n, l) => n + l.taxAmount, 0) }
}

export function taxSplit(taxAmount: number, intraState: boolean): { label: string; value: number }[] {
  if (!intraState) return [{ label: "IGST", value: taxAmount }]
  const cgst = Math.round(taxAmount / 2)
  return [
    { label: "CGST", value: cgst },
    { label: "SGST", value: taxAmount - cgst },
  ]
}

export function returnDeadline(date: Date | string): Date {
  const d = new Date(date)
  const out = new Date(d)
  out.setUTCFullYear(d.getUTCFullYear() + 1)
  return out
}

export const DUE_SOON_DAYS = 30

export function dueSoon(c: Pick<ChallanState, "receivedAt" | "cancelledAt"> & { date: Date | string }, now = new Date()): boolean {
  return challanStatus(c) === "open" && now.getTime() >= returnDeadline(c.date).getTime() - DUE_SOON_DAYS * 86_400_000
}

export type ShippingBlock = { open: string[]; missing: { name: string; missing: number }[] }

export function shippingBlock(items: ChallanItem[], challans: ChallanState[]): ShippingBlock | null {
  const open = challans.filter((c) => challanStatus(c) === "open").map((c) => c.number)
  const onChallan = quantitiesOnChallans(challans)
  const missing = items
    .filter((i) => i.needsChallan)
    .map((i) => ({ name: i.name, missing: i.quantity - (onChallan.get(i.id) ?? 0) }))
    .filter((m) => m.missing > 0)
  return open.length || missing.length ? { open, missing } : null
}

export function shippingBlockMessage(b: ShippingBlock): string {
  const parts: string[] = []
  if (b.missing.length) parts.push(`Issue a job work challan for ${b.missing.map((m) => `${m.missing} × ${m.name}`).join(", ")}.`)
  if (b.open.length) {
    parts.push(`Mark ${b.open.length === 1 ? "challan" : "challans"} ${b.open.join(", ")} received back from the tailor.`)
  }
  return `The order can be shipped once every piece is back from the tailor. ${parts.join(" ")}`
}

export const challanPiecesText = (pieces: ChallanPiece[]) =>
  pieces.map((p) => `${p.quantity} × ${p.name}${p.detail ? ` (${p.detail})` : ""}`).join("; ")

const lineQty = (n: number) => String(Math.round(n * 1000) / 1000)

export const challanLinesText = (lines: { kind: string; description: string; quantity: number; unit: string }[]) =>
  lines
    .map((l) => `${LINE_KIND_LABEL[l.kind as LineKind] ?? l.kind}: ${l.description}, ${lineQty(l.quantity)} ${(UNIT_NAME[l.unit as Unit] ?? l.unit).toLowerCase()}`)
    .join("; ")

export function receivedNoteFor(pieces: ChallanPiece[]): string {
  return pieces.map((p) => `${p.quantity} × ${p.name}${p.detail ? ` (${p.detail})` : ""}, stitched`).join("; ")
}

export function istDayStart(date: Date | string): number {
  const ist = new Date(new Date(date).getTime() + IST_OFFSET_MS)
  return Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate()) - IST_OFFSET_MS
}

export function receivedDate(input: string, challanDate: Date | string, now = new Date()): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input)
  if (!m) throw new ChallanError("Enter the date the goods came back")
  const day = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) - IST_OFFSET_MS
  const check = new Date(day + IST_OFFSET_MS)
  if (check.getUTCDate() !== Number(m[3])) throw new ChallanError("Enter a real date")
  if (day < istDayStart(challanDate)) throw new ChallanError("The goods cannot come back before the challan date")
  if (day > istDayStart(now)) throw new ChallanError("The date cannot be in the future")
  return new Date(day + 12 * 3_600_000)
}

export const istInputDate = (date: Date | string) => {
  const ist = new Date(new Date(date).getTime() + IST_OFFSET_MS)
  return ist.toISOString().slice(0, 10)
}
