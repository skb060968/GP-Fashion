import { describe, expect, it } from "vitest"
import { OrderStatus } from "@prisma/client"
import {
  ORDER_STATUSES,
  TRANSITIONS,
  allowedTransitions,
  canTransition,
  transitionFor,
} from "@/lib/orders/transitions"
import {
  adminStatusLabel,
  postDeliveryTracking,
  statusEmailSubject,
  statusLabel,
  trackingProgress,
} from "@/lib/orders/labels"
import { orderStatusEmailCustomer } from "@/lib/emails/orderStatusEmailCustomer"
import type { OrderEmailData } from "@/lib/types/OrderEmailData"

const RETURN_STATUSES = ["RETURN_REQUESTED", "RETURN_RECEIVED", "EXCHANGE_DISPATCHED", "EXCHANGE_COMPLETED"] as const

describe("return and exchange transitions", () => {
  it("keeps the local status universe in sync with Prisma", () => {
    expect(new Set(ORDER_STATUSES)).toEqual(new Set(Object.values(OrderStatus)))
    expect(Object.keys(TRANSITIONS).sort()).toEqual([...ORDER_STATUSES].sort())
  })

  it("supports the refund branch and requires auditable notes", () => {
    expect(canTransition("DELIVERED", "RETURN_REQUESTED")).toBe(true)
    expect(transitionFor("DELIVERED", "RETURN_REQUESTED")?.noteRequired).toBe(true)
    expect(canTransition("RETURN_REQUESTED", "RETURN_RECEIVED")).toBe(true)
    expect(canTransition("RETURN_RECEIVED", "REFUNDED")).toBe(true)
    expect(transitionFor("RETURN_RECEIVED", "REFUNDED")?.noteRequired).toBe(true)
  })

  it("supports the exchange branch and requires replacement details", () => {
    expect(canTransition("RETURN_RECEIVED", "EXCHANGE_DISPATCHED")).toBe(true)
    expect(transitionFor("RETURN_RECEIVED", "EXCHANGE_DISPATCHED")?.noteRequired).toBe(true)
    expect(canTransition("EXCHANGE_DISPATCHED", "EXCHANGE_COMPLETED")).toBe(true)
    expect(allowedTransitions("EXCHANGE_COMPLETED")).toEqual([])
  })

  it("does not allow impossible shortcuts", () => {
    expect(canTransition("DELIVERED", "REFUNDED")).toBe(false)
    expect(canTransition("RETURN_REQUESTED", "REFUNDED")).toBe(false)
    expect(canTransition("RETURN_RECEIVED", "EXCHANGE_COMPLETED")).toBe(false)
    expect(canTransition("EXCHANGE_DISPATCHED", "REFUNDED")).toBe(false)
  })

  it("can close a withdrawn request only with a history note", () => {
    const close = transitionFor("RETURN_REQUESTED", "DELIVERED")
    expect(close?.label).toBe("Close return request")
    expect(close?.noteRequired).toBe(true)
  })
})

describe("return and exchange customer presentation", () => {
  it.each(RETURN_STATUSES)("has deliberate labels and email subjects for %s", (status) => {
    expect(statusLabel(status)).not.toContain("_")
    expect(adminStatusLabel(status)).not.toContain("_")
    expect(statusEmailSubject(status, "26001")).not.toBe("Update on order 26001")
  })

  it("keeps fulfilment complete and shows the return refund branch", () => {
    const history = ["DELIVERED", "RETURN_REQUESTED", "RETURN_RECEIVED"]
    expect(trackingProgress("REFUNDED", history)).toBe(4)
    expect(postDeliveryTracking("REFUNDED", history)).toEqual({
      steps: [
        { key: "RETURN_REQUESTED", label: "Return requested" },
        { key: "RETURN_RECEIVED", label: "Return received" },
        { key: "RESOLUTION", label: "Refunded" },
      ],
      progress: 2,
    })
  })

  it("shows all four exchange milestones", () => {
    const result = postDeliveryTracking("EXCHANGE_COMPLETED", ["RETURN_REQUESTED", "RETURN_RECEIVED", "EXCHANGE_DISPATCHED"])
    expect(result?.progress).toBe(3)
    expect(result?.steps.map((s) => s.label)).toEqual([
      "Return requested",
      "Return received",
      "Replacement shipped",
      "Exchange completed",
    ])
  })

  it("shows a withdrawn request as closed rather than active", () => {
    expect(postDeliveryTracking("DELIVERED", ["DELIVERED", "RETURN_REQUESTED", "DELIVERED"])).toEqual({
      steps: [
        { key: "RETURN_REQUESTED", label: "Return requested" },
        { key: "RETURN_CLOSED", label: "Request closed" },
      ],
      progress: 1,
    })
  })

  it("does not present a cancellation refund as a return", () => {
    expect(trackingProgress("REFUNDED", ["CANCELLED", "REFUNDED"])).toBe(-1)
    expect(postDeliveryTracking("REFUNDED", ["CANCELLED", "REFUNDED"])).toBeNull()
  })
})

describe("return and exchange emails", () => {
  const base: OrderEmailData = {
    orderCode: "26001",
    amount: 1599000,
    status: "RETURN_REQUESTED",
    createdAt: new Date("2026-10-07T10:00:00Z"),
    paymentMethod: "UPI_MANUAL",
    customer: {
      fullName: "Test Customer",
      phone: "9999999999",
      email: "test@example.com",
      addressLine1: "1 Test Lane",
      city: "New Delhi",
      state: "Delhi",
      pincode: "110001",
    },
    items: [{ name: "Test Piece", size: "M", price: 1599000, quantity: 1, coverThumbnail: "/test.webp" }],
  }

  it.each([
    ["RETURN_REQUESTED", "Return opened"],
    ["RETURN_RECEIVED", "Return received"],
    ["EXCHANGE_DISPATCHED", "replacement"],
    ["EXCHANGE_COMPLETED", "Exchange completed"],
  ])("renders specific copy for %s", (status, phrase) => {
    const email = orderStatusEmailCustomer({ ...base, status })
    expect(email.subject).not.toContain("Update on order")
    expect(email.html.toLowerCase()).toContain(phrase.toLowerCase())
  })
})
