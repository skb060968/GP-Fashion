import { describe, expect, it } from "vitest"
import { buildGstr1, gstr1Table, invoiceRegisterCsv, istDate, recordWarnings, summarise, type RecordInvoice } from "../gstr1"
import { currentFyStart, currentQuarter, previousQuarter, recordPeriod } from "../period"

const GSTIN = "07FSKPB8774F1ZD"

const inv = (o: Partial<RecordInvoice> & Pick<RecordInvoice, "invoiceNumber">): RecordInvoice => ({
  orderCode: `26${o.invoiceNumber.slice(-4)}`,
  invoiceDate: "2026-10-05T06:00:00.000Z",
  amount: 1180000,
  taxableValue: 1000000,
  cgst: 90000,
  sgst: 90000,
  igst: 0,
  placeOfSupply: "07",
  buyerGstin: null,
  buyerName: null,
  customerName: "Asha Rao",
  sellerGstin: GSTIN,
  sellerStateCode: "07",
  status: "DELIVERED",
  items: [{ hsn: "6204", gstRate: 18, quantity: 1, taxableValue: 1000000, taxAmount: 180000 }],
  ...o,
})

const intra = inv({ invoiceNumber: "PBL/26-27/0001" })
const inter = inv({
  invoiceNumber: "PBL/26-27/0002",
  placeOfSupply: "27",
  amount: 590000,
  taxableValue: 500000,
  cgst: 0,
  sgst: 0,
  igst: 90000,
  items: [{ hsn: "6205", gstRate: 18, quantity: 2, taxableValue: 500000, taxAmount: 90000 }],
})
const b2b = inv({
  invoiceNumber: "PBL/26-27/0003",
  buyerGstin: "27AAACA1234A1Z5",
  buyerName: "Acme Retail",
  placeOfSupply: "27",
  amount: 236000,
  taxableValue: 200000,
  cgst: 0,
  sgst: 0,
  igst: 36000,
  items: [
    { hsn: "6204", gstRate: 18, quantity: 1, taxableValue: 120000, taxAmount: 21600 },
    { hsn: "6206", gstRate: 18, quantity: 1, taxableValue: 80000, taxAmount: 14400 },
  ],
})
const large = inv({
  invoiceNumber: "PBL/26-27/0004",
  invoiceDate: "2026-12-31T19:00:00.000Z",
  placeOfSupply: "29",
  amount: 11800000,
  taxableValue: 10000000,
  cgst: 0,
  sgst: 0,
  igst: 1800000,
  items: [{ hsn: "6204", gstRate: 18, quantity: 3, taxableValue: 10000000, taxAmount: 1800000 }],
})

describe("reporting periods", () => {
  it("gives the quarter's IST bounds and return period", () => {
    const q3 = recordPeriod(2026, 3)
    expect(q3.from.toISOString()).toBe("2026-09-30T18:30:00.000Z")
    expect(q3.to.toISOString()).toBe("2026-12-31T18:30:00.000Z")
    expect(q3.fp).toBe("122026")
    expect(q3.slug).toBe("FY2026-27-Q3")
    expect(recordPeriod(2026, 4).fp).toBe("032027")
    expect(recordPeriod(2026, 4).from.toISOString()).toBe("2026-12-31T18:30:00.000Z")
  })

  it("covers April to March for the whole year, with no return period", () => {
    const y = recordPeriod(2026, null)
    expect(y.from.toISOString()).toBe("2026-03-31T18:30:00.000Z")
    expect(y.to.toISOString()).toBe("2027-03-31T18:30:00.000Z")
    expect(y.fp).toBeNull()
  })

  it("finds the financial year and quarter in IST", () => {
    const newYearIst = new Date("2026-12-31T19:00:00.000Z")
    expect(currentFyStart(newYearIst)).toBe(2026)
    expect(currentQuarter(newYearIst)).toBe(4)
    expect(currentFyStart(new Date("2027-03-31T19:00:00.000Z"))).toBe(2027)
    expect(previousQuarter(new Date("2026-05-01T00:00:00.000Z"))).toEqual({ fyStart: 2025, quarter: 4 })
    expect(previousQuarter(new Date("2026-11-20T00:00:00.000Z"))).toEqual({ fyStart: 2026, quarter: 2 })
  })

  it("writes invoice dates as the IST day", () => {
    expect(istDate("2026-12-31T19:00:00.000Z")).toBe("01-01-2027")
    expect(istDate("2026-10-05T06:00:00.000Z")).toBe("05-10-2026")
  })
})

