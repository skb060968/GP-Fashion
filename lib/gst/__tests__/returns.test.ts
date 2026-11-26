import { describe, expect, it } from "vitest"
import {
  daysLeft,
  findSlot,
  fyOfPeriod,
  gstr3bDueDay,
  istDateFromInput,
  periodSales,
  registrationDate,
  returnCalendar,
  roundRupees,
  setOff,
  slotStatus,
} from "../returns"
import type { RecordCreditNote, RecordInvoice } from "../gstr1"

const reg = registrationDate("2026-11-19")
const ist = (d: Date) => new Date(d.getTime() + 330 * 60000).toISOString().slice(0, 10)

describe("return calendar", () => {
  const slots = returnCalendar(2026, reg, "07")
  const list = slots.map((s) => `${s.kind} ${s.period} ${ist(s.due)}`)

  it("starts with the month of registration and leaves out October", () => {
    expect(list).toEqual([
      "IFF 2026-11 2026-12-13",
      "PMT06 2026-11 2026-12-25",
      "GSTR1 2026-Q3 2027-01-13",
      "GSTR3B 2026-Q3 2027-01-24",
      "IFF 2027-01 2027-02-13",
      "PMT06 2027-01 2027-02-25",
      "IFF 2027-02 2027-03-13",
      "PMT06 2027-02 2027-03-25",
      "GSTR1 2026-Q4 2027-04-13",
      "GSTR3B 2026-Q4 2027-04-24",
      "ITC04 2026 2027-04-25",
      "GSTR9 2026 2027-12-31",
    ])
  })
  it("has every return for a full year after registration", () => {
    const next = returnCalendar(2027, reg, "07")
    expect(next.filter((s) => s.kind === "PMT06")).toHaveLength(8)
    expect(next.filter((s) => s.kind === "GSTR3B")).toHaveLength(4)
    expect(next.find((s) => s.kind === "GSTR3B" && s.period === "2027-Q1")!.label).toBe("Q1, April to June 2027")
  })
  it("is empty for a year before registration", () => {
    expect(returnCalendar(2025, reg, "07")).toEqual([])
  })
  it("uses the 22nd for GSTR-3B in the southern and western states", () => {
    expect(gstr3bDueDay("07")).toBe(24)
    expect(gstr3bDueDay("29")).toBe(22)
    expect(gstr3bDueDay("27")).toBe(22)
    expect(gstr3bDueDay("09")).toBe(24)
  })
  it("finds a return by its period and refuses periods before registration", () => {
    expect(fyOfPeriod("PMT06", "2027-02")).toBe(2026)
    expect(fyOfPeriod("GSTR1", "2026-Q3")).toBe(2026)
    expect(fyOfPeriod("GSTR9", "2026")).toBe(2026)
    expect(fyOfPeriod("PMT06", "2026-Q3")).toBeNull()
    expect(findSlot("PMT06", "2026-11", reg, "07")?.monthInQuarter).toBe(1)
    expect(findSlot("PMT06", "2026-10", reg, "07")).toBeNull()
    expect(findSlot("PMT06", "2026-12", reg, "07")).toBeNull()
  })
  it("reads dates as India time and rejects impossible ones", () => {
    expect(istDateFromInput("2026-11-19")!.toISOString()).toBe("2026-11-18T18:30:00.000Z")
    expect(istDateFromInput("2026-02-30")).toBeNull()
  })
})

describe("set-off of input tax credit", () => {
  it("pays what credit does not cover", () => {
    const r = setOff({ igst: 0, cgst: 9000, sgst: 9000 }, { igst: 0, cgst: 2000, sgst: 2000 })
    expect(r.cash).toEqual({ igst: 0, cgst: 7000, sgst: 7000 })
    expect(r.creditLeft).toEqual({ igst: 0, cgst: 0, sgst: 0 })
  })
  it("uses all IGST credit before CGST and SGST credit, first where their own credit falls short", () => {
    const r = setOff({ igst: 1000, cgst: 5000, sgst: 5000 }, { igst: 6000, cgst: 5000, sgst: 1000 })
    expect(r.cash).toEqual({ igst: 0, cgst: 0, sgst: 0 })
    expect(r.creditUsed.igst).toBe(6000)
    expect(r.creditLeft).toEqual({ igst: 0, cgst: 1000, sgst: 0 })
  })
  it("leaves SGST to cash when only CGST credit is spare", () => {
    const r = setOff({ igst: 0, cgst: 1000, sgst: 4000 }, { igst: 0, cgst: 5000, sgst: 1000 })
    expect(r.cash).toEqual({ igst: 0, cgst: 0, sgst: 3000 })
  })
  it("lets CGST and SGST credit pay IGST but never each other", () => {
    const r = setOff({ igst: 3000, cgst: 0, sgst: 2000 }, { igst: 0, cgst: 5000, sgst: 0 })
    expect(r.cash).toEqual({ igst: 0, cgst: 0, sgst: 2000 })
    expect(r.creditLeft).toEqual({ igst: 0, cgst: 2000, sgst: 0 })
  })
  it("carries spare credit forward and rounds cash to the rupee", () => {
    const r = setOff({ igst: 0, cgst: 0, sgst: 0 }, { igst: 500, cgst: 0, sgst: 0 })
    expect(r.creditLeft.igst).toBe(500)
    expect(roundRupees({ igst: 12349, cgst: 12350, sgst: 0 })).toEqual({ igst: 12300, cgst: 12400, sgst: 0 })
  })
})

