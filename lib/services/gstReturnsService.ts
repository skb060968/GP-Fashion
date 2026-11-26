import { Prisma } from "@prisma/client"
import { prisma } from "../prisma"
import { business } from "../data/business"
import { currentFyStart } from "../gst/period"
import { loadSalesRecords } from "../gst/recordsData"
import { itcContext } from "./purchaseService"
import {
  RETURN_TITLE,
  addHeads,
  clampHeads,
  daysLeft,
  findSlot,
  istDateFromInput,
  istDay,
  periodSales,
  registrationDate,
  returnCalendar,
  roundRupees,
  setOff,
  slotStatus,
  subHeads,
  totalHeads,
  zeroHeads,
  type Heads,
  type PeriodSales,
  type ReturnKind,
  type ReturnSlot,
  type SetOff,
  type SlotStatus,
} from "../gst/returns"

export class ReturnsError extends Error {
  constructor(message: string, public status = 400) {
    super(message)
  }
}

type Filing = { kind: string; period: string; itcIgst: number; itcCgst: number; itcSgst: number; itcSaved: boolean; paidIgst: number; paidCgst: number; paidSgst: number; filedAt: Date | null; reference: string | null; note: string | null; snapshot: unknown }

export type ItcSource = "saved" | "gstr2b" | "register" | "none"

export type ReturnDetails =
  | { kind: "PMT06"; sales: PeriodSales; itc: Heads; itcSource: ItcSource; suggested: Heads; registerBills: number; carried: Heads; setOff: SetOff; cash: Heads }
  | { kind: "IFF"; b2b: number }
  | { kind: "GSTR1"; sales: PeriodSales; nil: boolean }
  | {
      kind: "GSTR3B"; sales: PeriodSales; itc: Heads; itcSource: ItcSource; suggested: Heads; registerBills: number; gstr2bLoaded: boolean
      setOff: SetOff; cash: Heads; paidMonthly: Heads; balance: Heads; excess: Heads; nil: boolean
    }
  | { kind: "ITC04"; sent: number; received: number }
  | { kind: "GSTR9"; sales: PeriodSales }

export type ReturnRow = {
  kind: ReturnKind
  title: string
  period: string
  label: string
  quarter: number | null
  from: Date
  to: Date
  activeFrom: Date
  due: Date
  daysLeft: number
  status: SlotStatus
  optional: boolean
  filing: { filedAt: Date | null; reference: string | null; note: string | null; itc: Heads; paid: Heads } | null
  changedSinceFiled: boolean
  link: string | null
  details: ReturnDetails
}

const itcOf = (f: Filing | undefined): Heads => (f ? { igst: f.itcIgst, cgst: f.itcCgst, sgst: f.itcSgst } : zeroHeads())
const paidOf = (f: Filing | undefined): Heads => (f ? { igst: f.paidIgst, cgst: f.paidCgst, sgst: f.paidSgst } : zeroHeads())
const key = (kind: string, period: string) => `${kind}|${period}`

type Snapshot = { taxableValue: number; tax: Heads }

const salesSnapshot = (d: ReturnDetails): Snapshot | null =>
  "sales" in d ? { taxableValue: d.sales.taxableValue, tax: d.sales.tax } : null

function differs(snapshot: unknown, now: Snapshot | null): boolean {
  if (!now || !snapshot || typeof snapshot !== "object") return false
  const s = snapshot as Snapshot
  return s.taxableValue !== now.taxableValue || s.tax?.igst !== now.tax.igst || s.tax?.cgst !== now.tax.cgst || s.tax?.sgst !== now.tax.sgst
}

export const registeredOn = () => registrationDate(business.gstRegisteredOn)

export function returnYears(now = new Date()): number[] {
  const first = currentFyStart(registeredOn())
  const last = currentFyStart(now)
  return Array.from({ length: Math.max(1, last - first + 1) }, (_, i) => last - i)
}

