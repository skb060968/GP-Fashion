import { describe, expect, it } from "vitest"
import { billKey, checkPurchase, periodMonths, purchaseCost, purchaseTotal, sumItc, type PurchaseInput } from "../purchases"
import { matchGstr2b, parseGstr2b, type RegisterEntry } from "../gstr2b"
import { purchaseRegisterCsv } from "../register"
import { gstinCheckChar } from "@/lib/gst/gstin"

const reg = new Date("2026-11-18T18:30:00Z")
const now = new Date("2026-12-10T06:00:00Z")
const gstin = (first14: string) => first14 + gstinCheckChar(first14)
const DELHI = gstin("07AAACR5055K1Z")
const KARNATAKA = gstin("29AABCT1332L1Z")
const BAD = DELHI.slice(0, 14) + (DELHI[14] === "A" ? "B" : "A")
const bill: PurchaseInput = { kind: "BILL", category: "FABRIC", date: "2026-11-25", supplierName: "Kapoor Fabrics", supplierGstin: DELHI, billNumber: "KF/1182", description: "Silk crepe, 3 m", taxableValue: 1000000, cgst: 25000, sgst: 25000 }

describe("checking an entry", () => {
  it("keeps a Delhi bill with CGST and SGST and makes a matching key", () => {
    const r = checkPurchase(bill, "07", reg, now)
    expect(r).toMatchObject({ supplierStateCode: "07", billKey: "KF1182", cgst: 25000, sgst: 25000, igst: 0, claimItc: true })
    expect(billKey(" kf-001182 ")).toBe("KF001182")
    expect(billKey("000123")).toBe("123")
  })
  it("refuses the wrong tax for the supplier's state", () => {
    expect(() => checkPurchase({ ...bill, igst: 50000, cgst: 0, sgst: 0 }, "07", reg, now)).toThrow(/CGST and SGST, not IGST/)
    expect(() => checkPurchase({ ...bill, supplierGstin: KARNATAKA }, "07", reg, now)).toThrow(/IGST, not CGST and SGST/)
    expect(() => checkPurchase({ ...bill, cgst: 25000, sgst: 20000 }, "07", reg, now)).toThrow(/are equal/)
  })
  it("needs a GSTIN and bill number on a GST bill, and checks the GSTIN", () => {
    expect(() => checkPurchase({ ...bill, supplierGstin: "" }, "07", reg, now)).toThrow(/GSTIN from the bill/)
    expect(() => checkPurchase({ ...bill, supplierGstin: BAD }, "07", reg, now)).toThrow(/Supplier GSTIN/)
    expect(() => checkPurchase({ ...bill, billNumber: "" }, "07", reg, now)).toThrow(/bill number/)
    expect(() => checkPurchase({ ...bill, billNumber: "12345678901234567" }, "07", reg, now)).toThrow(/16 characters/)
  })
  it("refuses future dates and credit on bills before registration", () => {
    expect(() => checkPurchase({ ...bill, date: "2026-12-11" }, "07", reg, now)).toThrow(/future/)
    expect(() => checkPurchase({ ...bill, date: "2026-11-10" }, "07", reg, now)).toThrow(/before the GST registration/)
    expect(checkPurchase({ ...bill, date: "2026-11-10", claimItc: false }, "07", reg, now).claimItc).toBe(false)
  })
  it("records an expense without GST with no tax and no credit", () => {
    const r = checkPurchase({ kind: "NO_GST", category: "STITCHING", date: "2026-11-30", supplierName: "Ravi Tailors", description: "Stitching, 1 gown", taxableValue: 150000, cgst: 999 }, "07", reg, now)
    expect(r).toMatchObject({ supplierGstin: null, billNumber: null, cgst: 0, sgst: 0, igst: 0, claimItc: false })
  })
})

describe("amounts", () => {
  const p = { kind: "BILL", taxableValue: 1000000, igst: 0, cgst: 25000, sgst: 25000, claimItc: true }
  it("counts cost without the GST claimed, and with GST when not claimed", () => {
    expect(purchaseTotal(p)).toBe(1050000)
    expect(purchaseCost(p)).toBe(1000000)
    expect(purchaseCost({ ...p, claimItc: false })).toBe(1050000)
    expect(purchaseCost({ ...p, kind: "CREDIT_NOTE" })).toBe(-1000000)
  })
  it("adds up credit, less supplier credit notes, ignoring expenses", () => {
    expect(sumItc([p, { ...p, kind: "CREDIT_NOTE", cgst: 5000, sgst: 5000 }, { ...p, kind: "NO_GST", claimItc: false }])).toEqual({ igst: 0, cgst: 20000, sgst: 20000 })
  })
})

const file = {
  data: {
    gstin: "07FSKPB8774F1ZD",
    rtnprd: "122026",
    gendt: "14-01-2027",
    docdata: {
      b2b: [
        { ctin: DELHI, trdnm: "Kapoor Fabrics", inv: [
          { inum: "KF/1182", dt: "25-11-2026", val: 10500, txval: 10000, igst: 0, cgst: 250, sgst: 250, itcavl: "Y", items: [] },
          { inum: "KF/1190", dt: "02-12-2026", val: 1050, itcavl: "Y", items: [{ num: 1, rt: 5, txval: 1000, cgst: 25, sgst: 25 }] },
        ] },
        { ctin: KARNATAKA, trdnm: "Mysore Silks", inv: [{ inum: "MS-77", dt: "05-12-2026", val: 5900, txval: 5000, igst: 900, itcavl: "N", rsn: "POS and supplier state are same" }] },
      ],
      cdnr: [{ ctin: DELHI, trdnm: "Kapoor Fabrics", nt: [{ ntnum: "CN-4", typ: "C", dt: "10-12-2026", val: 105, txval: 100, cgst: 2.5, sgst: 2.5, itcavl: "Y" }] }],
      isd: [{ ctin: "07AAAAA0000A1Z5", doclist: [{}, {}] }],
    },
  },
}

