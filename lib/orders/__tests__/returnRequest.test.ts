import { describe, expect, it } from "vitest"
import {
  checkReturnRequest,
  deliveredAt,
  describeReturn,
  returnable,
  returnDeadline,
  returnHistoryNote,
  ReturnRequestError,
  type Returnable,
} from "../returns"
import { returnRequestSchema } from "@/lib/validation/schemas"
import { orderStatusEmailCustomer } from "@/lib/emails/orderStatusEmailCustomer"
import type { OrderEmailData } from "@/lib/types/OrderEmailData"

const gown = { id: "a", name: "Pink Petal Gown", size: "M", color: null, quantity: 2, madeToMeasure: false, sizes: ["S", "M", "L"] }
const shirt = { id: "b", name: "Dark Romance Shirt", size: "L", color: "Black", quantity: 1, madeToMeasure: false, sizes: ["M", "L", "XL"] }
const mtm = { id: "c", name: "Laurent Jacket", size: "Custom", color: null, quantity: 1, madeToMeasure: true, sizes: [] }
const delivered = "2026-11-20T09:00:00.000Z"
const history = [
  { status: "UNDER_VERIFICATION", changedAt: "2026-11-01T09:00:00.000Z" },
  { status: "SHIPPED", changedAt: "2026-11-15T09:00:00.000Z" },
  { status: "DELIVERED", changedAt: delivered },
]
const order = { status: "DELIVERED", history, items: [gown, shirt, mtm] }

describe("return window", () => {
  it("runs to the end of the 7th day after delivery, in IST", () => {
    expect(returnDeadline(new Date(delivered)).toISOString()).toBe("2026-11-27T18:30:00.000Z")
    expect(returnDeadline(new Date("2026-11-20T19:00:00.000Z")).toISOString()).toBe("2026-11-28T18:30:00.000Z")
  })

  it("counts from the first delivery, not a return closed later", () => {
    const later = [...history, { status: "RETURN_REQUESTED", changedAt: "2026-11-22T09:00:00.000Z" }, { status: "DELIVERED", changedAt: "2026-11-23T09:00:00.000Z" }]
    expect(deliveredAt(later)?.toISOString()).toBe(delivered)
  })

  it("offers standard-size pieces of a delivered order until the deadline", () => {
    const r = returnable(order, new Date("2026-11-27T18:00:00.000Z"))
    expect(r?.deadline).toBe("2026-11-27T18:30:00.000Z")
    expect(r?.items.map((i) => [i.id, i.sizes])).toEqual([
      ["a", ["S", "L"]],
      ["b", ["M", "XL"]],
    ])
    expect(returnable(order, new Date("2026-11-27T18:30:00.000Z"))).toBeNull()
  })

  it("offers nothing before delivery, during an open return, or for made to measure only", () => {
    expect(returnable({ ...order, status: "SHIPPED" }, new Date(delivered))).toBeNull()
    expect(returnable({ ...order, status: "RETURN_REQUESTED" }, new Date(delivered))).toBeNull()
    expect(returnable({ ...order, items: [mtm] }, new Date(delivered))).toBeNull()
    expect(returnable({ ...order, history: history.slice(0, 2) }, new Date(delivered))).toBeNull()
  })
})