export async function gstReturns(fyStart: number, now = new Date()) {
  const reg = registeredOn()
  const slots = returnCalendar(fyStart, reg, business.stateCode)
  const fyFrom = istDay(fyStart, 3, 1), fyTo = istDay(fyStart + 1, 3, 1)
  const [{ invoices, creditNotes }, suggest, challans, filingRows] = await Promise.all([
    loadSalesRecords(fyFrom, fyTo),
    itcContext(fyFrom, fyTo),
    prisma.jobWorkChallan.findMany({
      where: { OR: [{ date: { gte: fyFrom, lt: fyTo } }, { receivedAt: { gte: fyFrom, lt: fyTo } }] },
      select: { date: true, receivedAt: true, cancelledAt: true },
    }),
    slots.length ? prisma.gstFiling.findMany({ where: { OR: slots.map((s) => ({ kind: s.kind, period: s.period })) } }) : Promise.resolve([]),
  ])
  const filings = new Map(filingRows.map((f) => [key(f.kind, f.period), f]))
  const sales = (s: ReturnSlot) => periodSales(invoices, creditNotes, s.from, s.to, business.stateCode)
  const carry = new Map<string, Heads>()
  const rows: ReturnRow[] = []

  for (const slot of slots) {
    const filing = filings.get(key(slot.kind, slot.period))
    let details: ReturnDetails
    let nothing = false
    let optional = false
    let link: string | null = null

    if (slot.kind === "PMT06") {
      const s = sales(slot)
      const suggestion = suggest(slot.from, slot.to)
      const suggested = suggestion.gstr2b ?? suggestion.register
      const source: ItcSource = filing?.itcSaved ? "saved" : suggestion.gstr2b ? "gstr2b" : suggestion.registerBills ? "register" : "none"
      const itc = filing?.itcSaved ? itcOf(filing) : suggested
      const carried = slot.monthInQuarter === 1 ? carry.get(`${slot.fyStart}-Q${slot.quarter}`) ?? zeroHeads() : zeroHeads()
      const so = setOff(s.tax, addHeads(itc, carried))
      if (slot.monthInQuarter === 0) carry.set(`${slot.fyStart}-Q${slot.quarter}`, so.creditLeft)
      const cash = roundRupees(so.cash)
      details = { kind: "PMT06", sales: s, itc, itcSource: source, suggested, registerBills: suggestion.registerBills, carried, setOff: so, cash }
      nothing = totalHeads(cash) === 0
    } else if (slot.kind === "IFF") {
      const s = sales(slot)
      if (s.b2b === 0 && !filing?.filedAt) continue
      details = { kind: "IFF", b2b: s.b2b }
      optional = true
    } else if (slot.kind === "GSTR1") {
      const s = sales(slot)
      details = { kind: "GSTR1", sales: s, nil: s.invoices === 0 && s.creditNotes === 0 }
      link = `/admin/records?fy=${slot.fyStart}&q=${slot.quarter}`
    } else if (slot.kind === "GSTR3B") {
      const s = sales(slot)
      const months = slots.filter((m) => m.kind === "PMT06" && m.fyStart === slot.fyStart && m.quarter === slot.quarter)
      const monthly = months.map((m) => filings.get(key("PMT06", m.period)))
      const suggestion = suggest(slot.from, slot.to)
      const suggested = suggestion.gstr2b ?? suggestion.register
      const source: ItcSource = filing?.itcSaved ? "saved" : suggestion.gstr2b ? "gstr2b" : suggestion.registerBills ? "register" : "none"
      const itc = filing?.itcSaved ? itcOf(filing) : suggested
      const so = setOff(s.tax, itc)
      const cash = roundRupees(so.cash)
      const paidMonthly = monthly.filter((f) => f?.filedAt).reduce((t, f) => addHeads(t, paidOf(f)), zeroHeads())
      const balance = clampHeads(subHeads(cash, paidMonthly))
      const excess = clampHeads(subHeads(paidMonthly, cash))
      details = {
        kind: "GSTR3B", sales: s, itc, itcSource: source, suggested, registerBills: suggestion.registerBills, gstr2bLoaded: !!suggestion.gstr2b,
        setOff: so, cash, paidMonthly, balance, excess, nil: s.invoices === 0 && s.creditNotes === 0 && totalHeads(itc) === 0,
      }
    } else if (slot.kind === "ITC04") {
      const sent = challans.filter((c) => !c.cancelledAt && c.date >= slot.from && c.date < slot.to).length
      const received = challans.filter((c) => c.receivedAt && c.receivedAt >= slot.from && c.receivedAt < slot.to).length
      details = { kind: "ITC04", sent, received }
      nothing = sent === 0 && received === 0
      link = `/admin/records?fy=${slot.fyStart}&q=all`
    } else {
      details = { kind: "GSTR9", sales: sales(slot) }
      optional = business.annualReturnOptional
    }

    const filed = !!filing?.filedAt
    rows.push({
      kind: slot.kind,
      title: RETURN_TITLE[slot.kind],
      period: slot.period,
      label: slot.label,
      quarter: slot.quarter,
      from: slot.from,
      to: slot.to,
      activeFrom: slot.from < reg ? reg : slot.from,
      due: slot.due,
      daysLeft: daysLeft(slot.due, now),
      status: slotStatus(slot, { filed, nothing, optional }, now),
      optional,
      filing: filing ? { filedAt: filing.filedAt, reference: filing.reference, note: filing.note, itc: itcOf(filing), paid: paidOf(filing) } : null,
      changedSinceFiled: filed && differs(filing?.snapshot, salesSnapshot(details)),
      link,
      details,
    })
  }

  return {
    fyStart,
    years: returnYears(now),
    registeredOn: reg,
    gstin: business.gstin,
    stateCode: business.stateCode,
    annualReturnOptional: business.annualReturnOptional,
    returns: rows,
  }
}

