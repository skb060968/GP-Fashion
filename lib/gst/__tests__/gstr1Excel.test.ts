import { describe, expect, it } from "vitest"
import { buildGstr1, type RecordCreditNote, type RecordInvoice } from "../gstr1"
import { excelDate, excelPlace, gstr1Sheets } from "../gstr1Excel"
import { recordPeriod } from "../period"
import { columnName, makeXlsx, safeSheetName } from "@/lib/xlsx"

const GSTIN = "07FSKPB8774F1ZD"
const base = {
  orderCode: "26001",
  invoiceDate: "2026-10-05T06:00:00.000Z",
  customerName: "Asha Rao",
  sellerGstin: GSTIN,
  sellerStateCode: "07",
  status: "DELIVERED",
  buyerGstin: null,
  buyerName: null,
}
const intra: RecordInvoice = {
  ...base,
  invoiceNumber: "PBL/26-27/0001",
  amount: 1180000,
  taxableValue: 1000000,
  cgst: 90000,
  sgst: 90000,
  igst: 0,
  placeOfSupply: "07",
  items: [{ hsn: "6204", gstRate: 18, quantity: 1, taxableValue: 1000000, taxAmount: 180000 }],
}
const b2b: RecordInvoice = {
  ...base,
  invoiceNumber: "PBL/26-27/0002",
  buyerGstin: "27AAACA1234A1Z5",
  buyerName: "Acme Retail",
  amount: 236000,
  taxableValue: 200000,
  cgst: 0,
  sgst: 0,
  igst: 36000,
  placeOfSupply: "27",
  items: [{ hsn: "6205", gstRate: 18, quantity: 2, taxableValue: 200000, taxAmount: 36000 }],
}
const cn: RecordCreditNote = {
  number: "CN/26-27/001",
  date: "2026-11-10T06:00:00.000Z",
  reason: "Goods returned",
  orderCode: "26002",
  invoiceNumber: "PBL/26-27/0002",
  invoiceDate: "2026-10-05T06:00:00.000Z",
  invoiceAmount: 236000,
  amount: 118000,
  taxableValue: 100000,
  cgst: 0,
  sgst: 0,
  igst: 18000,
  placeOfSupply: "27",
  buyerGstin: "27AAACA1234A1Z5",
  buyerName: "Acme Retail",
  customerName: "Ravi Iyer",
  sellerGstin: GSTIN,
  sellerStateCode: "07",
  items: [{ hsn: "6205", gstRate: 18, quantity: 1, taxableValue: 100000, taxAmount: 18000 }],
}

describe("GSTR-1 Excel sheets", () => {
  const { json } = buildGstr1([intra, b2b], recordPeriod(2026, 3), GSTIN, "07", [cn])
  const sheets = gstr1Sheets(json, { "27AAACA1234A1Z5": "Acme Retail" })
  const byName = Object.fromEntries(sheets.map((s) => [s.name, s.rows]))

  it("has one sheet per table, in the offline tool's order", () => {
    expect(sheets.map((s) => s.name)).toEqual(["b2b", "b2cl", "b2cs", "cdnr", "cdnur", "hsn(b2b)", "hsn(b2c)", "docs"])
    expect(byName.b2cl).toHaveLength(1)
    expect(byName.cdnur).toHaveLength(1)
  })

  it("writes dates and places the way the workbook expects", () => {
    expect(excelDate("05-10-2026")).toBe("05-Oct-2026")
    expect(excelPlace("07")).toBe("07-Delhi")
    expect(excelPlace("27")).toBe("27-Maharashtra")
  })

  it("lists B2B invoices and credit notes with the buyer's name", () => {
    expect(byName.b2b[1]).toEqual(["27AAACA1234A1Z5", "Acme Retail", "PBL/26-27/0002", "05-Oct-2026", 2360, "27-Maharashtra", "N", null, "Regular B2B", null, 18, 2000, 0])
    expect(byName.cdnr[1]).toEqual(["27AAACA1234A1Z5", "Acme Retail", "CN/26-27/001", "10-Nov-2026", "C", "27-Maharashtra", "N", "Regular B2B", 1180, null, 18, 1000, 0])
  })

  it("adds up B2C small and the HSN summaries", () => {
    expect(byName.b2cs.slice(1)).toEqual([["OE", "07-Delhi", null, 18, 10000, 0, null]])
    expect(byName["hsn(b2c)"][1]).toEqual(["6204", "Women's suits and dresses", "PCS-PIECES", 1, 11800, 18, 10000, 0, 900, 900, 0])
    expect(byName["hsn(b2b)"][1]).toEqual(["6205", "Men's shirts", "PCS-PIECES", 1, 1180, 18, 1000, 180, 0, 0, 0])
  })

  it("lists the documents issued", () => {
    expect(byName.docs.slice(1)).toEqual([
      ["Invoices for outward supply", "PBL/26-27/0001", "PBL/26-27/0002", 2, 0],
      ["Credit Note", "CN/26-27/001", "CN/26-27/001", 1, 0],
    ])
  })
})

describe("xlsx writer", () => {
  it("names columns past Z", () => {
    expect([0, 25, 26, 27, 51, 52, 701, 702].map(columnName)).toEqual(["A", "Z", "AA", "AB", "AZ", "BA", "ZZ", "AAA"])
  })

  it("cleans sheet names", () => {
    expect(safeSheetName("hsn(b2b)")).toBe("hsn(b2b)")
    expect(safeSheetName("a/b:c*d?e[f]")).toBe("a b c d e f")
    expect(safeSheetName("x".repeat(40))).toHaveLength(31)
  })

  it("packs the workbook parts, escapes text and keeps numbers as numbers", () => {
    const bytes = makeXlsx([
      { name: "b2cs", rows: [["Type", "Rate"], ["A & <B>", 18], [null, 1180.5]] },
      { name: "b2cs", rows: [["x"]] },
    ])
    const text = new TextDecoder().decode(bytes)
    for (const part of ["[Content_Types].xml", "_rels/.rels", "xl/workbook.xml", "xl/_rels/workbook.xml.rels", "xl/styles.xml", "xl/worksheets/sheet1.xml", "xl/worksheets/sheet2.xml"]) {
      expect(text).toContain(part)
    }
    expect(text).toContain("A &amp; &lt;B&gt;")
    expect(text).toContain('<c r="B2"><v>18</v></c>')
    expect(text).toContain('<c r="B3"><v>1180.5</v></c>')
    expect(text).not.toContain('r="A3"')
    expect(text).toContain('<sheet name="b2cs" sheetId="1"')
    expect(text).toContain('<sheet name="b2cs 2" sheetId="2"')
  })
})
