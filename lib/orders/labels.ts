import type { OrderStatusValue } from "./transitions"

export const ORDER_STATUS_LABEL = {
  UNDER_VERIFICATION: "Payment under verification",
  VERIFIED: "Payment verified",
  REJECTED: "Payment could not be verified",
  PROCESSING: "Being prepared",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  RETURN_REQUESTED: "Return requested",
  RETURN_RECEIVED: "Return received",
  EXCHANGE_DISPATCHED: "Replacement shipped",
  EXCHANGE_COMPLETED: "Exchange completed",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
} satisfies Record<OrderStatusValue, string>

export const ADMIN_STATUS_LABEL = {
  UNDER_VERIFICATION: "Awaiting verification",
  VERIFIED: "Verified",
  REJECTED: "Rejected",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  RETURN_REQUESTED: "Return requested",
  RETURN_RECEIVED: "Return received",
  EXCHANGE_DISPATCHED: "Replacement shipped",
  EXCHANGE_COMPLETED: "Exchange completed",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
} satisfies Record<OrderStatusValue, string>

export function statusEmailSubject(status: string, orderCode: string): string {
  switch (status) {
    case "VERIFIED":
      return `Payment confirmed for order ${orderCode}`
    case "PROCESSING":
      return `Order ${orderCode} is being prepared`
    case "SHIPPED":
      return `Order ${orderCode} has shipped`
    case "DELIVERED":
      return `Order ${orderCode} delivered`
    case "RETURN_REQUESTED":
      return `Return opened for order ${orderCode}`
    case "RETURN_RECEIVED":
      return `Return received for order ${orderCode}`
    case "EXCHANGE_DISPATCHED":
      return `Replacement for order ${orderCode} has shipped`
    case "EXCHANGE_COMPLETED":
      return `Exchange completed for order ${orderCode}`
    case "REJECTED":
      return `Action needed on order ${orderCode}`
    case "CANCELLED":
      return `Order ${orderCode} cancelled`
    case "REFUNDED":
      return `Refund issued for order ${orderCode}`
    default:
      return `Update on order ${orderCode}`
  }
}

export function adminStatusLabel(status: string) {
  return ADMIN_STATUS_LABEL[status as OrderStatusValue] ?? status.replace(/_/g, " ").toLowerCase()
}

export const PAYMENT_METHOD_LABEL: Record<string, string> = {
  UPI_MANUAL: "UPI",
  RAZORPAY: "Online payment",
  COD: "Cash on delivery",
}

export const TRACKING_STEPS = [
  { key: "PLACED", label: "Order placed" },
  { key: "VERIFIED", label: "Payment verified" },
  { key: "PROCESSING", label: "Being prepared" },
  { key: "SHIPPED", label: "Shipped" },
  { key: "DELIVERED", label: "Delivered" },
] as const

const POST_DELIVERY_STATUSES = ["RETURN_REQUESTED", "RETURN_RECEIVED", "EXCHANGE_DISPATCHED", "EXCHANGE_COMPLETED"]

export function trackingProgress(status: string, historyStatuses: string[] = []): number {
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
    case "RETURN_REQUESTED":
    case "RETURN_RECEIVED":
    case "EXCHANGE_DISPATCHED":
    case "EXCHANGE_COMPLETED":
      return 4
    case "REFUNDED":
      return historyStatuses.includes("RETURN_RECEIVED") ? 4 : -1
    default:
      return -1
  }
}

export type PostDeliveryTracking = {
  steps: readonly { key: string; label: string }[]
  progress: number
}

export function postDeliveryTracking(status: string, historyStatuses: string[] = []): PostDeliveryTracking | null {
  const wasReturned = POST_DELIVERY_STATUSES.includes(status) || historyStatuses.includes("RETURN_REQUESTED")
  if (!wasReturned) return null

  if (status === "DELIVERED" && historyStatuses.includes("RETURN_REQUESTED")) {
    return {
      steps: [
        { key: "RETURN_REQUESTED", label: "Return requested" },
        { key: "RETURN_CLOSED", label: "Request closed" },
      ],
      progress: 1,
    }
  }

  if (status === "EXCHANGE_DISPATCHED" || status === "EXCHANGE_COMPLETED") {
    return {
      steps: [
        { key: "RETURN_REQUESTED", label: "Return requested" },
        { key: "RETURN_RECEIVED", label: "Return received" },
        { key: "EXCHANGE_DISPATCHED", label: "Replacement shipped" },
        { key: "EXCHANGE_COMPLETED", label: "Exchange completed" },
      ],
      progress: status === "EXCHANGE_COMPLETED" ? 3 : 2,
    }
  }

  const refunded = status === "REFUNDED"
  return {
    steps: [
      { key: "RETURN_REQUESTED", label: "Return requested" },
      { key: "RETURN_RECEIVED", label: "Return received" },
      { key: "RESOLUTION", label: refunded ? "Refunded" : "Resolution" },
    ],
    progress: refunded ? 2 : status === "RETURN_RECEIVED" ? 1 : 0,
  }
}

export function statusLabel(status: string) {
  return ORDER_STATUS_LABEL[status as OrderStatusValue] ?? status.replace(/_/g, " ").toLowerCase()
}

export function paymentLabel(method: string) {
  return PAYMENT_METHOD_LABEL[method] ?? method
}
