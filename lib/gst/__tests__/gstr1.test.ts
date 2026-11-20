import { describe, expect, it } from "vitest"
import {
  buildGstr1,
  creditNoteRegisterCsv,
  gstr1Table,
  invoiceRegisterCsv,
  istDate,
  recordWarnings,
  summarise,
  type RecordCreditNote,
  type RecordInvoice,
} from "../gstr1"
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
    const zeroTotals = { taxableValue: 0, cgst: 0, sgst: 0, igst: 0, total: 0 }
    const gross = { taxableValue: 11700000, cgst: 90000, sgst: 90000, igst: 1926000, total: 13806000 }
    expect(summarise([intra, inter, b2b, large], "07")).toEqual({
      invoices: 4,
      ...gross,
      tables: { B2B: 1, B2CL: 1, B2CS: 2 },
      creditNotes: 0,
      credited: zeroTotals,
      net: gross,
    })
  })

  it("takes credit notes off the net figures", () => {
    const s = summarise([intra], "07", [cnIntra])
    expect(s.creditNotes).toBe(1)
    expect(s.credited).toEqual({ taxableValue: 400000, cgst: 36000, sgst: 36000, igst: 0, total: 472000 })
    expect(s.net).toEqual({ taxableValue: 600000, cgst: 54000, sgst: 54000, igst: 0, total: 708000 })
  })

  it("flags refunds without a credit note, returns waiting for one, and gaps in the numbers", () => {
    const w = recordWarnings([intra, { ...inter, status: "REFUNDED" }, { ...large, status: "RETURN_RECEIVED" }], GSTIN)
    expect(w.some((x) => /PBL\/26-27\/0002.*refunded without a credit note/.test(x))).toBe(true)
    expect(w.some((x) => /PBL\/26-27\/0004.*Marking it refunded issues the credit note/.test(x))).toBe(true)
    expect(w.some((x) => /jump from PBL\/26-27\/0002 to PBL\/26-27\/0004/.test(x))).toBe(true)
    expect(recordWarnings([intra, { ...inter, status: "REFUNDED", creditNotes: ["CN/26-27/001"] }], GSTIN)).toEqual([])
    expect(recordWarnings([], GSTIN, [cnIntra, { ...cnInter, number: "CN/26-27/003" }]).some((x) => /jump from CN\/26-27\/001 to CN\/26-27\/003/.test(x))).toBe(true)
  })

  it("writes the invoice register in invoice order with a total line", () => {
    const lines = invoiceRegisterCsv([b2b, { ...intra, creditNotes: ["CN/26-27/001"] }], "07").trim().split("\n")
    expect(lines[0]).toMatch(/^Invoice number,Invoice date,Order,.*,Status now,Credit notes$/)
    expect(lines[1]).toBe("PBL/26-27/0001,05-10-2026,260001,Asha Rao,,,Delhi (07),B2CS,10000.00,900.00,900.00,0.00,11800.00,Delivered,CN/26-27/001")
    expect(lines[2]).toMatch(/^PBL\/26-27\/0003,.*,27AAACA1234A1Z5,Acme Retail,Maharashtra \(27\),B2B,2000\.00,0\.00,0\.00,360\.00,2360\.00,Delivered,$/)
    expect(lines[3]).toBe("Total,,,2 invoices,,,,,12000.00,900.00,900.00,360.00,14160.00,,")
  })

  it("writes the credit note register with the GSTR-1 table of each note", () => {
    const lines = creditNoteRegisterCsv([cnB2b, cnIntra]).trim().split("\n")
    expect(lines[0]).toMatch(/^Credit note number,Credit note date,Against invoice,/)
    expect(lines[1]).toBe("CN/26-27/001,10-11-2026,PBL/26-27/0001,05-10-2026,260001,Asha Rao,,Delhi (07),Taken off B2C small (7),4000.00,360.00,360.00,0.00,4720.00,Goods returned")
    expect(lines[2]).toBe(
      'CN/26-27/004,10-11-2026,PBL/26-27/0003,05-10-2026,260003,Ravi Iyer,27AAACA1234A1Z5,Maharashtra (27),"Credit notes, registered (9B)",1200.00,0.00,0.00,216.00,1416.00,Goods returned'
    )
    expect(lines[3]).toBe("Total,,,,,2 credit notes,,,,5200.00,360.00,360.00,216.00,6136.00,")
  })
})

