// lib/orders/labels.ts
// Customer-facing labels for order enums, shared by confirmation, tracking and invoice.

export const ORDER_STATUS_LABEL: Record<string, string> = {
  UNDER_VERIFICATION: "Payment under verification",
  VERIFIED: "Payment verified",
  REJECTED: "Payment could not be verified",
  PROCESSING: "Being prepared",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
}

export const PAYMENT_METHOD_LABEL: Record<string, string> = {
  UPI_MANUAL: "UPI",
  RAZORPAY: "Online payment",
  COD: "Cash on delivery",
}

/** Ordered milestones shown on the tracking timeline for a normal order. */
export const TRACKING_STEPS = [
  { key: "PLACED", label: "Order placed" },
  { key: "VERIFIED", label: "Payment verified" },
  { key: "PROCESSING", label: "Being prepared" },
  { key: "SHIPPED", label: "Shipped" },
  { key: "DELIVERED", label: "Delivered" },
] as const

/** Index of the furthest completed milestone for a status, or -1 for terminal failures. */
export function trackingProgress(status: string): number {
  switch (status) {
    case "UNDER_VERIFICATION":
      return 0
    case "VERIFIED":
      return 1
    case "PROCESSING":
      return 2
    case "SHIPPED":
      return 3
    case "DELIVERED":
      return 4
    default:
      return -1 // REJECTED, CANCELLED, REFUNDED
  }
}

export function statusLabel(status: string) {
  return ORDER_STATUS_LABEL[status] ?? status.replace(/_/g, " ").toLowerCase()
}

export function paymentLabel(method: string) {
  return PAYMENT_METHOD_LABEL[method] ?? method
}
