import { describe, expect, it } from "vitest"
import {
  challanFileName,
  challanFromSlug,
  challanLines,
  challanNumber,
  challanPieces,
  challanSlug,
  dueSoon,
  receivedDate,
  receivedNoteFor,
  returnDeadline,
  shippingBlock,
  shippingBlockMessage,
  taxSplit,
  type ChallanItem,
  type ChallanState,
  type LineInput,
} from "../challan"
import { challanRegisterCsv, itc04Sheets, type RecordChallan } from "../records"
import { challanDocument, type DocumentChallan } from "../challanDocument"

const gown: ChallanItem = { id: "a", name: "Pink Petal Gown", detail: "Size M", quantity: 2, needsChallan: true }
const shirt: ChallanItem = { id: "b", name: "Dark Romance Shirt", detail: "Made to measure · Arjun", quantity: 1, needsChallan: true }
const belt: ChallanItem = { id: "c", name: "Leather Belt", detail: "Size M", quantity: 1, needsChallan: false }

const silk: LineInput = { kind: "FABRIC", description: "Silk crepe, blush", hsn: "5007", quantity: 2.5, unit: "MTR", value: 300000, gstRate: 5 }
const lining: LineInput = { kind: "LINING", description: "Viscose lining", hsn: "5407", quantity: 2, unit: "MTR", value: 40000, gstRate: 5 }

const state = (number: string, pieces: { orderItemId: string; quantity: number }[], extra: Partial<ChallanState> = {}): ChallanState => ({
  number,
  pieces: pieces.map((p) => ({ ...p, name: "x", detail: "" })),
  receivedAt: null,
  cancelledAt: null,
  ...extra,
})

describe("challan numbers", () => {
  it("numbers each financial year from 001 in its own series", () => {
    expect(challanNumber("26-27", 1)).toBe("JW/26-27/001")
    expect(challanNumber("26-27", 1000)).toBe("JW/26-27/1000")
  })
  it("turns a number into a URL and file name and back", () => {
    expect(challanSlug("JW/26-27/001")).toBe("JW-26-27-001")
    expect(challanFromSlug("JW-26-27-001.pdf")).toBe("JW/26-27/001")
    expect(challanFromSlug("CN-26-27-001")).toBeNull()
    expect(challanFileName("JW/26-27/001")).toBe("Job-Work-Challan-JW-26-27-001")
  })
})

describe("pieces on a challan", () => {
  it("takes the chosen pieces and skips those set to 0", () => {
    const pieces = challanPieces([gown, shirt], [], [{ orderItemId: "a", quantity: 1 }, { orderItemId: "b", quantity: 0 }])
    expect(pieces).toEqual([{ orderItemId: "a", name: "Pink Petal Gown", detail: "Size M", quantity: 1 }])
  })
  it("refuses more than is left off other challans, but frees cancelled ones", () => {
    const sent = [state("JW/26-27/001", [{ orderItemId: "a", quantity: 1 }])]
    expect(() => challanPieces([gown], sent, [{ orderItemId: "a", quantity: 2 }])).toThrow(/Only 1 of Pink Petal Gown/)
    const cancelled = [state("JW/26-27/001", [{ orderItemId: "a", quantity: 2 }], { cancelledAt: new Date() })]
    expect(challanPieces([gown], cancelled, [{ orderItemId: "a", quantity: 2 }])).toHaveLength(1)
  })
  it("refuses accessories, unknown items, duplicates and an empty challan", () => {
    expect(() => challanPieces([belt], [], [{ orderItemId: "c", quantity: 1 }])).toThrow(/accessory/)
    expect(() => challanPieces([gown], [], [{ orderItemId: "z", quantity: 1 }])).toThrow(/not part of the order/)
    expect(() => challanPieces([gown], [], [{ orderItemId: "a", quantity: 1 }, { orderItemId: "a", quantity: 1 }])).toThrow(/twice/)
    expect(() => challanPieces([gown], [], [{ orderItemId: "a", quantity: 0 }])).toThrow(/Choose the pieces/)
  })
})