const inv = (over: Partial<RecordInvoice>): RecordInvoice => ({
  orderCode: "A",
  invoiceNumber: "PBL/26-27/0001",
  invoiceDate: new Date("2026-11-25T06:00:00Z"),
  amount: 118000,
  taxableValue: 100000,
  cgst: 9000,
  sgst: 9000,
  igst: 0,
  placeOfSupply: "07",
  buyerGstin: null,
  buyerName: null,
  customerName: null,
  sellerGstin: "07FSKPB8774F1ZD",
  sellerStateCode: "07",
  status: "SHIPPED",
  items: [],
  ...over,
})

describe("period sales", () => {
  const from = new Date("2026-10-31T18:30:00Z"), to = new Date("2026-11-30T18:30:00Z")
  it("adds invoices in the period, takes off credit notes and lists inter-state B2C sales by state", () => {
    const invoices = [
      inv({}),
      inv({ invoiceNumber: "PBL/26-27/0002", placeOfSupply: "29", cgst: 0, sgst: 0, igst: 18000 }),
      inv({ invoiceNumber: "PBL/26-27/0003", placeOfSupply: "29", cgst: 0, sgst: 0, igst: 18000, buyerGstin: "29AAAAA0000A1Z5" }),
      inv({ invoiceNumber: "PBL/26-27/0004", invoiceDate: new Date("2026-12-02T06:00:00Z") }),
    ]
    const cn = { ...inv({ placeOfSupply: "29", cgst: 0, sgst: 0, igst: 9000, taxableValue: 50000, amount: 59000 }), number: "CN/26-27/001", date: new Date("2026-11-28T06:00:00Z") } as unknown as RecordCreditNote
    const s = periodSales(invoices, [cn], from, to, "07")
    expect(s.invoices).toBe(3)
    expect(s.creditNotes).toBe(1)
    expect(s.b2b).toBe(1)
    expect(s.taxableValue).toBe(250000)
    expect(s.tax).toEqual({ igst: 27000, cgst: 9000, sgst: 9000 })
    expect(s.interState).toEqual([{ pos: "29", taxableValue: 50000, igst: 9000 }])
  })
})

describe("status", () => {
  const slot = { due: new Date("2027-01-23T18:30:00Z"), to: new Date("2026-12-31T18:30:00Z") }
  it("follows the period and the due date", () => {
    expect(slotStatus(slot, { filed: false }, new Date("2026-12-20T00:00:00Z"))).toBe("open")
    expect(slotStatus(slot, { filed: false }, new Date("2027-01-05T00:00:00Z"))).toBe("upcoming")
    expect(slotStatus(slot, { filed: false }, new Date("2027-01-20T00:00:00Z"))).toBe("dueSoon")
    expect(slotStatus(slot, { filed: false }, new Date("2027-01-24T17:00:00Z"))).toBe("dueSoon")
    expect(slotStatus(slot, { filed: false }, new Date("2027-01-24T18:31:00Z"))).toBe("overdue")
    expect(slotStatus(slot, { filed: true }, new Date("2027-02-01T00:00:00Z"))).toBe("filed")
    expect(slotStatus(slot, { filed: false, nothing: true }, new Date("2027-02-01T00:00:00Z"))).toBe("nothing")
    expect(slotStatus(slot, { filed: false, optional: true }, new Date("2027-02-01T00:00:00Z"))).toBe("optional")
  })
  it("counts the due day itself as a day left", () => {
    expect(daysLeft(slot.due, new Date("2027-01-24T10:00:00Z"))).toBe(1)
    expect(daysLeft(slot.due, new Date("2027-01-22T10:00:00Z"))).toBe(3)
  })
})
