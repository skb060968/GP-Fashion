import { describe, expect, it } from "vitest"
import { placeOfSupply } from "../placeOfSupply"
import { partiesOf } from "@/lib/orders/orderDocument"
import { ordersToCsv, type CsvOrder } from "@/lib/admin/csvExport"
import { createOrderSchema } from "@/lib/validation/schemas"

describe("place of supply", () => {
  it("is the shipping state without a GSTIN, whatever the billing state", () => {
    expect(placeOfSupply({ shippingStateCode: "27", billingStateCode: "07" })).toEqual({ ok: true, code: "27", basis: "shipping" })
    expect(placeOfSupply({ shippingStateCode: "07", gstin: "" })).toEqual({ ok: true, code: "07", basis: "shipping" })
  })

  it("is the GSTIN's state when the billing address is there", () => {
    expect(placeOfSupply({ shippingStateCode: "29", billingStateCode: "27", gstin: "27AAACA1234A1Z5" })).toEqual({ ok: true, code: "27", basis: "gstin" })
    expect(placeOfSupply({ shippingStateCode: "27", gstin: "27AAACA1234A1Z5" })).toEqual({ ok: true, code: "27", basis: "gstin" })
  })

  it("asks for a billing address in the GSTIN's state", () => {
    const sep = placeOfSupply({ shippingStateCode: "07", billingStateCode: "07", gstin: "27AAACA1234A1Z5" })
    expect(sep).toMatchObject({ ok: false, field: "billing.state" })
    expect(!sep.ok && sep.message).toMatch(/registered in Maharashtra.*not Delhi/)
    const same = placeOfSupply({ shippingStateCode: "07", gstin: "27AAACA1234A1Z5" })
    expect(same).toMatchObject({ ok: false, field: "gstin" })
    expect(!same.ok && same.message).toMatch(/Untick "Billing address same as shipping"/)
  })
})

const ship = {
  fullName: "Meera Kapoor",
  phone: "9876543210",
  email: "meera@example.com",
  addressLine1: "4 Lake Road",
  addressLine2: null,
  city: "Bengaluru",
  state: "Karnataka",
  pincode: "560001",
}
const bill = { fullName: "Rohan Kapoor", addressLine1: "22 Marine Drive", addressLine2: "Flat 3", city: "Mumbai", state: "Maharashtra", pincode: "400020" }

describe("invoice parties", () => {
  it("bills and ships to the same address when no billing address was given", () => {
    const p = partiesOf({ address: ship, billingAddress: null, buyerName: null, buyerGstin: null })
    expect(p.shipTo).toBeNull()
    expect(p.buyer).toMatchObject({ name: "Meera Kapoor", lines: ["4 Lake Road", "Bengaluru, Karnataka 560001"], phone: "9876543210" })
  })

  it("bills the billing address and lists the delivery address separately", () => {
    const p = partiesOf({ address: ship, billingAddress: bill, buyerName: null, buyerGstin: null })
    expect(p.buyer).toMatchObject({ name: "Rohan Kapoor", attention: null, lines: ["22 Marine Drive, Flat 3", "Mumbai, Maharashtra 400020"], email: "meera@example.com" })
    expect(p.shipTo).toEqual({ name: "Meera Kapoor", lines: ["4 Lake Road", "Bengaluru, Karnataka 560001"], phone: "9876543210" })
  })

  it("puts the business name first, attention to the billing name", () => {
    const p = partiesOf({ address: ship, billingAddress: bill, buyerName: "Kapoor Textiles", buyerGstin: "27AAACA1234A1Z5" })
    expect(p.buyer).toMatchObject({ name: "Kapoor Textiles", attention: "Rohan Kapoor", gstin: "27AAACA1234A1Z5" })
  })
})

describe("billing address in orders", () => {
  it("is optional at checkout and checked when given", () => {
    const base = {
      items: [{ slug: "a", name: "A", size: "M", price: 100, quantity: 1, coverThumbnail: "/a.webp" }],
      address: { ...ship, addressLine2: "" },
      amount: 100,
      paymentMethod: "UPI_MANUAL" as const,
    }
    expect(createOrderSchema.safeParse(base).success).toBe(true)
    expect(createOrderSchema.safeParse({ ...base, billing: { ...bill } }).success).toBe(true)
    expect(createOrderSchema.safeParse({ ...base, billing: { ...bill, pincode: "12" } }).success).toBe(false)
  })

  it("adds billing columns to the order export", () => {
    const order: CsvOrder = {
      orderCode: "26001",
      address: ship,
      billingAddress: bill,
      amount: 100,
      discount: 0,
      paymentMethod: "UPI_MANUAL",
      status: "SHIPPED",
      createdAt: "2026-11-20T10:00:00.000Z",
      items: [{ name: "A", size: "M", quantity: 1 }],
    }
    const [header, row] = ordersToCsv([order, { ...order, billingAddress: null }]).trim().split("\n")
    expect(header.endsWith("billingName,billingAddress,billingCity,billingState,billingPincode")).toBe(true)
    expect(row.endsWith('Rohan Kapoor,"22 Marine Drive, Flat 3",Mumbai,Maharashtra,400020')).toBe(true)
    expect(ordersToCsv([{ ...order, billingAddress: null }]).trim().split("\n")[1].endsWith(",,,,,")).toBe(true)
  })
})