export async function gstReturnAlerts(now = new Date()) {
  const current = currentFyStart(now)
  const first = currentFyStart(registeredOn())
  const years = [current - 1, current].filter((y) => y >= first)
  const all = (await Promise.all(years.map((y) => gstReturns(y, now)))).flatMap((r) => r.returns)
  return all
    .filter((r) => r.status === "overdue" || r.status === "dueSoon")
    .map((r) => ({ kind: r.kind, title: r.title, period: r.period, label: r.label, due: r.due, daysLeft: r.daysLeft, status: r.status, fyStart: currentFyStart(r.from) }))
}

export type FilingInput = {
  kind: ReturnKind
  period: string
  itc?: Heads
  resetItc?: boolean
  paid?: Heads
  filed?: boolean
  filedOn?: string
  reference?: string
  note?: string
}

export async function saveFiling(input: FilingInput, now = new Date()) {
  const slot = findSlot(input.kind, input.period, registeredOn(), business.stateCode)
  if (!slot) throw new ReturnsError("This return is not due for this business", 404)

  let filedAt: Date | null = null
  if (input.filed) {
    if (now < slot.to) throw new ReturnsError("The period has not ended yet, so this cannot be filed", 409)
    filedAt = istDateFromInput(input.filedOn ?? "")
    if (!filedAt) throw new ReturnsError("Enter the date it was filed")
    if (filedAt < slot.to) throw new ReturnsError("The filing date must be after the end of the period")
    if (filedAt > now) throw new ReturnsError("The filing date cannot be in the future")
  }

  const where = { kind_period: { kind: input.kind, period: input.period } }
  const draft = {
    ...(input.itc ? { itcIgst: input.itc.igst, itcCgst: input.itc.cgst, itcSgst: input.itc.sgst, itcSaved: true } : {}),
    ...(input.resetItc ? { itcIgst: 0, itcCgst: 0, itcSgst: 0, itcSaved: false } : {}),
    ...(input.note !== undefined ? { note: input.note.trim() || null } : {}),
  }
  await prisma.gstFiling.upsert({ where, create: { kind: input.kind, period: input.period, ...draft }, update: draft })

  if (input.filed === true) {
    const row = (await gstReturns(slot.fyStart, now)).returns.find((r) => r.kind === input.kind && r.period === input.period)
    const computed = row?.details.kind === "PMT06" ? row.details.cash : row?.details.kind === "GSTR3B" ? row.details.balance : zeroHeads()
    const paid = input.paid ?? computed
    const snapshot = row ? salesSnapshot(row.details) : null
    await prisma.gstFiling.update({
      where,
      data: {
        filedAt,
        reference: input.reference?.trim() || null,
        paidIgst: paid.igst,
        paidCgst: paid.cgst,
        paidSgst: paid.sgst,
        snapshot: snapshot ? (snapshot as unknown as Prisma.InputJsonValue) : Prisma.DbNull,
      },
    })
  } else if (input.filed === false) {
    await prisma.gstFiling.update({ where, data: { filedAt: null, reference: null, paidIgst: 0, paidCgst: 0, paidSgst: 0, snapshot: Prisma.DbNull } })
  }

  return gstReturns(slot.fyStart, now)
}