describe("checking a request", () => {
  const allowed = returnable(order, new Date(delivered)) as Returnable

  it("records the pieces, quantities and new sizes", () => {
    expect(checkReturnRequest(allowed, { reason: "WRONG_SIZE", resolution: "SIZE", items: [{ orderItemId: "a", quantity: 1, exchangeSize: "L" }, { orderItemId: "b", quantity: 0 }] })).toEqual([
      { orderItemId: "a", name: "Pink Petal Gown", size: "M", color: null, quantity: 1, exchangeSize: "L" },
    ])
  })

  it("allows a refund only for a damaged piece or a wrong item", () => {
    expect(() => checkReturnRequest(allowed, { reason: "WRONG_SIZE", resolution: "REFUND", items: [{ orderItemId: "a", quantity: 1 }] })).toThrow(/only offered for a damaged piece/)
    expect(checkReturnRequest(allowed, { reason: "DAMAGED", resolution: "REFUND", items: [{ orderItemId: "b", quantity: 1 }] })[0].exchangeSize).toBeNull()
  })

  it("refuses made to measure, too many, a missing or same size, and an empty request", () => {
    const bad = (items: { orderItemId: string; quantity: number; exchangeSize?: string }[], resolution: "SIZE" | "PIECE" = "SIZE", note?: string) =>
      () => checkReturnRequest(allowed, { reason: "WRONG_SIZE", resolution, note, items })
    expect(bad([{ orderItemId: "c", quantity: 1 }])).toThrow(/cannot be returned/)
    expect(bad([{ orderItemId: "a", quantity: 3, exchangeSize: "L" }])).toThrow(/up to 2/)
    expect(bad([{ orderItemId: "a", quantity: 1 }])).toThrow(/new size/)
    expect(bad([{ orderItemId: "a", quantity: 1, exchangeSize: "M" }])).toThrow(/new size/)
    expect(bad([{ orderItemId: "a", quantity: 0 }])).toThrow(ReturnRequestError)
    expect(bad([{ orderItemId: "a", quantity: 1 }], "PIECE")).toThrow(/which piece/)
    expect(bad([{ orderItemId: "a", quantity: 1 }], "PIECE", "The Coastline Dress in M")()).toHaveLength(1)
  })

  it("rejects unknown reasons at the door", () => {
    expect(returnRequestSchema.safeParse({ reason: "CHANGED_MIND", resolution: "REFUND", items: [{ orderItemId: "a", quantity: 1 }] }).success).toBe(false)
    expect(returnRequestSchema.safeParse({ reason: "DAMAGED", resolution: "REFUND", items: [{ orderItemId: "a", quantity: 1 }] }).success).toBe(true)
  })
})

describe("describing a request", () => {
  const record = {
    reason: "WRONG_SIZE",
    resolution: "SIZE",
    note: "A little tight",
    items: [{ orderItemId: "a", name: "Pink Petal Gown", size: "M", color: null, quantity: 1, exchangeSize: "L" }],
  }

  it("writes lines for the history, admin page and emails", () => {
    expect(describeReturn(record)).toEqual({
      reason: "Wrong size",
      resolution: "Exchange for another size",
      items: ["Pink Petal Gown, size M × 1 → size L"],
      note: "A little tight",
      photos: false,
    })
    expect(returnHistoryNote(record)).toBe("Customer request: Wrong size. Exchange for another size. Pink Petal Gown, size M × 1 → size L Note: A little tight")
    expect(describeReturn({ ...record, reason: "DAMAGED" }).photos).toBe(true)
  })

  it("tells the customer the next steps, and asks for photos when damaged", () => {
    const base: OrderEmailData = {
      orderCode: "26001",
      amount: 999000,
      status: "RETURN_REQUESTED",
      createdAt: new Date("2026-11-01T09:00:00.000Z"),
      paymentMethod: "UPI_MANUAL",
      customer: { fullName: "Asha <b>Rao</b>", phone: "9876543210", addressLine1: "12 Park Street", city: "New Delhi", state: "Delhi", pincode: "110001" },
      items: [],
      returnRequest: describeReturn(record),
    }
    const plain = orderStatusEmailCustomer(base).html
    expect(plain).toContain("Exchange for another size")
    expect(plain).toContain("Pink Petal Gown, size M × 1 → size L")
    expect(plain).toContain("Return shipping is at your cost")
    expect(plain).not.toContain("<b>Rao</b>")
    const damaged = orderStatusEmailCustomer({ ...base, returnRequest: describeReturn({ ...record, reason: "DAMAGED", resolution: "REFUND" }) }).html
    expect(damaged).toContain("send photos")
    expect(damaged).toContain("We pay the return shipping")
  })
})
