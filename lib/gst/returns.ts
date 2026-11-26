import { GSTIN_PATTERN, type RecordCreditNote, type RecordInvoice } from "./gstr1"
import { IST_OFFSET_MS, QUARTER_MONTHS, fyLabel, type Quarter } from "./period"
import { zeroHeads, type Heads } from "./taxHeads"

export const RETURN_KINDS = ["PMT06", "IFF", "GSTR1", "GSTR3B", "ITC04", "GSTR9"] as const
export type ReturnKind = (typeof RETURN_KINDS)[number]

export const RETURN_TITLE: Record<ReturnKind, string> = {
  PMT06: "PMT-06 tax payment",
  IFF: "IFF (B2B invoices)",
  GSTR1: "GSTR-1",
  GSTR3B: "GSTR-3B",
  ITC04: "ITC-04",
  GSTR9: "GSTR-9 annual return",
}

const KIND_ORDER: Record<ReturnKind, number> = { IFF: 0, GSTR1: 1, GSTR3B: 2, PMT06: 3, ITC04: 4, GSTR9: 5 }

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

const DAY_MS = 86_400_000

export const istDay = (year: number, month: number, day: number) => new Date(Date.UTC(year, month, day) - IST_OFFSET_MS)

export function istDateFromInput(input: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input)
  if (!m) return null
  const d = istDay(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  const check = new Date(d.getTime() + IST_OFFSET_MS)
  return check.getUTCDate() === Number(m[3]) && check.getUTCMonth() === Number(m[2]) - 1 ? d : null
}

export const registrationDate = (isoDay: string) => istDateFromInput(isoDay) ?? new Date(0)

const GSTR3B_22ND = new Set(["22", "23", "24", "25", "26", "27", "29", "30", "31", "32", "33", "34", "35", "36", "37"])

export const gstr3bDueDay = (stateCode: string) => (GSTR3B_22ND.has(stateCode) ? 22 : 24)

export type ReturnSlot = {
  kind: ReturnKind
  period: string
  label: string
  fyStart: number
  quarter: Quarter | null
  monthInQuarter: 0 | 1 | null
  from: Date
  to: Date
  due: Date
}

function quarterMonths(fyStart: number, q: Quarter) {
  const year = q === 4 ? fyStart + 1 : fyStart
  const first = q === 4 ? 0 : q * 3
  return [0, 1, 2].map((i) => ({ year, month: first + i }))
}

const pad = (n: number) => String(n).padStart(2, "0")

export function returnCalendar(fyStart: number, registeredOn: Date, stateCode: string): ReturnSlot[] {
  const slots: ReturnSlot[] = []
  for (const q of [1, 2, 3, 4] as Quarter[]) {
    const months = quarterMonths(fyStart, q)
    months.slice(0, 2).forEach(({ year, month }, i) => {
      const from = istDay(year, month, 1), to = istDay(year, month + 1, 1)
      if (to <= registeredOn) return
      const base = { period: `${year}-${pad(month + 1)}`, label: `${MONTHS[month]} ${year}`, fyStart, quarter: q, monthInQuarter: i as 0 | 1, from, to }
      slots.push({ ...base, kind: "PMT06", due: istDay(year, month + 1, 25) })
      slots.push({ ...base, kind: "IFF", due: istDay(year, month + 1, 13) })
    })
    const last = months[2]
    const from = istDay(months[0].year, months[0].month, 1), to = istDay(last.year, last.month + 1, 1)
    if (to <= registeredOn) continue
    const base = { period: `${fyStart}-Q${q}`, label: `Q${q}, ${QUARTER_MONTHS[q]} ${last.year}`, fyStart, quarter: q, monthInQuarter: null, from, to }
    slots.push({ ...base, kind: "GSTR1", due: istDay(last.year, last.month + 1, 13) })
    slots.push({ ...base, kind: "GSTR3B", due: istDay(last.year, last.month + 1, gstr3bDueDay(stateCode)) })
  }
  const fyFrom = istDay(fyStart, 3, 1), fyTo = istDay(fyStart + 1, 3, 1)
  if (fyTo > registeredOn) {
    const base = { period: String(fyStart), label: `FY ${fyLabel(fyStart)}`, fyStart, quarter: null, monthInQuarter: null, from: fyFrom, to: fyTo }
    slots.push({ ...base, kind: "ITC04", due: istDay(fyStart + 1, 3, 25) })
    slots.push({ ...base, kind: "GSTR9", due: istDay(fyStart + 1, 11, 31) })
  }
  return slots.sort((a, b) => a.due.getTime() - b.due.getTime() || KIND_ORDER[a.kind] - KIND_ORDER[b.kind])
}