describe("GSTR-1 tables", () => {
  it("sorts invoices into B2B, B2C large and B2C small", () => {
    expect(gstr1Table(b2b, "07")).toBe("B2B")
    expect(gstr1Table(large, "07")).toBe("B2CL")
    expect(gstr1Table(inter, "07")).toBe("B2CS")
    expect(gstr1Table(intra, "07")).toBe("B2CS")
    expect(gstr1Table({ ...large, placeOfSupply: "07" }, "07")).toBe("B2CS")
    expect(gstr1Table({ ...large, amount: 10000000 }, "07")).toBe("B2CS")
    expect(gstr1Table({ ...intra, buyerGstin: "not a gstin" }, "07")).toBe("B2CS")
  })

  it("builds the file for the quarter", () => {
    const { json, invoices } = buildGstr1([large, b2b, intra, inter], recordPeriod(2026, 3), GSTIN, "07")
    expect(invoices).toBe(4)
    expect(json).toMatchObject({ gstin: GSTIN, fp: "122026" })

    expect(json.b2b).toEqual([
      {
        ctin: "27AAACA1234A1Z5",
        inv: [
          {
            inum: "PBL/26-27/0003",
            idt: "05-10-2026",
            val: 2360,
            pos: "27",
            rchrg: "N",
            inv_typ: "R",
            itms: [{ num: 1, itm_det: { rt: 18, txval: 2000, iamt: 360, csamt: 0 } }],
          },
        ],
      },
    ])
    expect(json.b2cl).toEqual([
      {
        pos: "29",
        inv: [{ inum: "PBL/26-27/0004", idt: "01-01-2027", val: 118000, itms: [{ num: 1, itm_det: { rt: 18, txval: 100000, iamt: 18000, csamt: 0 } }] }],
      },
    ])
    expect(json.b2cs).toEqual([
      { sply_ty: "INTRA", pos: "07", typ: "OE", rt: 18, txval: 10000, camt: 900, samt: 900, csamt: 0 },
      { sply_ty: "INTER", pos: "27", typ: "OE", rt: 18, txval: 5000, iamt: 900, csamt: 0 },
    ])
  })

  it("adds up the HSN summary separately for B2B and B2C", () => {
    const { json } = buildGstr1([intra, inter, b2b, large], recordPeriod(2026, 3), GSTIN, "07")
    const hsn = json.hsn as { hsn_b2b: Record<string, unknown>[]; hsn_b2c: Record<string, unknown>[] }
    expect(hsn.hsn_b2b.map((r) => [r.num, r.hsn_sc, r.qty, r.txval, r.iamt])).toEqual([
      [1, "6204", 1, 1200, 216],
      [2, "6206", 1, 800, 144],
    ])
    expect(hsn.hsn_b2c.map((r) => [r.num, r.hsn_sc, r.qty, r.txval, r.iamt, r.camt, r.samt])).toEqual([
      [1, "6204", 4, 110000, 18000, 900, 900],
      [2, "6205", 2, 5000, 900, 0, 0],
    ])
    for (const r of [...hsn.hsn_b2b, ...hsn.hsn_b2c]) {
      expect(r.uqc).toBe("PCS")
      expect(String(r.desc).length).toBeGreaterThan(0)
      expect(String(r.desc).length).toBeLessThanOrEqual(30)
    }
  })

  it("lists the invoice number range as documents issued", () => {
    const { json } = buildGstr1([inter, intra, large, b2b], recordPeriod(2026, 3), GSTIN, "07")
    expect(json.doc_issue).toEqual({
      doc_det: [{ doc_num: 1, docs: [{ num: 1, from: "PBL/26-27/0001", to: "PBL/26-27/0004", totnum: 4, cancel: 0, net_issue: 4 }] }],
    })
  })

  it("leaves out invoices issued under another GSTIN", () => {
    const specimen = inv({ invoiceNumber: "PBL/26-27/0005", sellerGstin: "07XXXXXXXXXX1ZX" })
    const { json, invoices } = buildGstr1([intra, specimen], recordPeriod(2026, 3), GSTIN, "07")
    expect(invoices).toBe(1)
    expect(json.b2cs).toEqual([{ sply_ty: "INTRA", pos: "07", typ: "OE", rt: 18, txval: 10000, camt: 900, samt: 900, csamt: 0 }])
    expect(recordWarnings([intra, specimen], GSTIN)[0]).toMatch(/PBL\/26-27\/0005/)
  })

  it("leaves out empty tables", () => {
    const { json } = buildGstr1([intra], recordPeriod(2026, 3), GSTIN, "07")
    expect(Object.keys(json).sort()).toEqual(["b2cs", "doc_issue", "fp", "gstin", "hash", "hsn", "version"])
    expect(Object.keys(json.hsn as object)).toEqual(["hsn_b2c"])
  })

  it("is not prepared for a whole year", () => {
    expect(() => buildGstr1([intra], recordPeriod(2026, null), GSTIN, "07")).toThrow()
  })
})

describe("summary, warnings and register", () => {
  it("totals the period", () => {
    expect(summarise([intra, inter, b2b, large], "07")).toEqual({
      invoices: 4,
      taxableValue: 11700000,
      cgst: 90000,
      sgst: 90000,
      igst: 1926000,
      total: 13806000,
      tables: { B2B: 1, B2CL: 1, B2CS: 2 },
    })
  })

  it("flags refunds and gaps in the numbers", () => {
    const refunded = { ...inter, status: "REFUNDED" }
    const w = recordWarnings([intra, refunded, large], GSTIN)
    expect(w.some((x) => /PBL\/26-27\/0002.*credit note/.test(x))).toBe(true)
    expect(w.some((x) => /jump from PBL\/26-27\/0002 to PBL\/26-27\/0004/.test(x))).toBe(true)
    expect(recordWarnings([intra, inter], GSTIN)).toEqual([])
  })

  it("writes the invoice register in invoice order with a total line", () => {
    const lines = invoiceRegisterCsv([b2b, intra], "07").trim().split("\n")
    expect(lines[0]).toMatch(/^Invoice number,Invoice date,Order,/)
    expect(lines[1]).toMatch(/^PBL\/26-27\/0001,05-10-2026,260001,Asha Rao,,,Delhi \(07\),B2CS,10000\.00,900\.00,900\.00,0\.00,11800\.00,Delivered$/)
    expect(lines[2]).toMatch(/^PBL\/26-27\/0003,.*,27AAACA1234A1Z5,Acme Retail,Maharashtra \(27\),B2B,2000\.00,0\.00,0\.00,360\.00,2360\.00,/)
    expect(lines[3]).toBe("Total,,,2 invoices,,,,,12000.00,900.00,900.00,360.00,14160.00,")
  })
})
