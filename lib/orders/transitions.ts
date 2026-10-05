// lib/orders/transitions.ts
// Which status changes an admin may make from a given status, and how each
// should be presented. Shared by the API (validation) and the admin UI.

export const ORDER_STATUSES = [
  "UNDER_VERIFICATION",
  "VERIFIED",
  "REJECTED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
] as const

export type OrderStatusValue = (typeof ORDER_STATUSES)[number]

export type Transition = {
  to: OrderStatusValue
  /** Button label in the admin. */
  label: string
  /** Visual weight: primary is the expected next step, danger is destructive. */
  intent: "primary" | "secondary" | "danger"
  /** One line shown in the confirmation dialog. */
  description: string
}

const T = (to: OrderStatusValue, label: string, intent: Transition["intent"], description: string): Transition => ({
  to,
  label,
  intent,
  description,
})

export const TRANSITIONS: Record<OrderStatusValue, Transition[]> = {
  UNDER_VERIFICATION: [
    T("VERIFIED", "Verify payment", "primary", "Confirms the UPI payment was received. The order moves to the atelier."),
    T("REJECTED", "Reject payment", "danger", "No matching payment found. The customer is asked to get in touch."),
    T("CANCELLED", "Cancel order", "danger", "Cancels the order before any payment is confirmed."),
  ],
  VERIFIED: [
    T("PROCESSING", "Start processing", "primary", "The pieces are being prepared."),
    T("CANCELLED", "Cancel order", "danger", "Cancels a paid order. Follow up with a refund."),
  ],
  REJECTED: [
    T("UNDER_VERIFICATION", "Re-check payment", "secondary", "Moves the order back for another look, e.g. after the customer sends proof."),
    T("CANCELLED", "Cancel order", "danger", "Closes the order."),
  ],
  PROCESSING: [
    T("SHIPPED", "Mark shipped", "primary", "The order has been handed to the courier."),
    T("CANCELLED", "Cancel order", "danger", "Cancels an order already in production. Follow up with a refund."),
  ],
  SHIPPED: [T("DELIVERED", "Mark delivered", "primary", "The customer has received the order.")],
  DELIVERED: [T("REFUNDED", "Mark refunded", "danger", "A return or dispute has been refunded.")],
  CANCELLED: [T("REFUNDED", "Mark refunded", "secondary", "The customer's payment has been returned.")],
  REFUNDED: [],
}

export function allowedTransitions(from: string): Transition[] {
  return TRANSITIONS[from as OrderStatusValue] ?? []
}

export function canTransition(from: string, to: string): boolean {
  return allowedTransitions(from).some((t) => t.to === to)
}

/** Statuses that still need something from the admin. */
export const OPEN_STATUSES: OrderStatusValue[] = ["UNDER_VERIFICATION", "VERIFIED", "PROCESSING", "SHIPPED"]
/** Terminal statuses. */
export const CLOSED_STATUSES: OrderStatusValue[] = ["DELIVERED", "REJECTED", "CANCELLED", "REFUNDED"]
