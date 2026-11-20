import { describe, expect, it } from "vitest"
import {
  CreditNoteError,
  creditLines,
  creditNoteDeadline,
  creditNoteFileName,
  creditNoteFromSlug,
  creditNoteNumber,
  creditNoteSlug,
  creditTotals,
  remainingQuantities,
  type CreditableItem,
} from "../creditNote"
import { creditNoteDocument, type DocumentCreditNote } from "@/lib/orders/creditNoteDocument"

const dress: CreditableItem = { id: "a", name: "Pink Petal Gown", size: "M", color: null, hsn: "6204", gstRate: 18, quantity: 3, taxableValue: 2540000, taxAmount: 457201 }
const shirt: CreditableItem = { id: "b", name: "Dark Romance Shirt", size: "L", color: "Black", hsn: "6205", gstRate: 18, quantity: 1, taxableValue: 846610, taxAmount: 152390 }

describe("credit note numbers", () => {
  it("numbers each financial year from 001", () => {
    expect(creditNoteNumber("26-27", 1)).toBe("CN/26-27/001")
    expect(creditNoteNumber("26-27", 42)).toBe("CN/26-27/042")
    expect(creditNoteNumber("26-27", 1000)).toBe("CN/26-27/1000")
    expect(creditNoteNumber("26-27", 999).length).toBeLessThanOrEqual(16)
  })

  it("turns a number into a URL and file name and back", () => {
    expect(creditNoteSlug("CN/26-27/001")).toBe("CN-26-27-001")
    expect(creditNoteFromSlug("CN-26-27-001")).toBe("CN/26-27/001")
    expect(creditNoteFromSlug("CN-26-27-001.pdf")).toBe("CN/26-27/001")
    expect(creditNoteFromSlug("PBL-26-27-0001")).toBeNull()
    expect(creditNoteFromSlug("CN-26-27-1")).toBeNull()
    expect(creditNoteFileName("CN/26-27/001")).toBe("Credit-Note-CN-26-27-001")
  })
})

describe("credit lines", () => {
  it("credits a whole item at its invoice values", () => {
    const [line] = creditLines([dress, shirt], [], [{ orderItemId: "b", quantity: 1 }])
    expect(line).toEqual({ orderItemId: "b", name: "Dark Romance Shirt", size: "L", color: "Black", hsn: "6205", gstRate: 18, quantity: 1, taxableValue: 846610, taxAmount: 152390 })
  })

  it("splits an item by quantity and gives the last part the remainder", () => {
    const first = creditLines([dress], [], [{ orderItemId: "a", quantity: 1 }])[0]
    expect([first.taxableValue, first.taxAmount]).toEqual([846667, 152400])
    const second = creditLines([dress], [first], [{ orderItemId: "a", quantity: 1 }])[0]
    const last = creditLines([dress], [first, second], [{ orderItemId: "a", quantity: 1 }])[0]
    expect(first.taxableValue + second.taxableValue + last.taxableValue).toBe(dress.taxableValue)
    expect(first.taxAmount + second.taxAmount + last.taxAmount).toBe(dress.taxAmount)
  })

  it("skips items with quantity 0", () => {
    const lines = creditLines([dress, shirt], [], [{ orderItemId: "a", quantity: 0 }, { orderItemId: "b", quantity: 1 }])
    expect(lines.map((l) => l.orderItemId)).toEqual(["b"])
  })

  it("refuses more than is left, unknown items, repeats and an empty note", () => {
    expect(() => creditLines([dress], [], [{ orderItemId: "a", quantity: 4 }])).toThrow(/Only 3 of Pink Petal Gown/)
    expect(() => creditLines([shirt], [{ orderItemId: "b", quantity: 1, taxableValue: 846610, taxAmount: 152390 }], [{ orderItemId: "b", quantity: 1 }])).toThrow(/already been credited in full/)
    expect(() => creditLines([dress], [], [{ orderItemId: "x", quantity: 1 }])).toThrow(/not on this order/)
    expect(() => creditLines([dress], [], [{ orderItemId: "a", quantity: 1 }, { orderItemId: "a", quantity: 1 }])).toThrow(/listed twice/)
    expect(() => creditLines([dress], [], [{ orderItemId: "a", quantity: 0 }])).toThrow(CreditNoteError)
    expect(() => creditLines([dress], [], [{ orderItemId: "a", quantity: 1.5 }])).toThrow(/whole numbers/)
  })

  it("counts what is left of each item", () => {
    const left = remainingQuantities([dress, shirt], [{ orderItemId: "a", quantity: 2 }])
    expect([left.get("a"), left.get("b")]).toEqual([1, 1])
  })
})