describe("reading GSTR-2B", () => {
  const g = parseGstr2b(JSON.stringify(file), "07FSKPB8774F1ZD")
  it("reads invoices and credit notes with amounts in paise, from totals or items", () => {
    expect(g.period).toBe("2026-12")
    expect(g.generatedOn).toBe("14-01-2027")
    expect(g.docs).toHaveLength(4)
    expect(g.docs[0]).toMatchObject({ section: "B2B", ctin: DELHI, number: "KF/1182", key: "KF1182", date: "2026-11-25", taxableValue: 1000000, cgst: 25000, sgst: 25000, itcAvailable: true })
    expect(g.docs[1]).toMatchObject({ taxableValue: 100000, cgst: 2500, sgst: 2500 })
    expect(g.docs[2]).toMatchObject({ igst: 90000, itcAvailable: false, reason: "POS and supplier state are same" })
    expect(g.docs[3]).toMatchObject({ section: "CDNR", noteType: "C", key: "CN4", cgst: 250 })
    expect(g.other).toEqual([{ section: "isd", count: 2 }])
  })
  it("refuses another business's GSTR-2B and other files", () => {
    expect(() => parseGstr2b(JSON.stringify(file), DELHI)).toThrow(/is for GSTIN/)
    expect(() => parseGstr2b("not json", "07FSKPB8774F1ZD")).toThrow(/not a GSTR-2B/)
    expect(() => parseGstr2b(JSON.stringify({ gstin: "x" }), "07FSKPB8774F1ZD")).toThrow(/does not look like GSTR-2B/)
  })

  it("matches the register and counts credit only for matching bills", () => {
    const entry = (over: Partial<RegisterEntry>): RegisterEntry => ({ id: "a", kind: "BILL", supplierGstin: DELHI, billKey: "KF1182", taxableValue: 1000000, igst: 0, cgst: 25000, sgst: 25000, claimItc: true, ...over })
    const register = [
      entry({}),
      entry({ id: "b", billKey: "KF1190", taxableValue: 100000, cgst: 5000, sgst: 5000 }),
      entry({ id: "c", supplierGstin: KARNATAKA, billKey: "MS77", taxableValue: 500000, igst: 90000, cgst: 0, sgst: 0 }),
      entry({ id: "d", kind: "CREDIT_NOTE", billKey: "CN4", taxableValue: 10000, cgst: 250, sgst: 250 }),
      entry({ id: "e", billKey: "KF2000" }),
    ]
    const m = matchGstr2b(register, [{ period: g.period, docs: g.docs }, { period: "2027-03", docs: g.docs }])
    expect(m.entries.get("a")?.status).toBe("matched")
    expect(m.entries.get("b")?.status).toBe("differs")
    expect(m.entries.get("c")?.status).toBe("unavailable")
    expect(m.entries.get("d")?.status).toBe("matched")
    expect(m.entries.get("e")).toEqual({ status: "awaiting", period: null, doc: null })
    expect(m.unmatched).toHaveLength(0)
    expect(m.itcByPeriod.get("2026-12")).toEqual({ igst: 0, cgst: 24750, sgst: 24750 })
    expect(m.itcByPeriod.get("2027-03")).toBeUndefined()
  })
  it("lists GSTR-2B documents missing from the register", () => {
    const m = matchGstr2b([], [{ period: g.period, docs: g.docs }])
    expect(m.unmatched.map((d) => d.number)).toEqual(["KF/1182", "KF/1190", "MS-77", "CN-4"])
  })
})

describe("purchase register", () => {
  it("writes one row per entry with signed credit notes and a total", () => {
    const csv = purchaseRegisterCsv([
      { kind: "BILL", category: "FABRIC", date: new Date("2026-11-25T06:30:00Z"), supplierName: "Kapoor Fabrics", supplierGstin: DELHI, billNumber: "KF/1182", description: "Silk crepe", taxableValue: 1000000, igst: 0, cgst: 25000, sgst: 25000, claimItc: true, order: { orderCode: "26001" }, challan: { number: "JW/26-27/001" } },
      { kind: "NO_GST", category: "STITCHING", date: new Date("2026-11-30T06:30:00Z"), supplierName: "Ravi Tailors", supplierGstin: null, billNumber: null, description: "Stitching", taxableValue: 150000, igst: 0, cgst: 0, sgst: 0, claimItc: false, order: { orderCode: "26001" }, challan: null },
    ]).trim().split("\n")
    expect(csv[1]).toContain("25-11-2026,GST bill,Fabric,Kapoor Fabrics")
    expect(csv[1]).toContain("26001,JW/26-27/001,10000.00,0.00,250.00,250.00,10500.00,Yes,10000.00")
    expect(csv[2]).toContain("Expense without GST,Stitching (tailor),Ravi Tailors")
    expect(csv[3]).toMatch(/^Total,.*2 entries,,,11500\.00,0\.00,250\.00,250\.00,12000\.00,credit 500\.00,11500\.00$/)
  })
})

describe("months in a period", () => {
  it("lists the months of a quarter in India time", () => {
    expect(periodMonths(new Date("2026-09-30T18:30:00Z"), new Date("2026-12-31T18:30:00Z"))).toEqual(["2026-10", "2026-11", "2026-12"])
  })
})
