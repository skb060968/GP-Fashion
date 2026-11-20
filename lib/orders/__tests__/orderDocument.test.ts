import { describe, expect, it } from "vitest"
import { business } from "@/lib/data/business"
import { orderDocument, type DocumentOrder } from "../orderDocument"

const base: DocumentOrder = {
  orderCode: "260001",
  amount: 11800,
  discount: 0,
  couponCode: null,
  subtotal: 11800,
  taxableValue: 10000,
  cgst: 900,
  sgst: 900,
  igst: 0,
  placeOfSupply: "07",
  buyerGstin: null,
  buyerName: null,
  invoiceNumber: "PBL/2026-27/0001",
  invoiceDate: "2026-11-20T10:00:00.000Z",
  sellerGstin: "07FSKPB8774F1ZD",
  paymentMethod: "UPI",
  status: "SHIPPED",
  createdAt: "2026-11-19T10:00:00.000Z",
  address: null,
  items: [],
}

describe("orderDocument seller details", () => {
  it("uses the details saved on the invoice", () => {
    const doc = orderDocument({
      ...base,
      sellerLegalName: "Old Legal Name",
      sellerTradeName: "Old Trade Name",
      sellerAddress: "Old line 1\nOld City 110001",
      sellerStateCode: "07",
      sellerEmail: "old@example.com",
      sellerPhone: "+91 9000000000",
    })
    expect(doc.seller).toMatchObject({
      name: "Old Legal Name",
      tradeName: "Old Trade Name",
      addressLines: ["Old line 1", "Old City 110001"],
      gstin: "07FSKPB8774F1ZD",
      email: "old@example.com",
      phone: "+91 9000000000",
    })
  })

  it("falls back to the current details when none were saved", () => {
    const doc = orderDocument(base)
    expect(doc.seller).toMatchObject({
      name: business.legalName,
      tradeName: business.tradeName,
      addressLines: business.addressLines,
      email: business.email,
      phone: business.phone,
    })
  })

  it("decides intra-state tax from the saved seller state", () => {
    const doc = orderDocument({ ...base, sellerStateCode: "27", cgst: 0, sgst: 0, igst: 1800 })
    expect(doc.taxColumns).toHaveLength(1)
    expect(doc.taxColumns[0]).toMatch(/^IGST/)
  })
})