describe("credit totals", () => {
  const lines = [{ taxableValue: 846610, taxAmount: 152390 }, { taxableValue: 100, taxAmount: 19 }]
  it("splits tax into CGST and SGST in the seller's state", () => {
    expect(creditTotals(lines, true)).toEqual({ taxableValue: 846710, cgst: 76205, sgst: 76204, igst: 0, amount: 999119 })
  })
  it("charges IGST to other states", () => {
    expect(creditTotals(lines, false)).toEqual({ taxableValue: 846710, cgst: 0, sgst: 0, igst: 152409, amount: 999119 })
  })
})

describe("credit note deadline", () => {
  it("is 30 November after the invoice's financial year", () => {
    expect(creditNoteDeadline("2026-10-05T06:00:00.000Z").toISOString()).toBe("2027-11-30T18:30:00.000Z")
    expect(creditNoteDeadline("2027-03-31T10:00:00.000Z").toISOString()).toBe("2027-11-30T18:30:00.000Z")
    expect(creditNoteDeadline("2027-03-31T19:00:00.000Z").toISOString()).toBe("2028-11-30T18:30:00.000Z")
  })
})

describe("credit note document", () => {
  const cn: DocumentCreditNote = {
    number: "CN/26-27/001",
    date: "2026-11-10T06:00:00.000Z",
    reason: "Goods returned",
    amount: 999000,
    taxableValue: 846610,
    cgst: 76195,
    sgst: 76195,
    igst: 0,
    placeOfSupply: "07",
    buyerGstin: null,
    buyerName: null,
    invoiceNumber: "PBL/26-27/0001",
    invoiceDate: "2026-10-05T06:00:00.000Z",
    sellerGstin: "07FSKPB8774F1ZD",
    sellerLegalName: "Piyush Bholla",
    sellerTradeName: "Piyush Bholla Label",
    sellerAddress: "N-37A, Vijay Vihar, Uttam Nagar\nDelhi 110059",
    sellerStateCode: "07",
    sellerEmail: "piyushbhollalabel@gmail.com",
    sellerPhone: "+91 9821818352",
    order: {
      orderCode: "26001",
      address: { fullName: "Asha Rao", phone: "9876543210", email: "asha@example.com", addressLine1: "12 Park Street", addressLine2: null, city: "New Delhi", state: "Delhi", pincode: "110001" },
    },
    items: [{ id: "x", name: "Dark Romance Shirt", size: "L", color: "Black", hsn: "6205", gstRate: 18, quantity: 1, taxableValue: 846610, taxAmount: 152390 }],
  }

  it("shows the saved seller, the original invoice and the CGST/SGST split", () => {
    const d = creditNoteDocument(cn)
    expect(d.seller).toMatchObject({ name: "Piyush Bholla", tradeName: "Piyush Bholla Label", addressLines: ["N-37A, Vijay Vihar, Uttam Nagar", "Delhi 110059"], state: "Delhi (07)" })
    expect([d.invoiceNumber, d.fileName, d.specimen]).toEqual(["PBL/26-27/0001", "Credit-Note-CN-26-27-001", false])
    expect(d.taxColumns).toEqual(["CGST 9%", "SGST 9%"])
    expect(d.lines[0]).toMatchObject({ detail: "Size L · Black", taxParts: [76195, 76195], amount: 999000 })
    expect(d.totals.inWords).toBe("Rupees Nine Thousand Nine Hundred Ninety Only")
  })

  it("uses IGST for another state", () => {
    const d = creditNoteDocument({ ...cn, placeOfSupply: "27", cgst: 0, sgst: 0, igst: 152390 })
    expect(d.taxColumns).toEqual(["IGST 18%"])
    expect(d.totals.taxParts).toEqual([{ label: "IGST @ 18%", value: 152390 }])
  })
})