export function fyOfPeriod(kind: ReturnKind, period: string): number | null {
  if (kind === "PMT06" || kind === "IFF") {
    const m = /^(\d{4})-(\d{2})$/.exec(period)
    if (!m) return null
    const month = Number(m[2])
    return month >= 4 ? Number(m[1]) : Number(m[1]) - 1
  }
  if (kind === "GSTR1" || kind === "GSTR3B") {
    const m = /^(\d{4})-Q([1-4])$/.exec(period)
    return m ? Number(m[1]) : null
  }
  return /^\d{4}$/.test(period) ? Number(period) : null
}

export function findSlot(kind: ReturnKind, period: string, registeredOn: Date, stateCode: string): ReturnSlot | null {
  const fy = fyOfPeriod(kind, period)
  if (fy === null) return null
  return returnCalendar(fy, registeredOn, stateCode).find((s) => s.kind === kind && s.period === period) ?? null
}

export * from "./taxHeads"

export type PeriodSales = {
  invoices: number
  creditNotes: number
  b2b: number
  taxableValue: number
  tax: Heads
  interState: { pos: string; taxableValue: number; igst: number }[]
}

const within = (d: Date | string, from: Date, to: Date) => {
  const t = new Date(d).getTime()
  return t >= from.getTime() && t < to.getTime()
}

export function periodSales(invoices: RecordInvoice[], creditNotes: RecordCreditNote[], from: Date, to: Date, sellerStateCode: string): PeriodSales {
  const inv = invoices.filter((i) => within(i.invoiceDate, from, to))
  const cns = creditNotes.filter((c) => within(c.date, from, to))
  const tax = zeroHeads()
  let taxableValue = 0
  const states = new Map<string, { pos: string; taxableValue: number; igst: number }>()
  const add = (d: { taxableValue: number; igst: number; cgst: number; sgst: number; placeOfSupply: string; buyerGstin: string | null; sellerStateCode: string | null }, sign: number) => {
    taxableValue += sign * d.taxableValue
    tax.igst += sign * d.igst
    tax.cgst += sign * d.cgst
    tax.sgst += sign * d.sgst
    const registered = !!d.buyerGstin && GSTIN_PATTERN.test(d.buyerGstin)
    if (!registered && d.placeOfSupply !== (d.sellerStateCode ?? sellerStateCode)) {
      const row = states.get(d.placeOfSupply) ?? { pos: d.placeOfSupply, taxableValue: 0, igst: 0 }
      row.taxableValue += sign * d.taxableValue
      row.igst += sign * d.igst
      states.set(d.placeOfSupply, row)
    }
  }
  for (const i of inv) add(i, 1)
  for (const c of cns) add(c, -1)
  return {
    invoices: inv.length,
    creditNotes: cns.length,
    b2b: inv.filter((i) => !!i.buyerGstin && GSTIN_PATTERN.test(i.buyerGstin)).length,
    taxableValue,
    tax,
    interState: [...states.values()].filter((r) => r.taxableValue !== 0 || r.igst !== 0).sort((a, b) => a.pos.localeCompare(b.pos)),
  }
}

export type SlotStatus = "filed" | "open" | "nothing" | "optional" | "overdue" | "dueSoon" | "upcoming"

export const DUE_SOON_DAYS = 7

export const dueEnd = (due: Date) => new Date(due.getTime() + DAY_MS)

export function daysLeft(due: Date, now = new Date()): number {
  return Math.ceil((dueEnd(due).getTime() - now.getTime()) / DAY_MS)
}

export function slotStatus(slot: Pick<ReturnSlot, "due" | "to">, flags: { filed: boolean; nothing?: boolean; optional?: boolean }, now = new Date()): SlotStatus {
  if (flags.filed) return "filed"
  if (now < slot.to) return "open"
  if (flags.nothing) return "nothing"
  if (flags.optional) return "optional"
  if (now >= dueEnd(slot.due)) return "overdue"
  if (daysLeft(slot.due, now) <= DUE_SOON_DAYS) return "dueSoon"
  return "upcoming"
}