describe("goods lines", () => {
  it("keeps several fabrics, lining and trims and adds up the value and GST", () => {
    const r = challanLines([silk, lining, { kind: "TRIM", description: "Covered buttons", hsn: "9606", quantity: 12, unit: "PCS", value: 6000, gstRate: 18 }])
    expect(r.lines.map((l) => [l.position, l.kind, l.taxAmount])).toEqual([
      [1, "FABRIC", 15000],
      [2, "LINING", 2000],
      [3, "TRIM", 1080],
    ])
    expect(r.taxableValue).toBe(346000)
    expect(r.taxAmount).toBe(18080)
  })
  it("checks every field of a line", () => {
    expect(() => challanLines([])).toThrow(/Add the fabric/)
    expect(() => challanLines([{ ...silk, hsn: "50" }])).toThrow(/Line 1: the HSN code/)
    expect(() => challanLines([silk, { ...lining, quantity: 0 }])).toThrow(/Line 2: enter the quantity/)
    expect(() => challanLines([{ ...silk, unit: "KG" }])).toThrow(/unit/)
    expect(() => challanLines([{ ...silk, value: 0 }])).toThrow(/value/)
    expect(() => challanLines([{ ...silk, gstRate: 7 }])).toThrow(/GST rate/)
    expect(() => challanLines([{ ...silk, description: "  " }])).toThrow(/describe/)
  })
  it("splits the GST shown into CGST and SGST within Delhi, IGST outside", () => {
    expect(taxSplit(1001, true)).toEqual([{ label: "CGST", value: 501 }, { label: "SGST", value: 500 }])
    expect(taxSplit(1001, false)).toEqual([{ label: "IGST", value: 1001 }])
  })
})

describe("shipping block", () => {
  it("blocks until every piece except accessories is on a challan received back", () => {
    expect(shippingBlock([gown, belt], [])?.missing).toEqual([{ name: "Pink Petal Gown", missing: 2 }])
    const open = [state("JW/26-27/001", [{ orderItemId: "a", quantity: 2 }])]
    const b = shippingBlock([gown, belt], open)!
    expect(b).toEqual({ open: ["JW/26-27/001"], missing: [] })
    expect(shippingBlockMessage(b)).toMatch(/Mark challan JW\/26-27\/001 received back/)
    const back = [state("JW/26-27/001", [{ orderItemId: "a", quantity: 2 }], { receivedAt: new Date() })]
    expect(shippingBlock([gown, belt], back)).toBeNull()
  })
  it("needs no challan for an order of accessories only", () => {
    expect(shippingBlock([belt], [])).toBeNull()
  })
  it("ignores cancelled challans", () => {
    const cancelled = [state("JW/26-27/001", [{ orderItemId: "b", quantity: 1 }], { cancelledAt: new Date() })]
    expect(shippingBlock([shirt], cancelled)).toEqual({ open: [], missing: [{ name: "Dark Romance Shirt", missing: 1 }] })
  })
})

describe("return within a year", () => {
  const date = new Date("2026-11-25T06:00:00Z")
  it("is due one year after the challan date and warns 30 days before", () => {
    expect(returnDeadline(date).toISOString()).toBe("2027-11-25T06:00:00.000Z")
    expect(dueSoon({ date, receivedAt: null, cancelledAt: null }, new Date("2027-10-20T00:00:00Z"))).toBe(false)
    expect(dueSoon({ date, receivedAt: null, cancelledAt: null }, new Date("2027-10-30T00:00:00Z"))).toBe(true)
    expect(dueSoon({ date, receivedAt: new Date(), cancelledAt: null }, new Date("2028-01-01T00:00:00Z"))).toBe(false)
  })
  it("takes a received date between the challan date and today, India time", () => {
    const now = new Date("2026-12-10T10:00:00Z")
    expect(receivedDate("2026-12-01", date, now).toISOString()).toBe("2026-12-01T06:30:00.000Z")
    expect(() => receivedDate("2026-11-24", date, now)).toThrow(/before the challan date/)
    expect(() => receivedDate("2026-12-11", date, now)).toThrow(/future/)
    expect(() => receivedDate("2026-02-30", date, now)).toThrow(/real date/)
  })
  it("suggests what came back from the pieces", () => {
    expect(receivedNoteFor([{ orderItemId: "a", name: "Pink Petal Gown", detail: "Size M", quantity: 2 }])).toBe("2 × Pink Petal Gown (Size M), stitched")
  })
})

const record = (over: Partial<RecordChallan> = {}): RecordChallan => ({
  number: "JW/26-27/001",
  date: new Date("2026-11-25T06:00:00Z"),
  orderCode: "PB1234",
  tailorName: "Ravi Tailors",
  tailorStateCode: "29",
  tailorGstin: null,
  sellerStateCode: "07",
  pieces: [{ orderItemId: "a", name: "Pink Petal Gown", detail: "Size M", quantity: 2 }],
  lines: [
    { kind: "FABRIC", description: "Silk crepe, blush", hsn: "5007", quantity: 2.5, unit: "MTR", taxableValue: 300000, gstRate: 5, taxAmount: 15000 },
    { kind: "LINING", description: "Viscose lining", hsn: "5407", quantity: 2, unit: "MTR", taxableValue: 40000, gstRate: 5, taxAmount: 2000 },
  ],
  taxableValue: 340000,
  taxAmount: 17000,
  ewayBill: null,
  receivedAt: null,
  receivedNote: null,
  receivedEwayBill: null,
  cancelledAt: null,
  cancelReason: null,
  ...over,
})