const cnBase = {
  date: "2026-11-10T06:00:00.000Z",
  reason: "Goods returned",
  customerName: "Asha Rao",
  sellerGstin: GSTIN,
  sellerStateCode: "07",
  buyerGstin: null,
  buyerName: null,
}
const cnIntra: RecordCreditNote = {
  ...cnBase,
  number: "CN/26-27/001",
  orderCode: "260001",
  invoiceNumber: "PBL/26-27/0001",
  invoiceDate: "2026-10-05T06:00:00.000Z",
  invoiceAmount: 1180000,
  amount: 472000,
  taxableValue: 400000,
  cgst: 36000,
  sgst: 36000,
  igst: 0,
  placeOfSupply: "07",
  items: [{ hsn: "6204", gstRate: 18, quantity: 1, taxableValue: 400000, taxAmount: 72000 }],
}
const cnInter: RecordCreditNote = {
  ...cnBase,
  number: "CN/26-27/002",
  orderCode: "260002",
  invoiceNumber: "PBL/26-27/0002",
  invoiceDate: "2026-10-05T06:00:00.000Z",
  invoiceAmount: 590000,
  amount: 590000,
  taxableValue: 500000,
  cgst: 0,
  sgst: 0,
  igst: 90000,
  placeOfSupply: "27",
  items: [{ hsn: "6205", gstRate: 18, quantity: 2, taxableValue: 500000, taxAmount: 90000 }],
}
const cnLarge: RecordCreditNote = {
  ...cnBase,
  number: "CN/26-27/003",
  orderCode: "260004",
  invoiceNumber: "PBL/26-27/0004",
  invoiceDate: "2026-12-31T19:00:00.000Z",
  invoiceAmount: 11800000,
  amount: 3933333,
  taxableValue: 3333333,
  cgst: 0,
  sgst: 0,
  igst: 600000,
  placeOfSupply: "29",
  items: [{ hsn: "6204", gstRate: 18, quantity: 1, taxableValue: 3333333, taxAmount: 600000 }],
}
const cnB2b: RecordCreditNote = {
  ...cnBase,
  number: "CN/26-27/004",
  orderCode: "260003",
  invoiceNumber: "PBL/26-27/0003",
  invoiceDate: "2026-10-05T06:00:00.000Z",
  invoiceAmount: 236000,
  buyerGstin: "27AAACA1234A1Z5",
  buyerName: "Acme Retail",
  customerName: "Ravi Iyer",
  amount: 141600,
  taxableValue: 120000,
  cgst: 0,
  sgst: 0,
  igst: 21600,
  placeOfSupply: "27",
  items: [{ hsn: "6204", gstRate: 18, quantity: 1, taxableValue: 120000, taxAmount: 21600 }],
}