describe("register and ITC-04", () => {
  it("lists every challan with its status and leaves cancelled ones out of the total", () => {
    const csv = challanRegisterCsv([record(), record({ number: "JW/26-27/002", cancelledAt: new Date(), cancelReason: "Wrong tailor" })])
    const rows = csv.trim().split("\n")
    expect(rows[0]).toMatch(/^Challan number,Challan date,Order,Tailor/)
    expect(rows[1]).toContain("JW/26-27/001,25-11-2026,PB1234,Ravi Tailors,Karnataka,Unregistered")
    expect(rows[1]).toContain("Open (with the tailor)")
    expect(rows[2]).toContain("Cancelled")
    expect(rows[3]).toMatch(/^Total,.*1 challan,3400\.00,170\.00/)
  })
  it("puts each material in table 4 and each challan received back in table 5A", () => {
    const back = record({ receivedAt: new Date("2026-12-05T06:30:00Z"), receivedNote: "2 × Pink Petal Gown, stitched" })
    const [t4, t5] = itc04Sheets([record()], [back])
    expect(t4.name).toBe("4")
    expect(t4.rows).toHaveLength(3)
    expect(t4.rows[1]).toEqual([null, "29-Karnataka", "Non SEZ", "JW/26-27/001", "25-Nov-2026", "Inputs", "Fabric: Silk crepe, blush", "MTR-METERS", 2.5, 3000, 5, null, null, 0])
    expect(t5.name).toBe("5A")
    expect(t5.rows[1]).toEqual([null, "29-Karnataka", "JW/26-27/001", "25-Nov-2026", null, null, "Stitching", "2 × Pink Petal Gown, stitched", "PCS-PIECES", 2, null, null])
  })
  it("gives a Delhi tailor central and state rates and a registered tailor their GSTIN", () => {
    const [t4] = itc04Sheets([record({ tailorStateCode: "07", tailorGstin: "07AAAAA0000A1Z5" })], [])
    expect(t4.rows[1].slice(0, 2)).toEqual(["07AAAAA0000A1Z5", null])
    expect(t4.rows[1].slice(10, 13)).toEqual([null, 2.5, 2.5])
  })
})

describe("challan document", () => {
  const doc: DocumentChallan = {
    number: "JW/26-27/001",
    date: new Date("2026-11-25T06:00:00Z"),
    pieces: [{ orderItemId: "a", name: "Pink Petal Gown", detail: "Size M", quantity: 2 }],
    taxableValue: 340000,
    taxAmount: 17000,
    fabricBill: null,
    ewayBill: null,
    note: null,
    tailorName: "Ravi Tailors",
    tailorAddress: "12 MG Road\nBengaluru 560001",
    tailorStateCode: "29",
    tailorGstin: null,
    tailorPhone: null,
    sellerGstin: "07FSKPB8774F1ZD",
    sellerLegalName: "Piyush Bholla",
    sellerTradeName: "Piyush Bholla Label",
    sellerAddress: "N-37A, Vijay Vihar, Uttam Nagar\nDelhi 110059",
    sellerStateCode: "07",
    sellerEmail: "hello@example.com",
    sellerPhone: "9999999999",
    receivedAt: null,
    receivedNote: null,
    receivedEwayBill: null,
    cancelledAt: null,
    cancelReason: null,
    order: { orderCode: "PB1234" },
    lines: [
      { id: "l2", position: 2, kind: "LINING", description: "Viscose lining", hsn: "5407", quantity: 2, unit: "MTR", taxableValue: 40000, gstRate: 5, taxAmount: 2000 },
      { id: "l1", position: 1, kind: "FABRIC", description: "Silk crepe, blush", hsn: "5007", quantity: 2.5, unit: "MTR", taxableValue: 300000, gstRate: 5, taxAmount: 15000 },
    ],
  }
  it("shows the goods in order with GST as not charged, IGST for another state", () => {
    const d = challanDocument(doc)
    expect(d.lines.map((l) => l.name)).toEqual(["Fabric: Silk crepe, blush", "Lining: Viscose lining"])
    expect(d.lines[0].quantity).toBe("2.5 m")
    expect(d.totals.taxParts).toEqual([{ label: "IGST (not charged)", value: 17000 }])
    expect(d.totals.total).toBe(357000)
    expect(d.interState).toBe(true)
    expect(d.tailor.state).toBe("Karnataka (29)")
    expect(d.status).toBe("open")
  })
})