describe("GSTR-1 credit notes", () => {
  const build = (notes: RecordCreditNote[]) => buildGstr1([intra, inter, b2b, large], recordPeriod(2026, 3), GSTIN, "07", notes)

  it("lists credit notes against B2B invoices under the buyer's GSTIN", () => {
    const { json } = build([cnB2b])
    expect(json.cdnr).toEqual([
      {
        ctin: "27AAACA1234A1Z5",
        nt: [
          {
            ntty: "C",
            nt_num: "CN/26-27/004",
            nt_dt: "10-11-2026",
            val: 1416,
            pos: "27",
            rchrg: "N",
            inv_typ: "R",
            itms: [{ num: 1, itm_det: { rt: 18, txval: 1200, iamt: 216, csamt: 0 } }],
          },
        ],
      },
    ])
  })

  it("lists credit notes against B2C large invoices as unregistered", () => {
    const { json } = build([cnLarge])
    expect(json.cdnur).toEqual([
      {
        typ: "B2CL",
        ntty: "C",
        nt_num: "CN/26-27/003",
        nt_dt: "10-11-2026",
        val: 39333.33,
        pos: "29",
        itms: [{ num: 1, itm_det: { rt: 18, txval: 33333.33, iamt: 6000, csamt: 0 } }],
      },
    ])
    expect(json.b2cl).toBeDefined()
  })

  it("takes credit notes against B2C small invoices off B2C small", () => {
    const { json, warnings } = build([cnIntra])
    expect(json.cdnr).toBeUndefined()
    expect(json.cdnur).toBeUndefined()
    expect(json.b2cs).toEqual([
      { sply_ty: "INTRA", pos: "07", typ: "OE", rt: 18, txval: 6000, camt: 540, samt: 540, csamt: 0 },
      { sply_ty: "INTER", pos: "27", typ: "OE", rt: 18, txval: 5000, iamt: 900, csamt: 0 },
    ])
    expect(warnings).toEqual([])
  })

  it("drops a B2C small row that a full credit brings to zero", () => {
    const { json, warnings } = build([cnInter])
    expect((json.b2cs as { pos: string }[]).map((r) => r.pos)).toEqual(["07"])
    expect(warnings).toEqual([])
  })

  it("leaves out a negative B2C small row and says so", () => {
    const { json, warnings } = buildGstr1([intra], recordPeriod(2026, 3), GSTIN, "07", [cnInter])
    expect((json.b2cs as { pos: string }[]).map((r) => r.pos)).toEqual(["07"])
    expect(warnings.some((w) => /Maharashtra \(27\) at 18%.*5000\.00 below zero/.test(w))).toBe(true)
    expect(warnings.some((w) => /B2C HSN summary for 6205/.test(w))).toBe(true)
  })

  it("takes credit notes off the HSN summary", () => {
    const { json } = build([cnIntra, cnB2b])
    const hsn = json.hsn as { hsn_b2b: Record<string, unknown>[]; hsn_b2c: Record<string, unknown>[] }
    expect(hsn.hsn_b2b.map((r) => [r.num, r.hsn_sc, r.qty, r.txval, r.iamt])).toEqual([[1, "6206", 1, 800, 144]])
    expect(hsn.hsn_b2c.map((r) => [r.hsn_sc, r.qty, r.txval, r.iamt, r.camt, r.samt])).toEqual([
      ["6204", 3, 106000, 18000, 540, 540],
      ["6205", 2, 5000, 900, 0, 0],
    ])
  })

  it("adds the credit note range to documents issued", () => {
    const { json } = build([cnInter, cnIntra])
    expect(json.doc_issue).toEqual({
      doc_det: [
        { doc_num: 1, docs: [{ num: 1, from: "PBL/26-27/0001", to: "PBL/26-27/0004", totnum: 4, cancel: 0, net_issue: 4 }] },
        { doc_num: 5, docs: [{ num: 1, from: "CN/26-27/001", to: "CN/26-27/002", totnum: 2, cancel: 0, net_issue: 2 }] },
      ],
    })
  })

  it("makes a file for a quarter with credit notes only", () => {
    const { json, invoices, creditNotes, warnings } = buildGstr1([], recordPeriod(2026, 3), GSTIN, "07", [cnB2b])
    expect([invoices, creditNotes]).toEqual([0, 1])
    expect(Object.keys(json).sort()).toEqual(["cdnr", "doc_issue", "fp", "gstin", "hash", "version"])
    expect(json.doc_issue).toEqual({ doc_det: [{ doc_num: 5, docs: [{ num: 1, from: "CN/26-27/004", to: "CN/26-27/004", totnum: 1, cancel: 0, net_issue: 1 }] }] })
    expect(warnings.some((w) => /B2B HSN summary for 6204/.test(w))).toBe(true)
  })
})
